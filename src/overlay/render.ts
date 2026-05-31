import type { LandomOverlayItem, OverlayResult } from '../types';
import { colorFor } from './colors';

export const OVERLAY_ROOT_ID = '__landom_overlay_root__';

/**
 * 라벨을 box 위(top:-30px)에 그릴지 box 안(is-inside)에 그릴지 가르는 임계값(px).
 * rect.top은 viewport 기준이며, overlay root가 `position: fixed; inset: 0`라는 전제 하에
 * box의 좌표계와 일치한다. styles.ts의 라벨 높이(top:-30px + padding)와 맞춰진 값.
 */
const LABEL_INSIDE_THRESHOLD = 36;

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

/**
 * items를 순회하며 매칭/누락/무효로 분류하고, 매칭된 요소 위에 box+label을 그린다.
 * root는 호출 시점에 비워진다. RESULT 전송은 호출자(컨트롤러) 책임.
 * 전제: overlay 스타일(injectStyle)이 주입돼 있어야 box의 position:absolute가 적용된다.
 */
export function renderOverlay(root: HTMLElement, items: LandomOverlayItem[]): OverlayResult {
  root.innerHTML = '';
  const matched: OverlayResult['matched'] = [];
  const missing: OverlayResult['missing'] = [];
  const invalid: OverlayResult['invalid'] = [];

  for (const item of items) {
    const id = { sectionName: item.sectionName, selector: item.selector };

    let element: Element | null = null;
    try {
      element = document.querySelector(item.selector);
    } catch {
      invalid.push(id);
      continue;
    }

    if (!element) {
      missing.push(id);
      continue;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      missing.push(id);
      continue;
    }

    matched.push(id);

    const color = colorFor(item.sectionName);

    const box = document.createElement('div');
    box.className = 'landom-funnel-box';
    box.style.borderColor = color;
    box.style.left = `${rect.left}px`;
    box.style.top = `${rect.top}px`;
    box.style.width = `${rect.width}px`;
    box.style.height = `${rect.height}px`;

    const label = document.createElement('div');
    label.className =
      rect.top < LABEL_INSIDE_THRESHOLD ? 'landom-funnel-label is-inside' : 'landom-funnel-label';
    label.style.background = color;
    label.textContent = formatLabel(item.sectionName, item.dropRate);

    box.appendChild(label);
    root.appendChild(box);
  }

  return { matched, missing, invalid };
}
