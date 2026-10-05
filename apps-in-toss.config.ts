import { defineConfig } from '@apps-in-toss/web-framework/config'

export default defineConfig({
  // Replace with the immutable appName registered in the Apps in Toss console.
  appName: process.env.TOSS_APP_NAME || 'now-caffeine',
  brand: { primaryColor: '#20252D' },
  permissions: [{ name: 'photos', access: 'read' }],
  navigationBar: {
    withBackButton: false,
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
