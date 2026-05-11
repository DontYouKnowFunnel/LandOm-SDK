// ─── 이벤트 타입 ───

export type EventType =
  | 'start'
  | 'visibility'
  | 'scroll'
  | 'click'
  | 'input'
  | 'replay'
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

export interface ReplayPayload {
  event: unknown;
  isCheckout: boolean;
  version: 'rrweb';
}

export interface CompressedReplayPayload {
  compressed: true;
  compression: 'gzip';
  encoding: 'base64';
  data: string;
  version: 'rrweb';
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
  | ReplayPayload
  | CompressedReplayPayload
  | PingPayload
  | ExitPayload
  | CustomPayload;

// ─── SDK 이벤트 (큐에 저장되는 단위) ───

export interface SDKEvent {
  type: EventType;
  timestamp: number;
  // 발생 요소의 CSS selector. 연결된 요소가 없는 이벤트는 null.
  cssSelector: string | null;
  payload: EventPayload;
}

// ─── 전송 payload (서버로 보내는 배치 구조) ───

export interface TransportPayload {
  sessionId: string;
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
  enableReplay: boolean;
  replayMaskAllInputs: boolean;
  replayBlockClass: string;
  replayBlockSelector?: string;
  replayMaskTextClass: string;
  replayMaskTextSelector?: string;
  replayInlineStylesheet: boolean;
  replayCheckoutEveryNms: number;
  replayMousemoveSampling: number | false;
  replayMousemoveCallbackSampling: number;
  replayScrollSampling: number;
  replayInputSampling: 'all' | 'last';
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
  enableReplay: true,
  replayMaskAllInputs: true,
  replayBlockClass: 'rr-block',
  replayBlockSelector: '.no-record',
  replayMaskTextClass: 'rr-mask',
  // cross-origin stylesheet도 재생 가능하도록 인라인 (페이로드 ↑ 트레이드오프)
  replayInlineStylesheet: true,
  replayCheckoutEveryNms: 600_000,
  replayMousemoveSampling: false,
  replayMousemoveCallbackSampling: 500,
  replayScrollSampling: 200,
  replayInputSampling: 'last',
  debug: false,
};
