import { useState } from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import type { AppTheme } from '../features/caffeine/model/caffeine.types';
import './theme-settings.css';

export interface ThemeSettingsProps {
  theme: AppTheme;
  busy: boolean;
  onChange: (theme: AppTheme) => Promise<boolean>;
}

export function ThemeSettings({ theme, busy, onChange }: ThemeSettingsProps) {
  const [retryTheme, setRetryTheme] = useState<AppTheme | null>(null);

  async function selectTheme(next: AppTheme) {
    setRetryTheme(null);
    if (!await onChange(next)) setRetryTheme(next);
  }

  return <section className="settings-section" aria-labelledby="theme-title" aria-busy={busy}>
    <div className="section-heading"><Sun size={18} aria-hidden="true" /><h2 id="theme-title">화면 테마</h2></div>
    <p className="settings-description">선택한 테마를 이 기기에 기억해요.</p>
    <div className="theme-options" role="group" aria-label="화면 테마">
      {([{ value: 'light', label: '밝게', icon: Sun }, { value: 'dark', label: '어둡게', icon: Moon }] as const).map(({ value, label, icon: Icon }) => <button
        key={value} type="button" className="theme-option" aria-pressed={theme === value} disabled={busy}
        onClick={() => { void selectTheme(value); }}>
        <Icon size={20} aria-hidden="true" /><span>{label}</span>{theme === value && <Check className="theme-option-check" size={17} aria-hidden="true" />}
      </button>)}
    </div>
    {retryTheme && <div className="theme-retry"><p>테마를 저장하지 못했어요.</p><button className="text-button" disabled={busy} onClick={() => void selectTheme(retryTheme)}>다시 시도</button></div>}
  </section>;
}
