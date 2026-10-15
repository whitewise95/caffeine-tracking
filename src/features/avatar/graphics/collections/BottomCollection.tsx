import type { ReactNode } from 'react'
import type { OutfitLayer } from '../../components/AvatarOutfitLayers'
import { BOTTOM_DESIGNS, type BottomDesignId, type BottomShape } from '../../data/collections/bottomCollection'
import { GarmentSurface } from '../clothing/GarmentSurface'
import { garmentPalettes, type GarmentPalette } from '../clothing/garmentPalette'

// Every cut starts at the curved pelvis and leaves a gap between the two feet.
const cuts: Record<BottomShape, string> = {
  shorts: 'M98 229 C130 241 191 241 223 229 C232 246 236 264 231 280 C213 291 189 292 174 284 Q160 276 147 284 C131 293 105 292 90 280 C86 264 90 245 98 229 Z',
  bloomers: 'M98 229 C130 241 191 241 223 229 C240 243 245 265 233 282 Q211 298 178 287 Q160 277 143 288 Q112 299 89 283 C77 266 82 244 98 229 Z',
  tapered: 'M98 229 C130 241 191 241 223 229 C234 246 235 272 226 290 L222 301 Q201 310 180 301 L173 284 Q160 276 148 284 L141 301 Q119 310 99 301 L94 289 C86 271 89 247 98 229 Z',
  culottes: 'M98 229 C130 241 191 241 223 229 Q233 256 235 297 Q208 309 173 301 L172 282 Q160 275 149 282 L147 301 Q113 309 86 297 Q88 256 98 229 Z',
  skirt: 'M98 229 C130 241 191 241 223 229 Q232 257 242 285 Q220 302 161 304 Q104 302 79 285 Q89 256 98 229 Z',
  wrap: 'M98 229 C130 241 191 241 223 229 Q231 260 240 286 Q215 303 167 304 L154 295 Q120 303 82 285 Q92 257 98 229 Z',
  tiered: 'M98 229 C130 241 191 241 223 229 L230 252 L233 256 L238 273 L240 278 L246 291 Q207 307 161 307 Q113 307 75 291 L81 277 L84 273 L89 256 L92 252 Z',
  bubble: 'M98 229 C130 241 191 241 223 229 C232 243 244 258 241 276 C239 298 205 305 161 305 C118 305 82 298 80 276 C78 259 90 243 98 229 Z',
  scalloped: 'M98 229 C130 241 191 241 223 229 Q231 254 240 280 Q238 293 224 290 Q214 306 199 298 Q182 311 161 302 Q140 311 123 298 Q107 306 97 290 Q83 293 81 280 Q91 254 98 229 Z',
  knicker: 'M98 229 C130 241 191 241 223 229 C238 243 243 265 232 281 Q222 295 183 291 L175 284 Q160 276 146 284 L138 292 Q101 295 89 281 C78 265 83 243 98 229 Z',
}
const isSkirt = (shape: BottomShape) => ['skirt', 'wrap', 'tiered', 'bubble', 'scalloped'].includes(shape)

function Bow({ x, y, color = '#DDC1BF', small = false }: { x: number; y: number; color?: string; small?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${small ? .66 : 1})`} fill={color} stroke="#79656E" strokeWidth=".9">
    <path d="M0 0 Q-13 -10 -14 -2 Q-15 6 -2 3 L-6 13 L0 10 L2 4 L6 12 L12 12 L5 2 Q18 5 16 -3 Q13 -10 3 -1 Z" />
    <ellipse cx="2" cy="1" rx="3" ry="3.5" />
  </g>
}

function Flower({ x, y, color = '#EEE6D7', size = 1 }: { x: number; y: number; color?: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} stroke="none" fill={color}>
    <ellipse cy="-3" rx="2.2" ry="3" /><ellipse cx="3" cy="-1" rx="3" ry="2.2" transform="rotate(20)" /><ellipse cx="2" cy="3" rx="2.2" ry="3" /><ellipse cx="-2" cy="3" rx="2.2" ry="3" /><ellipse cx="-3" cy="-1" rx="3" ry="2.2" /><circle r="1.8" fill="#C4AC7E" />
  </g>
}

function Star({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${size})`} d="M0 -6 L2 -2 L6 -1 L3 2 L4 6 L0 4 L-4 6 L-3 2 L-6 -1 L-2 -2 Z" fill="#D9CAA5" stroke="#8B856D" strokeWidth=".7" />
}

function Pleats({ palette: p, skirt = false }: { palette: GarmentPalette; skirt?: boolean }) {
  return <g fill="none">
    <path d={skirt ? 'M111 250 L96 286 M134 254 L125 298 M157 255 V301 M181 254 L191 298 M207 249 L226 286' : 'M114 253 Q107 274 110 295 M137 256 L132 299 M184 256 L189 299 M207 253 Q214 274 211 295'} stroke={p.shade} strokeWidth="2" />
    <path d={skirt ? 'M115 251 L103 286 M138 254 L132 298 M162 255 V301 M186 253 L198 297 M212 248 L232 284' : 'M118 253 Q114 276 116 297 M141 256 L139 299 M180 256 L182 299 M203 253 Q208 276 205 297'} stroke={p.light} strokeWidth="2.2" strokeOpacity=".65" />
  </g>
}

function Cuff({ p, y = 287, rib = false }: { p: GarmentPalette; y?: number; rib?: boolean }) {
  return <g transform={`translate(0 ${y - 287})`}>
    <path d="M94 280 Q115 292 145 282 L143 291 Q120 302 97 289 Z M176 282 Q207 292 227 280 L224 289 Q201 302 178 291 Z" fill={p.shade} />
    <path d="M96 281 Q119 292 143 283 M178 283 Q202 292 225 281" fill="none" stroke={p.light} strokeWidth="1.4" />
    {rib && <path d="M103 285 L104 291 M111 288 L111 294 M119 289 V295 M127 289 V295 M135 287 L134 293 M186 287 L187 293 M194 289 V295 M202 289 V295 M210 288 L210 294 M218 285 L217 291" fill="none" stroke={p.base} strokeWidth="1.5" />}
  </g>
}

function Rear({ p, shape }: { p: GarmentPalette; shape: BottomShape }) {
  return <g aria-hidden="true" stroke={p.edge} strokeWidth="1.1">
    <path d="M98 229 C114 215 206 215 223 229 L226 241 C198 230 122 230 95 241 Z" fill={p.shade} />
    <path d="M99 229 C127 219 195 219 222 229" fill="none" stroke={p.light} strokeOpacity=".7" />
    {isSkirt(shape) ? <path d="M82 282 Q161 265 240 282 Q246 304 161 309 Q76 304 82 282 Z" fill={p.shade} /> : <>
      <path d={shape === 'tapered' || shape === 'culottes'
        ? 'M90 291 Q117 282 147 294 Q150 307 96 303 Z M174 294 Q204 282 231 291 L225 303 Q170 307 174 294 Z'
        : 'M90 274 Q117 265 147 278 Q150 293 96 288 Z M174 278 Q204 265 231 274 L225 288 Q170 293 174 278 Z'} fill={p.shade} />
    </>}
  </g>
}

function BottomDetails({ id, p }: { id: BottomDesignId; p: GarmentPalette }): ReactNode {
  const seam = p.shade
  switch (id) {
    case 'bottom-bear-pocket':
      return <><Cuff p={p} /><g fill="#D8C7A6"><path d="M102 259 Q100 252 107 254 Q115 250 122 255 Q129 253 128 261 L126 278 Q113 286 102 277 Z" /><path d="M194 261 Q193 254 200 255 Q207 250 215 255 Q222 253 220 261 L219 277 Q207 285 196 278 Z" /></g><g fill="#655E55" stroke="none"><circle cx="109" cy="265" r="1.3" /><circle cx="122" cy="265" r="1.3" /><ellipse cx="115" cy="271" rx="2.8" ry="1.9" /><circle cx="201" cy="265" r="1.3" /><circle cx="214" cy="265" r="1.3" /><ellipse cx="208" cy="271" rx="2.8" ry="1.9" /></g><path d="M139 254 L136 271 M182 254 L185 271" fill="none" stroke={seam} /></>
    case 'bottom-bunny-bloomer':
      return <><path d="M105 250 Q91 264 100 278 M127 255 Q117 271 124 284 M194 255 Q204 271 197 284 M216 250 Q230 264 221 278" fill="none" stroke={seam} strokeOpacity=".65" /><Cuff p={garmentPalettes.sand} rib /><g fill="#DDD0C2" stroke="#A19483"><path d="M111 270 C106 255 110 252 115 266 C115 251 121 252 119 269 Q127 274 122 279 Q112 285 108 277 Q107 273 111 270 Z" /><path d="M202 270 C197 255 201 252 206 266 C206 251 212 252 210 269 Q218 274 213 279 Q203 285 199 277 Q198 273 202 270 Z" /></g><g fill="#6E665F" stroke="none"><circle cx="113" cy="274" r="1" /><circle cx="120" cy="274" r="1" /><circle cx="204" cy="274" r="1" /><circle cx="211" cy="274" r="1" /></g></>
    case 'bottom-quilt-patch':
      return <><path d="M101 252 L124 279 M121 254 L143 279 M181 254 L204 279 M201 252 L226 275 M99 276 L122 254 M119 281 L143 256 M179 278 L201 254 M202 280 L225 255" fill="none" stroke={p.light} strokeWidth="1.1" /><path d="M99 258 L116 261 L114 275 L96 272 Z" fill="#CABCA5" strokeDasharray="2 2" /><path d="M205 263 L223 259 L226 273 L206 277 Z" fill="#A5AFBC" strokeDasharray="2 2" /><Cuff p={p} /></>
    case 'bottom-cable-knit':
      return <><g fill="none" stroke={p.shade} strokeWidth="1.2">{[108, 128, 193, 213].map(x => <path key={x} d={`M${x} 255 q-7 7 0 13 q7 7 0 13 q-7 7 0 13 M${x + 5} 255 q7 7 0 13 q-7 7 0 13 q7 7 0 13`} />)}</g><Cuff p={p} y={299} rib /><path d="M149 257 V274 M172 257 V274" stroke={p.light} strokeWidth="2" /></>
    case 'bottom-cloud-culottes':
      return <><Pleats palette={p} /><path d="M90 288 Q96 280 105 285 Q113 275 122 284 Q132 280 141 289 L143 298 Q113 306 88 296 Z M178 289 Q186 280 196 284 Q205 275 214 285 Q223 280 232 288 L233 296 Q207 306 178 298 Z" fill="#D4DFD3" stroke={p.shade} strokeWidth=".9" /><path d="M102 289 Q107 285 112 288 M204 289 Q209 285 214 288" fill="none" stroke="#F0ECDD" strokeWidth="1.5" /></>
    case 'bottom-baker-apron':
      return <><Cuff p={p} y={298} /><GarmentSurface d="M113 246 Q160 260 208 246 L211 285 Q187 301 160 301 Q135 301 109 285 Z" palette={garmentPalettes.cream} /><path d="M117 254 L115 283 Q160 305 205 283 L203 254 M135 266 Q160 273 185 266 L185 283 Q160 291 135 283 Z M160 270 V287" fill="none" stroke="#A89D88" /><path d="M100 252 L113 257 M208 257 L221 252" stroke="#D6CDBA" strokeWidth="4" /></>
    case 'bottom-fleece-jog':
      return <><path d="M105 254 Q97 267 107 275 M216 254 Q224 267 214 275" fill="none" stroke={seam} strokeWidth="2" /><g fill="#DED2BA" stroke="none">{[104, 113, 122, 131, 190, 199, 208, 217].map((x, i) => <circle key={x} cx={x} cy={294 + (i % 4 === 0 || i % 4 === 3 ? 0 : 3)} r="6" />)}</g><path d="M113 262 l2 -3 3 3 3 -3 M198 268 l2 -3 3 3 3 -3 M123 282 l3 -3 3 3" fill="none" stroke={p.light} strokeWidth="2" /></>
    case 'bottom-picnic-gingham':
      return <><g fill="#E2D8D5" fillOpacity=".6" stroke="none"><path d="M99 254 L118 258 V274 L93 269 Z M136 260 H150 V276 H133 Z M173 260 H188 L190 276 H173 Z M204 258 L222 254 L228 269 L204 274 Z M93 284 L118 288 V300 L90 294 Z M133 289 H147 V299 H132 Z M175 289 H190 V300 H175 Z M204 288 L229 284 L232 294 L204 300 Z" /></g><path d="M125 258 V301 M196 258 V301 M93 278 Q120 287 149 281 M173 281 Q202 287 229 278" stroke={p.shade} strokeWidth="1.8" fill="none" /><Bow x={199} y={259} small color="#E4DAC8" /></>
    case 'bottom-petal-wrap':
      return <><path d="M101 244 Q135 262 162 298 Q123 303 83 285 Q96 262 101 244 Z" fill={p.light} fillOpacity=".65" /><path d="M219 244 Q201 277 153 300 Q191 310 238 286 Q226 260 219 244 Z" fill={p.base} /><path d="M219 250 Q196 280 156 299 M104 252 Q118 281 141 293" fill="none" stroke={p.light} strokeWidth="1.7" /><Bow x={207} y={256} small /></>
    case 'bottom-lace-bloomer':
      return <><path d="M109 253 Q101 269 110 281 M129 257 Q125 270 130 284 M192 257 Q196 270 191 284 M212 253 Q220 269 211 281" fill="none" stroke={seam} strokeOpacity=".55" /><Cuff p={p} /><path d="M96 284 q3 8 7 2 q4 9 8 2 q4 9 8 2 q4 8 8 0 q5 7 9 -2 q5 4 8 -2 M178 286 q3 8 7 2 q4 9 8 0 q4 9 8 0 q4 8 8 -1 q5 7 9 -4 q5 4 7 -2" fill="none" stroke="#F4ECDD" strokeWidth="3" /><Bow x={160} y={257} small color="#BAAB91" /></>
    case 'bottom-ribbon-pleat':
      return <><Pleats palette={p} skirt /><path d="M83 285 Q161 313 238 285" fill="none" stroke="#A4AFB9" strokeWidth="2.2" /><Bow x={204} y={262} color="#D8C3C4" /><path d="M204 275 Q210 284 220 290" fill="none" stroke="#D8C3C4" strokeWidth="2.5" /></>
    case 'bottom-rose-tier':
      return <><path d="M89 259 Q161 286 233 259 M81 277 Q161 308 240 277" fill="none" stroke={p.shade} strokeWidth="2" /><path d="M92 257 q5 7 10 3 q7 8 14 4 q7 7 15 3 q7 7 15 2 q7 7 15 1 q7 6 15 -1 q7 6 15 -2 q7 5 15 -3 q7 4 15 -4 q7 3 10 -3" fill="none" stroke={p.light} strokeWidth="2.7" /><path d="M104 279 L102 291 M125 285 L124 298 M149 289 V302 M175 289 V302 M199 284 L201 298 M222 278 L225 291" stroke={p.shade} strokeOpacity=".6" /><Flower x={110} y={278} color="#D9B8BC" /><Flower x={213} y={290} color="#D9B8BC" size={.8} /></>
    case 'bottom-pearl-tweed':
      return <><path d="M101 256 H218 M96 267 H226 M91 279 H230 M108 290 H216 M108 253 L102 285 M125 256 L121 296 M144 257 L143 299 M177 257 L178 299 M196 256 L200 296 M213 253 L220 285" fill="none" stroke={p.light} strokeWidth="1.2" strokeDasharray="3 3" /><path d="M104 263 L129 266 L128 277 Q114 281 103 273 Z M191 266 L216 263 L218 273 Q204 281 193 277 Z" fill={p.base} />{[260, 271, 282, 293].map(y => <circle key={y} cx="161" cy={y} r="2.4" fill="#F0E4CC" stroke="#B4A58A" strokeWidth=".7" />)}</>
    case 'bottom-daisy-shorts':
      return <><Cuff p={{ ...p, base: p.light }} /><path d="M101 255 Q110 270 126 263 M195 263 Q210 270 220 255" fill="none" stroke="#C8C9B3" /><path d="M111 276 L118 263 M207 278 L201 263 M119 270 L124 271 M203 270 L196 272" fill="none" stroke="#A6B9A5" strokeWidth="1.3" /><Flower x={118} y={263} /><Flower x={201} y={263} size={.85} /><Flower x={135} y={276} size={.6} /><Flower x={217} y={275} size={.55} /></>
    case 'bottom-swan-bubble':
      return <><path d="M103 251 Q84 278 111 293 M124 256 Q111 285 135 299 M147 258 Q142 287 149 301 M175 258 Q179 286 173 301 M198 255 Q211 284 187 298 M219 250 Q237 276 212 292" fill="none" stroke={p.shade} strokeWidth="1.3" strokeOpacity=".6" /><path d="M89 286 Q161 317 232 286" fill="none" stroke={p.light} strokeWidth="3.6" /><Bow x={161} y={258} color="#B0ADBF" /></>
    case 'bottom-scallop-linen':
      return <><Pleats palette={p} /><path d="M89 290 Q95 300 102 296 Q110 306 118 300 Q127 307 134 300 Q142 302 147 295 M174 295 Q180 303 188 300 Q196 307 203 300 Q212 306 219 296 Q227 300 232 290" fill="none" stroke="#D8DECE" strokeWidth="3" /><path d="M102 255 L96 277 M219 255 L225 277" fill="none" stroke={p.light} />{[258, 268, 278].map(y => <g key={y} fill="#D6C8A9"><circle cx={102 - (y - 258) / 4} cy={y} r="1.8" /><circle cx={219 + (y - 258) / 4} cy={y} r="1.8" /></g>)}</>
    case 'bottom-parachute':
      return <><path d="M103 253 L112 261 L109 280 L96 275 Z M218 253 L209 261 L212 280 L225 275 Z" fill="#65717C" /><path d="M117 256 L124 266 L116 285 M204 256 L197 266 L205 285" fill="none" stroke={p.light} strokeWidth="1.2" /><Cuff p={p} y={298} rib /><path d="M99 290 l8 3 -3 9 M222 290 l-8 3 3 9" fill="none" stroke="#B4BBB7" strokeWidth="1.4" /><g fill="#2B333F"><rect x="101" y="290" width="7" height="4" rx="1" /><rect x="213" y="290" width="7" height="4" rx="1" /></g></>
    case 'bottom-skater-panel':
      return <><path d="M98 251 L119 257 L112 281 Q98 285 91 278 Z M203 257 L223 251 L231 278 Q223 285 209 281 Z" fill="#D2C8B6" /><path d="M122 257 L145 259 L146 282 L118 285 Z M176 259 L199 257 L204 285 L175 282 Z" fill="#445E77" stroke="#BAC2BA" strokeDasharray="2 2" /><path d="M95 272 L111 277 M210 277 L227 272" stroke="#E0D8C3" strokeWidth="2" /><Cuff p={p} /></>
    case 'bottom-basket-mesh':
      return <><g fill={p.light} stroke="none" opacity=".6">{[257, 265, 273].flatMap((y, row) => [106, 117, 128, 193, 204, 215].map(x => <circle key={`${x}-${y}`} cx={x + row % 2 * 3} cy={y} r="1" />))}</g><path d="M99 247 Q91 261 96 277 M222 247 Q230 261 225 277" stroke="#D8D6C3" strokeWidth="4" fill="none" /><path d="M94 278 Q119 291 146 280 M175 280 Q202 291 227 278" fill="none" stroke="#D8D6C3" strokeWidth="2.3" /><path d="M128 262 h7 v10 h-7 Z M139 262 h7 v4 h-7 v6 h7" fill="none" stroke="#D8D6C3" strokeWidth="1.3" /></>
    case 'bottom-tech-zip':
      return <><path d="M99 253 Q110 261 117 274 L108 292 L97 286 Q90 270 99 253 Z M222 253 Q211 261 204 274 L213 292 L224 286 Q231 270 222 253 Z" fill="#546371" /><path d="M107 256 L128 275 M214 256 L193 275" stroke="#D4D9CC" strokeWidth="1.7" /><path d="M105 258 L126 277 M216 258 L195 277" stroke="#303E4B" strokeWidth="1" strokeDasharray="2 1.5" /><path d="M126 274 l2 5 M195 274 l-2 5" stroke="#BEC4BD" strokeWidth="2.6" /><Cuff p={p} y={298} /></>
    case 'bottom-carpenter':
      return <><path d="M102 256 L124 260 L122 286 Q110 292 97 283 Z M198 260 L219 256 L225 283 Q213 292 200 286 Z" fill="#C6BAA0" strokeDasharray="2.4 2" /><path d="M99 259 L91 262 L92 278 L100 279" fill="none" stroke="#827762" strokeWidth="4.3" /><path d="M208 264 L211 282 M215 262 L218 281" stroke="#897D65" strokeWidth="2" /><path d="M103 295 Q122 303 144 297 M178 297 Q199 303 221 295" fill="none" stroke={p.light} strokeWidth="2" /></>
    case 'bottom-wrap-utility':
      return <><path d="M108 250 L216 251 L206 292 L151 300 L160 269 Z" fill="#6F867B" /><path d="M111 252 L164 268 L153 298" fill="none" stroke="#BBC5B0" strokeWidth="1.6" /><path d="M183 261 L216 257 L215 278 L184 282 Z" fill="#506B60" /><path d="M183 259 L217 255 L216 264 L184 268 Z" fill="#97A894" /><rect x="195" y="262" width="11" height="4" rx="1" fill="#3B534C" /><path d="M95 280 Q116 292 142 291" fill="none" stroke={p.light} /></>
    case 'bottom-moto-knee':
      return <><path d="M101 267 Q121 260 140 272 L137 287 Q116 294 99 281 Z M181 272 Q201 260 220 267 L222 281 Q204 294 184 287 Z" fill="#737E89" /><path d="M104 269 L136 275 M102 273 L136 280 M104 278 L134 284 M185 275 L217 269 M185 280 L219 273 M187 284 L217 278" fill="none" stroke="#394653" strokeWidth="2" /><Cuff p={p} y={298} /><path d="M114 253 L129 263 M207 253 L192 263" stroke="#B0B8BB" strokeWidth="1.4" /></>
    case 'bottom-retro-race':
      return <><path d="M98 247 L114 260 L100 277 L93 271 Z M223 247 L207 260 L221 277 L228 271 Z" fill="#D9DEC9" /><path d="M101 252 L109 261 L99 273 M220 252 L212 261 L222 273" fill="none" stroke="#547777" strokeWidth="2.4" /><path d="M93 279 Q118 291 147 281 M174 281 Q203 291 228 279" fill="none" stroke="#E0E1CE" strokeWidth="2.5" /><path d="M128 265 h12 M128 269 h8" stroke="#516F70" strokeWidth="1.5" /></>
    case 'bottom-sailor-buttons':
      return <><path d="M118 252 L122 277 Q160 288 199 277 L203 252" fill="none" stroke="#A3B3B8" strokeWidth="1.4" /><Cuff p={p} /><path d="M95 280 Q119 290 146 281 M175 281 Q202 290 226 280" fill="none" stroke="#D6D9C6" strokeWidth="2" />{[257, 267, 277].map(y => <g key={y} fill="#CDBD92" stroke="#637079"><circle cx="128" cy={y} r="2.5" /><circle cx="193" cy={y} r="2.5" /></g>)}</>
    case 'bottom-academy-tartan':
      return <><path d="M97 259 Q161 277 225 259 M91 275 Q161 300 233 275 M114 249 L105 291 M143 255 L139 301 M178 255 L182 301 M207 249 L216 291" fill="none" stroke="#354D4D" strokeWidth="4" /><path d="M96 263 Q161 281 226 263 M91 279 Q161 303 233 279 M119 251 L110 294 M148 255 L144 302 M183 255 L187 302 M212 248 L221 290" fill="none" stroke="#C9C4A4" strokeWidth="1" /><Pleats palette={{ ...p, light: '#A5B1A0' }} skirt /></>
    case 'bottom-oxford-pleat':
      return <><Pleats palette={p} /><path d="M109 254 L101 268 M212 254 L220 268 M160 253 V271" fill="none" stroke={seam} strokeWidth="1.3" /><Cuff p={{ ...p, shade: '#43515F' }} y={298} /><path d="M118 257 L126 255 L124 270 M203 257 L195 255 L197 270" fill="none" stroke={p.light} strokeWidth="1.1" /></>
    case 'bottom-heritage-knicker':
      return <><path d="M102 254 L128 281 M118 257 L140 279 M183 257 L207 281 M201 254 L225 276 M100 276 L123 255 M119 284 L142 258 M180 279 L204 255 M202 283 L224 256" fill="none" stroke={p.shade} strokeOpacity=".65" strokeWidth="1" /><Cuff p={p} rib /><path d="M100 281 L116 286 L113 291 L99 287 Z M205 286 L221 281 L222 287 L208 291 Z" fill="#7A7262" /><circle cx="108" cy="286" r="1.7" fill="#DDD0AE" /><circle cx="213" cy="286" r="1.7" fill="#DDD0AE" /></>
    case 'bottom-pinstripe':
      return <><g stroke="#B0BDC1" strokeWidth=".9" opacity=".8">{[104, 114, 124, 134, 187, 197, 207, 217].map(x => <path key={x} d={`M${x} 254 Q${x + (x < 160 ? -4 : 4)} 275 ${x} 298`} fill="none" />)}</g><Cuff p={p} y={298} /><path d="M111 254 L102 266 M210 254 L219 266" stroke="#D2D4C6" strokeWidth="1.3" /></>
    case 'bottom-bookshop-wrap':
      return <><path d="M98 260 Q161 280 225 260 M89 279 Q161 302 235 279 M118 252 L106 291 M144 256 L139 300 M179 256 L185 300 M204 251 L218 292" fill="none" stroke="#9C9B8B" strokeWidth="2" /><path d="M216 248 Q200 279 156 300" fill="none" stroke="#6F786D" strokeWidth="2" /><path d="M100 265 L130 269 L126 286 L99 281 Z" fill="#C4BDA8" /><path d="M106 265 L107 260 L122 262 L121 268" fill="#80958C" /><path d="M110 262 L119 264" stroke="#D7D9C3" /></>
    case 'bottom-nautical-culotte':
      return <><Pleats palette={p} /><path d="M88 289 Q113 301 147 294 L147 300 Q113 308 87 296 Z M174 294 Q208 301 233 289 L234 296 Q208 308 174 300 Z" fill="#506477" /><path d="M91 288 Q118 299 144 293 M177 293 Q203 299 230 288" fill="none" stroke="#8A9BA5" strokeWidth="1.2" /><g transform="translate(208 270)" fill="none" stroke="#627687" strokeWidth="1.5"><circle cy="-6" r="2" /><path d="M0 -4 V8 M-7 1 Q-6 10 0 8 Q6 10 7 1 M-3 -1 H3" /></g></>
    case 'bottom-herringbone':
      return <><g fill="none" stroke="#A0A9AB" strokeWidth=".75" opacity=".65">{[104, 119, 134, 185, 200, 215].map(x => <path key={x} d={`M${x - 5} 257 l5 4 5 -4 m-10 7 l5 4 5 -4 m-10 7 l5 4 5 -4`} />)}</g><Cuff p={p} /><path d="M102 255 Q109 273 124 263" fill="none" stroke="#C4B693" strokeWidth="1.2" /><circle cx="124" cy="263" r="2.2" fill="#B6AA8D" /><path d="M194 258 L218 254" stroke="#9DA8AD" strokeWidth="1.3" /></>
    case 'bottom-fern-petal':
      return <><path d="M104 245 Q99 273 97 290 Q117 286 137 257 Z M137 254 Q119 283 124 299 Q147 291 160 260 Z M184 254 Q202 283 198 299 Q175 291 161 260 Z M217 245 Q222 273 224 290 Q204 286 184 257 Z" fill="#A6B9A4" /><path d="M109 256 L99 285 M141 264 L127 294 M180 264 L194 294 M213 256 L222 285 M160 258 V298" fill="none" stroke="#5D7B66" strokeWidth="1.2" /><path d="M103 274 l9 -3 M131 284 l10 -3 M190 284 l-10 -3 M218 274 l-9 -3" stroke="#779478" /></>
    case 'bottom-moon-wizard':
      return <><path d="M110 251 Q95 268 110 283 M133 257 Q124 270 133 286 M188 257 Q197 270 188 286 M211 251 Q226 268 211 283" fill="none" stroke={p.light} strokeWidth="1.2" /><Cuff p={{ ...p, shade: '#A99D7F' }} /><path d="M119 262 A8 8 0 1 0 125 275 A8 8 0 0 1 119 262 Z" fill="#D4C9A8" stroke="none" /><Star x={204} y={269} size={.7} /><Star x={190} y={279} size={.4} /><circle cx="135" cy="271" r="1.4" fill="#D8D0B2" /></>
    case 'bottom-ranger-map':
      return <><Cuff p={p} y={298} /><path d="M94 257 L121 260 L119 282 L95 279 Z" fill="#8C8D73" /><path d="M96 255 L120 258 L121 265 L95 262 Z" fill="#C3B79A" /><path d="M198 262 L219 256 L222 277 L200 282 Z" fill="#D4C8AA" /><path d="M201 266 L206 270 L210 264 L218 268 M210 264 L210 276 M208 277 L216 273" fill="none" stroke="#8A9278" strokeWidth="1.2" /><path d="M128 256 L136 285 M193 256 L185 285" fill="none" stroke={p.shade} /></>
    case 'bottom-stardust-tulle':
      return <><path d="M90 255 Q161 281 232 255 L239 277 Q161 309 82 277 Z" fill="#C8C5D7" fillOpacity=".35" /><path d="M83 276 Q161 305 240 276 M77 291 Q161 320 244 291" fill="none" stroke="#DED6DB" strokeWidth="1.5" /><path d="M110 261 L101 291 M136 267 L131 300 M161 269 V303 M187 267 L191 300 M212 260 L223 291" stroke={p.light} strokeOpacity=".75" /><Star x={107} y={281} size={.65} /><Star x={195} y={287} size={.8} /><Star x={158} y={278} size={.45} /><Star x={224} y={282} size={.4} /></>
    case 'bottom-mushroom-bloom':
      return <><Cuff p={garmentPalettes.cream} rib /><g fill="#E8DDCB" stroke="none"><ellipse cx="105" cy="261" rx="5" ry="3.5" transform="rotate(-20 105 261)" /><ellipse cx="131" cy="274" rx="6" ry="4" /><ellipse cx="191" cy="262" rx="5" ry="3.5" /><ellipse cx="216" cy="276" rx="6" ry="4" /><ellipse cx="199" cy="282" rx="3" ry="2" /></g><path d="M118 253 Q108 272 113 282 M204 253 Q213 270 208 284" stroke="#D1B0B2" fill="none" /></>
    case 'bottom-knight-tabard':
      return <><path d="M103 253 L218 253 L225 288 Q206 300 181 297 L172 279 H151 L141 297 Q114 300 95 288 Z" fill="#586B79" /><path d="M133 250 Q161 260 189 250 L190 290 L161 304 L131 290 Z" fill="#9EACB5" stroke="#D2D0BA" strokeWidth="1.6" /><path d="M161 264 L174 268 L172 281 L161 289 L150 281 L148 268 Z" fill="#526D7D" stroke="#D6C8A5" /><path d="M161 268 V284 M154 274 H168" stroke="#D6C8A5" strokeWidth="2" /></>
    case 'bottom-cloud-pilot':
      return <><Cuff p={garmentPalettes.cream} rib /><path d="M104 253 L115 256 L107 281 L97 276 Z M206 256 L217 253 L224 276 L214 281 Z" fill="#9EADAE" /><path d="M124 258 L145 261 L142 278 L120 275 Z" fill="#425C75" /><path d="M121 267 L145 270" stroke="#C3CCBF" strokeWidth="1.3" /><path d="M196 261 l-8 8 9 -2 -5 11 16 -14 -10 2 Z" fill="#D4CEB2" /><circle cx="132" cy="269" r="1.8" fill="#D5C69F" /></>
    case 'bottom-treasure-sash':
      return <><Pleats palette={p} /><path d="M98 245 Q161 262 221 244 L224 254 Q162 273 95 255 Z" fill="#8F797D" /><path d="M190 259 L216 254 L214 290 L204 286 L194 296 Z" fill="#B49D99" /><path d="M196 264 L203 290 M210 260 L209 284" fill="none" stroke="#79656E" /><path d="M105 264 Q105 285 126 280" fill="none" stroke="#C3B28C" strokeWidth="1.5" /><path d="M93 296 Q114 307 145 300 M177 300 Q208 307 230 296" fill="none" stroke="#A8B0B2" strokeWidth="2" /></>
  }
}

export function BottomCollectionGraphic({ itemId, layer }: { itemId: string; layer: OutfitLayer; drinking?: boolean }): ReactNode {
  const design = BOTTOM_DESIGNS.find(item => item.id === itemId)
  if (!design || layer === 'front' || layer === 'sleeve') return null
  const p = garmentPalettes[design.fabric]
  if (layer === 'back') return <Rear p={p} shape={design.shape} />
  return <g aria-hidden="true" className="garment-bottom-body" stroke={p.edge} strokeWidth="1.05" strokeLinejoin="round" strokeLinecap="round">
    <GarmentSurface d={cuts[design.shape]} palette={p} />
    <BottomDetails id={design.id} p={p} />
    <g className="garment-bottom-waist">
      <GarmentSurface d="M98 229 C130 241 191 241 223 229 L226 242 C191 255 129 255 95 242 Z" palette={p} />
      <path d="M99 233 C131 245 190 245 222 233 M98 241 Q160 263 224 241" fill="none" stroke={p.light} strokeWidth=".9" strokeOpacity=".7" />
    </g>
  </g>
}
