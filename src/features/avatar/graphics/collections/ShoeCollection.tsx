import type { ReactNode } from 'react'
import type { OutfitLayer } from '../../components/AvatarOutfitLayers'
import { SHOE_DESIGNS, type ShoeDesignId, type ShoeShape } from '../../data/collections/shoeCollection'
import { GarmentSurface } from '../clothing/GarmentSurface'
import { garmentPalettes, type GarmentPalette } from '../clothing/garmentPalette'

// Draw a shaped left shoe, then mirror it around the jelly's centre for a fitted pair.
// A dark curved opening, a rounded toe and a separate outsole remain visible on every cut.
const cuts: Record<ShoeShape, { d: string; opening: number; left: number; right: number }> = {
  slipper: { d: 'M101 294 Q108 288 118 292 Q129 288 136 293 L141 301 Q147 307 138 312 Q116 319 96 311 Q89 304 96 298 Z', opening: 292, left: 104, right: 135 },
  clog: { d: 'M104 288 Q116 294 135 288 L139 298 Q148 306 138 312 Q117 319 96 312 Q88 306 95 297 Q99 291 104 288 Z', opening: 288, left: 105, right: 135 },
  flat: { d: 'M100 298 Q109 294 120 299 Q132 299 136 288 L141 301 Q143 310 123 314 Q103 316 96 309 Q92 303 100 298 Z', opening: 293, left: 112, right: 135 },
  sneaker: { d: 'M103 288 Q118 294 134 288 L139 298 Q147 302 141 310 Q120 317 97 311 Q90 305 97 297 Z', opening: 288, left: 104, right: 134 },
  runner: { d: 'M104 285 Q117 293 132 286 L139 297 L145 300 Q149 307 138 311 L98 313 Q89 309 95 300 Z', opening: 286, left: 105, right: 132 },
  high: { d: 'M103 275 Q119 283 136 275 L139 297 Q147 303 140 311 Q119 318 96 311 Q90 305 98 299 L103 295 Z', opening: 275, left: 103, right: 136 },
  boot: { d: 'M102 273 Q119 280 136 273 L137 296 Q149 302 140 312 Q117 318 96 312 Q89 306 97 299 L103 296 Z', opening: 273, left: 102, right: 136 },
  tall: { d: 'M101 263 Q119 270 137 263 L137 295 Q148 301 141 310 Q122 318 97 312 Q90 308 96 301 L103 296 Z', opening: 263, left: 101, right: 137 },
  loafer: { d: 'M104 292 Q119 298 135 290 L140 300 Q144 309 125 313 Q109 316 97 311 Q91 305 98 298 Z', opening: 292, left: 108, right: 135 },
  sandal: { d: 'M100 300 Q117 296 136 296 Q147 301 140 309 Q121 318 98 312 Q90 308 100 300 Z', opening: 298, left: 105, right: 136 },
  pointed: { d: 'M102 279 Q119 287 135 279 L137 297 Q145 306 136 311 Q113 317 96 309 Q86 302 89 293 Q94 301 102 295 Z', opening: 279, left: 103, right: 135 },
}

function Opening({ cut, p }: { cut: (typeof cuts)[ShoeShape]; p: GarmentPalette }) {
  const { left, right, opening: y } = cut
  const center = (left + right) / 2
  return <g className="garment-shoe-opening">
    <path d={`M${left} ${y} Q${center} ${y + 7} ${right} ${y} L${right} ${y + 4} Q${center} ${y + 12} ${left + 1} ${y + 4} Z`} fill={p.shade} stroke="none" />
    <path d={`M${left + 1} ${y + 1} Q${center} ${y + 8} ${right - 1} ${y + 1}`} fill="none" stroke={p.light} strokeWidth="1.2" />
  </g>
}

function Sole({ shape, p }: { shape: ShoeShape; p: GarmentPalette }) {
  const boot = shape === 'boot' || shape === 'tall'
  const sporty = ['sneaker', 'runner', 'high'].includes(shape)
  if (shape === 'pointed') return <path d="M89 299 Q99 318 139 305 L139 312 Q108 324 93 310 Z" fill={p.shade} />
  return <g className="garment-shoe-sole">
    <path d={boot ? 'M95 309 Q118 317 142 304 L142 313 L132 316 L128 312 Q110 319 96 315 Z' : 'M95 308 Q116 317 142 304 L142 311 Q120 321 96 314 Z'} fill={sporty ? '#CFD0C2' : p.shade} />
    <path d="M99 311 Q116 316 138 309" fill="none" stroke={sporty ? '#718085' : p.light} strokeOpacity=".7" strokeWidth=".9" />
  </g>
}

function Laces({ y = 291, color = '#E7E1CC', count = 3 }: { y?: number; color?: string; count?: number }) {
  return <g fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round">
    {Array.from({ length: count }, (_, index) => <path key={index} d={`M${112 - index * 1.8} ${y + index * 4} l11 3`} />)}
  </g>
}

function Bow({ x = 111, y = 299, color = '#DDC1BF' }: { x?: number; y?: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`} fill={color} stroke="#7D7179" strokeWidth=".65"><path d="M0 0 Q-10 -7 -10 -1 Q-10 5 -1 2 L-4 8 L0 7 L2 2 L5 8 L9 7 L4 1 Q12 4 12 -2 Q10 -8 2 -1 Z" /><circle cx="1" cy="1" r="2" /></g>
}

function Flower({ x, y, color = '#E9E0CE' }: { x: number; y: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`} fill={color} stroke="none"><ellipse cy="-3" rx="2" ry="3" /><ellipse cx="3" rx="3" ry="2" /><ellipse cx="1.8" cy="3" rx="2" ry="3" /><ellipse cx="-2" cy="3" rx="2" ry="3" /><ellipse cx="-3" rx="3" ry="2" /><circle r="1.6" fill="#BCA77E" /></g>
}

function Buckle({ x, y, width = 8 }: { x: number; y: number; width?: number }) {
  return <g fill="none" stroke="#D3C3A0" strokeWidth="1.7"><rect x={x} y={y} width={width} height="6" rx="1" /><path d={`M${x + width / 2} ${y + .7} v4.6`} /></g>
}

function ShoeDetails({ id, p }: { id: ShoeDesignId; p: GarmentPalette }): ReactNode {
  switch (id) {
    case 'shoes-bear-slipper':
      return <><g fill="#CBB795"><circle cx="101" cy="296" r="4.8" /><circle cx="119" cy="296" r="4.8" /><ellipse cx="109" cy="303" rx="13" ry="8" /></g><g fill="#655C52" stroke="none"><circle cx="104" cy="301" r="1.3" /><circle cx="115" cy="301" r="1.3" /><ellipse cx="109.5" cy="306" rx="2.8" ry="1.8" /></g><path d="M130 300 l3 -2 M127 308 l3 -2" stroke={p.light} strokeWidth="2" /></>
    case 'shoes-bunny-mule':
      return <><g fill="#E5DCCD" stroke="#9B9386"><path d="M103 300 Q96 282 101 282 Q106 280 108 299 Z M113 298 Q115 281 119 283 Q124 287 117 302 Z" /><ellipse cx="109" cy="305" rx="12" ry="7" /></g><path d="M102 286 L105 296 M118 286 L115 296" stroke="#C9B5B2" strokeWidth="1.6" /><g fill="#736C66" stroke="none"><circle cx="105" cy="304" r="1.2" /><circle cx="114" cy="304" r="1.2" /><circle cx="109.5" cy="308" r="1" /></g></>
    case 'shoes-quilt-camp':
      return <><path d="M99 296 L113 310 M107 293 L125 309 M122 296 L135 306 M98 305 L109 294 M108 310 L122 297 M121 310 L135 299" fill="none" stroke="#B9C9B5" strokeWidth="1.1" /><path d="M127 292 L137 297 L135 306 L125 302 Z" fill="#536C62" /><path d="M131 295 L132 302" stroke="#D6D9C1" strokeWidth="1.4" /></>
    case 'shoes-cable-bootie':
      return <><path d="M103 279 Q120 287 135 279 L135 287 Q121 295 103 287 Z" fill="#C3B79E" /><path d="M108 282 v7 M115 284 v7 M122 284 v7 M129 282 v7" stroke="#8B8577" strokeWidth="1.1" /><path d="M107 292 q-5 4 0 7 q5 4 0 7 M113 292 q5 4 0 7 q-5 4 0 7 M125 292 q-4 4 0 7 q4 4 0 7" fill="none" stroke="#A0947E" /><path d="M98 305 Q112 314 136 305" stroke="#EFE7D4" strokeWidth="1.5" fill="none" /></>
    case 'shoes-cloud-clog':
      return <><path d="M96 301 Q99 295 105 298 Q110 291 116 298 Q123 295 127 302 L128 309 Q108 315 96 307 Z" fill="#DEE4D5" stroke="#A1B6A8" /><g fill="#65877B" stroke="none"><ellipse cx="108" cy="301" rx="1.6" ry="1.1" /><ellipse cx="116" cy="301" rx="1.6" ry="1.1" /><ellipse cx="112" cy="306" rx="1.6" ry="1.1" /></g><path d="M131 292 Q143 292 140 301" fill="none" stroke="#B4C9B7" strokeWidth="3" /></>
    case 'shoes-felt-moccasin':
      return <><path d="M101 299 Q111 293 124 301 L125 306 Q109 313 98 306 Z" fill="#B5A58C" stroke="#E0D2B3" strokeDasharray="2 2" /><path d="M104 297 L123 300 L120 306 L117 303 L114 306 L112 302 L108 305 L108 301 L103 302 Z" fill="#8B7E67" /><path d="M128 296 Q140 295 137 304" stroke="#E4D5B7" fill="none" strokeWidth="1.2" /></>
    case 'shoes-patchwork-home':
      return <><path d="M99 296 L112 299 L109 312 Q99 314 96 307 Z" fill="#C4B8C3" /><path d="M112 299 L123 297 L128 309 L110 312 Z" fill="#A8BFB3" /><path d="M125 298 L137 294 L142 305 L130 310 Z" fill="#D8CBB6" /><path d="M111 299 L109 310 M125 300 L130 308 M99 307 L104 305 M116 303 L121 306" fill="none" stroke="#6F7A77" strokeDasharray="1.5 1.8" strokeWidth="1.2" /></>
    case 'shoes-toast-socks':
      return <><path d="M104 281 Q119 289 135 281 M104 285 Q119 293 135 285" stroke="#A6977D" strokeWidth="1.8" fill="none" /><path d="M103 300 Q100 292 106 292 Q111 287 117 294 Q125 293 122 302 L122 308 Q111 313 101 307 Z" fill="#BBA17D" /><path d="M105 301 Q103 296 108 296 Q112 292 116 297 Q121 296 119 302 L119 306 Q112 309 104 306 Z" fill="#E6D5B2" stroke="none" /><path d="M131 292 L133 301" stroke="#CAC1AD" strokeWidth="1.5" /></>
    case 'shoes-ballet-ribbon':
      return <><path d="M105 283 Q117 291 135 285 M105 287 Q119 281 134 291" fill="none" stroke="#C3A3AB" strokeWidth="2.8" /><path d="M106 286 L111 299 M133 289 L125 302" fill="none" stroke="#DCC1C1" strokeWidth="2.2" /><path d="M98 304 Q106 298 116 303" stroke="#E5CFCB" strokeWidth="1.4" fill="none" /><Bow x={109} y={301} /></>
    case 'shoes-pearl-strap':
      return <><path d="M109 296 Q121 304 135 294" fill="none" stroke="#BFC6C3" strokeWidth="2" /><g fill="#E8DFC7" stroke="#9A9C91" strokeWidth=".5">{[0, 1, 2, 3, 4, 5].map(i => <circle key={i} cx={110 + i * 4.6} cy={297 + Math.sin(i / 5 * Math.PI) * 3} r="1.75" />)}</g><path d="M99 303 Q104 300 111 303" stroke="#A8B7BF" strokeWidth="1.6" fill="none" /><circle cx="135" cy="294" r="2.5" fill="#C7B797" /></>
    case 'shoes-daisy-canvas':
      return <><path d="M97 300 Q107 295 115 303 L113 310 Q102 313 95 306 Z" fill="#D1C5B0" /><Laces y={293} count={2} color="#8D958E" /><Flower x={130} y={300} /><path d="M96 307 Q103 311 112 309" stroke="#F4EBD8" strokeWidth="1.5" fill="none" /></>
    case 'shoes-lace-boot':
      return <><path d="M103 279 q3 5 6 1 q3 5 6 1 q3 5 6 0 q3 5 6 -1 q3 4 6 -1" fill="none" stroke="#EFE4D1" strokeWidth="2.5" /><path d="M108 284 L107 299 M123 284 L119 300" stroke="#7C7465" fill="none" /><path d="M109 285 L121 290 L108 293 L120 298 L107 300" fill="none" stroke="#E1D3B8" strokeWidth="1.4" /><Bow x={114} y={285} color="#DCCBBD" /><path d="M99 305 Q106 301 113 305" stroke={p.light} strokeWidth="1.5" fill="none" /></>
    case 'shoes-petal-sandal':
      return <><path d="M102 295 L108 293 L127 308 L121 312 Z M126 291 L133 293 L111 311 L105 307 Z" fill="#C9BCCD" /><path d="M134 290 Q144 298 138 304" fill="none" stroke="#D7C9D2" strokeWidth="4" /><g transform="translate(114 301)" fill="#D9CDDA"><path d="M0 0 Q-9 -9 -10 -2 Q-10 5 0 3 Q3 13 8 8 Q12 2 3 0 Q13 -7 7 -9 Q1 -11 0 0 Z" /></g><circle cx="115" cy="302" r="2" fill="#B5A079" /></>
    case 'shoes-heart-penny':
      return <><path d="M101 299 Q112 294 125 301 L123 307 Q108 314 99 306 Z" fill="#A17E8A" stroke="#D9BFC0" strokeWidth=".8" /><path d="M102 298 L126 300 L124 306 L101 303 Z" fill="#755E6E" /><path d="M114 301 C109 296 107 302 114 306 C122 302 119 297 114 301 Z" fill="#D8B3B9" stroke="#E6CECA" strokeWidth=".6" /></>
    case 'shoes-scallop-flat':
      return <><path d="M109 297 q3 5 6 2 q4 5 7 1 q5 2 7 -3 q6 1 8 -5" fill="none" stroke="#D5DFCD" strokeWidth="2.8" /><path d="M99 304 Q109 298 118 305" stroke="#CBD9C8" strokeWidth="1.2" fill="none" /><path d="M103 305 l2 2 M111 303 l2 2" stroke="#D5DFCD" strokeWidth="1.1" /><circle cx="132" cy="297" r="2" fill="#CABB97" /></>
    case 'shoes-rose-mary':
      return <><path d="M109 292 Q121 302 135 292 L137 297 Q122 307 109 298 Z M106 299 Q116 307 131 301 L131 306 Q116 312 105 305 Z" fill="#6F7A87" /><Buckle x={128} y={291} width={7} /><g transform="translate(107 301)" fill="#BD9BA7" stroke="#806875" strokeWidth=".7"><path d="M0 -5 Q5 -6 6 -1 Q9 3 5 6 Q1 8 -2 4 Q-7 4 -6 0 Q-5 -5 0 -5 Z" /><path d="M-2 -1 Q3 -4 3 0 Q4 3 0 3 Q-3 3 -2 -1 Z" fill="#D5B8BF" /></g></>
    case 'shoes-skate-gum':
      return <><path d="M96 308 Q117 316 142 304 L142 312 Q120 321 96 315 Z" fill="#9D8B6C" /><path d="M99 297 L111 298 L114 306 L99 308 Z" fill="#777F86" /><path d="M124 295 L136 293 L139 299 L126 307 L119 304 Z" fill="#D7D5C3" /><Laces y={291} count={3} /><path d="M99 313 Q117 317 136 311" stroke="#5F6157" strokeWidth=".9" fill="none" /></>
    case 'shoes-trail-toggle':
      return <><path d="M98 298 L112 295 L126 302 L138 295 L145 300 L132 309 L110 304 L94 308 Z" fill="#BBC6B3" /><path d="M112 290 L119 298 L108 300 L122 302" fill="none" stroke="#425E56" strokeWidth="1.4" /><rect x="116" y="295" width="7" height="4" rx="1.5" fill="#D7D9C5" /><path d="M98 311 l3 5 M109 313 v4 M121 313 v4 M133 310 l2 5" stroke="#4E655D" strokeWidth="2.5" /><path d="M130 290 L133 294" stroke="#C8BE92" strokeWidth="2" /></>
    case 'shoes-court-strap':
      return <><path d="M103 293 Q113 291 127 297 L125 302 Q113 298 101 299 Z M101 299 Q112 297 124 303 L122 308 Q110 303 99 305 Z" fill="#C3C7BC" /><path d="M104 295 L123 299 M102 301 L120 305" stroke="#F1ECD9" strokeWidth="1.3" /><path d="M130 291 L137 296 L138 303 L132 305 Z" fill="#799096" /><path d="M97 305 Q102 309 110 310" fill="none" stroke="#A9B2AB" /></>
    case 'shoes-tech-sock':
      return <><path d="M104 281 Q119 290 135 281 L136 293 Q119 300 102 291 Z" fill="#424F5E" /><path d="M108 283 V293 M114 286 V295 M121 287 V296 M128 285 V294" stroke="#8F9DA3" strokeWidth="1" /><path d="M99 300 L111 295 L122 303 L137 297 L143 303 L130 311 L111 306 L96 309 Z" fill="#AEBBBC" /><path d="M126 303 L131 300 L136 303" fill="none" stroke="#E0E2D1" strokeWidth="1.6" /><path d="M131 274 L134 269 L138 270 L136 278" fill="none" stroke="#667988" strokeWidth="2.3" /></>
    case 'shoes-basket-high':
      return <><path d="M104 281 L112 285 L109 300 L100 300 Z M126 284 L136 280 L138 298 L127 304 L120 298 Z" fill="#D4D6C7" /><path d="M129 287 L136 286 L137 293 L129 297 Z" fill="#496886" /><path d="M97 301 Q106 296 114 303 L112 311 L95 307 Z" fill="#A1B5C0" /><Laces y={284} count={4} color="#E3E4D4" /><path d="M130 299 l2 2 3 -3" stroke="#7E929F" strokeWidth="1.5" fill="none" /></>
    case 'shoes-lug-combat':
      return <><path d="M104 279 L110 282 L107 300 M124 282 L121 302" fill="none" stroke="#909BA0" strokeWidth="1" /><Laces y={281} count={5} color="#AAB2AF" /><path d="M128 282 V298" stroke="#232D39" strokeWidth="3" /><path d="M96 312 l4 5 M107 314 v5 M119 314 v4 M133 312 l2 5 M141 307 v6" stroke="#343F49" strokeWidth="3" /><path d="M98 305 Q107 301 117 306" stroke="#839199" fill="none" /></>
    case 'shoes-webbing-sport':
      return <><path d="M99 296 L106 293 L127 307 L122 312 Z M125 291 L133 291 L110 312 L103 308 Z" fill="#95AAA9" /><path d="M135 289 Q147 296 139 305" stroke="#718B92" strokeWidth="5" fill="none" /><path d="M101 297 L123 309 M128 292 L107 310" stroke="#D0D7C4" strokeWidth=".9" strokeDasharray="2 2" /><Buckle x={129} y={291} width={7} /><path d="M98 312 v3 M109 315 v3 M121 314 v3 M134 310 l1 4" stroke="#3E535F" strokeWidth="2.2" /></>
    case 'shoes-retro-track':
      return <><path d="M99 298 Q106 293 114 298 L109 308 L95 306 Z" fill="#C6D1BC" /><path d="M128 292 L135 294 L123 307 L119 306 Z M136 295 L141 299 L130 309 L126 308 Z" fill="#DDE1CC" /><Laces y={290} count={3} color="#526E6E" /><path d="M98 311 Q111 316 141 306" stroke="#5D7878" strokeWidth="2.4" fill="none" /></>
    case 'shoes-oxford-wing':
      return <><path d="M98 302 Q106 294 114 301 L119 298 L125 306 Q110 314 98 307 Z" fill="#8B7A65" /><path d="M99 303 Q106 297 114 304 L119 301 L122 306" fill="none" stroke="#D7C6AA" strokeDasharray="1 2" strokeWidth="1" /><Laces y={294} count={2} color="#5C574E" /><path d="M129 296 L137 302" stroke="#D7C6AA" strokeDasharray="1 2" /></>
    case 'shoes-tassel':
      return <><path d="M100 301 Q111 294 126 302 L124 308 Q109 315 98 307 Z" fill="#5F6976" stroke="#ABB3B4" strokeWidth=".8" /><path d="M103 298 Q116 302 127 298" fill="none" stroke="#ACA89A" strokeWidth="1.6" /><path d="M110 299 L107 304 L107 308 L112 310 L114 306 L112 300 M118 300 L116 305 L117 309 L122 310 L123 306 L121 300" fill="#9C9584" /><path d="M109 305 L110 308 M119 306 L120 309" stroke="#5F625E" /></>
    case 'shoes-sailor-deck':
      return <><path d="M98 301 Q111 294 125 301 L124 307 Q109 313 97 306 Z" fill="#71899A" stroke="#D7D9C5" strokeDasharray="2 2" /><path d="M109 292 L123 300 M106 296 L118 302 M129 293 Q137 291 138 300" fill="none" stroke="#D9D7BD" strokeWidth="1.4" /><circle cx="130" cy="295" r="1.4" fill="#B9A87D" /><circle cx="135" cy="294" r="1.4" fill="#B9A87D" /><path d="M96 310 Q118 318 141 307" stroke="#F0E7D2" strokeWidth="1.4" fill="none" /></>
    case 'shoes-academy-buckle':
      return <><path d="M110 291 Q121 301 135 291 L138 298 Q123 309 108 298 Z" fill="#697686" /><Buckle x={125} y={292} width={10} /><path d="M99 302 Q109 297 118 304 L117 309 Q106 313 98 307 Z" fill="#414E5D" stroke="#8E9DA4" strokeWidth=".8" /><path d="M101 302 L105 301" stroke="#BDC5C2" strokeWidth="1.3" /></>
    case 'shoes-chelsea':
      return <><path d="M123 282 L134 280 L135 297 L126 302 Z" fill="#645D51" /><path d="M126 284 L129 297 M129 283 L132 296 M132 282 L134 293" stroke="#A99B80" strokeWidth=".9" /><path d="M129 274 L130 268 L134 268 L135 275" stroke="#8B7C66" strokeWidth="2.4" fill="none" /><path d="M104 283 L106 297 M99 304 Q107 299 116 304" fill="none" stroke="#E0CFAD" strokeWidth="1.1" /></>
    case 'shoes-spectator':
      return <><path d="M97 300 Q106 296 113 301 L114 310 Q104 314 97 308 Z M125 294 L135 291 L140 303 L127 310 L122 305 Z" fill="#64646A" /><path d="M100 301 Q106 299 110 303 M129 296 L135 303" stroke="#CCC6B7" strokeDasharray="1 2" strokeWidth="1" fill="none" /><Laces y={294} count={2} color="#655E54" /><path d="M114 307 L123 307" stroke="#B3AA95" strokeWidth=".8" /></>
    case 'shoes-penny-kilt':
      return <><path d="M104 296 L127 300 L124 309 L121 306 L118 311 L116 307 L112 310 L111 306 L107 309 L107 304 L103 306 Z" fill="#A1A8A6" /><path d="M103 296 L127 299 L126 303 L103 300 Z" fill="#344C61" /><path d="M113 299 L119 300" stroke="#D0C8AE" strokeWidth="1.8" /><path d="M99 306 Q108 313 124 309" fill="none" stroke="#8FA3AD" strokeWidth=".9" /></>
    case 'shoes-riding':
      return <><path d="M102 268 Q119 276 136 268 L136 275 Q119 283 102 275 Z" fill="#7A7B7D" /><path d="M130 278 L131 299" stroke="#273544" strokeWidth="2" /><path d="M105 295 Q120 302 137 295 L138 301 Q121 307 103 301 Z" fill="#777B7B" /><Buckle x={127} y={296} width={8} /><path d="M108 279 L109 290 M99 305 Q107 300 116 305" fill="none" stroke="#A7ADAA" strokeWidth="1.1" /></>
    case 'shoes-fern-fairy':
      return <><path d="M103 285 Q112 289 120 283 L115 298 L107 292 L101 299 Z M120 284 Q127 288 135 284 L132 298 L125 293 L119 301 Z" fill="#B8CBB1" /><path d="M101 300 Q95 299 91 295 Q92 304 104 306" fill="#B2C3A8" /><path d="M109 289 L110 299 M126 290 L126 299 M97 302 L105 304" fill="none" stroke="#66836A" strokeWidth="1" /><path d="M116 302 Q122 306 130 302" stroke="#D4DBC3" strokeWidth="1.2" fill="none" /></>
    case 'shoes-moon-wizard':
      return <><path d="M103 285 Q119 293 135 285 L136 290 Q120 298 103 290 Z" fill="#8E91A5" /><path d="M127 294 A5 5 0 1 0 131 303 A5 5 0 0 1 127 294 Z" fill="#DFD0A8" stroke="none" /><path d="M102 298 Q96 300 92 296" stroke="#C3B994" strokeWidth="1.4" fill="none" /><circle cx="92" cy="295" r="2.2" fill="#C9BB96" /><path d="M109 298 l1 -3 1 3 3 1 -3 1 -1 3 -1 -3 -3 -1 Z" fill="#CFC5A3" stroke="none" /></>
    case 'shoes-ranger-lace':
      return <><path d="M103 280 Q119 286 135 279 L135 284 Q119 292 103 286 Z" fill="#7D8870" /><Laces y={287} count={4} color="#DCCDAC" /><path d="M128 288 L135 286 L136 299 L129 303 Z" fill="#71816B" /><path d="M99 304 Q108 299 117 305" stroke="#E3D1B0" fill="none" strokeWidth="1.2" /><path d="M98 313 l3 3 M109 315 v3 M122 314 v3 M135 311 l1 4" stroke="#6E6A55" strokeWidth="2" /></>
    case 'shoes-star-button':
      return <><path d="M110 293 Q122 303 135 292 L137 297 Q124 308 109 299 Z" fill="#C2BACB" /><path d="M130 290 l2 3 4 1 -3 3 1 4 -4 -2 -3 2 1 -4 -3 -3 4 -1 Z" fill="#DCCAA1" stroke="#958D7D" strokeWidth=".65" /><path d="M99 303 Q108 299 116 305" stroke="#E1D7DE" strokeWidth="1.5" fill="none" /><circle cx="104" cy="307" r="1" fill="#E5D6B5" /><circle cx="115" cy="307" r=".8" fill="#E5D6B5" /></>
    case 'shoes-mushroom-clog':
      return <><path d="M96 300 Q101 290 115 293 Q127 294 131 306 Q112 313 96 307 Z" fill="#B8959D" /><g fill="#F0E3CF" stroke="none"><ellipse cx="103" cy="300" rx="3.5" ry="2.4" /><ellipse cx="115" cy="297" rx="3.3" ry="2.2" /><ellipse cx="121" cy="305" rx="3.7" ry="2.4" /><circle cx="108" cy="307" r="1.8" /></g><path d="M130 292 Q142 293 139 301" fill="none" stroke="#D3C6AD" strokeWidth="4" /><path d="M96 311 Q116 320 140 308" stroke="#CCB89A" strokeWidth="2" fill="none" /></>
    case 'shoes-knight-sabatons':
      return <><path d="M103 279 Q119 286 135 279 L135 286 L120 292 L104 286 Z" fill="#A1AFB5" /><path d="M106 289 Q121 294 136 287 L138 294 Q121 304 103 296 Z M102 297 Q121 302 138 295 L140 301 Q119 311 99 304 Z M98 304 Q117 312 140 302 L141 308 Q116 319 96 310 Z" fill="#B4BEC1" stroke="#697C8A" /><path d="M109 282 L130 283 M107 293 L130 295 M101 308 Q111 311 119 309" stroke="#E0E1D5" strokeWidth="1.1" fill="none" /></>
    case 'shoes-cloud-aviator':
      return <><path d="M102 269 q4 -2 7 3 q4 -2 7 1 q4 -2 7 0 q4 -3 7 -2 l5 -2 v7 q-16 9 -33 0 Z" fill="#D4D8C8" /><path d="M106 282 L111 299 M124 282 L121 301" stroke="#C3CFC7" fill="none" strokeWidth="2" /><path d="M104 291 Q120 299 136 290 L137 295 Q120 303 103 296 Z" fill="#738C9D" /><Buckle x={125} y={291} width={9} /><path d="M99 306 Q105 301 113 305" stroke="#B9C8CA" strokeWidth="1.5" fill="none" /></>
    case 'shoes-treasure-buckle':
      return <><path d="M101 279 Q118 288 137 278 L140 286 Q121 297 101 287 Z" fill="#8D8990" /><path d="M105 293 Q121 301 136 291 L138 298 Q122 309 103 300 Z" fill="#8B7E79" /><Buckle x={121} y={295} width={12} /><path d="M99 305 Q106 300 115 305" fill="none" stroke="#B4ACA0" strokeWidth="1.1" /><path d="M107 280 L109 286 M132 281 L133 286" stroke="#D0C2A2" strokeWidth="1" /><circle cx="106" cy="296" r="1.2" fill="#D4C4A0" /></>
  }
}

export function ShoeCollectionGraphic({ itemId, layer }: { itemId: string; layer: OutfitLayer; drinking?: boolean }): ReactNode {
  const design = SHOE_DESIGNS.find(item => item.id === itemId)
  if (!design || layer !== 'body') return null
  const p = garmentPalettes[design.fabric]
  const cut = cuts[design.shape]
  const shoe = <>
    <GarmentSurface d={cut.d} palette={p} />
    <Opening cut={cut} p={p} />
    <Sole shape={design.shape} p={p} />
    <ShoeDetails id={design.id} p={p} />
  </>
  return <g aria-hidden="true" className="garment-shoes" stroke={p.edge} strokeWidth="1.05" strokeLinejoin="round" strokeLinecap="round">
    {shoe}<g transform="translate(321 0) scale(-1 1)">{shoe}</g>
  </g>
}
