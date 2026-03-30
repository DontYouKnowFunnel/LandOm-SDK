import type { SDKConfig } from '../types';
import type { Logger } from '../utils/logger';
import type { EventQueue } from './event-queue';

/**
 * SDK 내부 공유 컨텍스트
 * 순환 의존성을 방지하기 위해 sdk.ts와 이벤트 수집기 사이의 공유 상태를 분리
 */

let queue: EventQueue;
let config: SDKConfig;
let logger: Logger;

export function setContext(q: EventQueue, c: SDKConfig, l: Logger): void {
  queue = q;
  config = c;
  logger = l;
}

export function getQueue(): EventQueue {
  return queue;
}

export function getConfig(): SDKConfig {
  return config;
}

export function getLogger(): Logger {
  return logger;
}
