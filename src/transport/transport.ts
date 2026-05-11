import type { SDKEvent, TransportPayload } from '../types';
import type { Logger } from '../utils/logger';

/** Transport 생성에 필요한 설정 */
export interface TransportConfig {
  endpoint: string;
  apiKey: string;
  maxRetries: number;
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
  const { endpoint, apiKey, maxRetries, logger } = config;

  /** 재시도 가능한 HTTP 상태인지 판별 (서버 오류, 429 등) */
  function isRetryable(status: number): boolean {
    return status === 429 || status >= 500;
  }

  /**
   * fetch(keepalive)로 비동기 전송
   * 실패 시 exponential backoff로 최대 maxRetries회 재시도
   * @returns 전송 성공 여부
   */
  /** keepalive 최대 허용 크기 (64KB, 여유분 확보) */
  const KEEPALIVE_LIMIT = 60_000;

  async function send(payload: TransportPayload): Promise<boolean> {
    const body = JSON.stringify(payload);
    const useKeepalive = body.length <= KEEPALIVE_LIMIT;

    if (!useKeepalive) {
      logger.warn('페이로드 크기 초과, keepalive 비활성화:', body.length, 'bytes');
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Project-Key': apiKey,
          },
          body,
          keepalive: useKeepalive,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          logger.log('전송 완료:', payload.events.length, '건');
          return true;
        }

        // 재시도 불가능한 상태(4xx 클라이언트 오류)는 즉시 포기
        if (!isRetryable(res.status)) {
          logger.warn('전송 실패 (재시도 불가):', res.status, res.statusText);
          return false;
        }

        logger.warn(
          `전송 실패 (${res.status}), 재시도 ${attempt + 1}/${maxRetries}`,
        );
      } catch (err) {
        logger.warn(
          `전송 에러, 재시도 ${attempt + 1}/${maxRetries}:`,
          err,
        );
      }

      // 마지막 시도가 아니면 exponential backoff 대기
      if (attempt < maxRetries) {
        const delay = 1000 * 2 ** attempt; // 1s → 2s → 4s
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    logger.warn('최대 재시도 초과, 전송 포기:', payload.events.length, '건');
    return false;
  }

  /** sendBeacon 안전 한계 (64KB, 여유분 확보) */
  const SENDBEACON_LIMIT = 60_000;

  /** 청크별로 직렬화한 body 크기가 한계 이하가 되도록 events를 분할 */
  function chunkEvents(payload: TransportPayload, limit: number): SDKEvent[][] {
    const envelopeSize = JSON.stringify({
      ...payload,
      apiKey,
      events: [],
    }).length;
    const budget = limit - envelopeSize - 8; // ',' 및 안전 여분

    const chunks: SDKEvent[][] = [];
    let current: SDKEvent[] = [];
    let currentSize = 0;

    for (const ev of payload.events) {
      const evSize = JSON.stringify(ev).length + 1; // 구분자 1바이트
      if (current.length > 0 && currentSize + evSize > budget) {
        chunks.push(current);
        current = [];
        currentSize = 0;
      }
      current.push(ev);
      currentSize += evSize;
    }
    if (current.length > 0) chunks.push(current);

    return chunks;
  }

  /**
   * navigator.sendBeacon으로 동기 전송 (페이지 이탈 시 사용).
   * 헤더 설정 불가 → body에 apiKey 포함.
   * 64KB 한계를 넘기지 않도록 events를 청크로 분할해 다회 호출.
   * 페이지 이탈 컨텍스트라 fetch fallback은 의미 없음 (요청이 unload와 함께 취소됨).
   * sendBeacon 실패 청크는 드롭하고 경고만 남긴다.
   */
  function sendSync(payload: TransportPayload): void {
    const chunks = chunkEvents(payload, SENDBEACON_LIMIT);

    for (const events of chunks) {
      const body = JSON.stringify({ ...payload, apiKey, events });

      if (body.length > SENDBEACON_LIMIT) {
        // 단일 이벤트가 청크 한계를 넘는 케이스 (예: 거대한 replay 페이로드)
        logger.warn(
          'sendSync: 단일 청크가 sendBeacon 한계 초과, 드롭:',
          body.length,
          'bytes,',
          events.length,
          '건',
        );
        continue;
      }

      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(endpoint, blob);

      if (ok) {
        logger.log('sendBeacon 전송:', events.length, '건');
      } else {
        logger.warn('sendBeacon 실패, 청크 드롭:', events.length, '건');
      }
    }
  }

  return { send, sendSync };
}

/** createTransport 반환 타입 */
export type Transport = ReturnType<typeof createTransport>;
