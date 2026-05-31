import { init, destroy } from './sdk';
import { OVERLAY_ROOT_ID } from '../overlay/render';

// jsdom에는 IntersectionObserver가 없어 ping 수집기 setup이 실패한다.
// overlay와 무관한 환경 제약이므로 테스트에서만 no-op 스텁을 제공한다.
// 또한 replay(rrweb)는 jsdom에서 DOM 변경 시 node.matches 미구현으로 크래시하므로
// overlay 검증과 무관한 enableReplay는 꺼두고 init한다.
beforeAll(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return [];
      }
    };
});

afterEach(() => {
  destroy();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

test('overlay.enabled가 true면 init 시 overlay root가 생성된다', () => {
  init({ apiKey: 'k', enableReplay: false, overlay: { enabled: true } });
  expect(document.getElementById(OVERLAY_ROOT_ID)).not.toBeNull();
});

test('overlay 설정이 없으면 overlay root가 생성되지 않는다', () => {
  init({ apiKey: 'k', enableReplay: false });
  expect(document.getElementById(OVERLAY_ROOT_ID)).toBeNull();
});

test('destroy 시 overlay root가 제거된다', () => {
  init({ apiKey: 'k', enableReplay: false, overlay: { enabled: true } });
  destroy();
  expect(document.getElementById(OVERLAY_ROOT_ID)).toBeNull();
});
