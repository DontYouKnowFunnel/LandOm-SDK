import type { Collector } from '../core/sdk';
import { getQueue } from '../core/context';
import { getElementId } from '../utils/dom';
import { touchSession } from '../utils/session';

/** input 이벤트 대상 태그 */
const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * 입력(input) 이벤트 수집기
 * focus 이벤트로 입력 필드 진입만 1회 기록(  값은 수집하지 않음)
 */
export function createInputCollector(): Collector {
  function handler(e: FocusEvent) {
    const target = e.target as Element | null;
    if (!target || !INPUT_TAGS.has(target.tagName)) return;

    touchSession();

    getQueue().push({
      type: 'input',
      timestamp: Date.now(),
      payload: { fieldId: getElementId(target) },
    });
  }

  return {
    setup() {
      // capture: true로 포커스 이벤트 감지 (focus는 버블링되지 않음)
      document.addEventListener('focus', handler, { capture: true });
    },
    teardown() {
      document.removeEventListener('focus', handler, { capture: true });
    },
  };
}
