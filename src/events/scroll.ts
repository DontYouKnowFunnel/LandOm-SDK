import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';
import { throttle } from '../utils/throttle';
import { touchSession } from '../utils/session';

const THROTTLE_MS = 500;

/**
 * 스크롤(scroll) 이벤트 수집기
 * 500ms trailing-edge 쓰로틀로 스크롤 위치와 비율을 기록
 */
export function createScrollCollector(): Collector {
  const handler = throttle(() => {
    touchSession();

    const yOffset = window.scrollY;
    // 전체 문서 높이 - 뷰포트 높이 = 최대 스크롤 가능 거리
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = maxScroll > 0 ? Math.round((yOffset / maxScroll) * 100) / 100 : 0;

    getQueue().push({
      type: 'scroll',
      timestamp: Date.now(),
      payload: { yOffset, percentage },
    });
  }, THROTTLE_MS);

  return {
    setup() {
      window.addEventListener('scroll', handler, { passive: true });
    },
    teardown() {
      window.removeEventListener('scroll', handler);
    },
  };
}
