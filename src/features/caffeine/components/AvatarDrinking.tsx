import './avatar-drinking.css';

/** A single held cup expresses absorption, without repeating the drinking action. */
export function AvatarDrinking({ id }: { id: string }) {
  return <g className="avatar-drinking" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sip-coffee`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--sip-coffee-light)" /><stop offset="1" stopColor="var(--sip-coffee-dark)" /></linearGradient>
      <linearGradient id={`${id}-sip-glass`} x1="0" y1="0" x2="1" y2=".7">
        <stop stopColor="var(--avatar-shine)" stopOpacity=".24" />
        <stop offset=".3" stopColor="var(--sip-glass)" stopOpacity=".85" />
        <stop offset=".7" stopColor="var(--sip-glass)" />
        <stop offset="1" stopColor="var(--avatar-liquid-light)" stopOpacity=".3" />
      </linearGradient>
      <linearGradient id={`${id}-sip-arm`} x1="1" y1="0" x2=".2" y2="1">
        <stop stopColor="var(--avatar-shine)" stopOpacity=".16" />
        <stop offset=".5" stopColor="var(--avatar-glass-mid)" stopOpacity=".6" />
        <stop offset="1" stopColor="var(--avatar-glass-mid)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-sip-arm-glass-rim`} x1=".8" y1="0" x2=".2" y2="1">
        <stop stopColor="var(--avatar-rim)" stopOpacity=".65" />
        <stop offset=".6" stopColor="var(--avatar-rim)" stopOpacity=".35" />
        <stop offset="1" stopColor="var(--avatar-rim)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-sip-arm-rim`} x1=".8" y1="0" x2=".2" y2="1">
        <stop stopColor="var(--avatar-liquid-light)" stopOpacity=".85" />
        <stop offset=".6" stopColor="var(--avatar-tint)" stopOpacity=".65" />
        <stop offset="1" stopColor="var(--avatar-tint)" stopOpacity="0" />
      </linearGradient>
      <g id={`${id}-sip-cup`}>
        <path d="M21 8 C38 1 40 27 20 29" fill="none" stroke="var(--avatar-tint)" strokeWidth="4.5" opacity=".4" />
        <path d="M21 8 C38 1 40 27 20 29" fill="none" stroke="var(--avatar-liquid-light)" strokeWidth="1.5" />
        <path d="M-23 1 C-23 20 -18 38 -4 39 H4 C18 38 23 20 23 1 Z" fill={`url(#${id}-sip-glass)`} stroke="var(--avatar-liquid-light)" strokeOpacity=".7" strokeWidth="1.3" />
        <path d="M-19 9 C-18 24 -13 33 0 34 C13 33 18 24 19 9 Q0 16 -19 9 Z" fill={`url(#${id}-sip-coffee)`} />
        <ellipse cy="1" rx="23" ry="6.5" fill={`url(#${id}-sip-coffee)`} stroke="var(--avatar-liquid-light)" strokeWidth="1.5" />
        <ellipse cy="2" rx="20" ry="4.3" fill="var(--sip-glass)" opacity=".65" />
        <path d="M-18 1 Q0 7 20 1" fill="none" stroke="var(--sip-coffee-light)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-18 10 Q-18 25 -11 30" fill="none" stroke="var(--avatar-shine)" strokeWidth="2.2" strokeLinecap="round" opacity=".6" />
        <path d="M18 14 Q17 28 9 33" fill="none" stroke="var(--avatar-liquid-light)" strokeWidth="1" opacity=".4" />
        <ellipse cy="40" rx="13" ry="3" fill={`url(#${id}-glass)`} stroke="var(--avatar-liquid-light)" strokeWidth="1" opacity=".7" />
      </g>
    </defs>
    <g className="avatar-sip-cup" transform="translate(184 138) rotate(-8)"><use href={`#${id}-sip-cup`} /></g>
    {/* Only the front edge is drawn: the lower arm blends into the continuous shoulder. */}
    <g className="avatar-sip-arm">
      <path d="M232 199 C246 207 260 199 262 187 C265 172 254 154 239 146 C225 137 214 138 209 147 C202 158 211 177 225 188 Q230 195 232 199 Z" fill={`url(#${id}-sip-arm)`} />
      <path d="M232 199 C246 207 260 199 262 187 C265 172 254 154 239 146 C225 137 214 138 209 147 C202 158 211 177 225 188" fill="none" stroke={`url(#${id}-sip-arm-glass-rim)`} strokeWidth="1.3" />
      <g className="avatar-sip-arm-liquid avatar-lit-rim" clipPath={`url(#${id}-filled)`}>
        <path d="M232 199 C246 207 260 199 262 187 C265 172 254 154 239 146 C225 137 214 138 209 147 C202 158 211 177 225 188" fill="none" stroke={`url(#${id}-sip-arm-rim)`} strokeWidth="5" filter={`url(#${id}-bloom)`} opacity=".4" />
        <path d="M232 199 C246 207 260 199 262 187 C265 172 254 154 239 146 C225 137 214 138 209 147 C202 158 211 177 225 188" fill="none" stroke={`url(#${id}-sip-arm-rim)`} strokeWidth="1.3" />
      </g>
      <path d="M220 146 Q228 142 239 151 M245 159 Q257 174 255 185" fill="none" stroke={`url(#${id}-reflection)`} strokeWidth="3.5" strokeLinecap="round" />
    </g>
  </g>;
}
