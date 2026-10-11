import type { Page } from '@playwright/test';
import { createInitialState } from '../../src/features/caffeine/model/caffeine';

/** Emulate the installed SDK's native bridge protocol, without replacing the SDK. */
export async function installTossHost(page: Page, platformOS: 'ios' | 'android' = 'ios') {
  await page.addInitScript(({ state, platformOS }) => {
    const nativeKey = 'test-toss-native-state';
    if (!localStorage.getItem(nativeKey)) localStorage.setItem(nativeKey, JSON.stringify(state));
    Reflect.set(window, '__appsInTossConstants', {
      operationalEnvironment: 'toss', tossAppVersion: '5.261.0', platformOS,
      safeAreaInsets: { top: 47, bottom: 34, left: 0, right: 0 },
    });
    Reflect.set(window, 'testNavigationOptions', []);
    Reflect.set(window, 'testExternalURLs', []);
    Reflect.set(window, 'testCloseRequests', 0);
    const subscriptions = new Map<string, { method: string; bridgeId: string }>();
    Reflect.set(window, 'testNativeBack', () => {
      const emitters = Reflect.get(window, 'nativeEmitterMap') as Record<string, { emit: (event: string, value: unknown) => void }>;
      for (const [subscriptionId, item] of subscriptions) {
        if (item.method === 'backEvent') emitters[item.bridgeId].emit('postMessage/appsInTossEvent', { subscriptionId, kind: 'event' });
      }
    });
    Reflect.set(window, 'ReactNativeWebView', { postMessage: (raw: string) => {
      const message = JSON.parse(raw) as {
        type: string; bridgeId: string;
        body?: { method: string; eventId: string; args: [{ key?: string; value?: string; theme?: string; backgroundColor?: string; url?: string; method?: string; subscriptionId?: string }] };
      };
      if (message.type !== 'bridge' || !message.body) return;
      const { method, eventId, args } = message.body;
      let result: unknown;
      if (method === '__subscribeAppEvent') subscriptions.set(args[0].subscriptionId!, { method: args[0].method!, bridgeId: message.bridgeId });
      if (method === '__unsubscribeAppEvent') subscriptions.delete(args[0].subscriptionId!);
      if (method === 'getStorageItem') result = localStorage.getItem(nativeKey);
      if (method === 'setStorageItem') {
        if (Reflect.get(window, 'testFailNextStorage')) {
          Reflect.set(window, 'testFailNextStorage', false);
          result = { __instanceof: 'Error', name: 'Error', message: 'Native storage failed' };
        } else localStorage.setItem(nativeKey, args[0].value!);
      }
      if (method === 'removeStorageItem') localStorage.removeItem(nativeKey);
      if (method === 'closeView') {
        Reflect.set(window, 'testCloseRequests', Number(Reflect.get(window, 'testCloseRequests')) + 1);
        if (Reflect.get(window, 'testFailNextClose')) {
          Reflect.set(window, 'testFailNextClose', false);
          result = { __instanceof: 'Error', name: 'Error', message: 'Native close failed' };
        }
      }
      if (method === 'setNavigationBarOptions') {
        (Reflect.get(window, 'testNavigationOptions') as unknown[]).push(args[0]);
      }
      if (method === 'openURL') {
        (Reflect.get(window, 'testExternalURLs') as string[]).push(args[0].url!);
        if (Reflect.get(window, 'testFailNextExternalURL')) {
          Reflect.set(window, 'testFailNextExternalURL', false);
          result = { __instanceof: 'Error', name: 'Error', message: 'External browser failed' };
        }
      }
      const emitters = Reflect.get(window, 'nativeEmitterMap') as Record<string, { emit: (event: string, value: unknown, failed: boolean) => void }>;
      queueMicrotask(() => emitters[message.bridgeId].emit(`${method}-${eventId}`, result, false));
    } });
  }, { state: createInitialState(), platformOS });
}
