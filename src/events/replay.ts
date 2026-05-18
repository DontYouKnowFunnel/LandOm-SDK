import { record } from 'rrweb';
import type { eventWithTime } from '@rrweb/types';
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

async function gzipString(input: string): Promise<Uint8Array> {
  const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function createReplayPayload(
  event: eventWithTime,
  isCheckout: boolean,
): Promise<EventPayload> {
  const rawPayload: ReplayPayload = {
    event,
    isCheckout,
    version: 'rrweb',
  };

  const compressed = await gzipString(JSON.stringify(rawPayload));

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
          createReplayPayload(event, Boolean(isCheckout))
            .then((payload) => {
              const replayEvent: SDKEvent = {
                type: 'replay',
                timestamp: event.timestamp ?? Date.now(),
                cssSelector: null,
                payload,
              };
              getQueue().push(replayEvent);
            })
            .catch((err) => {
              // 서버는 압축된 페이로드 컨트랙트만 처리한다.
              // 비압축 fallback을 보내면 컨트랙트가 깨지므로 이 이벤트는 드롭한다.
              logger.warn('rrweb payload 압축 실패, 이벤트 드롭:', err);
            });
        },
        maskAllInputs: config.replayMaskAllInputs,
        blockClass: config.replayBlockClass,
        blockSelector: config.replayBlockSelector,
        maskTextClass: config.replayMaskTextClass,
        maskTextSelector: config.replayMaskTextSelector,
        slimDOMOptions: 'all',
        inlineStylesheet: config.replayInlineStylesheet,
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
