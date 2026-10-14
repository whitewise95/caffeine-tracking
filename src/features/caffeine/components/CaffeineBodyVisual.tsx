import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { getVisualLevel } from '../model/caffeine';
import { liquidAvatarState } from '../model/liquidAvatar';
import { AvatarLiquid } from './AvatarLiquid';
import { AvatarDrinking } from './AvatarDrinking';
import { useAvatarLiquidMotion } from '../hooks/useAvatarLiquidMotion';
import { deviceTiltPermissionStatus, requestDeviceTiltPermission } from '../hooks/deviceTiltPermission';
import { closeLiquidSurface, liquidSurfacePath, liquidWaveAmplitude } from '../model/liquidWaves';
import { AvatarOutfitLayers } from '../../avatar/components/AvatarOutfitLayers';
import type { AvatarOutfit } from '../../avatar/model/avatar.types';
import './liquid-avatar.css';

// A single connected, asymmetric jelly shape: rounded crown, soft shoulders,
// short fins and two tiny feet. All material layers share this silhouette.
const silhouette = 'M160 53 C194 51 219 75 220 106 C220 121 215 132 215 140 C216 151 240 161 250 182 C260 203 254 219 243 220 C233 221 227 211 222 204 C226 226 233 253 228 277 C225 295 215 307 201 307 C185 308 177 298 174 287 C171 279 151 279 148 288 C144 302 134 310 120 307 C103 304 95 292 94 274 C91 251 98 224 99 208 C93 218 85 225 75 222 C62 218 61 205 69 187 C77 168 101 151 103 141 C105 133 99 119 100 105 C101 75 125 54 160 53 Z';
// The lifted forearm is part of the body outline, with a broad shoulder join.
const drinkingSilhouette = silhouette.replace('C216 151 240 161 250 182 C260 203 254 219 243 220 C233 221 227 211 222 204', 'C222 143 227 140 239 146 C254 154 265 172 262 187 C260 201 247 207 234 201 C228 199 224 196 222 192 C222 197 222 201 222 204');

interface CaffeineBodyVisualProps { caffeineMg: number; maxCaffeineMg?: number; intakePulse?: number; absorbingCount?: number; tiltEnabled?: boolean; outfit?: AvatarOutfit }

export function CaffeineBodyVisual(props: CaffeineBodyVisualProps) {
  return <LiquidAvatar {...props} />;
}

export function LiquidAvatar({ caffeineMg, maxCaffeineMg, intakePulse = 0, absorbingCount = 0, tiltEnabled = false, outfit }: CaffeineBodyVisualProps) {
  const id = useId().replace(/:/g, '');
  const drinking = absorbingCount > 0;
  const body = drinking ? drinkingSilhouette : silhouette;
  const visual = liquidAvatarState(caffeineMg, maxCaffeineMg);
  const initialLiquidY = useRef(visual.liquidY).current;
  const initialSurface = useRef(liquidSurfacePath(0, liquidWaveAmplitude(initialLiquidY))).current;
  const root = useRef<HTMLDivElement>(null);
  useAvatarLiquidMotion({ root, body, y: visual.liquidY, tilt: visual.tilt, scaleX: visual.scaleX, scaleY: visual.scaleY, tiltEnabled });
  const previousPulse = useRef(intakePulse);
  const [adding, setAdding] = useState(false);
  const [paused, setPaused] = useState(document.hidden);
  const [tapPulse, setTapPulse] = useState(0);
  const tapSequence = useRef(0);
  const tapTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(tapTimer.current), []);
  const illuminateLiquid = () => {
    if (tiltEnabled && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const permission = deviceTiltPermissionStatus();
      // Keep the native request inside this real tap, including when empty.
      if (permission === 'permission' || permission === 'denied') void requestDeviceTiltPermission();
    }
    if (visual.mg === 0) return;
    window.clearTimeout(tapTimer.current);
    // Restart only the tap layer; the periodic absorption glow keeps its phase.
    setTapPulse(++tapSequence.current);
    tapTimer.current = window.setTimeout(() => setTapPulse(0), 900);
  };
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    if (previousPulse.current === intakePulse) return;
    previousPulse.current = intakePulse;
    setAdding(true);
    const timer = window.setTimeout(() => setAdding(false), 1400);
    return () => window.clearTimeout(timer);
  }, [intakePulse]);
  const style = {
    '--avatar-sx': visual.scaleX,
    '--avatar-sy': visual.scaleY,
    '--avatar-tilt': `${visual.tilt}deg`,
    '--avatar-glow': visual.state === 'high' ? .12 : visual.fill * .38,
    '--avatar-energy': visual.mg === 0 ? 0 : Math.min(visual.mg / 80, 1),
  } as CSSProperties;
  return <div ref={root} className="body-visual liquid-avatar" data-state={visual.state} data-level={getVisualLevel(visual.mg)} data-caffeine={Math.round(visual.mg)} data-adding={adding} data-paused={paused} data-drinking={drinking} data-absorbing-count={absorbingCount} style={style}>
    <button type="button" className="avatar-glow-button" aria-label="캐릭터 액체 발광" onClick={illuminateLiquid}>
    <svg viewBox="0 0 320 366" role="img" aria-label={`추정 잔존 카페인 ${Math.round(visual.mg)}mg, ${visual.label}${drinking ? `, 흡수 중인 음료 ${absorbingCount}잔` : ''}`} aria-describedby={`${id}-description`}>
      <desc id={`${id}-description`}>액체 높이와 캐릭터 모습은 카페인 잔존량의 추정치를 표현하며, 실제 신체 상태나 의료적 위험도를 뜻하지 않아요.</desc>
      <defs>
        <clipPath id={`${id}-body`}><path className="avatar-body-clip" d={body} /></clipPath>
        <path className="avatar-surface-definition" id={`${id}-surface`} d={initialSurface} />
        <path className="avatar-volume-definition" id={`${id}-volume`} d={closeLiquidSurface(initialSurface)} />
        <clipPath id={`${id}-local-liquid`}><use href={`#${id}-volume`} /></clipPath>
        <clipPath id={`${id}-filled`}><use className="avatar-gravity-frame" transform={`translate(0 ${initialLiquidY})`} href={`#${id}-volume`} /></clipPath>
        <filter id={`${id}-bloom`} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${id}-surface-bloom`} filterUnits="userSpaceOnUse" x="-480" y="-40" width="1280" height="80" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`${id}-soft-light`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="1.5" /></filter>
        <radialGradient id={`${id}-bubble`} cx=".35" cy=".25">
          <stop stopColor="var(--avatar-liquid-light)" stopOpacity=".8" />
          <stop offset=".3" stopColor="var(--avatar-tint)" stopOpacity=".08" />
          <stop offset=".7" stopColor="var(--avatar-tint)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--avatar-tint)" stopOpacity=".7" />
        </radialGradient>
        <linearGradient id={`${id}-reflection`} x1="0" y1="0" x2="1" y2=".9">
          <stop stopColor="var(--avatar-shine)" stopOpacity=".85" />
          <stop offset=".38" stopColor="var(--avatar-shine)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--avatar-shine)" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2=".85">
          <stop stopColor="var(--avatar-glass-light)" stopOpacity=".34" />
          <stop offset=".45" stopColor="var(--avatar-glass-mid)" stopOpacity=".12" />
          <stop offset="1" stopColor="var(--avatar-glass-dark)" stopOpacity=".65" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor="var(--avatar-rim)" stopOpacity=".9" />
          <stop offset=".38" stopColor="var(--avatar-rim)" stopOpacity=".18" />
          <stop offset=".75" stopColor="var(--avatar-tint)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--avatar-rim)" stopOpacity=".65" />
        </linearGradient>
        <linearGradient id={`${id}-liquid`} gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="220" y2="280">
          <stop stopColor="var(--avatar-liquid-light)" stopOpacity=".12" />
          <stop offset=".3" stopColor="var(--avatar-tint)" stopOpacity=".04" />
          <stop offset="1" stopColor="var(--avatar-liquid-dark)" stopOpacity=".22" />
        </linearGradient>
        <radialGradient id={`${id}-core`}>
          <stop stopColor="var(--avatar-tint)" stopOpacity=".38" />
          <stop offset="1" stopColor="var(--avatar-tint)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx=".25" cy=".2" r=".8">
          <stop stopColor="var(--avatar-shine)" stopOpacity=".12" />
          <stop offset=".5" stopColor="var(--avatar-shine)" stopOpacity="0" />
          <stop offset=".78" stopColor="var(--avatar-glass-dark)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--avatar-shine)" stopOpacity=".24" />
        </radialGradient>
        <radialGradient id={`${id}-shadow`}><stop stopColor="var(--avatar-shadow)" stopOpacity=".24" /><stop offset="1" stopColor="var(--avatar-shadow)" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse className="avatar-ground" cx="160" cy="329" rx="76" ry="12" fill={`url(#${id}-shadow)`} />
      <ellipse className="avatar-ambient" cx="160" cy="222" rx="132" ry="121" fill={`url(#${id}-core)`} />
      <g className="avatar-floor-light">
        <ellipse cx="160" cy="328" rx="83" ry="10" fill="none" stroke="var(--avatar-tint)" strokeWidth="4" filter={`url(#${id}-bloom)`} opacity=".55" />
        <ellipse cx="160" cy="328" rx="83" ry="10" fill="none" stroke="var(--avatar-tint)" strokeWidth=".65" opacity=".6" />
      </g>
      <g className="avatar-idle">
        <g className="avatar-tension">
          <g className="avatar-shape">
            <AvatarOutfitLayers outfit={outfit} layer="back" drinking={drinking} />
            <path className="avatar-outer-bloom" d={body} clipPath={`url(#${id}-filled)`} fill="none" stroke="var(--avatar-tint)" strokeWidth="4" filter={`url(#${id}-bloom)`} />
            <path className={drinking ? 'avatar-drinking-body' : undefined} d={body} fill={`url(#${id}-glass)`} stroke={`url(#${id}-rim)`} strokeWidth="1.4" />
            <g clipPath={`url(#${id}-body)`}>
              <AvatarLiquid id={id} y={visual.liquidY} bubbles={visual.bubbles} visible={visual.mg > 0} absorbing={drinking} tapPulse={tapPulse} />
              <path d={body} fill={`url(#${id}-shine)`} />
              <path d={body} fill="none" stroke={`url(#${id}-reflection)`} strokeWidth="8" filter={`url(#${id}-soft-light)`} />
              <path d="M110 105 C109 75 139 58 163 59 C188 58 208 78 212 100" fill="none" stroke={`url(#${id}-reflection)`} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M114 81 C125 66 144 63 158 64" fill="none" stroke="var(--avatar-shine)" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />
              <path d={`M205 82 Q217 100 210 122 M104 149 Q77 176 70 199 ${drinking ? '' : 'M218 166 Q240 185 246 204'} M102 252 Q92 292 116 302 M222 251 Q232 290 209 300`} fill="none" stroke={`url(#${id}-reflection)`} strokeWidth="3.5" strokeLinecap="round" />
              <g className="avatar-lit-rim" clipPath={`url(#${id}-filled)`}>
                <path d={body} fill="none" stroke="var(--avatar-tint)" strokeWidth="12" filter={`url(#${id}-bloom)`} />
                <path d={body} fill="none" stroke="var(--avatar-tint)" strokeWidth="4" opacity=".75" />
                <path d={body} fill="none" stroke="var(--avatar-liquid-light)" strokeWidth="1.4" opacity=".9" />
              </g>
              {adding && <circle key={intakePulse} className="avatar-ripple" cx="160" cy="213" r="22" fill="none" stroke="var(--avatar-liquid-light)" strokeWidth="2" />}
            </g>
            <AvatarOutfitLayers outfit={outfit} layer="body" drinking={drinking} />
            <g className="avatar-eye-glow" filter={`url(#${id}-bloom)`} fill="none" stroke="var(--avatar-tint)" strokeWidth="6" strokeLinecap="round">
              <g className="avatar-eyes-open"><path d="M136 117 Q140 111 144 117 M176 117 Q180 111 184 117" /></g>
              <g className="avatar-eyes-full"><path d="M133 121 Q139 113 145 121 M174 121 Q180 113 186 121" /></g>
            </g>
            <g className="avatar-face" fill="none" stroke="var(--avatar-face)" strokeWidth="3.7" strokeLinecap="round">
              <g className="avatar-eyes-rest"><path d="M133 119 Q139 123 145 119 M174 119 Q180 123 186 119" /></g>
              <g className="avatar-eyes-open"><path d="M136 117 Q140 111 144 117 M176 117 Q180 111 184 117" /></g>
              <g className="avatar-eyes-full"><path d="M133 121 Q139 113 145 121 M174 121 Q180 113 186 121" /></g>
              <path className="avatar-mouth" d="M154 139 Q160 142 166 139" strokeWidth="2" />
            </g>
            <AvatarOutfitLayers outfit={outfit} layer="front" drinking={drinking} />
            {drinking && <AvatarDrinking id={id} />}
            <AvatarOutfitLayers outfit={outfit} layer="sleeve" drinking={drinking} />
          </g>
        </g>
      </g>
      {adding && <circle key={intakePulse} className="avatar-intake-orb" cx="160" cy="213" r="7" fill={`url(#${id}-core)`} stroke="var(--avatar-liquid-light)" strokeWidth="1" />}
    </svg>
    </button>
  </div>;
}
