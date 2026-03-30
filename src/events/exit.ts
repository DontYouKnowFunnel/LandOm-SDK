import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';
import { getElementId } from '../utils/dom';

/**
 * 이탈(exit) 이벤트 수집기
 * beforeunload + visibilitychange로 이탈을 감지
 * 이탈 직전 보이는 요소와 최대 스크롤 깊이를 기록하고 flushSync로 즉시 전송
 */
export function createExitCollector(): Collector {
  let hasFired = false; // beforeunload + visibilitychange 중복 방지
  let maxDepth = 0;

  /** 스크롤 시 최대 깊이 갱신 */
  function trackDepth() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const current = Math.round((window.scrollY / maxScroll) * 100);
    if (current > maxDepth) {
      maxDepth = current;
    }
  }

  /** 이탈 처리: exit 이벤트 발행 + flushSync */
  function handleExit() {
    if (hasFired) return;
    hasFired = true;

    trackDepth();

    // 뷰포트 하단에 보이는 마지막 요소 식별
    const lastEl = document.elementFromPoint(
      window.innerWidth / 2,
      window.innerHeight - 1,
    );
    const lastElementId = lastEl ? getElementId(lastEl) : 'unknown';

    const queue = getQueue();
    queue.push({
      type: 'exit',
      timestamp: Date.now(),
      payload: { lastElementId, maxDepth },
    });

    // 이탈 시 sendBeacon으로 즉시 전송
    queue.flushSync();
  }

  /** visibilitychange에서 hidden일 때만 이탈 처리 */
  function onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      handleExit();
    }
  }

  return {
    setup() {
      // 스크롤 시 최대 깊이 추적
      window.addEventListener('scroll', trackDepth, { passive: true });
      // 이탈 감지 (두 가지 이벤트 모두 등록)
      window.addEventListener('beforeunload', handleExit);
      document.addEventListener('visibilitychange', onVisibilityChange);
    },
    teardown() {
      window.removeEventListener('scroll', trackDepth);
      window.removeEventListener('beforeunload', handleExit);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      hasFired = false;
      maxDepth = 0;
    },
  };
}
