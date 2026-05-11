# LandOm SDK

랜딩페이지 사용자 행동(클릭, 스크롤, 입력, 이탈, 세션 리플레이 등)을 자동 수집하여 서버로 전송하는 경량 SDK.

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

`init()` 호출만 하면 페이지 내 모든 사용자 행동과 rrweb 세션 리플레이가 자동 수집됩니다.

### 전체 옵션

```js
LandOm.init({
  apiKey: 'your-project-key',
  endpoint: '/api/v1/events',          // 이벤트 전송 엔드포인트 (기본값)
  flushInterval: 3000,                 // 자동 전송 간격 ms (기본값)
  flushQueueSize: 20,                  // 큐 크기 도달 시 즉시 전송 (기본값)
  maxQueueSize: 100,                   // 최대 큐 크기, 초과 시 오래된 이벤트 드롭 (기본값)
  maxRetries: 3,                       // fetch 전송 실패 재시도 횟수 (기본값)

  replayMaskAllInputs: true,           // rrweb input 값 마스킹 여부 (기본값)
  replayBlockClass: 'rr-block',        // 녹화에서 제외할 요소 클래스
  replayBlockSelector: '.no-record',   // 녹화에서 제외할 요소 선택자
  replayMaskTextClass: 'rr-mask',      // 텍스트를 마스킹할 요소 클래스
  replayCheckoutEveryNms: 600000,      // rrweb full snapshot 재생성 간격 ms (기본값: 10분)
  replayMousemoveSampling: false,      // mousemove 기록 여부/간격 (기본값: 비활성화)
  replayMousemoveCallbackSampling: 500,// mousemove emit 간격 ms (mousemove 활성화 시)
  replayScrollSampling: 200,           // scroll 샘플링 간격 ms (기본값)
  replayInputSampling: 'last',         // input 기록 빈도 (기본값: change 중심)

  debug: false,                        // 콘솔 디버그 로그 (기본값)
  beforeSend: (event) => event,        // 전송 전 이벤트 가공/필터링 훅
});
```

## 세션 리플레이

rrweb 기반 세션 리플레이는 `init()` 호출 후 자동으로 수집됩니다. 별도 on/off 옵션은 없습니다.

리플레이 수집 시 `type: "replay"` 이벤트가 전송되며, rrweb payload는 `pako`로 Gzip 압축 후 Base64 문자열로 전송됩니다.

```json
{
  "type": "replay",
  "timestamp": 1711612803000,
  "cssSelector": null,
  "payload": {
    "compressed": true,
    "compression": "gzip",
    "encoding": "base64",
    "data": "...",
    "version": "rrweb"
  }
}
```

서버는 저장 전에 압축을 해제해서 기존 `event_details.payload`에 원래 JSON 구조를 저장합니다.

### 리플레이 데이터 최소화

SDK는 rrweb 기록량을 줄이기 위해 다음 설정을 기본 적용합니다.

| 설정 | 값 | 설명 |
|------|----|------|
| `slimDOMOptions` | `"all"` | script, comment, head metadata 등 불필요한 DOM 기록 최소화 |
| `inlineStylesheet` | `false` | 거대한 stylesheet 내용이 DOM snapshot에 인라인으로 반복 기록되는 것을 방지 |
| `sampling.mousemove` | `false` | 마우스 이동 기록 비활성화 |
| `sampling.scroll` | `200` | rrweb 기본 100ms 대비 스크롤 기록 빈도 축소 |
| `sampling.input` | `"last"` | 입력 이벤트를 change 중심으로 기록 |
| `checkoutEveryNms` | `600000` | full snapshot 주기 10분 |
| `blockSelector` | `.no-record` | 해당 선택자 요소를 녹화에서 제외 |

민감 영역은 HTML에 `rr-block` 또는 `no-record` 클래스를 붙이면 녹화에서 제외되고, `rr-mask` 클래스를 붙이면 텍스트가 마스킹됩니다.

```html
<section class="no-record">
  이 영역은 리플레이에 기록되지 않습니다.
</section>

<p class="rr-mask">
  이 텍스트는 마스킹되어 기록됩니다.
</p>
```

## 자동 수집 이벤트

SDK가 `init()` 후 자동으로 수집하는 이벤트:

모든 이벤트는 공통 필드 `cssSelector: string | null`을 포함합니다 (연결된 요소가 없는 이벤트는 `null`).

| 이벤트 | 설명 | Payload | cssSelector |
|--------|------|---------|-------------|
| `start` | 페이지 진입 | - | `null` |
| `visibility` | 탭 전환/최소화 | `isVisible` | `null` |
| `scroll` | 스크롤 (500ms 쓰로틀) | `yOffset`, `percentage` | `null` |
| `click` | element 클릭 | `targetId` | 클릭된 요소 |
| `input` | 입력 필드 포커스 (값 미수집) | `fieldId` | 입력 필드 |
| `replay` | rrweb 세션 리플레이 | `compressed`, `compression`, `encoding`, `data`, `version` | `null` |
| `ping` | 현재 보고 있는 섹션 (5초 간격) | `sectionId` | 현재 섹션 |
| `exit` | 페이지 이탈 | `lastElementId`, `maxDepth` | 마지막 요소 (없으면 `null`) |

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
    {
      "type": "click",
      "timestamp": 1711612800000,
      "cssSelector": "section[id=\"hero\"] > button:nth-of-type(1)",
      "payload": { "targetId": "#signup-btn" }
    },
    {
      "type": "scroll",
      "timestamp": 1711612802000,
      "cssSelector": null,
      "payload": { "yOffset": 500, "percentage": 25 }
    },
    {
      "type": "replay",
      "timestamp": 1711612803000,
      "cssSelector": null,
      "payload": {
        "compressed": true,
        "compression": "gzip",
        "encoding": "base64",
        "data": "...",
        "version": "rrweb"
      }
    }
  ]
}
```

페이지 이탈 시에는 `navigator.sendBeacon`을 사용하며, 헤더 설정이 불가하므로 body에 `apiKey`를 포함합니다.

## 프로젝트 구조

```
src/
├── index.ts                # 진입점 (init, capture + 타입 re-export)
├── types/
│   ├── index.ts            # 이벤트 타입, SDK 설정, 전송 payload 정의
│   └── pako.d.ts           # pako gzip 타입 선언
├── utils/
│   ├── logger.ts           # 조건부 디버그 로거(개발용)
│   ├── session.ts          # UUIDv7 생성, 세션 ID 관리
│   ├── throttle.ts         # trailing-edge 쓰로틀
│   ├── dom.ts              # DOM 요소 식별자 추출
│   └── selector.ts         # CSS selector 생성 (id 우선 -> :nth-of-type)
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
    ├── replay.ts           # rrweb 세션 리플레이 수집 + gzip 압축
    ├── ping.ts             # 체류 섹션 보고 (IntersectionObserver)
    └── exit.ts             # 이탈 감지 + 동기 flush
```
