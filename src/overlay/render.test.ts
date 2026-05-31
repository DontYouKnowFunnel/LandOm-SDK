import { formatLabel, ensureRoot, OVERLAY_ROOT_ID } from './render';

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
