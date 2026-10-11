import { useId, useRef, useState } from 'react';
import { Check, Smartphone } from 'lucide-react';
import { requestDeviceTiltPermission } from '../hooks/deviceTiltPermission';
import { useDeviceTiltPermission } from '../hooks/useDeviceTiltPermission';
import './tilt-animation-setting.css';

export function TiltAnimationSetting({ enabled, busy, onChange }: { enabled: boolean; busy: boolean; onChange: (enabled: boolean) => Promise<boolean> }) {
  const id = useId();
  const permission = useDeviceTiltPermission();
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const needsPermission = enabled && (permission === 'permission' || permission === 'denied');

  async function act(authorizeOnly = false) {
    if (locked.current || busy) return;
    locked.current = true;
    setPending(true);
    try {
      if (enabled && !authorizeOnly) await onChange(false);
      else {
        const result = await requestDeviceTiltPermission();
        if (result === 'ready' && !authorizeOnly) await onChange(true);
      }
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  const notice = permission === 'checking' ? '센서 권한을 확인하고 있어요…'
    : permission === 'unavailable' ? '이 환경에서는 기울기 센서를 사용할 수 없어요.'
      : needsPermission ? '애니메이션 설정은 켜져 있어요. 기울기 센서 권한을 다시 허용해 주세요.'
        : permission === 'denied' ? '센서 권한이 허용되지 않았어요. 토글을 켜서 다시 요청할 수 있어요.' : '';

  return <section className="settings-section tilt-animation-setting">
    <button className="tilt-animation-toggle" role="switch" aria-label="애니메이션" aria-checked={enabled} aria-describedby={`${id}-description${notice ? ` ${id}-notice` : ''}`} aria-busy={pending || permission === 'checking'} disabled={busy || pending || (!enabled && (permission === 'unavailable' || permission === 'checking'))} onClick={() => void act()}>
      <Smartphone size={20} strokeWidth={1.65} aria-hidden="true" />
      <span className="tilt-animation-label">애니메이션<small id={`${id}-description`}>휴대폰을 기울이면 캐릭터 속 액체가 움직여요.</small></span>
      <span className="tilt-animation-track" aria-hidden="true"><span className="tilt-animation-thumb">{enabled && <Check size={13} strokeWidth={2.5} />}</span></span>
    </button>
    {notice && <p className="tilt-animation-notice" id={`${id}-notice`} role="status">{notice}</p>}
    {needsPermission && <button className="tilt-animation-permission" disabled={busy || pending} onClick={() => void act(true)}>센서 권한 허용</button>}
  </section>;
}
