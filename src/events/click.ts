import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';
import { getElementId } from '../utils/dom';
import { touchSession } from '../utils/session';

/**
 * 클릭(click) 이벤트 수집
 * capture: true로 문서 최상단에서 모든 클릭을 감지
 */
export function createClickCollector(): Collector {
  function handler(e: MouseEvent) {
    const target = e.target as Element | null;
    if (!target) return;

    touchSession();

    getQueue().push({
      type: 'click',
      timestamp: Date.now(),
      payload: { targetId: getElementId(target) },
    });
  }

  return {
    setup() {
      document.addEventListener('click', handler, { capture: true });
    },
    teardown() {
      document.removeEventListener('click', handler, { capture: true });
    },
  };
}
