import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';

/**
 * 페이지 진입(start) 이벤트 수집
 * init 시 즉시 start 이벤트를 발행
 */
export function createStartCollector(): Collector {
  return {
    setup() {
      getQueue().push({
        type: 'start',
        timestamp: Date.now(),
        payload: {},
      });
    },
    teardown() {
      // 정리할 리스너 없음
    },
  };
}
