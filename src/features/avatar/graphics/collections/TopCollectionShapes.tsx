import type { ReactNode } from 'react';
import { GarmentSurface } from '../clothing/GarmentSurface';
import { garmentPalettes, type GarmentPalette } from '../clothing/garmentPalette';

export type TopSleeve = 'long' | 'short' | 'puff' | 'bell' | 'none';
export type TopCut = 'round' | 'vneck' | 'vest' | 'blouse' | 'coat' | 'open' | 'bolero' | 'petal' | 'tunic';
export type TopMaterial = { palette: GarmentPalette; sleeve: TopSleeve; cut?: TopCut; sleevePalette?: GarmentPalette; hood?: boolean };

// Every front panel follows the jelly's side walls; even short garments overlap
// the rounded waist. All front necklines begin below the face at y=142.
const cuts: Record<Exclude<TopCut, 'open' | 'bolero'>, string> = {
  round: 'M103 142 C113 141 124 147 135 149 Q160 162 185 149 C196 147 207 141 217 142 C219 155 221 171 221 188 C222 207 229 226 229 243 Q160 263 94 243 C94 226 99 208 99 188 C99 171 101 155 103 142 Z',
  vneck: 'M103 142 Q116 141 135 149 L160 177 L185 149 Q204 141 217 142 Q222 164 221 188 C222 207 229 226 229 243 Q160 263 94 243 C94 226 99 208 99 188 Q98 164 103 142 Z',
  vest: 'M112 145 Q125 146 137 152 L160 178 L183 152 Q195 146 208 145 Q203 173 221 190 C222 208 229 227 229 243 Q160 263 94 243 C94 227 99 208 99 190 Q117 173 112 145 Z',
  blouse: 'M103 143 Q118 143 135 149 Q160 161 185 149 Q203 143 217 143 Q223 164 219 189 C220 208 231 223 228 244 Q160 264 94 244 C91 223 102 208 101 189 Q97 164 103 143 Z',
  coat: 'M103 142 Q118 141 135 149 Q160 164 185 149 Q203 141 217 142 Q221 167 221 188 C222 211 230 237 230 250 Q160 270 91 250 C91 237 98 211 99 188 Q98 166 103 142 Z',
  petal: 'M113 146 Q127 147 138 152 L160 175 L182 152 Q194 147 207 146 Q203 174 221 190 Q223 214 229 242 Q216 247 207 257 Q192 247 181 260 Q168 252 160 265 Q151 252 138 260 Q127 247 112 257 Q103 247 94 242 Q97 214 99 190 Q117 174 113 146 Z',
  tunic: 'M103 143 Q121 144 138 151 Q160 163 182 151 Q200 144 217 143 Q221 168 221 188 Q222 218 229 247 L174 261 L160 251 L146 261 L92 247 Q98 218 99 188 Q98 168 103 143 Z',
};

export function TopBody({ material, children }: { material: TopMaterial; children?: ReactNode }) {
  const { palette, cut = 'round' } = material;
  return <g stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
    {cut === 'open' || cut === 'bolero' ? <>
      <GarmentSurface d="M115 147 Q135 153 160 160 Q185 153 205 147 Q214 189 224 242 Q160 261 98 242 Q107 189 115 147 Z" palette={garmentPalettes.cream} />
      {cut === 'open' ? <>
        <GarmentSurface d="M103 142 Q116 142 132 149 Q139 178 148 198 L147 252 Q117 251 94 243 C94 225 99 208 99 188 Q98 163 103 142 Z" palette={palette} />
        <GarmentSurface d="M217 142 Q204 142 188 149 Q181 178 172 198 L173 252 Q203 251 229 243 C229 225 222 208 221 188 Q222 163 217 142 Z" palette={palette} />
      </> : <>
        <GarmentSurface d="M103 142 Q119 143 135 151 Q137 177 146 191 Q139 210 101 211 L99 188 Q98 163 103 142 Z" palette={palette} />
        <GarmentSurface d="M217 142 Q201 143 185 151 Q183 177 174 191 Q181 210 220 211 L221 188 Q222 163 217 142 Z" palette={palette} />
      </>}
    </> : <GarmentSurface d={cuts[cut]} palette={palette} />}
    {/* The lower crescent and side seam make the fabric wrap around the jelly. */}
    <path d="M104 176 Q104 202 100 223 M216 176 Q216 203 221 229 M100 239 Q160 258 223 239" fill="none" stroke={palette.light} strokeOpacity=".35" />
    {cut !== 'bolero' && <path d="M217 192 Q219 219 227 240 Q160 261 95 241 L97 235 Q160 253 220 235 Q214 211 217 192 Z" fill={palette.shade} fillOpacity=".13" stroke="none" />}
    {children}
  </g>;
}

const sleevePaths = {
  long: 'M105 141 Q92 148 77 174 C69 187 64 199 67 208 Q75 217 87 212 C99 204 109 186 114 167 L116 148 Z',
  short: 'M105 141 Q88 151 75 175 Q82 187 97 190 Q112 172 116 148 Z',
  puff: 'M105 141 C91 140 76 154 73 167 Q70 181 91 190 Q107 189 111 175 Q118 162 116 148 Z',
  bell: 'M105 141 Q91 150 80 167 Q73 182 64 207 Q73 220 91 215 Q105 194 111 173 L116 148 Z',
};

export function TopSleeves({ material, drinking, raised = false }: { material: TopMaterial; drinking: boolean; raised?: boolean }) {
  const { sleeve } = material;
  const palette = material.sleevePalette ?? material.palette;
  if (sleeve === 'none') return null;
  const short = sleeve === 'short' || sleeve === 'puff';
  if (raised) {
    if (!drinking) return null;
    return <g stroke={palette.edge} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <GarmentSurface d={short
        ? 'M235 145 Q251 148 257 163 Q250 178 233 184 L222 175 Q232 162 235 145 Z'
        : 'M235 144 C250 151 263 171 264 185 C265 196 256 205 245 205 C232 205 221 198 216 187 Q213 179 217 171 Q230 165 235 144 Z'} palette={palette} />
      <path d={short ? 'M251 160 Q246 171 230 179 L234 185 Q250 177 257 164 Z' : 'M235 144 Q231 162 217 171 L222 178 Q238 167 242 149 Z'} fill={palette.shade} />
      <path d={short ? 'M241 151 Q247 156 251 163' : 'M243 154 Q256 167 258 181 M224 189 Q236 202 248 198'} fill="none" stroke={palette.light} strokeOpacity=".65" />
      {sleeve === 'puff' && <path d="M238 151 Q240 163 233 172 M248 155 Q249 166 242 175" fill="none" stroke={palette.shade} strokeOpacity=".55" />}
    </g>;
  }
  const side = <g>
    <GarmentSurface d={sleevePaths[sleeve]} palette={palette} />
    <path d={short ? 'M75 174 Q84 184 98 187 L95 193 Q81 188 73 179 Z' : sleeve === 'bell' ? 'M65 204 Q75 215 92 210 L90 217 Q74 222 63 210 Z' : 'M66 201 Q75 209 91 205 L86 214 Q75 220 67 211 Z'} fill={palette.shade} fillOpacity=".65" />
    <path d="M100 149 Q85 162 79 177" fill="none" stroke={palette.light} strokeOpacity=".6" strokeWidth="1.4" />
    {sleeve === 'puff' && <path d="M92 148 Q82 162 82 174 M107 148 Q96 162 94 179" fill="none" stroke={palette.shade} strokeOpacity=".5" />}
    {sleeve === 'bell' && <path d="M97 169 L79 205 M104 173 L89 207" fill="none" stroke={palette.shade} strokeOpacity=".45" />}
  </g>;
  return <g stroke={palette.edge} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    {side}
    {drinking
      ? <GarmentSurface d="M212 142 Q224 138 239 147 L235 153 Q225 147 219 150 L219 163 L224 175 L218 180 Q212 165 212 142 Z" palette={palette} />
      : <g transform="translate(320 0) scale(-1 1)">{side}</g>}
  </g>;
}

export function TopBack({ material }: { material: TopMaterial }) {
  return <GarmentSurface d={material.hood
    ? 'M100 158 Q87 143 101 129 Q108 123 118 130 Q160 164 202 130 Q213 123 222 137 Q230 149 219 160 L204 176 Q160 189 116 176 Z'
    : 'M100 149 Q98 139 108 137 Q160 150 212 137 Q222 139 220 149 Q160 170 100 149 Z'} palette={material.palette} />;
}

export function TopNeck({ color, v = false }: { color: string; v?: boolean }) {
  return <path d={v ? 'M133 149 L160 180 L187 149 L181 152 L160 173 L139 152 Z' : 'M133 148 Q160 164 187 148 L188 155 Q160 173 132 155 Z'} fill={color} />;
}

export function TopHem({ color }: { color: string }) {
  return <g>
    <path d="M95 235 Q160 254 228 235 L229 243 Q160 263 94 243 Z" fill={color} />
    <path d="M106 240 L105 245 M119 243 L118 249 M133 246 L132 252 M147 248 V254 M161 249 V255 M175 248 V254 M189 246 L190 252 M203 243 L204 249 M216 240 L217 245" fill="none" stroke="#EEE6D7" strokeOpacity=".3" />
  </g>;
}

export function TopButtons({ x = 160, start = 180, count = 4, color = '#D6CDBA' }: { x?: number; start?: number; count?: number; color?: string }) {
  return <g fill={color} stroke="none">{Array.from({ length: count }, (_, i) => <circle key={i} cx={x} cy={start + i * 18} r="2.1" />)}</g>;
}

export function TopBow({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-2 0 Q-21 -15 -20 -4 Q-20 8 -2 3 M2 0 Q21 -15 20 -4 Q20 8 2 3 M-2 3 L-10 20 L-3 17 L2 21 L4 4 L11 18 L16 15 L6 2" fill={color} />
    <rect x="-3" y="-3" width="7" height="8" rx="2" fill={color} />
  </g>;
}

export function TopFlower({ x, y, color = '#EEE6D7', scale = 1 }: { x: number; y: number; color?: string; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill={color} strokeWidth=".8">
    <path d="M0 -3 C-10 -13 -12 -2 -5 1 C-15 4 -7 14 -1 7 C3 17 12 9 6 3 C17 0 11 -9 4 -5 C7 -16 -5 -16 0 -3 Z" />
    <circle r="3.2" fill="#BAAB91" />
  </g>;
}

export function TopStar({ x, y, scale = 1, color = '#E3D5BC' }: { x: number; y: number; scale?: number; color?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${scale})`} d="M0 -9 L3 -3 L9 -2 L5 3 L6 9 L0 6 L-6 9 L-5 3 L-9 -2 L-3 -3 Z" fill={color} strokeWidth=".8" />;
}
