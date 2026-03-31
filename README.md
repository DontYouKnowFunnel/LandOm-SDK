# LandOm SDK

랜딩페이지 사용자 행동(클릭, 스크롤, 입력, 이탈 등)을 자동 수집하여 서버로 전송하는 경량 SDK.

## 설치

```bash
git clone https://github.com/DontYouKnowFunnel/LandOm-SDK.git
cd LandOm-SDK
npm install
```

## 빌드

```bash
# 빌드 (ESM / CJS / UMD)
npm run build

# 개발 모드 (watch)
npm run dev
```

### 빌드 결과물

| 파일 | 포맷 | 용도 |
|------|------|------|
| `dist/landom-sdk.esm.js` | ESM | 번들러 (Vite, Webpack 등) |
| `dist/landom-sdk.cjs.js` | CJS | Node.js / require() |
| `dist/landom-sdk.umd.js` | UMD | `<script>` 태그 직접 삽입 |

## 사용법

빌드 후 `dist/landom-sdk.umd.js`를 HTML에 삽입합니다.

```html
<script src="dist/landom-sdk.umd.js"></script>
<script>
  LandOm.init({
    apiKey: 'your-project-key',
    endpoint: 'http://your-server.com/api/v1/events',
  });
</script>
```

`init()` 호출만 하면 페이지 내 모든 사용자 행동이 자동 수집됩니다.

### 전체 옵션

```js
LandOm.init({
  apiKey: 'your-project-key',
  endpoint: '/api/v1/events',   // 이벤트 전송 엔드포인트 (기본값)
  flushInterval: 3000,          // 자동 전송 간격 ms (기본값)
  flushQueueSize: 20,           // 큐 크기 도달 시 즉시 전송 (기본값)
  maxQueueSize: 100,            // 최대 큐 크기, 초과 시 오래된 이벤트 드롭 (기본값)
  debug: false,                 // 콘솔 디버그 로그 (기본값)
  beforeSend: (event) => event, // 전송 전 이벤트 가공/필터링 훅
});
```

## 자동 수집 이벤트

SDK가 `init()` 후 자동으로 수집하는 이벤트:

| 이벤트 | 설명 | Payload |
|--------|------|---------|
| `start` | 페이지 진입 | - |
| `visibility` | 탭 전환/최소화 | `isVisible` |
| `scroll` | 스크롤 (500ms 쓰로틀) | `yOffset`, `percentage` |
| `click` | element 클릭 | `targetId` |
| `input` | 입력 필드 포커스 (값 미수집) | `fieldId` |
| `ping` | 현재 보고 있는 섹션 (5초 간격) | `sectionId` |
| `exit` | 페이지 이탈 | `lastElementId`, `maxDepth` |

## 서버로 전송되는 데이터

`POST /api/v1/events`로 배치 전송됩니다.

```
Header: X-Project-Key: <apiKey>
```

```json
{
  "sessionId": "UUIDv7",
  "userAgent": "Mozilla/5.0 ...",
  "url": "https://example.com",
  "events": [
    { "type": "click", "timestamp": 1711612800000, "payload": { "targetId": "#signup-btn" } },
    { "type": "scroll", "timestamp": 1711612802000, "payload": { "yOffset": 500, "percentage": 25 } }
  ]
}
```

페이지 이탈 시에는 `navigator.sendBeacon`을 사용하며, 헤더 설정이 불가하므로 body에 `apiKey`를 포함합니다.

## 프로젝트 구조

```
src/
├── index.ts                # 진입점 (init, capture + 타입 re-export)
├── types/
│   └── index.ts            # 이벤트 타입, SDK 설정, 전송 payload 정의
├── utils/
│   ├── logger.ts           # 조건부 디버그 로거(개발용)
│   ├── session.ts          # UUIDv7 생성, 세션 ID 관리
│   ├── throttle.ts         # trailing-edge 쓰로틀
│   └── dom.ts              # DOM 요소 식별자 추출
├── transport/
│   └── transport.ts        # fetch(keepalive) + sendBeacon 전송
├── core/
│   ├── context.ts          # 이벤트 수집기 공유 컨텍스트
│   ├── event-queue.ts      # 이벤트 버퍼링 및 배치 flush
│   └── sdk.ts              # 싱글턴 SDK 코어 (모듈 조립)
└── events/
    ├── start.ts            # 페이지 진입 이벤트
    ├── visibility.ts       # 탭 전환 감지
    ├── scroll.ts           # 스크롤 깊이 추적
    ├── click.ts            # 클릭 이벤트
    ├── input.ts            # 입력 필드 포커스 감지
    ├── ping.ts             # 체류 섹션 보고 (IntersectionObserver)
    └── exit.ts             # 이탈 감지 + 동기 flush
```
