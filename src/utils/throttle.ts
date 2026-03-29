/**
 * Trailing-edge throttle
 * 마지막 호출 기준으로 ms 간격마다 한 번씩 실행한다
 * 스크롤 등 고빈도 이벤트의 호출 횟수를 제한할 때 사용
 *
 * 예시 (ms = 500):
 *   0ms   → 스크롤 100px 들어옴 → lastArgs = 100, 타이머 시작
 *   50ms  → 스크롤 200px 들어옴 → lastArgs = 200, 타이머 있으니 무시
 *   100ms → 스크롤 350px 들어옴 → lastArgs = 350, 타이머 있으니 무시
 *   500ms → 타이머 만료 → fn(350) 실행 (마지막 값만 사용됨)
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;

    // 이미 타이머가 걸려있으면 최신 인자만 저장하고 대기
    if (timeoutId !== null) return;

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, ms);
  };

  return throttled as T;
}
