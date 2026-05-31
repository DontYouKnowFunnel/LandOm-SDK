import { createOverlayController } from './overlay';
import { OVERLAY_ROOT_ID } from './render';
import { OVERLAY_STYLE_ID } from './styles';
import type { Collector } from '../core/sdk';

let postSpy: jest.SpyInstance;

function stubRect(el: Element, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {}, ...rect } as DOMRect);
}

beforeEach(() => {
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 1; }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
  postSpy = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => {});
});

afterEach(() => {
  postSpy.mockRestore();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

function send(data: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data }));
}

test('setup 시 style/root 생성 후 READY를 부모로 보낸다', () => {
  const c: Collector = createOverlayController();
  c.setup();
  expect(document.getElementById(OVERLAY_STYLE_ID)).not.toBeNull();
  expect(document.getElementById(OVERLAY_ROOT_ID)).not.toBeNull();
  expect(postSpy).toHaveBeenCalledWith({ type: 'LANDOM_OVERLAY_READY' }, '*');
  c.teardown();
});

test('SET 메시지를 받으면 렌더 후 RESULT를 보낸다', () => {
  const section = document.createElement('section');
  section.id = 'pricing';
  document.body.appendChild(section);
  stubRect(section, { left: 0, top: 200, width: 300, height: 100 });

  const c = createOverlayController();
  c.setup();
  postSpy.mockClear();

  send({ type: 'LANDOM_OVERLAY_SET', items: [
    { sectionName: 'PRICING', selector: 'section#pricing', dropRate: 0.26 },
  ]});

  const root = document.getElementById(OVERLAY_ROOT_ID)!;
  expect(root.querySelectorAll('.landom-funnel-box')).toHaveLength(1);
  expect(postSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'LANDOM_OVERLAY_RESULT',
      matched: [{ sectionName: 'PRICING', selector: 'section#pricing' }],
    }),
    '*',
  );
  c.teardown();
});

test('CLEAR는 overlay를 비운다', () => {
  const section = document.createElement('section');
  section.id = 'pricing';
  document.body.appendChild(section);
  stubRect(section, { left: 0, top: 200, width: 300, height: 100 });

  const c = createOverlayController();
  c.setup();
  send({ type: 'LANDOM_OVERLAY_SET', items: [
    { sectionName: 'PRICING', selector: 'section#pricing', dropRate: 0.26 },
  ]});
  send({ type: 'LANDOM_OVERLAY_CLEAR' });

  const root = document.getElementById(OVERLAY_ROOT_ID)!;
  expect(root.querySelectorAll('.landom-funnel-box')).toHaveLength(0);
  c.teardown();
});

test('HIDE/SHOW는 root의 display를 토글한다', () => {
  const c = createOverlayController();
  c.setup();
  const root = document.getElementById(OVERLAY_ROOT_ID)! as HTMLElement;

  send({ type: 'LANDOM_OVERLAY_HIDE' });
  expect(root.style.display).toBe('none');

  send({ type: 'LANDOM_OVERLAY_SHOW' });
  expect(root.style.display).toBe('block');
  c.teardown();
});

test('객체가 아닌 메시지는 무시한다', () => {
  const c = createOverlayController();
  c.setup();
  postSpy.mockClear();
  send('hello');
  send(null);
  expect(postSpy).not.toHaveBeenCalled();
  c.teardown();
});

test('teardown은 root/style을 제거하고 메시지 수신을 멈춘다', () => {
  const c = createOverlayController();
  c.setup();
  c.teardown();
  expect(document.getElementById(OVERLAY_ROOT_ID)).toBeNull();
  expect(document.getElementById(OVERLAY_STYLE_ID)).toBeNull();

  postSpy.mockClear();
  send({ type: 'LANDOM_OVERLAY_SET', items: [] });
  expect(postSpy).not.toHaveBeenCalled();
});
