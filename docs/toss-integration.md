# Apps in Toss integration evidence

Verified on 2026-10-02 using the connected Apps in Toss documentation MCP, the official developer site, and the published SDK package. Native device testing is a separate release step; browser tests do not certify native behavior.

## SDK and project setup

- The public npm registry returned `@apps-in-toss/web-framework` **3.7.0** as `latest`. The installed package was also inspected at version 3.7.0. [Registry metadata](https://registry.npmjs.org/@apps-in-toss/web-framework/latest)
- Use React + TypeScript + Vite as a client-rendered WebView app. Existing projects can install the SDK and run `npx ait init`; new projects can use `npx create-ait-app <app-name>`. [WebView setup](https://developers-apps-in-toss.toss.im/ai-vibe-coding/tutorials/webview), [Developer center](https://developers-apps-in-toss.toss.im/)
- SDK 3.x uses **`apps-in-toss.config.ts`**, with `defineConfig` from `@apps-in-toss/web-framework/config`. Older tutorial examples still show `granite.config.ts`; the explicit SDK 3.x migration guide takes precedence. [SDK 3.x migration](https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x)

Verified config structure:

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  appName: 'caffeine-tracking', // Must match the registered console appName.
  brand: { primaryColor: '#20252D' },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: true,
    transparentBackground: false,
    theme: 'light',
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: true,
  },
  webBundleDir: 'dist',
})
```

`brand.displayName`, `brand.icon`, the `web` block, `webViewProps.type`, and `outdir` belong to the older configuration. SDK 3.x keeps only `brand.primaryColor`, uses `webView` and `webBundleDir`, and runs the web bundler directly from package scripts. The native brand name/logo come from the registered app. [Migration guide](https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x), [WebView options](https://developers-apps-in-toss.toss.im/documentation/integration/props)

## Runtime, safe area, back handling

All following runtime imports are from `@apps-in-toss/web-framework`.

```ts
SafeArea.get(): { top: number; right: number; bottom: number; left: number }
SafeArea.subscribe({ onEvent: (insets) => void }): () => void

graniteEvent.addEventListener('backEvent', {
  onEvent: () => void,
  onError?: (error: Error) => void,
}): () => void

Screen.setIosSwipeBack({ isEnabled: boolean }): Promise<void>
Screen.close(): Promise<void>
Device.os: 'ios' | 'android'
Environment.environment: 'toss' | 'sandbox'
Environment.tossAppVersion: string
Environment.initialURL: string
```

- Apply safe-area values to CSS layout variables, and unsubscribe on cleanup. `SafeAreaInsets` is an older compatibility alias. [SafeArea.get](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/safearea/getsafeareainsets), [SafeArea.subscribe](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/safearea/safearea.subscribe)
- Registering a back listener intercepts normal back behavior. Subscribe while a sheet or an internal route needs handling; close an open sheet first. At the home screen, allow the host's normal exit behavior. Never trap the user with a new confirmation sheet solely for leaving. [Event control](https://developers-apps-in-toss.toss.im/documentation/common/screen/event), [graniteEvent API](https://developers-apps-in-toss.toss.im/documentation/sdk/events/graniteevent), [Non-game checklist](https://developers-apps-in-toss.toss.im/checklist/app-nongame)
- Disable iOS native swipe while a sheet is open and restore it after all overlays close. Native swipe and browser history remain separate mechanisms and require device validation. [iOS swipe API](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/screen/screen.setiosswipeback), [Platform API](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/device/device.os)
- The SDK already provides the native navigation bar. Do not recreate the host close/more controls. Native back and a duplicate in-page back control should not be visible together. [Navigation guide](https://developers-apps-in-toss.toss.im/documentation/common/navigationbar)

`isTossRuntime()` checks the actual native bridge and synchronous SDK environment constants, rather than making a native promise as an environment probe. In SDK 3.7.0, public constant getters read host-injected values and the internal WebView guard checks `window.ReactNativeWebView`; ordinary browser constants are absent. This implementation detail was verified directly in the [published SDK source](https://unpkg.com/@apps-in-toss/web-framework@3.7.0/dist/index.js). It is isolated in the integration module so future bridge changes can be handled in one place. [Environment API](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/environment/environment.environment), [Version API](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/environment/environment.tossappversion)

For `npm run dev:toss` only, `import.meta.env.DEV && import.meta.env.MODE === 'toss'` allows the official Devtools SDK facade without a native bridge, while still validating SDK environment constants. Devtools replaces imports with mocks and intentionally does not inject `ReactNativeWebView`. The exception is removed from production builds. This behavior was verified against the installed Devtools 3.7.0 README and source.

## Persistence

The official SDK offers native persistent string storage:

```ts
Storage.getItem(key: string): Promise<string | null>
Storage.setItem(key: string, value: string): Promise<void>
Storage.removeItem(key: string): Promise<void>
```

The app injects this adapter into `LocalCaffeineRepository` inside Toss; the browser preview uses the repository's localStorage adapter. Components never read storage directly. Native failures are surfaced instead of silently changing stores. Reset removes only this app's state key. Native storage survives app sessions, but deleting Toss deletes its local data. [Storage guide](https://developers-apps-in-toss.toss.im/documentation/common/file-storage/storage), [Get](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage/storage.getitem), [Set](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage/storage.setitem), [Remove](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage/storage.removeitem)

Web localStorage is supported, but QR and production origins do not share data. The migration guide requires SDK **3.1.1 or later** to preserve older origin-based localStorage continuity. `AsyncStorage` is not supported. [Storage guide](https://developers-apps-in-toss.toss.im/documentation/common/file-storage/storage), [Migration guide](https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x)

## Routing and deep links

Use web route paths `/`, `/history`, `/settings`. The official WebView example maps a React route such as `/search` to `intoss://{appName}/search`; no React Native file router is required. Browser reloads and history must continue to resolve the same route. [Feature routing](https://developers-apps-in-toss.toss.im/guide/operation/function)

`Environment.initialURL` contains the original entry scheme, not subsequent navigation. Production sharing uses `intoss://{appName}/path`. Before release, upload a bundle and use the console-generated `intoss-private://{appName}/path?_deploymentId=...`; the deployment ID is required and cannot be invented. [Entry URL API](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/environment/environment.initialurl), [Device testing](https://developers-apps-in-toss.toss.im/guide/operation/toss)

## TDS, icons, and theme conflict

The current official FAQ says every component does **not** have to use TDS; TDS is recommended, with custom UI allowed where needed. For this custom tracker, the app can use CSS/SVG and Lucide without adding TDS solely as an unused dependency. [TDS FAQ](https://developers-apps-in-toss.toss.im/guide/faq)

If TDS components are added later, the documented setup is React 18, `@emotion/react@^11`, `@toss/tds-mobile`, and `@toss/tds-mobile-ait`, with the root wrapped in `TDSMobileAITProvider` from `@toss/tds-mobile-ait`. The SDK 3.x guide calls for the two TDS packages at 2.4.1 or later. Official icon rendering is through `Asset.Icon` with `name`, optional `color`, and `frameShape`; actual icon identifiers must be verified, not guessed. [TDS setup](https://tossmini-docs.toss.im/tds-mobile/start/), [Asset.Icon](https://tossmini-docs.toss.im/tds-mobile/components/Asset/asset/), [TDS migration compatibility](https://developers-apps-in-toss.toss.im/documentation/sdk/v3)

Toss UI assets are licensed for Apps in Toss services. Native accessory icons must be monochrome and are limited to one. [TDS license](https://developers-apps-in-toss.toss.im/design/components), [Navigation icons](https://developers-apps-in-toss.toss.im/documentation/common/navigationbar)

**The requested OLED design conflicts with the current release checklist.** Both the FAQ and non-game checklist require light-mode implementation/release. The app therefore needs a light Toss runtime presentation, while the local design preview can retain the requested OLED palette. A dark native navigation option exists, but it does not override the release requirement. [Non-game checklist](https://developers-apps-in-toss.toss.im/checklist/app-nongame), [Theme FAQ](https://developers-apps-in-toss.toss.im/guide/faq)

The bottom navigation must use the provided **floating form**, even for custom UI, with two to five items. The app's three destinations—홈, 기록, 설정—fit that requirement. [UI/UX guide](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide)

## Development, build, and remaining native validation

SDK 3.x does not use the older Sandbox app. Use AIT Devtools in a local browser, then a console QR test in Toss on iOS and Android. The older Sandbox instructions remain relevant only to SDK 2.x. [Sandbox notice](https://developers-apps-in-toss.toss.im/development/test/sandbox)

```ts
// vite.config.ts; install @apps-in-toss/devtools as a dev dependency.
import aitDevtools from '@apps-in-toss/devtools/unplugin'
// plugins: [aitDevtools.vite(), react()]
```

The documented build sequence is `vite build && ait build`; type checking may precede it. `ait build` packages `webBundleDir` into the uploadable `.ait` artifact. Producing `dist/` alone is not a native bundle. Devtools is a mock environment; validate actual storage persistence, safe-area insets, Android hardware back, iOS swipe/overlay behavior, and direct-route entry via the console QR before release. [SDK 3.x guide](https://developers-apps-in-toss.toss.im/documentation/integration/sdk-3.x), [Toss testing](https://developers-apps-in-toss.toss.im/guide/operation/toss)

Browser Devtools verification on 2026-10-02 passed: automatic light theme, live SafeArea update to 42px, mock back closing the open sheet first, iOS swipe mock disable/restore, SDK Storage persistence under `__ait_storage:caffeine-tracker:state:v1`, 155mg record retained after reload, and route back returning home. No page errors were observed. These results validate the mock integration, not native devices.

No login is needed for this local MVP. A future account-sync feature may use `TossAuth.login(): Promise<{ authorizationCode: string; referrer: 'DEFAULT' | 'SANDBOX' }>`; token exchange and secret storage belong on a server. [Login SDK](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/tossauth/tossauth.login), [Login integration](https://developers-apps-in-toss.toss.im/documentation/common/authentication/toss-login)

Known documentation inconsistencies were resolved using the specific, newer contract: SDK 3.x migration over old setup examples; registry version over the original v3 launch announcement; SDK 3.1.1+ origin notes over the earlier 3.0 origin table. No documentation feedback or other external messages were sent.

## Album photo icons (2026-10-04)

Toss MCP reverified [Device.getPhotos](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/device/device.getphotos) and the [photos/read permission](https://developers-apps-in-toss.toss.im/documentation/common/permission). SDK 3.x config now declares photos/read in `apps-in-toss.config.ts`. The picker is invoked only by the album + button, with `maxCount: 1`, `maxWidth: 360`, `base64: true`. A previously denied permission can be requested again with the documented `Device.getPhotos.openPermissionDialog`; cancellation retains the previous icon.

Browser preview uses a standard image file input. Both paths decode locally, crop to a square and encode a JPEG thumbnail no larger than 160×160px with bounded storage length. Only the resulting thumbnail is committed to the existing device repository, once per custom drink. Records refer to the drink ID, and reset removes the whole app state including its photos. No external image URL is accepted as a persisted photo. Album permissions and cancellation still require a real Toss iOS/Android QR device check before release; mocked API tests cannot certify the OS picker.

## Category management (2026-10-05)

Rechecked the official Toss MCP pages for [Storage](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage), [Storage.setItem](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/storage/storage.setitem), [graniteEvent](https://developers-apps-in-toss.toss.im/documentation/sdk/events/graniteevent), [Screen.setIosSwipeBack](https://developers-apps-in-toss.toss.im/documentation/sdk/domains-api/screen/screen.setiosswipeback), and [BottomSheet](https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/).

Category management reuses the existing sheet and history/back integration. From a drink draft it is one history step in the same dialog; the composer stays mounted but hidden so its name, photo and amount survive the round trip. Leaving the manager cancels an uncommitted drag. The existing iOS swipe guard remains active for the whole sheet session. No new native API or UI dependency is introduced.

Renames, order and category removal use the existing device repository. Moving drinks and deleting their category produce one state document and one awaited `Storage.setItem` call; UI state is published only after the write resolves. Storage errors retain the last published state and expose retry. These browser checks do not replace a real Toss Android/iOS device check.
