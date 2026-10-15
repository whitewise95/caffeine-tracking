import { defineConfig } from '@playwright/test';

const chromiumChannel = process.env.PLAYWRIGHT_BROWSER === 'chromium' ? undefined : 'chrome';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile-375', use: { channel: chromiumChannel, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
    { name: 'mobile-390', use: { channel: chromiumChannel, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    // WebKit exercises the iOS engine; physical Toss touch/haptics still need a device.
    { name: 'webkit-390', testMatch: /time-picker(-haptics)?\.spec\.ts/, use: { browserName: 'webkit', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5174', reuseExistingServer: true },
});
