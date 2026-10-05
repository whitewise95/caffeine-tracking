import type { AppTheme } from '../features/caffeine/model/caffeine.types';

/** Toss non-game release guidelines currently require a light mini-app. */
export function resolveAppTheme(preference: AppTheme | undefined, tossRuntime: boolean, previewTheme: string | null): AppTheme {
  if (tossRuntime) return 'light';
  if (preference) return preference;
  return previewTheme === 'light' ? 'light' : 'dark';
}
