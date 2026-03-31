const SESSION_KEY = 'landom_session';
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30분 비활동 시 세션 만료
const MAX_DURATION = 24 * 60 * 60 * 1000; // 24시간 최대 세션 지속

/** sessionStorage에 저장되는 세션 데이터 */
interface SessionData {
  sessionId: string;
  startedAt: number;
  lastActivityAt: number;
}

// ─── UUIDv7 (RFC 9562) ───

/**
 * UUIDv7 생성
 * 상위 48비트에 밀리초 타임스탬프를 담아 시간순 정렬
 */
export function generateUUIDv7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // 상위 48비트: 밀리초 단위 Unix 타임스탬프
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // 버전 7 표시
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  // variant 10xx 표시
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // 바이트 배열을 8-4-4-4-12 형식의 hex 문자열로 변환
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ─── Storage 헬퍼 ───

/** sessionStorage에서 JSON 파싱하여 읽기 (실패 시 null) */
function readStorage<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** sessionStorage에 JSON 직렬화하여 저장 (private browsing 등에서 실패 시 무시) */
function writeStorage(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage 사용 불가 시 무시
  }
}

// ─── 세션 관리 ───

/** 새 세션 생성 후 sessionStorage에 저장 */
function createSession(): SessionData {
  const now = Date.now();
  const session: SessionData = {
    sessionId: generateUUIDv7(),
    startedAt: now,
    lastActivityAt: now,
  };
  writeStorage(SESSION_KEY, session);
  return session;
}

/** 세션 만료 여부 확인 (30분 비활동 또는 24시간 초과) */
function isExpired(session: SessionData): boolean {
  const now = Date.now();
  const idle = now - session.lastActivityAt > IDLE_TIMEOUT;
  const maxed = now - session.startedAt > MAX_DURATION;
  return idle || maxed;
}

/** 기존 세션 반환, 없거나 만료되었으면 새로 생성 */
export function getOrCreateSession(): SessionData {
  const existing = readStorage<SessionData>(SESSION_KEY);
  if (existing && !isExpired(existing)) {
    return existing;
  }
  return createSession();
}

/** 마지막 활동 시간 갱신 */
export function touchSession(): void {
  const session = getOrCreateSession();
  session.lastActivityAt = Date.now();
  writeStorage(SESSION_KEY, session);
}

/** 현재 세션 ID 반환 (활동 시간도 갱신) */
export function getSessionId(): string {
  const session = getOrCreateSession();
  session.lastActivityAt = Date.now();
  writeStorage(SESSION_KEY, session);
  return session.sessionId;
}

