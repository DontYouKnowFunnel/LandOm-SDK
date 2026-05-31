import type { LandomOverlayItem, OverlayResult } from '../types';
import { colorFor } from './colors';

export const OVERLAY_ROOT_ID = '__landom_overlay_root__';

/** "PRICING · 26%" 형식의 라벨 문자열을 만든다. */
export function formatLabel(sectionName: string, dropRate: number): string {
  return `${sectionName} · ${Math.round(dropRate * 100)}%`;
}

/** overlay root를 보장한다. 없으면 body에 생성, 있으면 재사용. */
export function ensureRoot(): HTMLElement {
  const existing = document.getElementById(OVERLAY_ROOT_ID);
  if (existing) return existing as HTMLElement;
  const root = document.createElement('div');
  root.id = OVERLAY_ROOT_ID;
  document.body.appendChild(root);
  return root;
}
