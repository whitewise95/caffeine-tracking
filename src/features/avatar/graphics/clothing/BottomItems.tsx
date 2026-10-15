import type { ReactNode } from 'react';
import { GarmentSurface } from './GarmentSurface';
import { garmentPalettes, type GarmentPalette } from './garmentPalette';

// These garments share the jelly's broad, rounded pelvis and short, separate feet.
// The rear rim sits behind the jelly; the curved front band tucks under every top.
const waistFront = 'M98 229 C128 242 192 242 223 229 L226 242 C194 255 126 255 95 242 Z';
const shorts = 'M98 229 C128 240 192 240 223 229 C230 242 235 263 231 279 C216 291 189 292 173 284 C170 279 151 279 148 285 C133 294 106 291 91 280 C87 263 92 243 98 229 Z';
const trousers = 'M98 229 C128 240 192 240 223 229 C231 245 234 263 230 280 C230 289 226 297 222 300 C210 307 190 307 179 300 L172 287 C170 279 151 279 148 287 L142 301 C128 308 109 307 98 300 C93 290 90 278 92 262 C93 248 95 237 98 229 Z';

type BottomLayer = 'back' | 'body' | 'front' | 'sleeve';

function Waistband({ palette, elastic = false }: { palette: GarmentPalette; elastic?: boolean }) {
  return <g className="garment-bottom-waist">
    <GarmentSurface d={waistFront} palette={palette} />
    <path d="M99 233 C130 246 191 246 222 233" fill="none" stroke={palette.light} strokeOpacity=".7" strokeWidth="1" />
    <path d="M98 241 C129 253 193 253 223 241" fill="none" stroke={palette.shade} strokeOpacity=".7" strokeWidth="1" />
    {elastic && <path d="M106 237 L104 242 M114 240 L113 245 M123 242 L122 247 M133 244 V249 M144 246 V250 M176 246 V250 M187 244 V249 M198 242 L199 247 M208 240 L209 245 M216 237 L218 242" fill="none" stroke={palette.shade} strokeOpacity=".65" strokeWidth="1" />}
  </g>;
}

function Drawstring({ color = '#E4DDCB' }: { color?: string }) {
  return <g fill="none" stroke={color} strokeWidth="1.35" strokeLinecap="round">
    <path d="M160 249 C153 244 148 247 151 251 C153 253 158 251 160 249 C165 244 173 246 170 250 C168 253 164 251 160 249 M158 252 Q158 259 154 264 M162 252 Q163 259 167 262" />
    <path d="M154 263 L154 265 M167 261 L168 263" strokeWidth="1.8" />
  </g>;
}

function PocketSeams({ color, slanted = false }: { color: string; slanted?: boolean }) {
  return <path d={slanted ? 'M117 252 Q111 263 101 270 M204 252 Q210 263 220 270' : 'M118 252 C117 264 109 270 99 270 M203 252 C204 264 212 270 222 270'} fill="none" stroke={color} strokeWidth="1.25" />;
}

function BeltLoops({ color }: { color: string }) {
  return <path d="M108 236 L106 245 M135 243 L134 251 M186 243 L187 251 M213 236 L215 245" fill="none" stroke={color} strokeWidth="2.6" />;
}

/** Two curved bands and their dark inner lips make the short legs read as tubes. */
function ShortCuffs({ palette, rolled = false }: { palette: GarmentPalette; rolled?: boolean }) {
  const cuffPalette = rolled ? { ...palette, base: palette.light, shade: palette.base } : palette;
  return <g className="garment-bottom-hem">
    <path d="M92 280 C109 287 134 289 149 280 L148 286 C132 295 106 293 93 285 Z M172 280 C188 289 213 287 230 279 L229 285 C214 293 190 295 173 286 Z" fill={palette.shade} stroke={palette.edge} strokeWidth="1" />
    <GarmentSurface d="M91 274 C108 283 133 284 150 276 L148 283 C131 292 108 290 92 282 Z M171 276 C188 284 213 283 231 274 L230 282 C213 290 190 292 173 283 Z" palette={cuffPalette} />
    <path d="M95 276 C111 283 132 285 147 279 M175 279 C191 285 212 283 227 276" fill="none" stroke={palette.light} strokeWidth="1.05" strokeOpacity=".85" />
    {rolled && <path d="M96 282 C112 288 131 288 144 283 M177 283 C191 288 210 288 226 282" fill="none" stroke={palette.base} strokeWidth=".85" strokeDasharray="2 2.7" />}
  </g>;
}

function AnkleCuffs({ palette, ribbed = false }: { palette: GarmentPalette; ribbed?: boolean }) {
  return <g className="garment-bottom-hem">
    <path d="M98 296 C110 303 130 305 144 298 L142 303 C130 309 111 308 100 302 Z M177 298 C190 305 211 303 223 296 L222 302 C209 308 190 309 179 303 Z" fill={palette.shade} stroke={palette.edge} />
    <GarmentSurface d="M97 289 C110 297 132 298 146 291 L143 300 C129 306 111 305 99 298 Z M175 291 C189 298 210 297 224 289 L222 298 C210 305 191 306 178 300 Z" palette={palette} />
    <path d="M101 291 C112 297 131 299 142 294 M179 294 C190 299 209 297 220 291" fill="none" stroke={palette.light} strokeWidth="1" />
    {ribbed && <path d="M106 296 L107 301 M114 298 L114 303 M122 299 L122 304 M130 299 L130 303 M138 297 L137 301 M183 297 L184 301 M191 299 L191 303 M199 299 L199 304 M207 298 L207 303 M215 296 L214 301" fill="none" stroke={palette.shade} strokeWidth=".9" />}
  </g>;
}

function RearBottom({ palette, kind }: { palette: GarmentPalette; kind: 'short' | 'long' | 'skirt' | 'wide' }) {
  return <g aria-hidden="true" stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round">
    <path className="garment-bottom-waist" d="M98 229 C111 216 207 216 223 229 L226 240 C201 228 121 228 95 240 Z" fill={palette.shade} />
    <path d="M99 229 C126 218 194 218 222 229" fill="none" stroke={palette.light} strokeOpacity=".65" />
    {kind === 'skirt' ? <path className="garment-bottom-hem" d="M83 282 C112 269 211 269 239 282 C244 294 215 303 160 304 C106 303 78 294 83 282 Z" fill={palette.shade} />
      : kind === 'wide' ? <path className="garment-bottom-hem" d="M88 291 C104 283 133 285 149 294 C150 305 103 309 86 299 Z M172 294 C188 285 218 283 234 291 L236 299 C219 309 172 305 172 294 Z" fill={palette.shade} />
        : kind === 'long' ? <path className="garment-bottom-hem" d="M98 293 C108 285 136 286 147 294 C147 306 110 310 99 301 Z M175 294 C186 286 214 285 224 293 L223 301 C212 310 175 306 175 294 Z" fill={palette.shade} />
          : <path className="garment-bottom-hem" d="M91 274 C107 264 136 266 151 277 C152 289 110 296 92 284 Z M170 277 C184 266 214 264 231 274 L230 284 C212 296 170 289 170 277 Z" fill={palette.shade} />}
  </g>;
}

export function BottomItem({ itemId, layer = 'body' }: { itemId: string; layer?: BottomLayer }): ReactNode {
  if (layer === 'front' || layer === 'sleeve') return null;
  let graphic: ReactNode;
  let palette: GarmentPalette;
  let kind: 'short' | 'long' | 'skirt' | 'wide' = 'short';
  switch (itemId) {
    case 'bottom-denim':
      palette = garmentPalettes.denim;
      graphic = <>
        <GarmentSurface d={shorts} palette={palette} />
        <path d="M96 246 C91 259 93 270 97 277 M225 246 C231 259 229 270 225 277" fill="none" stroke={palette.shade} strokeWidth="2" strokeOpacity=".65" />
        <PocketSeams color="#C2C9B5" />
        <path d="M158 250 V270 Q164 273 168 266 M112 257 L125 259 L124 266" fill="none" stroke="#C4CAB7" strokeWidth="1.1" />
        <path d="M111 270 Q120 272 132 271 M190 271 Q201 272 210 270" fill="none" stroke={palette.light} strokeWidth="2" strokeOpacity=".6" />
        <ShortCuffs palette={palette} rolled />
        <Waistband palette={palette} /><BeltLoops color="#9CB0BD" />
        <g fill="#CDBD90" stroke="#5C665F" strokeWidth=".7"><circle cx="161" cy="246" r="2.15" /><circle cx="116" cy="253" r="1.3" /><circle cx="205" cy="253" r="1.3" /></g>
      </>;
      break;
    case 'bottom-chino':
      palette = garmentPalettes.sand;
      graphic = <>
        <GarmentSurface d={shorts} palette={palette} />
        <path d="M99 248 Q94 262 96 276 M222 248 Q228 262 225 276" fill="none" stroke={palette.shade} strokeOpacity=".6" />
        <PocketSeams color="#857A65" slanted />
        <path d="M128 254 Q124 265 124 278 M193 254 Q197 265 197 278 M160 251 V273" fill="none" stroke={palette.shade} strokeOpacity=".65" />
        <path d="M130 256 Q128 267 128 275 M191 256 Q193 267 193 275" fill="none" stroke={palette.light} strokeWidth="1.5" />
        <ShortCuffs palette={palette} />
        <Waistband palette={palette} /><BeltLoops color="#D3C5AA" />
        <circle cx="161" cy="246" r="2.1" fill="#736E5D" stroke="#E0D4BD" strokeWidth=".75" />
      </>;
      break;
    case 'bottom-cargo':
      palette = garmentPalettes.sage;
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C232 244 237 264 233 281 C218 293 188 293 173 285 C169 280 151 280 148 285 C132 294 103 293 88 281 C84 263 91 242 98 229 Z" palette={palette} />
        <path d="M128 251 L119 263 M193 251 L202 263 M160 252 V272" fill="none" stroke={palette.shade} />
        <ShortCuffs palette={palette} />
        <GarmentSurface d="M91 258 Q102 260 118 262 L118 281 Q107 286 90 280 Z M203 262 Q219 260 230 258 L231 280 Q214 286 203 281 Z" palette={{ ...palette, base: '#73877A', light: '#9FB3A2' }} />
        <path d="M90 256 Q105 260 119 259 L117 267 Q104 268 91 264 Z M202 259 Q217 260 231 256 L230 264 Q217 268 204 267 Z" fill="#A3B3A0" stroke={palette.edge} />
        <path d="M101 270 L100 279 M111 272 L111 281 M210 272 L210 281 M220 270 L221 279" fill="none" stroke={palette.light} strokeOpacity=".65" />
        <Waistband palette={palette} /><BeltLoops color="#A7B3A0" />
        <g fill="#4B6456" stroke="#BEC8B4" strokeWidth=".65"><circle cx="105" cy="264" r="1.7" /><circle cx="216" cy="264" r="1.7" /><circle cx="161" cy="246" r="2" /></g>
      </>;
      break;
    case 'bottom-training':
      palette = garmentPalettes.navy;
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C232 245 235 264 229 278 C213 290 187 289 173 281 C170 276 151 276 148 282 C133 290 107 290 92 278 C87 264 91 245 98 229 Z" palette={palette} />
        <path d="M99 244 C93 258 94 270 97 277 M222 244 C228 258 227 270 224 277" fill="none" stroke="#DDDACA" strokeWidth="3.1" />
        <path d="M105 246 C100 258 100 266 102 270 M216 246 C221 258 221 266 219 270" fill="none" stroke="#AABDC1" strokeWidth="1.1" />
        <path className="garment-bottom-hem" d="M94 278 C108 287 133 288 147 281 M174 281 C188 288 213 287 227 278" fill="none" stroke={palette.shade} strokeWidth="5.5" />
        <path d="M94 277 C109 285 132 286 147 280 M174 280 C189 286 212 285 227 277" fill="none" stroke="#D5D9CA" strokeWidth="1.55" />
        <path d="M126 262 L132 260 L138 262" fill="none" stroke="#D9E0D6" strokeWidth="1.6" />
        <Waistband palette={palette} elastic /><Drawstring />
      </>;
      break;
    case 'bottom-jogger':
      palette = garmentPalettes.grey;
      kind = 'long';
      graphic = <>
        <GarmentSurface d={trousers} palette={palette} />
        <PocketSeams color="#4C5B69" />
        <path d="M108 270 C105 276 107 284 111 289 M213 270 C216 276 214 284 210 289 M137 278 L140 289 M184 278 L181 289" fill="none" stroke={palette.shade} strokeOpacity=".7" />
        <path d="M114 273 Q111 280 116 289 M207 273 Q210 280 205 289" fill="none" stroke={palette.light} strokeWidth="1.7" strokeOpacity=".8" />
        <AnkleCuffs palette={{ ...palette, base: '#65717D', light: '#9AA5AC' }} ribbed />
        <Waistband palette={palette} elastic /><Drawstring />
      </>;
      break;
    case 'bottom-wide':
      palette = garmentPalettes.lavender;
      kind = 'wide';
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C232 248 232 276 236 297 C221 307 190 308 173 301 L171 286 C170 279 151 279 150 286 L148 301 C131 308 100 307 85 297 C89 276 89 248 98 229 Z" palette={palette} />
        <path d="M109 249 C103 262 102 281 99 297 M132 252 C124 267 124 287 121 302 M189 252 C197 267 197 287 200 302 M212 249 C218 262 219 281 222 297" fill="none" stroke={palette.shade} strokeOpacity=".65" strokeWidth="1.5" />
        <path d="M113 253 C108 267 109 286 106 298 M137 255 Q131 278 131 301 M184 255 Q190 278 190 301 M208 253 C213 267 212 286 215 298" fill="none" stroke={palette.light} strokeOpacity=".7" strokeWidth="2.4" />
        <path className="garment-bottom-hem" d="M87 294 C105 303 131 304 148 297 L148 302 C130 310 102 307 85 298 Z M173 297 C190 304 216 303 234 294 L236 298 C219 307 191 310 173 302 Z" fill={palette.shade} stroke={palette.edge} />
        <path d="M90 294 C108 301 132 302 145 297 M176 297 C189 302 213 301 231 294" fill="none" stroke={palette.light} strokeWidth="1.1" />
        <Waistband palette={palette} />
        <path d="M160 251 V273" fill="none" stroke={palette.shade} /><circle cx="161" cy="246" r="2" fill="#DCD1BA" stroke={palette.edge} strokeWidth=".7" />
      </>;
      break;
    case 'bottom-pajama':
      palette = garmentPalettes.mint;
      kind = 'long';
      graphic = <>
        <GarmentSurface d={trousers} palette={palette} />
        {/* The checks follow the round legs, with their edges bounded to the cloth. */}
        <g fill="#D0DFCE" fillOpacity=".65" stroke="none">
          <path d="M102 251 L118 254 L117 268 L95 264 Z M134 256 L150 257 L150 273 L132 271 Z M171 257 L187 256 L189 271 L172 273 Z M203 254 L220 251 L226 264 L204 268 Z" />
          <path d="M96 279 L116 282 L116 294 L101 291 Z M133 283 L147 280 L141 296 L131 297 Z M174 280 L188 283 L190 297 L180 296 Z M205 282 L226 279 L221 291 L205 294 Z" />
        </g>
        <path d="M123 253 Q120 275 123 299 M198 253 Q201 275 198 299 M95 272 C112 279 133 281 150 276 M172 276 C188 281 209 279 227 272" fill="none" stroke="#698D80" strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M109 254 Q106 271 109 288 M212 254 Q215 271 212 288" fill="none" stroke={palette.light} strokeOpacity=".6" strokeWidth="2" />
        <AnkleCuffs palette={palette} />
        <path d="M100 298 C112 304 131 305 141 300 M180 300 C190 305 209 304 221 298" fill="none" stroke="#E5E6CF" strokeWidth="2" />
        <Waistband palette={palette} elastic /><Drawstring color="#F0EBD7" />
      </>;
      break;
    case 'bottom-pleated':
      palette = { ...garmentPalettes.lavender, base: '#8E96AC', light: '#C2C8D5', shade: '#626E8A', edge: '#505D77' };
      kind = 'skirt';
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C230 244 238 263 243 282 C237 292 203 301 161 302 C119 301 84 292 78 282 C83 264 91 244 98 229 Z" palette={palette} />
        <path d="M105 244 C100 257 91 273 87 285 L104 290 C108 275 113 259 119 248 Z M131 250 C127 267 122 282 122 295 L141 298 C141 282 143 266 146 252 Z M170 252 C172 266 173 283 175 298 L194 295 C191 280 188 266 185 250 Z M202 248 C208 262 213 278 217 290 L235 285 C230 271 221 254 216 244 Z" fill={palette.shade} stroke="none" />
        <path d="M105 245 C100 259 92 274 88 284 M131 251 C127 266 123 284 123 294 M170 253 C172 268 173 284 175 297 M202 249 C208 263 213 279 217 289" fill="none" stroke={palette.light} strokeWidth="1.45" />
        <path className="garment-bottom-hem" d="M79 282 C100 293 130 300 161 300 C193 300 225 293 242 282 L241 287 C218 299 188 305 161 305 C130 305 99 298 80 287 Z" fill={palette.shade} stroke={palette.edge} />
        <path d="M83 283 C105 294 135 299 161 300 C188 299 219 294 238 283" fill="none" stroke={palette.light} strokeOpacity=".8" strokeWidth="1" />
        <Waistband palette={palette} />
      </>;
      break;
    case 'bottom-a-line':
      palette = { ...garmentPalettes.sand, base: '#ACA48F', light: '#D5CFB9', shade: '#777A6B', edge: '#626A61' };
      kind = 'skirt';
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C228 249 230 264 241 284 C233 295 202 303 161 303 C120 303 87 295 79 284 C91 264 92 249 98 229 Z" palette={palette} />
        <path d="M103 249 C101 264 95 277 91 285 C110 293 134 297 156 298" fill="none" stroke={palette.light} strokeWidth="1.8" strokeOpacity=".85" />
        <path d="M218 251 C222 264 223 278 231 286 C220 291 212 293 204 294" fill="none" stroke={palette.shade} strokeWidth="3.4" strokeOpacity=".65" />
        <path d="M160 251 V300 M113 256 Q114 275 135 270 M208 256 Q207 275 186 270" fill="none" stroke={palette.shade} strokeWidth="1.2" />
        <path d="M116 258 Q119 270 132 267 M205 258 Q202 270 189 267" fill="none" stroke={palette.light} strokeWidth="1" />
        <path className="garment-bottom-hem" d="M80 283 C99 295 133 301 161 301 C190 301 223 295 240 283 L239 288 C217 300 188 306 161 306 C131 306 100 300 81 288 Z" fill={palette.shade} stroke={palette.edge} />
        <path d="M85 285 C104 294 136 300 161 300 C187 300 219 294 235 285" fill="none" stroke={palette.light} strokeWidth="1.05" />
        <Waistband palette={palette} />
        <g fill="#DDD0AB" stroke="#7A7A64" strokeWidth=".75"><circle cx="161" cy="258" r="2" /><circle cx="161" cy="271" r="2" /><circle cx="161" cy="284" r="2" /></g>
      </>;
      break;
    case 'bottom-balloon':
      palette = garmentPalettes.cream;
      kind = 'long';
      graphic = <>
        <GarmentSurface d="M98 229 C128 240 192 240 223 229 C240 246 244 270 231 286 C224 296 207 302 183 297 L172 287 C170 279 151 279 148 287 L138 298 C114 303 96 297 89 286 C76 268 82 245 98 229 Z" palette={palette} />
        <path d="M107 248 C94 260 95 275 106 287 M126 252 C116 264 116 282 124 292 M195 252 C205 264 205 282 197 292 M214 248 C227 260 226 275 215 287" fill="none" stroke={palette.shade} strokeOpacity=".65" strokeWidth="1.4" />
        <path d="M112 250 C103 264 105 278 112 284 M131 254 C124 269 126 282 129 287 M190 254 C197 269 195 282 192 287 M209 250 C218 264 216 278 209 284" fill="none" stroke={palette.light} strokeWidth="2.4" strokeOpacity=".8" />
        <path d="M143 277 L138 289 M178 277 L183 289 M94 279 L103 287 M227 279 L218 287" fill="none" stroke={palette.shade} strokeWidth="1.2" />
        <AnkleCuffs palette={{ ...garmentPalettes.sand, base: '#AC9F85', light: '#D2C7AC' }} ribbed />
        <Waistband palette={palette} elastic />
        <path d="M159 251 V269" fill="none" stroke={palette.shade} /><circle cx="161" cy="246" r="2.1" fill="#8C816B" stroke="#E0D8BE" strokeWidth=".7" />
      </>;
      break;
    default:
      return null;
  }
  if (layer === 'back') return <RearBottom palette={palette} kind={kind} />;
  return <g aria-hidden="true" className="garment-bottom-body" stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">{graphic}</g>;
}
