import { funnelColors, colorFor } from './colors';

test('정의된 섹션은 해당 색상을 반환한다', () => {
  expect(colorFor('PRICING')).toBe('#3b82f6');
  expect(funnelColors.HERO).toBe('#ef4444');
});

test('모든 SectionName이 색상 맵에 존재한다', () => {
  expect(Object.keys(funnelColors)).toHaveLength(17);
});
