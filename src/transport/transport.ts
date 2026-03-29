import type { TransportPayload } from '../types';
import type { Logger } from '../utils/logger';

/** Transport 생성에 필요한 설정 */
export interface TransportConfig {
  endpoint: string;
  apiKey: string;
  logger: Logger;
}

/**
 * 이벤트 전송 모듈
 *
 * 두 가지 전송 방식 
 * - send(): fetch(keepalive)로 전송. 커스텀 헤더(X-Project-Key) 사용 가능.
 * - sendSync(): navigator.sendBeacon으로 전송. 페이지 이탈 시 사용.
 *   sendBeacon은 커스텀 헤더를 설정할 수 없으므로 body에 apiKey를 포함
 */
export function createTransport(config: TransportConfig) {
  const { endpoint, apiKey, logger } = config;

  /**
   * fetch(keepalive)로 비동기 전송
   * 일반적인 배치 flush에 사용
   */
  async function send(payload: TransportPayload): Promise<void> {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Project-Key': apiKey,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (!res.ok) {
        logger.warn('전송 실패:', res.status, res.statusText);
      } else {
        logger.log('전송 완료:', payload.events.length, '건');
      }
    } catch (err) {
      logger.warn('전송 에러:', err);
    }
  }

  /**
   * navigator.sendBeacon으로 동기 전송
   * 페이지 이탈(beforeunload, visibilitychange) 시 사용
   * 헤더 설정 불가 → body에 apiKey 포함
   */
  function sendSync(payload: TransportPayload): void {
    const body = JSON.stringify({ ...payload, apiKey });
    const blob = new Blob([body], { type: 'application/json' });
    const ok = navigator.sendBeacon(endpoint, blob);

    if (ok) {
      logger.log('sendBeacon 전송:', payload.events.length, '건');
    } else {
      logger.warn('sendBeacon 실패, fetch fallback 시도');
      // sendBeacon 실패 시 fetch로 재시도
      send(payload);
    }
  }

  return { send, sendSync };
}

/** createTransport 반환 타입 */
export type Transport = ReturnType<typeof createTransport>;
