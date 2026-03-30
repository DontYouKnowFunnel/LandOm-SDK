import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';

const PING_INTERVAL = 5000; // 5초마다 현재 섹션 보고

/**
 * 체류 섹션(ping) 이벤트 수집기
 * IntersectionObserver로 현재 뷰포트에 보이는 섹션을 감지하고
 * 5초 간격으로 현재 체류 섹션을 보 고
 */
export function createPingCollector(): Collector {
  let observer: IntersectionObserver | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  let currentSectionId: string | null = null;

  return {
    setup() {
      // section 요소들을 관찰하여 현재 보이는 섹션 추적
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.target.id) {
              currentSectionId = entry.target.id;
            }
          }
        },
        { threshold: 0.3 }, // 30% 이상 보일 때 감지
      );

      // 페이지 내 모든 section 요소 관찰
      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => observer!.observe(section));

      // 5초마다 현재 섹션 보고
      timerId = setInterval(() => {
        if (!currentSectionId) return;

        getQueue().push({
          type: 'ping',
          timestamp: Date.now(),
          payload: { sectionId: currentSectionId },
        });
      }, PING_INTERVAL);
    },

    teardown() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      currentSectionId = null;
    },
  };
}
