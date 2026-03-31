import type { SDKConfig, SDKOptions, SDKEvent, EventType, EventPayload } from '../types';
import { DEFAULT_CONFIG } from '../types';
import { createLogger } from '../utils/logger';
import { createTransport } from '../transport/transport';
import { createEventQueue } from './event-queue';
import { setContext } from './context';
import { createStartCollector } from '../events/start';
import { createVisibilityCollector } from '../events/visibility';
import { createScrollCollector } from '../events/scroll';
import { createClickCollector } from '../events/click';
import { createInputCollector } from '../events/input';
import { createPingCollector } from '../events/ping';
import { createExitCollector } from '../events/exit';
import type { Logger } from '../utils/logger';
import type { EventQueue } from './event-queue';

/** 이벤트 수집기 인터페이스 (setup/teardown) */
export interface Collector {
  setup(): void;
  teardown(): void;
}

/** SDK 싱글턴 상태 */
let isInitialized = false;
let queue: EventQueue;
let collectors: Collector[] = [];

/**
 * SDK 초기화
 * 싱글턴으로 동작하며, 중복 호출 시 경고만 출력한다.
 * 이벤트 수집기는 registerCollectors()로 별도 등록한다.
 */
export function init(options: SDKOptions): void {
  if (isInitialized) {
    console.warn('[LandOm] 이미 초기화되었습니다.');
    return;
  }

  const config = { ...DEFAULT_CONFIG, ...options };
  const logger = createLogger(config.debug);

  const transport = createTransport({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    maxRetries: config.maxRetries,
    logger,
  });

  queue = createEventQueue({
    flushInterval: config.flushInterval,
    flushQueueSize: config.flushQueueSize,
    maxQueueSize: config.maxQueueSize,
    beforeSend: config.beforeSend,
    transport,
    logger,
  });

  // 컨텍스트 설정 (이벤트 수집기들이 참조)
  setContext(queue, config, logger);

  queue.start();
  isInitialized = true;

  // 기본 이벤트 수집기 등록
  registerCollectors([
    createStartCollector(),
    createVisibilityCollector(),
    createScrollCollector(),
    createClickCollector(),
    createInputCollector(),
    createPingCollector(),
    createExitCollector(),
  ]);

  logger.log('SDK 초기화 완료', config);
}

/**
 * 이벤트 수집기 일괄 등록 및 시작
 * init() 이후에 호출해야 한다.
 */
export function registerCollectors(items: Collector[]): void {
  collectors = items;
  collectors.forEach((c) => c.setup());
  logger.log(`수집기 ${collectors.length}개 등록`);
}

/**
 * 이벤트를 큐에 추가
 * 외부에서 커스텀 이벤트를 보낼 때 사용
 */
export function capture(type: EventType, payload: EventPayload = {}): void {
  if (!isInitialized) {
    console.warn('[LandOm] 초기화 전에는 capture를 호출할 수 없습니다.');
    return;
  }

  const event: SDKEvent = {
    type,
    timestamp: Date.now(),
    payload,
  };

  queue.push(event);
}


/**
 * SDK 종료
 * 모든 수집기 해제 + 잔여 이벤트 flush + 상태 초기화
 */
export function destroy(): void {
  if (!isInitialized) return;

  collectors.forEach((c) => c.teardown());
  collectors = [];
  queue.stop();
  isInitialized = false;
  logger.log('SDK 종료');
}
