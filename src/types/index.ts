// ─── 이벤트 타입 ───

export type EventType =
  | 'start'
  | 'visibility'
  | 'scroll'
  | 'click'
  | 'input'
  | 'ping'
  | 'exit'
  | 'custom';

// ─── 이벤트별 payload ───

export interface StartPayload {
  // 페이지 진입 시점 — 별도 데이터 없음
}

export interface VisibilityPayload {
  isVisible: boolean;
}

export interface ScrollPayload {
  yOffset: number;
  percentage: number;
}

export interface ClickPayload {
  targetId: string;
}

export interface InputPayload {
  fieldId: string;
}

export interface PingPayload {
  sectionId: string;
}

export interface ExitPayload {
  lastElementId: string;
  maxDepth: number;
}

export interface CustomPayload {
  [key: string]: unknown;
}

export type EventPayload =
  | StartPayload
  | VisibilityPayload
  | ScrollPayload
  | ClickPayload
  | InputPayload
  | PingPayload
  | ExitPayload
  | CustomPayload;

// ─── SDK 이벤트 (큐에 저장되는 단위) ───

export interface SDKEvent {
  type: EventType;
  timestamp: number;
  payload: EventPayload;
}

// ─── 전송 payload (서버로 보내는 배치 구조) ───

export interface TransportPayload {
  sessionId: string;
  userId: string;
  userAgent: string;
  url: string;
  events: SDKEvent[];
}

// ─── SDK 설정 ───

export interface SDKConfig {
  apiKey: string;
  endpoint: string;
  flushInterval: number;
  flushQueueSize: number;
  maxQueueSize: number;
  maxRetries: number;
  beforeSend?: (event: SDKEvent) => SDKEvent | null;
  debug: boolean;
}

export type SDKOptions = Partial<SDKConfig> & Pick<SDKConfig, 'apiKey'>;

// ─── SDK 기본값 ───

export const DEFAULT_CONFIG: Omit<SDKConfig, 'apiKey'> = {
  endpoint: '/api/v1/events',
  flushInterval: 3000,
  flushQueueSize: 20,
  maxQueueSize: 100,
  maxRetries: 3,
  debug: false,
};
