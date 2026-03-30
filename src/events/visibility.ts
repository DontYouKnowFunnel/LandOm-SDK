import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';
import { touchSession } from '../utils/session';

/**
 * 탭 전환/최소화(visibility) 이벤트 수집기
 * visibilitychange 이벤트로 탭 활성/비활성 상태를 추적
 */
export function createVisibilityCollector(): Collector {
  function handler() {
    const isVisible = document.visibilityState === 'visible';

    // 탭 복귀 시 세션 활동 시간 갱신
    if (isVisible) {
      touchSession();
    }

    getQueue().push({
      type: 'visibility',
      timestamp: Date.now(),
      payload: { isVisible },
    });
  }

  return {
    setup() {
      document.addEventListener('visibilitychange', handler);
    },
    teardown() {
      document.removeEventListener('visibilitychange', handler);
    },
  };
}
