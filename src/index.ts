// ─── 코어 API ───
export { init, capture, destroy } from './core/sdk';

// ─── 타입 re-export ───
export type {
  EventType,
  EventPayload,
  StartPayload,
  VisibilityPayload,
  ScrollPayload,
  ClickPayload,
  InputPayload,
  PingPayload,
  ExitPayload,
  CustomPayload,
  SDKEvent,
  TransportPayload,
  SDKConfig,
  SDKOptions,
} from './types';
