import { injectStyle, removeStyle, OVERLAY_STYLE_ID } from './styles';

afterEach(() => {
  document.head.innerHTML = '';
});

test('injectStyle은 style 태그를 한 번만 주입한다', () => {
  injectStyle();
  injectStyle();
  const styles = document.querySelectorAll(`#${OVERLAY_STYLE_ID}`);
  expect(styles).toHaveLength(1);
  expect(styles[0].textContent).toContain('__landom_overlay_root__');
});

test('removeStyle은 주입된 style을 제거한다', () => {
  injectStyle();
  removeStyle();
  expect(document.getElementById(OVERLAY_STYLE_ID)).toBeNull();
});
