import type { Collector } from '../core/sdk';
import type { LandomOverlayItem } from '../types';
import { injectStyle, removeStyle } from './styles';
import { ensureRoot, renderOverlay, OVERLAY_ROOT_ID } from './render';

const OBSERVE_OPTS: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class', 'style', 'id'],
};

/**
 * 퍼널 오버레이 컨트롤러.
 * Collector 인터페이스(setup/teardown)를 재사용하지만 이벤트 큐는 사용하지 않는다.
 */
export function createOverlayController(): Collector {
  let lastItems: LandomOverlayItem[] = [];
  let rafId: number | null = null;
  let observer: MutationObserver | null = null;
  let isObserving = false;
  let root: HTMLElement | null = null;

  function render(): void {
    if (!root) return;
    // 자기 DOM 변경이 MutationObserver를 다시 트리거하는 무한 루프를 막는다.
    observer?.disconnect();
    try {
      const result = renderOverlay(root, lastItems);
      window.parent.postMessage({ type: 'LANDOM_OVERLAY_RESULT', ...result }, '*');
    } finally {
      if (isObserving && observer) observer.observe(document.body, OBSERVE_OPTS);
    }
  }

  function scheduleRender(): void {
    if (rafId !== null) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      render();
    });
  }

  function handleMessage(event: MessageEvent): void {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    switch (message.type) {
      case 'LANDOM_OVERLAY_SET':
        lastItems = Array.isArray(message.items) ? message.items : [];
        render();
        break;
      case 'LANDOM_OVERLAY_CLEAR':
        lastItems = [];
        if (root) root.innerHTML = '';
        break;
      case 'LANDOM_OVERLAY_HIDE':
        if (root) root.style.display = 'none';
        break;
      case 'LANDOM_OVERLAY_SHOW':
        if (root) root.style.display = 'block';
        scheduleRender();
        break;
    }
  }

  return {
    setup() {
      injectStyle();
      root = ensureRoot();
      window.addEventListener('message', handleMessage);
      window.addEventListener('scroll', scheduleRender, { passive: true });
      window.addEventListener('resize', scheduleRender);
      window.addEventListener('load', scheduleRender);
      observer = new MutationObserver(scheduleRender);
      observer.observe(document.body, OBSERVE_OPTS);
      isObserving = true;
      window.parent.postMessage({ type: 'LANDOM_OVERLAY_READY' }, '*');
    },
    teardown() {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('scroll', scheduleRender);
      window.removeEventListener('resize', scheduleRender);
      window.removeEventListener('load', scheduleRender);
      isObserving = false;
      observer?.disconnect();
      observer = null;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.getElementById(OVERLAY_ROOT_ID)?.remove();
      root = null;
      removeStyle();
    },
  };
}
