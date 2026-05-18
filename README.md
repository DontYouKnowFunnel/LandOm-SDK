# LandOm SDK

A lightweight SDK that automatically captures landing page user behavior — clicks, scrolls, inputs, exits, and full session replay — and ships it to your analytics backend.

## Installation

### npm / yarn / pnpm

```bash
npm install landom-sdk
# or
yarn add landom-sdk
# or
pnpm add landom-sdk
```

### CDN (`<script>` tag)

```html
<script src="https://unpkg.com/landom-sdk/dist/landom-sdk.umd.js"></script>
```

## Quick Start

### With a bundler (Vite, Webpack, Next.js, etc.)

```js
import { init } from 'landom-sdk';

init({
  apiKey: 'your-project-key',
  endpoint: 'https://your-server.com/api/v1/events',
});
```

Or import everything under a namespace:

```js
import * as LandOm from 'landom-sdk';

LandOm.init({ apiKey: '...', endpoint: '...' });
```

### With a `<script>` tag (UMD)

The UMD build attaches the SDK to `window.LandOm`:

```html
<script src="https://unpkg.com/landom-sdk/dist/landom-sdk.umd.js"></script>
<script>
  LandOm.init({
    apiKey: 'your-project-key',
    endpoint: 'https://your-server.com/api/v1/events',
  });
</script>
```

A single `init()` call enables automatic capture of user events and rrweb-based session replay.

## API

```ts
import { init, capture, destroy } from 'landom-sdk';
```

| Function | Description |
|----------|-------------|
| `init(options)` | Initialize the SDK and start auto-capture |
| `capture(type, payload?)` | Manually record a custom event |
| `destroy()` | Stop capture and flush any pending events |

## Configuration

```js
init({
  apiKey: 'your-project-key',
  endpoint: '/api/v1/events',          // event ingest endpoint
  flushInterval: 3000,                 // auto-flush interval (ms)
  flushQueueSize: 20,                  // flush immediately when queue hits this size
  maxQueueSize: 100,                   // max queued events; oldest are dropped beyond this
  maxRetries: 3,                       // fetch retry count on failure

  enableReplay: true,                  // enable rrweb session replay
  replayMaskAllInputs: true,           // mask all input values in replay
  replayBlockClass: 'rr-block',        // class to fully exclude an element from replay
  replayBlockSelector: '.no-record',   // selector to fully exclude elements from replay
  replayMaskTextClass: 'rr-mask',      // class to mask text content in replay
  replayInlineStylesheet: true,        // inline external stylesheets (replay fidelity ↔ payload size)
  replayCheckoutEveryNms: 600000,      // rrweb full-snapshot interval (default: 10 min)
  replayMousemoveSampling: false,      // record mousemove events (off by default)
  replayMousemoveCallbackSampling: 500,// mousemove emit interval (ms) when enabled
  replayScrollSampling: 200,           // scroll sampling interval (ms)
  replayInputSampling: 'last',         // input recording strategy (change-based)

  debug: false,                        // verbose console logging
  beforeSend: (event) => event,        // hook to transform or filter events before send
});
```

## Auto-Captured Events

After `init()`, the SDK automatically collects the following events. Each event includes a common `cssSelector: string | null` field (`null` when no element is associated).

| Event | Description | Payload | cssSelector |
|-------|-------------|---------|-------------|
| `start` | Page load | — | `null` |
| `visibility` | Tab visibility change | `isVisible` | `null` |
| `scroll` | Page scroll (500 ms throttle) | `yOffset`, `percentage` | `null` |
| `click` | Element click | `targetId` | clicked element |
| `input` | Input field focus (value is **not** captured) | `fieldId` | focused field |
| `replay` | rrweb session replay chunk | `compressed`, `compression`, `encoding`, `data`, `version` | `null` |
| `ping` | Currently visible section (5 s interval) | `sectionId` | current section |
| `exit` | Page exit | `lastElementId`, `maxDepth` | last element or `null` |

## Session Replay

Session replay is powered by [rrweb](https://github.com/rrweb-io/rrweb) and is enabled by default. Disable it with `enableReplay: false`.

Replay chunks are emitted as `type: "replay"` events; the rrweb payload is gzipped via the browser-native [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream) API and base64-encoded:

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

The server is expected to decompress the payload before persisting the original rrweb JSON.

### Replay Footprint Optimizations

The SDK applies the following rrweb settings by default to keep payloads small:

| Setting | Value | Purpose |
|---------|-------|---------|
| `slimDOMOptions` | `"all"` | Strip scripts, comments, head metadata, etc. |
| `sampling.mousemove` | `false` | Disable mousemove recording |
| `sampling.scroll` | `200` | Reduce scroll recording frequency (rrweb default is 100 ms) |
| `sampling.input` | `"last"` | Record only the last value on change |
| `checkoutEveryNms` | `600000` | Take a full snapshot every 10 minutes |
| `blockSelector` | `.no-record` | Exclude marked elements entirely |

### Excluding & Masking Sensitive Content

Add `rr-block` or `no-record` to fully exclude an element from replay, or `rr-mask` to mask its text content:

```html
<section class="no-record">
  This section is never recorded.
</section>

<p class="rr-mask">
  This text is masked in the replay.
</p>
```

## Server Contract

Events are batched and sent via `POST <endpoint>`:

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
    }
  ]
}
```

On page exit the SDK falls back to `navigator.sendBeacon`. Since custom headers cannot be set on beacons, the `apiKey` is included in the body instead.

## Build Outputs

`npm install` ships these prebuilt artifacts (resolved automatically via `package.json` `exports`):

| File | Format | Use |
|------|--------|-----|
| `dist/landom-sdk.esm.js` | ESM | Bundlers (Vite, Webpack, Rollup) |
| `dist/landom-sdk.cjs.js` | CommonJS | Node / `require()` |
| `dist/landom-sdk.umd.js` | UMD | Direct `<script>` tag |
| `dist/types/index.d.ts` | TypeScript declarations | Type-checked consumers |

## Development

```bash
git clone https://github.com/DontYouKnowFunnel/LandOm-SDK.git
cd LandOm-SDK
npm install
npm run build   # one-off build
npm run dev     # watch mode
```

## License

[MIT](./LICENSE) © Kim Seongmin
