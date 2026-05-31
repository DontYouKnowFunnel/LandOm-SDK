import { formatLabel, ensureRoot, renderOverlay, OVERLAY_ROOT_ID } from './render';
import type { LandomOverlayItem } from '../types';

afterEach(() => {
  document.body.innerHTML = '';
});

test('라벨은 "SECTION · NN%" 형식이다', () => {
  expect(formatLabel('PRICING', 0.26)).toBe('PRICING · 26%');
  expect(formatLabel('CTA', 0.5)).toBe('CTA · 50%');
  expect(formatLabel('HERO', 0)).toBe('HERO · 0%');
});

test('ensureRoot는 body에 root를 한 번만 만든다', () => {
  const a = ensureRoot();
  const b = ensureRoot();
  expect(a).toBe(b);
  expect(a.id).toBe(OVERLAY_ROOT_ID);
  expect(document.querySelectorAll(`#${OVERLAY_ROOT_ID}`)).toHaveLength(1);
});

function stubRect(el: Element, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} , ...rect } as DOMRect);
}

test('매칭된 요소는 box+label을 그리고 matched로 분류한다', () => {
  const section = document.createElement('section');
  section.id = 'pricing';
  document.body.appendChild(section);
  stubRect(section, { left: 10, top: 200, width: 300, height: 100 });

  const root = ensureRoot();
  const items: LandomOverlayItem[] = [
    { sectionName: 'PRICING', selector: 'section#pricing', dropRate: 0.26 },
  ];
  const result = renderOverlay(root, items);

  expect(result.matched).toEqual([{ sectionName: 'PRICING', selector: 'section#pricing' }]);
  expect(result.missing).toHaveLength(0);
  expect(result.invalid).toHaveLength(0);

  const box = root.querySelector('.landom-funnel-box') as HTMLElement;
  expect(box).not.toBeNull();
  expect(box.style.left).toBe('10px');
  expect(box.style.top).toBe('200px');
  const label = box.querySelector('.landom-funnel-label') as HTMLElement;
  expect(label.textContent).toBe('PRICING · 26%');
});

test('존재하지 않는 selector는 missing으로 분류한다', () => {
  const root = ensureRoot();
  const result = renderOverlay(root, [
    { sectionName: 'FAQ', selector: '#nope', dropRate: 0.1 },
  ]);
  expect(result.missing).toEqual([{ sectionName: 'FAQ', selector: '#nope' }]);
  expect(root.querySelectorAll('.landom-funnel-box')).toHaveLength(0);
});

test('크기가 0인 요소는 missing으로 분류한다', () => {
  const el = document.createElement('div');
  el.id = 'zero';
  document.body.appendChild(el);
  stubRect(el, { width: 0, height: 0 });
  const root = ensureRoot();
  const result = renderOverlay(root, [
    { sectionName: 'CTA', selector: '#zero', dropRate: 0.3 },
  ]);
  expect(result.missing).toHaveLength(1);
  expect(result.matched).toHaveLength(0);
});

test('잘못된 selector 문법은 invalid로 분류한다', () => {
  const root = ensureRoot();
  const result = renderOverlay(root, [
    { sectionName: 'GENERIC', selector: '###', dropRate: 0.2 },
  ]);
  expect(result.invalid).toEqual([{ sectionName: 'GENERIC', selector: '###' }]);
});

test('renderOverlay 재호출 시 이전 box를 비운다', () => {
  const section = document.createElement('section');
  section.id = 'pricing';
  document.body.appendChild(section);
  stubRect(section, { left: 0, top: 200, width: 300, height: 100 });
  const root = ensureRoot();
  const items: LandomOverlayItem[] = [
    { sectionName: 'PRICING', selector: 'section#pricing', dropRate: 0.26 },
  ];
  renderOverlay(root, items);
  renderOverlay(root, items);
  expect(root.querySelectorAll('.landom-funnel-box')).toHaveLength(1);
});

test('너비만 0인 요소도 missing으로 분류한다', () => {
  const el = document.createElement('div');
  el.id = 'sliver';
  document.body.appendChild(el);
  stubRect(el, { width: 0, height: 100 });
  const root = ensureRoot();
  const result = renderOverlay(root, [
    { sectionName: 'CTA', selector: '#sliver', dropRate: 0.3 },
  ]);
  expect(result.missing).toHaveLength(1);
  expect(result.matched).toHaveLength(0);
});

test('top<36인 요소의 라벨은 is-inside 클래스를 가진다', () => {
  const el = document.createElement('div');
  el.id = 'topbar';
  document.body.appendChild(el);
  stubRect(el, { left: 0, top: 0, width: 200, height: 50 });
  const root = ensureRoot();
  renderOverlay(root, [{ sectionName: 'HERO', selector: '#topbar', dropRate: 0.4 }]);
  const label = root.querySelector('.landom-funnel-label') as HTMLElement;
  expect(label.className).toContain('is-inside');
});
