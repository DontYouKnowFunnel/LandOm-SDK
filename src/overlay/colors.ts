import type { SectionName } from '../types';

export const funnelColors: Record<SectionName, string> = {
  HERO: '#ef4444',
  PROBLEM: '#f43f5e',
  TARGET: '#f97316',
  USE_CASE: '#14b8a6',
  FEATURE: '#eab308',
  VALUE_PROP: '#f97316',
  SOCIAL_PROOF: '#22c55e',
  TRUST: '#06b6d4',
  PRICING: '#3b82f6',
  FAQ: '#84cc16',
  CTA: '#6366f1',
  CTA_SECTION: '#6366f1',
  INPUT_FORM: '#a855f7',
  CHECKOUT: '#ec4899',
  INTERACTIVE: '#14b8a6',
  POPUP: '#f43f5e',
  GENERIC: '#64748b',
};

/** 미정의 섹션은 GENERIC 색상으로 폴백한다. */
export function colorFor(sectionName: SectionName): string {
  return funnelColors[sectionName] ?? funnelColors.GENERIC;
}
