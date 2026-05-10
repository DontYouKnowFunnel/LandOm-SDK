import { record } from 'rrweb';
import { gzip } from 'pako';
import type { Collector } from '../core/sdk';
import { getConfig, getLogger, getQueue } from '../core/context';
import type { EventPayload, ReplayPayload, SDKEvent } from '../types';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function createReplayPayload(event: unknown, isCheckout: boolean): EventPayload {
  const rawPayload: ReplayPayload = {
    event,
    isCheckout,
    version: 'rrweb',
  };

  const compressed = gzip(JSON.stringify(rawPayload));

  return {
    compressed: true,
    compression: 'gzip',
    encoding: 'base64',
    data: uint8ArrayToBase64(compressed),
    version: 'rrweb',
  };
}

/**
 * rrweb 기반 세션 리플레이 수집기.
 * 개인정보 보호를 위해 input 값은 기본 마스킹하고, rr-block/rr-mask 클래스를 지원한다.
 */
export function createReplayCollector(): Collector {
  let stopRecording: (() => void) | undefined;

  return {
    setup(): void {
      const config = getConfig();
      const logger = getLogger();

      stopRecording = record({
        emit(event, isCheckout) {
          let payload: EventPayload;

          try {
            payload = createReplayPayload(event, Boolean(isCheckout));
          } catch (err) {
            logger.warn('rrweb payload 압축 실패, 비압축으로 전송:', err);
            payload = {
              event,
              isCheckout: Boolean(isCheckout),
              version: 'rrweb',
            };
          }

          const replayEvent: SDKEvent = {
            type: 'replay',
            timestamp: event.timestamp || Date.now(),
            cssSelector: null,
            payload,
          };

          getQueue().push(replayEvent);
        },
        maskAllInputs: config.replayMaskAllInputs,
        blockClass: config.replayBlockClass,
        blockSelector: config.replayBlockSelector,
        maskTextClass: config.replayMaskTextClass,
        maskTextSelector: config.replayMaskTextSelector,
        slimDOMOptions: 'all',
        inlineStylesheet: false,
        checkoutEveryNms: config.replayCheckoutEveryNms,
        sampling: {
          mousemove: config.replayMousemoveSampling,
          mousemoveCallback: config.replayMousemoveCallbackSampling,
          scroll: config.replayScrollSampling,
          input: config.replayInputSampling,
        },
      });

      if (stopRecording) {
        logger.log('rrweb 리플레이 수집 시작');
      } else {
        logger.warn('rrweb 리플레이 수집을 시작하지 못했습니다.');
      }
    },

    teardown(): void {
      if (!stopRecording) return;
      stopRecording();
      stopRecording = undefined;
      getLogger().log('rrweb 리플레이 수집 종료');
    },
  };
}
