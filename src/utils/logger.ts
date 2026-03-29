/** SDK 내부 로거 인터페이스(디버깅용으로 넣음) */
export interface Logger {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
}

const noop = () => {};

/**
 * 조건부 로거 생성
 * debug가 true일 때만 콘솔에 [LandOm] 접두사와 함께 출력
 */
export function createLogger(debug: boolean): Logger {
  if (!debug) {
    return { log: noop, warn: noop };
  }

  return {
    log: (...args: unknown[]) => console.log('[LandOm]', ...args),
    warn: (...args: unknown[]) => console.warn('[LandOm]', ...args),
  };
}
