import type { SDKEvent, TransportPayload } from '../types';
import type { Transport } from '../transport/transport';
import type { Logger } from '../utils/logger';
import { getSessionId } from '../utils/session';

/** EventQueue 생성에 필요한 설정 */
export interface EventQueueConfig {
  flushInterval: number;
  flushQueueSize: number;
  maxQueueSize: number;
  beforeSend?: (event: SDKEvent) => SDKEvent | null;
  transport: Transport;
  logger: Logger;
}

/**
 * 이벤트 큐 모듈
 *
 * 이벤트를 배열에 버퍼링하고, 조건 충족 시 배치 전송한다.
 * - flushInterval마다 자동 flush
 * - flushQueueSize 도달 시 즉시 flush
 * - maxQueueSize 초과 시 오래된 이벤트 드롭
 * - beforeSend 훅으로 이벤트 가공/필터링
 */
export function createEventQueue(config: EventQueueConfig) {
  const {
    flushInterval,
    flushQueueSize,
    maxQueueSize,
    beforeSend,
    transport,
    logger,
  } = config;

  let queue: SDKEvent[] = [];
  let timerId: ReturnType<typeof setInterval> | null = null;

  /** 공통 전송 payload 생성 */
  function buildPayload(events: SDKEvent[]): TransportPayload {
    return {
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      url: location.href,
      events,
    };
  }

  /**
   * maxQueueSize 초과 시 큐 정리.
   * 분석 핵심 이벤트(click, exit 등)를 보존하기 위해 오래된 replay 이벤트를 먼저 드롭한다.
   * 그래도 초과면 가장 오래된 이벤트부터 드롭한다.
   */
  function enforceMaxSize(): void {
    if (queue.length <= maxQueueSize) return;

    let need = queue.length - maxQueueSize;
    let droppedReplay = 0;
    const survivors: SDKEvent[] = [];

    for (const e of queue) {
      if (need > 0 && e.type === 'replay') {
        need--;
        droppedReplay++;
        continue;
      }
      survivors.push(e);
    }

    let droppedOther = 0;
    if (need > 0) {
      droppedOther = Math.min(need, survivors.length);
      survivors.splice(0, droppedOther);
    }

    queue = survivors;
    logger.warn(`큐 초과: replay ${droppedReplay}건, 기타 ${droppedOther}건 드롭`);
  }

  /** 이벤트 추가 (beforeSend 적용, maxQueueSize 초과 시 드롭) */
  function push(event: SDKEvent): void {
    // beforeSend 훅 적용
    const processed = beforeSend ? beforeSend(event) : event;
    if (!processed) {
      logger.log('beforeSend에 의해 제외됨:', event.type);
      return;
    }

    queue.push(processed);
    enforceMaxSize();

    // flushQueueSize 도달 시 즉시 flush
    if (queue.length >= flushQueueSize) {
      flush();
    }
  }

  /** 큐에 쌓인 이벤트를 비동기 전송 (fetch), 실패 시 큐 앞에 복원 */
  async function flush(): Promise<void> {
    if (queue.length === 0) return;

    // 오프라인이면 전송 건너뛰기 (큐에 계속 쌓아둠)
    if (!navigator.onLine) {
      logger.log('오프라인 상태, 전송 보류:', queue.length, '건');
      return;
    }

    const events = queue.splice(0);
    const payload = buildPayload(events);
    logger.log('flush:', events.length, '건');

    const ok = await transport.send(payload);
    if (!ok) {
      queue.unshift(...events);
      enforceMaxSize();
    }
  }

  /** 큐에 쌓인 이벤트를 동기 전송 (sendBeacon) — 이탈 시 사용 */
  function flushSync(): void {
    if (queue.length === 0) return;

    const events = queue.splice(0);
    const payload = buildPayload(events);
    logger.log('flushSync:', events.length, '건');
    transport.sendSync(payload);
  }

  /** 온라인 복귀 시 즉시 flush */
  function onOnline(): void {
    logger.log('온라인 복귀, 보류 이벤트 전송');
    flush();
  }

  /** 주기적 flush 타이머 시작 + 온라인 복귀 리스너 등록 */
  function start(): void {
    if (timerId !== null) return;
    timerId = setInterval(flush, flushInterval);
    window.addEventListener('online', onOnline);
    logger.log(`큐 시작 (${flushInterval}ms 간격)`);
  }

  /** 타이머 중지 + 리스너 해제 + 잔여 이벤트 flush */
  function stop(): void {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    window.removeEventListener('online', onOnline);
    flush();
  }

  return { push, flush, flushSync, start, stop };
}

/** createEventQueue 반환 타입 */
export type EventQueue = ReturnType<typeof createEventQueue>;
