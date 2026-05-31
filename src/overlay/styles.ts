export const OVERLAY_STYLE_ID = '__landom_overlay_style__';

export const OVERLAY_CSS = `
#__landom_overlay_root__ {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2147483647;
  font-family: Pretendard, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
#__landom_overlay_root__ .landom-funnel-box {
  position: absolute;
  border: 2px solid;
  background: rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  border-radius: 8px;
  box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.03);
}
#__landom_overlay_root__ .landom-funnel-label {
  position: absolute;
  top: -30px;
  left: 0;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  line-height: 16px;
  padding: 5px 8px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.25);
}
#__landom_overlay_root__ .landom-funnel-label.is-inside {
  top: 8px;
  left: 8px;
}
`;

/** overlay 스타일을 head에 1회 주입한다(중복 방지). */
export function injectStyle(): void {
  if (document.getElementById(OVERLAY_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = OVERLAY_STYLE_ID;
  style.textContent = OVERLAY_CSS;
  document.head.appendChild(style);
}

/** 주입된 overlay 스타일을 제거한다. */
export function removeStyle(): void {
  document.getElementById(OVERLAY_STYLE_ID)?.remove();
}
