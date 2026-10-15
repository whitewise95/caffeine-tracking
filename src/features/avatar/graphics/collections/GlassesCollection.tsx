import type { ReactNode } from 'react';

import type { OutfitLayer } from '../../components/AvatarOutfitLayers';

type GlassesCollectionProps = { itemId: string; layer: OutfitLayer; drinking: boolean };
const cream = '#D6CDBA';
const navy = '#52677B';
const metal = '#C6C8C0';
const gold = '#BFAE87';
const rose = '#B79298';
const charcoal = '#4D5662';
const sage = '#81968D';
const glint = '#F0EEE3';

function Mirror({ children }: { children: ReactNode }) {
  return <>{children}<g transform="translate(320 0) scale(-1 1)">{children}</g></>;
}

/** A mirrored pair still has a deliberately drawn silhouette for every design. */
function Frames({ d, color = metal, width = 2, lens = '#C6D8DE', tint = .1, bridge = 'M156 116 Q160 112 164 116', arms = true, children }: {
  d: string; color?: string; width?: number; lens?: string; tint?: number;
  bridge?: string; arms?: boolean; children?: ReactNode;
}) {
  return <g stroke={color} strokeWidth={width}>
    {arms && <path d="M121 112 L111 108 M199 112 L209 108" fill="none" />}
    <path d={bridge} fill="none" />
    <Mirror><path d={d} fill={lens} fillOpacity={tint} /></Mirror>
    {children}
  </g>;
}

function TinyBow({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} stroke="#7F6674" strokeWidth="1">
    <path d="M-1 -1 Q-10 -9 -10 -2 L-8 5 L-1 2 M1 -1 Q10 -9 10 -2 L8 5 L1 2" fill={rose} />
    <path d="M-2 2 L-5 9 L0 7 L3 10 L3 2 M3 2 L9 8 L9 3" fill={rose} />
    <rect x="-2" y="-3" width="4" height="7" rx="1.5" fill="#DDC1BF" />
  </g>;
}

function Gem({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} stroke="#827C90" strokeWidth=".8">
    <path d="M0 -5 L4 0 L0 6 L-4 0 Z" fill="#BCB7CC" /><path d="M0 -5 V6 L-4 0 Z" fill="#E0D9E9" />
  </g>;
}

function GlassesArt({ itemId }: { itemId: string }): ReactNode {
  switch (itemId) {
    case 'glasses-biscuit':
      return <Frames d="M126 104 Q129 100 133 104 Q138 100 142 104 Q148 100 151 105 Q158 104 157 111 Q162 115 157 119 Q161 124 156 128 Q156 134 149 133 Q145 138 140 133 Q134 138 130 133 Q123 134 123 128 Q118 124 122 119 Q117 113 122 110 Q120 105 126 104 Z" color="#BAAB91" width={3} lens="#E5D5B7" tint={.1}>
        <Mirror><path d="M127 110 L129 109 M137 106 L139 106 M150 110 L151 112 M127 126 L129 127 M140 131 H142 M153 125 L154 123" fill="none" stroke="#7C705C" strokeWidth="1.3" /><path d="M130 113 L135 110" fill="none" stroke={glint} strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-cocoa-mug':
      return <Frames d="M124 107 H153 L155 122 Q154 134 140 135 Q125 134 124 123 Z" color={cream} width={3} lens="#DCC9B2" tint={.13}>
        <Mirror><path d="M123 112 H119 Q109 113 113 124 Q116 130 124 125" fill="none" stroke="#BAAB91" strokeWidth="3" /><path d="M124 108 H154" stroke="#827762" strokeWidth="3" /><path d="M129 113 V122" fill="none" stroke={glint} strokeWidth="1.3" /><path d="M135 104 Q131 101 135 97 M145 103 Q142 99 146 96" fill="none" stroke="#C6C8C0" strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-cloud-rim':
      return <Frames d="M123 116 Q116 111 123 105 Q127 98 136 103 Q144 96 150 104 Q158 103 158 112 Q162 120 154 125 Q154 134 145 133 Q139 139 131 132 Q120 133 123 124 Q116 122 123 116 Z" color="#CBD2CB" width={2.5} bridge="M158 116 Q160 114 162 116">
        <Mirror><path d="M128 107 Q132 103 136 107 M145 105 Q151 104 152 110" fill="none" stroke={glint} strokeWidth="1.2" /><path d="M128 132 L127 140 M134 135 V143" stroke="#A0B9CA" strokeWidth="1.5" /></Mirror>
      </Frames>;
    case 'glasses-knitted':
      return <Frames d="M129 102 H147 L156 111 V126 L147 134 H128 L120 125 V111 Z" color={sage} width={4.1} lens="#D0DECF" tint={.1}>
        <Mirror><path d="M129 103 L132 106 M138 102 L141 105 M147 103 L148 107 M154 112 L151 114 M155 122 L152 122 M148 132 L147 128 M137 134 L138 130 M127 131 L130 128 M121 121 L125 121 M122 111 L126 113" fill="none" stroke="#D3E2D3" strokeWidth="1.1" /></Mirror>
        <path d="M157 115 L160 118 L163 115" fill="none" stroke="#D3E2D3" strokeWidth="1" />
      </Frames>;
    case 'glasses-bear-rim':
      return <Frames d="M155 119 A16 16 0 1 1 123 119 A16 16 0 1 1 155 119 Z" color="#BAAB91" width={3} lens="#E3D5BC" tint={.12}>
        <Mirror><path d="M123 108 Q116 97 124 96 Q132 95 134 104 M145 104 Q148 95 155 98 Q161 103 153 111" fill={cream} stroke="#827762" strokeWidth="1.6" /><path d="M123 102 Q127 99 129 104 M149 104 Q152 100 155 104" fill="none" stroke="#B79298" strokeWidth="2" /><path d="M128 114 Q132 108 138 109" fill="none" stroke={glint} strokeWidth="1.1" /></Mirror>
      </Frames>;
    case 'glasses-toast-rim':
      return <Frames d="M123 115 C116 109 120 101 128 102 Q139 96 150 102 C159 101 162 110 155 115 L154 133 Q140 138 124 132 Z" color="#B49F7C" width={3.2} lens="#EEE0C3" tint={.1}>
        <Mirror><path d="M126 116 C120 110 125 105 129 106 Q141 101 149 106 Q156 107 152 113" fill="none" stroke="#F2E2C9" strokeWidth="1.1" /><path d="M128 129 H132 M146 132 H149" stroke="#E3D5BC" strokeWidth="1.6" /></Mirror>
      </Frames>;
    case 'glasses-pillow':
      return <Frames d="M123 104 Q139 108 155 104 Q152 118 156 132 Q140 129 123 133 Q127 119 123 104 Z" color="#A79DAC" width={2.7} lens="#D2C8CF" tint={.1}>
        <Mirror><path d="M128 109 Q139 112 151 109 M128 128 Q141 125 151 128" fill="none" stroke="#D2C8CF" strokeWidth="1" strokeDasharray="2 2" /><circle cx="125" cy="106" r="2" fill={cream} stroke="#736C82" strokeWidth=".8" /><circle cx="154" cy="131" r="2" fill={cream} stroke="#736C82" strokeWidth=".8" /></Mirror>
      </Frames>;
    case 'glasses-acorn-rim':
      return <Frames d="M122 110 Q138 100 155 110 L154 122 Q149 134 139 137 Q126 132 123 122 Z" color="#BAAB91" width={2.5} lens="#E0D3B7" tint={.1}>
        <Mirror><path d="M121 110 Q138 100 156 110" fill="none" stroke="#827762" strokeWidth="5" /><path d="M125 106 L129 111 M135 104 L140 109 M145 105 L150 111 M131 105 L127 111 M144 104 L138 109 M152 107 L148 111" stroke="#D6CDBA" strokeWidth=".9" fill="none" /><path d="M138 104 L140 98 L144 97" stroke="#827762" strokeWidth="2" fill="none" /></Mirror>
      </Frames>;
    case 'glasses-petal':
      return <Frames d="M139 106 C130 93 119 101 125 112 C111 115 118 128 128 125 C128 140 143 140 146 127 C159 135 166 121 153 116 C162 104 148 97 139 106 Z" color={rose} width={2.3} lens="#DCC7CF" tint={.1} bridge="M157 117 Q160 114 163 117">
        <Mirror><path d="M127 105 Q130 102 134 107 M122 118 L127 119 M137 132 L139 128 M153 123 L149 121" fill="none" stroke="#F0DCD8" strokeWidth="1.2" /></Mirror>
        <circle cx="160" cy="115" r="2" fill={gold} stroke="#8F8064" strokeWidth=".8" />
      </Frames>;
    case 'glasses-bow-bridge':
      return <Frames d="M121 116 Q123 103 138 104 Q154 104 155 117 Q154 131 139 132 Q123 132 121 116 Z" color="#C8B6AA" width={1.8} lens="#DECBD4" tint={.08} bridge="M154 113 Q160 109 166 113">
        <TinyBow x={160} y={110} scale={.8} />
        <Mirror><path d="M126 113 Q132 106 141 108" fill="none" stroke={glint} strokeWidth="1.1" /><path d="M118 112 L112 106 L108 110" fill="none" stroke={rose} strokeWidth="2" /></Mirror>
      </Frames>;
    case 'glasses-ribbon-temple':
      return <Frames d="M119 108 Q136 108 155 111 L153 122 Q144 131 130 126 Q122 122 119 108 Z" color={rose} width={2} lens="#E0C9D2" tint={.1}>
        <Mirror><path d="M119 110 Q108 98 106 105 Q104 115 118 112 M118 112 Q110 123 104 120 M114 116 Q112 130 107 133" fill="none" stroke={rose} strokeWidth="2.2" /><path d="M124 113 Q138 114 148 114" stroke="#EDD8D4" fill="none" strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-pearl-oval':
      return <Frames d="M157 119 A18 12 0 1 1 121 119 A18 12 0 1 1 157 119 Z" color={gold} width={1.4} lens="#E4DBCB" tint={.08} bridge="M157 118 Q160 115 163 118">
        <Mirror>{[{x:123,y:112},{x:129,y:107},{x:138,y:105},{x:147,y:107},{x:154,y:112},{x:122,y:124},{x:128,y:130},{x:138,y:133},{x:148,y:131},{x:155,y:125}].map(({x,y}) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={glint} stroke="#A29F8D" strokeWidth=".6" />)}<path d="M112 109 Q108 128 117 139" fill="none" stroke={gold} strokeWidth=".8" /><circle cx="117" cy="141" r="2.5" fill={glint} stroke="#A29F8D" strokeWidth=".7" /></Mirror>
      </Frames>;
    case 'glasses-butterfly':
      return <Frames d="M156 115 Q144 104 122 99 Q116 114 125 121 Q121 134 133 136 Q149 134 156 120 Z" color="#A79DAC" width={2.3} lens="#C9BFDA" tint={.12} bridge="M156 118 H164">
        <Mirror><path d="M124 104 Q140 108 150 116 M128 127 Q137 132 147 124" fill="none" stroke="#E0D9E9" strokeWidth="1.2" /><circle cx="123" cy="108" r="2" fill={cream} stroke="none" /><path d="M153 113 L155 104" stroke="#736C82" strokeWidth="1.3" /></Mirror>
        <path d="M160 111 V125" stroke={gold} strokeWidth="2.5" />
      </Frames>;
    case 'glasses-lily':
      return <Frames d="M122 113 L131 104 L148 107 L156 118 L149 129 L132 130 L122 123 Z" color="#CDD6D3" width={.9} lens="#D2E4DF" tint={.12} bridge="M155 116 Q160 111 165 116">
        <Mirror><path d="M122 114 L118 105 Q110 100 111 107 Q113 114 121 116 M119 111 Q118 99 123 99 Q129 103 122 114" fill={cream} stroke="#A6AC9B" strokeWidth="1" /><path d="M122 115 L115 124 Q124 122 125 116" fill="#A0B8AD" stroke="#607B73" strokeWidth="1" /><path d="M127 113 L132 109 L143 111" stroke={glint} strokeWidth="1" fill="none" /><path d="M151 116 H155" stroke={gold} strokeWidth="2" /></Mirror>
      </Frames>;
    case 'glasses-shell':
      return <Frames d="M139 136 Q121 128 118 116 Q116 109 123 107 Q124 99 132 103 Q139 95 145 103 Q155 99 156 108 Q163 110 158 119 Q153 130 139 136 Z" color="#C8B6AA" width={2.1} lens="#DECEC7" tint={.1} bridge="M158 117 Q160 114 162 117">
        <Mirror><path d="M124 110 L129 116 M133 106 L135 112 M143 106 L143 111 M153 111 L150 116 M130 127 L138 133 L149 126" fill="none" stroke="#E8DBD1" strokeWidth="1.2" /><circle cx="139" cy="135" r="2" fill={glint} stroke="#A29F8D" strokeWidth=".8" /></Mirror>
      </Frames>;
    case 'glasses-rosette':
      return <Frames d="M122 119 Q122 105 138 104 Q153 105 156 117 Q157 129 142 133 Q128 135 122 119 Z" color="#BDA797" width={1.9} lens="#DCCFC2" tint={.08}>
        <Mirror><path d="M121 109 Q113 109 115 103 Q110 96 118 96 Q123 90 127 97 Q134 95 133 102 Q132 109 125 109 Z" fill={rose} stroke="#7F6674" strokeWidth="1" /><path d="M120 98 Q129 97 128 103 Q121 109 118 102 Q120 99 124 102" fill="none" stroke="#DDC1BF" strokeWidth="1.1" /><path d="M115 108 L108 114 L119 113" fill={sage} stroke="#4E655D" strokeWidth="1" /><path d="M129 111 Q136 107 145 110" stroke={glint} strokeWidth="1" fill="none" /></Mirror>
      </Frames>;
    case 'glasses-racing-split':
      return <Frames d="M116 106 L154 108 L151 124 L129 129 L121 123 Z" color={navy} width={2.8} lens="#8096A3" tint={.4} bridge="M154 111 L160 107 L166 111">
        <Mirror><path d="M118 107 L153 110" stroke="#C1CCD0" strokeWidth="1.3" fill="none" /><path d="M124 109 L131 125 M129 109 L136 125" stroke="#C3DCE1" strokeOpacity=".5" strokeWidth="1.8" fill="none" /><path d="M115 109 L106 105 L104 111 L117 115" fill="#3B506D" stroke="#40546A" strokeWidth="1.2" /></Mirror>
        <path d="M155 117 L160 112 L165 117" stroke="#B6BDC3" fill="none" strokeWidth="1.4" />
      </Frames>;
    case 'glasses-angular':
      return <Frames d="M120 107 L144 102 L157 111 L152 130 L127 134 L118 121 Z" color={charcoal} width={3} lens="#C0CED8" tint={.12}>
        <Mirror><path d="M125 109 L143 106 L152 112 M122 121 L129 130" fill="none" stroke="#A7B3BD" strokeWidth="1.1" /><path d="M116 110 L108 108 L104 113" stroke="#8195A4" strokeWidth="2" fill="none" /><path d="M149 129 L151 122" stroke={metal} strokeWidth="1.4" /></Mirror>
      </Frames>;
    case 'glasses-micro-rectangle':
      return <Frames d="M121 111 Q121 108 125 108 H153 Q156 108 156 112 V121 Q156 124 152 124 H125 Q121 124 121 120 Z" color={charcoal} width={3.3} lens="#617788" tint={.5} bridge="M156 113 H164">
        <Mirror><path d="M126 111 H147" stroke="#CEDADE" strokeWidth="1" fill="none" /><path d="M122 112 L109 106" stroke={charcoal} strokeWidth="4" /><path d="M114 108 L117 109" stroke={metal} strokeWidth="1.4" /></Mirror>
      </Frames>;
    case 'glasses-chain-hex':
      return <Frames d="M127 104 H147 L158 118 L147 132 H127 L118 118 Z" color={metal} width={1.8} lens="#C4D3DD" tint={.1}>
        <Mirror><path d="M118 112 L112 107 Q109 105 107 108 Q105 111 109 113 L115 117 Q119 119 120 115 M110 110 L105 106" fill="none" stroke={metal} strokeWidth="1.5" /><path d="M114 117 Q109 128 114 139" fill="none" stroke="#9DA9AC" strokeWidth="1.3" strokeDasharray="2.5 2" /><path d="M129 108 H142" fill="none" stroke={glint} strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-flip-up':
      return <Frames d="M155 120 A16 14 0 1 1 123 120 A16 14 0 1 1 155 120 Z" color={metal} width={1.8} lens="#CAD8DB" tint={.08} bridge="M155 117 Q160 113 165 117">
        <Mirror><path d="M121 105 Q138 88 155 103 L155 109 Q140 104 123 110 Z" fill="#52677B" fillOpacity=".55" stroke={charcoal} strokeWidth="2" /><path d="M126 103 Q137 96 148 101" fill="none" stroke="#A0B9CA" strokeWidth="1.1" /><path d="M127 107 V112 M149 107 V112" stroke="#C6C8C0" strokeWidth="2.4" /><circle cx="127" cy="110" r="1" fill="#52677B" stroke="none" /></Mirror>
      </Frames>;
    case 'glasses-keyhole-chunky':
      return <Frames d="M123 106 Q140 100 155 108 L153 126 Q146 135 130 130 L123 123 Z" color={charcoal} width={4.7} lens="#C2CDD8" tint={.13} bridge="M155 115 V109 Q160 103 165 109 V115">
        <Mirror><path d="M128 107 Q140 104 149 108" stroke="#98A6B0" strokeWidth="1.1" fill="none" /><path d="M124 111 H128" stroke={cream} strokeWidth="1.5" /><path d="M153 119 L152 124" stroke="#89949D" strokeWidth="1.2" /></Mirror>
      </Frames>;
    case 'glasses-skate':
      return <Frames d="M121 114 Q123 108 136 108 H149 Q158 109 157 116 Q157 124 146 126 H131 Q120 126 121 114 Z" color={cream} width={3} lens="#91A6B0" tint={.42} bridge="M157 113 Q160 111 163 113">
        <Mirror><path d="M122 111 L110 106 L107 112 L120 117 Z" fill="#4D5662" stroke="#4D5662" strokeWidth="1" /><path d="M111 108 L114 109 L113 112 L110 111 M116 110 L119 111 L118 114 L115 113" fill={cream} stroke="none" /><path d="M128 112 H145" stroke="#E2ECE9" strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-shield-lite':
      return <g>
        <path d="M115 109 L105 106 M205 109 L215 106" stroke={charcoal} strokeWidth="4" />
        <path d="M114 105 L149 101 L160 105 L172 101 L207 105 L202 126 L178 133 L160 122 L143 133 L119 126 Z" fill="#92A8AF" fillOpacity=".27" stroke="#B9CDCD" strokeWidth="1.6" />
        <path d="M114 105 L149 101 L160 105 L172 101 L207 105" fill="none" stroke={charcoal} strokeWidth="4" /><path d="M121 109 L146 106 M173 106 L198 109" fill="none" stroke={glint} strokeWidth="1" />
        <path d="M153 121 L160 114 L167 121" fill="none" stroke="#52677B" strokeWidth="2.5" /><path d="M122 125 L126 126 M194 127 L198 126" stroke={charcoal} strokeWidth="2" />
      </g>;
    case 'glasses-aviator':
      return <Frames d="M122 107 Q138 101 151 107 Q158 113 153 122 Q144 137 130 133 Q119 131 119 119 Q118 112 122 107 Z" color={gold} width={1.7} lens="#DDCFAE" tint={.14} bridge="M154 114 Q160 109 166 114">
        <path d="M149 106 Q160 101 171 106" fill="none" stroke={gold} strokeWidth="1.8" />
        <Mirror><path d="M126 110 Q136 106 145 110" fill="none" stroke={glint} strokeWidth="1.1" /><path d="M123 118 Q123 126 130 129" fill="none" stroke="#D9CFB6" strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-double-bridge':
      return <Frames d="M155 120 A17 16 0 1 1 121 120 A17 16 0 1 1 155 120 Z" color={metal} width={1.8} bridge="M155 116 Q160 111 165 116">
        <path d="M139 104 Q160 96 181 104" fill="none" stroke={metal} strokeWidth="2" /><path d="M144 101 H176" stroke="#DCE1D8" strokeWidth=".9" />
        <Mirror><path d="M127 112 Q133 106 140 107" fill="none" stroke={glint} strokeWidth="1" /><path d="M120 113 L113 110" stroke="#827762" strokeWidth="3" /></Mirror>
      </Frames>;
    case 'glasses-octagon-wire':
      return <Frames d="M131 103 H146 L156 113 V125 L146 135 H131 L121 125 V113 Z" color={gold} width={1.6} lens="#D7DDD4" tint={.09}>
        <Mirror><path d="M132 107 H144 L151 114" fill="none" stroke={glint} strokeWidth="1" /><path d="M121 114 H117 M121 118 H117" stroke="#B6BDC3" strokeWidth="1" /><circle cx="118" cy="116" r="2" fill="#B6BDC3" stroke="#7C807B" strokeWidth=".8" /></Mirror>
      </Frames>;
    case 'glasses-halfmoon':
      return <Frames d="M121 119 Q139 116 156 119 Q155 137 139 138 Q122 136 121 119 Z" color="#BFAE87" width={1.8} lens="#E4D7BE" tint={.09} bridge="M156 122 Q160 117 164 122">
        <Mirror><path d="M121 118 Q138 115 156 118" stroke="#827762" strokeWidth="3" fill="none" /><path d="M126 124 Q129 132 137 133" fill="none" stroke={glint} strokeWidth="1" /><path d="M121 119 L111 112" stroke="#827762" strokeWidth="2" /></Mirror>
      </Frames>;
    case 'glasses-pince-nez':
      return <Frames d="M154 120 A15 14 0 1 1 124 120 A15 14 0 1 1 154 120 Z" color={gold} width={1.6} lens="#D9D9CA" tint={.08} bridge="M153 116 Q160 99 167 116" arms={false}>
        <path d="M156 117 L157 123 M164 117 L163 123" stroke={gold} strokeWidth="2.3" fill="none" /><path d="M195 122 Q210 127 207 140 Q204 147 199 144" stroke={gold} strokeWidth=".9" fill="none" strokeDasharray="2 1.5" />
        <Mirror><path d="M129 113 Q133 108 140 109" stroke={glint} strokeWidth="1" fill="none" /></Mirror>
      </Frames>;
    case 'glasses-club-square':
      return <Frames d="M122 108 H155 L153 127 L146 133 H130 L123 127 Z" color={metal} width={1.4} lens="#C5D2D5" tint={.09}>
        <Mirror><path d="M121 114 V108 Q138 103 156 108 V114" fill="none" stroke={navy} strokeWidth="4.5" /><path d="M126 107 Q138 105 150 107" fill="none" stroke="#A0B9CA" strokeWidth="1" /><path d="M123 111 H127" stroke={gold} strokeWidth="1.3" /><path d="M127 119 V124 L131 128" fill="none" stroke={glint} strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-tortoise-wellington':
      return <Frames d="M120 106 Q139 101 157 106 L153 126 Q150 134 133 132 Q125 131 123 122 Z" color="#82705B" width={4} lens="#DDD0B5" tint={.1}>
        <Mirror><path d="M124 107 L128 106 M136 104 L141 104 M152 107 L155 109 M124 119 L125 124 M133 132 L138 132 M153 121 L152 125" stroke="#CFB893" strokeWidth="2.2" /><path d="M129 109 L132 108 M145 106 L149 108 M127 129 L131 130" stroke="#4D5662" strokeWidth="1.6" /></Mirror>
      </Frames>;
    case 'glasses-folding-travel':
      return <Frames d="M123 112 L131 105 H146 L155 113 L154 126 L146 133 H132 L123 126 Z" color={metal} width={1.7} lens="#CCD8D7" tint={.08} bridge="M155 117 H165">
        <path d="M158 113 H162 V120 H158 Z" fill={cream} stroke="#827762" strokeWidth="1" /><path d="M160 114 V119" stroke="#827762" strokeWidth=".8" />
        <Mirror><path d="M120 112 L113 109 L109 116" fill="none" stroke="#BAAB91" strokeWidth="2" /><rect x="118" y="109" width="5" height="6" rx="1" fill={metal} stroke="#7C807B" strokeWidth=".7" /><circle cx="120.5" cy="112" r=".8" fill="#52677B" stroke="none" /><path d="M130 110 L133 108 H143" fill="none" stroke={glint} strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-lunar':
      return <Frames d="M155 119 A17 16 0 1 1 121 119 A17 16 0 1 1 155 119 Z" color={gold} width={1.4} lens="#CFCBDE" tint={.1}>
        <Mirror><path d="M145 104 C125 96 111 110 121 127 Q127 137 140 135 C121 131 122 108 145 104 Z" fill={cream} stroke="#A39579" strokeWidth="1" /><path d="M119 126 L113 137" stroke={gold} strokeWidth="1" /><path d="M113 134 L115 137 L113 142 L110 138 Z" fill={gold} stroke="#827762" strokeWidth=".7" /></Mirror>
        <Gem x={160} y={113} size={.55} />
      </Frames>;
    case 'glasses-constellation':
      return <Frames d="M129 104 H148 L158 119 L146 133 H129 L119 118 Z" color="#A0B9CA" width={1.8} lens="#CCD6E6" tint={.11}>
        <Mirror><path d="M121 109 L111 100 L107 112 L114 116 M119 128 L123 139 L132 134" fill="none" stroke={gold} strokeWidth="1" /><path d="M111 96 L112 100 L116 101 L112 103 L111 107 L109 103 L105 101 L109 100 Z" fill={cream} stroke="#A39579" strokeWidth=".7" /><circle cx="123" cy="139" r="1.7" fill={cream} stroke="none" /><path d="M132 108 H142" fill="none" stroke={glint} strokeWidth="1" /></Mirror>
      </Frames>;
    case 'glasses-sprite-leaf':
      return <Frames d="M117 104 Q138 99 156 116 Q159 127 142 132 Q121 133 117 104 Z" color={sage} width={2} lens="#C3D6C4" tint={.11}>
        <Mirror><path d="M122 108 Q129 110 133 113 M126 120 L131 119 M141 128 L143 123" fill="none" stroke="#D3E2D3" strokeWidth="1.2" /><path d="M118 109 Q109 96 105 104 Q106 113 118 113 M115 113 Q104 116 110 124 Q118 123 120 116" fill="#A0B8AD" stroke="#607B73" strokeWidth="1" /><path d="M110 106 L118 112" stroke="#D3E2D3" strokeWidth=".8" /></Mirror>
      </Frames>;
    case 'glasses-crystal-prism':
      return <Frames d="M133 101 L150 105 L158 119 L146 135 L129 132 L119 116 Z" color="#B0A9BF" width={1.6} lens="#CCC5E1" tint={.14}>
        <Mirror><path d="M133 101 L131 108 L124 116 L132 128 L146 135 M150 105 L147 111 L153 119" fill="none" stroke="#E0D9E9" strokeWidth="1" /><path d="M130 104 L124 113 M150 127 L145 131" stroke="#8D86A0" strokeWidth="1.4" fill="none" /></Mirror>
        <Gem x={160} y={115} size={.7} /><Mirror><Gem x={113} y={110} size={.65} /></Mirror>
      </Frames>;
    case 'glasses-owl':
      return <Frames d="M122 106 L132 102 L145 104 L156 115 L155 127 L144 136 H131 L120 125 L119 115 Z" color="#BAAB91" width={2.7} lens="#DBD4BF" tint={.1}>
        <Mirror><path d="M119 115 L115 97 L129 105 L141 102 L154 113" fill="none" stroke="#827762" strokeWidth="4" /><path d="M118 104 L121 107 M126 105 L129 108 M145 107 L149 111" stroke="#E3D5BC" strokeWidth="1.1" /><path d="M124 126 L130 133 L139 135" stroke="#E3D5BC" strokeWidth="1.1" fill="none" /></Mirror>
        <path d="M156 115 L160 121 L164 115" fill="none" stroke={gold} strokeWidth="2" />
      </Frames>;
    case 'glasses-potion':
      return <Frames d="M131 107 V101 H146 V107 Q157 112 157 122 Q154 136 139 136 Q123 136 121 123 Q121 113 131 107 Z" color="#A0B8AD" width={1.9} lens="#C3DAD2" tint={.14}>
        <Mirror><rect x="130" y="98" width="17" height="6" rx="1.5" fill="#BAAB91" stroke="#827762" strokeWidth="1" /><path d="M127 127 Q139 122 152 127" fill="none" stroke="#81968D" strokeWidth="1.1" /><path d="M128 113 Q125 116 126 120" fill="none" stroke={glint} strokeWidth="1.2" /><circle cx="146" cy="130" r="1.5" fill="#D3E2D3" stroke="none" /></Mirror>
        <path d="M156 114 Q160 110 164 114" fill="none" stroke={gold} strokeWidth="1.4" />
      </Frames>;
    case 'glasses-comet':
      return <Frames d="M116 103 Q136 104 154 112 Q161 122 150 129 Q134 136 125 122 Z" color="#A0B9CA" width={2.1} lens="#C7D7E5" tint={.11}>
        <Mirror><path d="M121 111 L107 99 M119 116 L105 110 M124 122 L111 120" fill="none" stroke="#C6C8C0" strokeWidth="1.3" /><path d="M105 95 L107 99 L111 100 L107 102 L106 106 L104 102 L101 100 L104 99 Z" fill={gold} stroke="#8F8064" strokeWidth=".8" /><path d="M126 109 Q139 109 148 115" stroke={glint} strokeWidth="1" fill="none" /></Mirror>
      </Frames>;
    case 'glasses-clockwork':
      return <Frames d="M155 119 A17 17 0 1 1 121 119 A17 17 0 1 1 155 119 Z" color="#827762" width={4} lens="#CED4CD" tint={.12} bridge="M156 113 H164 M156 118 H164">
        <Mirror><circle cx="138" cy="119" r="14" fill="none" stroke={gold} strokeWidth="1" />{[{x:138,y:102},{x:121,y:119},{x:138,y:136},{x:155,y:119}].map(({x,y}) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="2" fill={metal} stroke="#6B695F" strokeWidth=".7" /><path d={`M${x-1} ${y} H${x+1}`} stroke="#6B695F" strokeWidth=".7" /></g>)}<path d="M117 108 L112 104 L108 107 L109 112 L105 114 L107 119 L112 118 L115 121 L119 118" fill="#BAAB91" stroke="#6B695F" strokeWidth="1" /><circle cx="113" cy="112" r="2.5" fill="#52677B" stroke={gold} strokeWidth=".9" /><path d="M129 112 Q133 108 138 109" stroke={glint} strokeWidth="1" fill="none" /></Mirror>
      </Frames>;
    default: return null;
  }
}

/** All lenses render over the face; transparent lenses preserve the expression. */
export function GlassesCollectionGraphic({ itemId, layer }: GlassesCollectionProps): ReactNode {
  if (layer !== 'front') return null;
  const art = GlassesArt({ itemId });
  return art ? <g aria-hidden="true" data-avatar-item={itemId} data-avatar-layer={layer} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">{art}</g> : null;
}
