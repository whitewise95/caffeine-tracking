import { describe, expect, it } from 'vitest';
import { resolveAppTheme } from './theme';

describe('app theme', () => {
  it.each(['light', 'dark', undefined] as const)('keeps Toss light with preference %s', preference => {
    expect(resolveAppTheme(preference, true, 'dark')).toBe('light');
  });

  it('restores the browser preference even when the preview URL requests another theme', () => {
    expect(resolveAppTheme('dark', false, 'light')).toBe('dark');
    expect(resolveAppTheme('light', false, 'dark')).toBe('light');
  });

  it('uses the existing preview default before the first selection', () => {
    expect(resolveAppTheme(undefined, false, 'light')).toBe('light');
    expect(resolveAppTheme(undefined, false, null)).toBe('dark');
    expect(resolveAppTheme(undefined, false, 'unknown')).toBe('dark');
  });
});
