import type { ReactNode } from 'react';
import { GarmentSurface } from './GarmentSurface';
import { garmentPalettes, type GarmentPalette } from './garmentPalette';

// A narrow front rim leaves the jelly leg visible above the opening.
function ShoeOpening({ left, right, y, palette }: {
  left: number; right: number; y: number; palette: GarmentPalette;
}) {
  const center = (left + right) / 2;
  return <g>
    <path d={`M${left} ${y} Q${center} ${y + 7} ${right} ${y} L${right - 1} ${y + 4} Q${center} ${y + 11} ${left + 1} ${y + 4} Z`} fill={palette.shade} fillOpacity=".84" stroke="none" />
    <path d={`M${left + 1} ${y + 1} Q${center} ${y + 8} ${right - 1} ${y + 1}`} fill="none" stroke={palette.light} strokeWidth="1.15" strokeOpacity=".8" />
  </g>;
}

/** The left shoe is drawn locally; mirroring gives a fitted pair, not an icon. */
function shoeGraphic(itemId: string): ReactNode {
  switch (itemId) {
    case 'shoes-low':
      return <>
        <GarmentSurface d="M103 289 Q115 296 136 289 L142 302 Q138 311 114 311 L96 309 Q91 301 98 296 Z" palette={garmentPalettes.cream} />
        <ShoeOpening left={103} right={136} y={289} palette={garmentPalettes.cream} />
        <path d="M97 299 Q106 295 115 302 L114 308 Q104 311 95 307 Z" fill="#EEE6D7" fillOpacity=".68" stroke="none" />
        <path d="M100 300 Q105 297 110 300" fill="none" stroke="#F5EFE2" strokeWidth="1.4" />
        <path d="M95 306 Q117 311 141 303 L141 310 Q119 317 96 312 Z" fill="#A6ABA9" />
        <path d="M113 293 L124 299 M108 296 L120 303" fill="none" stroke="#748185" strokeWidth="1.7" />
        <path d="M129 295 L133 302 M99 310 Q118 314 136 308" fill="none" stroke="#F7F1DE" />
      </>;
    case 'shoes-high':
      return <>
        <GarmentSurface d="M103 277 Q120 284 136 277 L140 299 Q147 306 138 311 Q116 316 96 310 Q91 302 101 296 Z" palette={garmentPalettes.denim} />
        <ShoeOpening left={103} right={136} y={277} palette={garmentPalettes.denim} />
        <path d="M105 283 Q120 290 134 283" fill="none" stroke="#A0B9CA" strokeWidth=".8" strokeOpacity=".6" />
        <path d="M98 300 Q107 297 115 304 L113 310 L95 309 Z" fill="#D6CDBA" stroke="none" />
        <path d="M100 301 Q105 299 110 302" fill="none" stroke="#EEE6D7" strokeWidth="1.3" />
        <path d="M95 307 Q117 314 141 305 L142 311 Q119 318 95 313 Z" fill="#B6BFC0" />
        <path d="M111 285 L122 288 M109 290 L121 293 M107 295 L119 298" fill="none" stroke="#E7E3D2" strokeWidth="1.7" />
        <circle cx="130" cy="297" r="4" fill="#A4B8C5" /><path d="M130 294 V300 M127 297 H133" stroke="#607A91" />
      </>;
    case 'shoes-running':
      return <>
        <GarmentSurface d="M104 286 Q114 293 132 287 L138 296 L146 301 Q147 308 136 310 L97 311 Q90 307 97 299 Z" palette={garmentPalettes.sage} />
        <ShoeOpening left={104} right={132} y={286} palette={garmentPalettes.sage} />
        <path d="M100 297 L112 294 L126 301 L138 295 L144 300 L132 307 L111 304 L95 307 Z" fill="#C4C7AF" />
        <path d="M95 306 Q113 309 144 301 L146 307 Q136 315 97 314 L93 310 Z" fill="#E1DECB" />
        <path d="M97 313 L137 313" stroke="#536970" strokeWidth="2.5" />
        <path d="M114 291 L122 295 M109 294 L118 299" stroke="#E4E2CD" strokeWidth="1.8" />
        <path d="M129 292 L134 294 M102 301 H106 M127 309 L136 307" stroke="#607A7C" strokeWidth="1.6" />
      </>;
    case 'shoes-loafer':
      return <>
        <GarmentSurface d="M104 293 Q119 298 135 290 L140 301 Q140 311 114 312 L96 310 Q90 300 104 293 Z" palette={garmentPalettes.sand} />
        <ShoeOpening left={108} right={135} y={291} palette={garmentPalettes.sand} />
        <path d="M101 298 Q113 292 124 300 L125 306 Q109 312 99 305 Z" fill="#9C8B75" fillOpacity=".64" stroke="none" />
        <path d="M103 299 Q111 296 117 300" fill="none" stroke="#E3D5BC" strokeOpacity=".7" />
        <path d="M99 304 Q105 311 122 306" fill="none" stroke="#D2BB9F" />
        <path d="M103 296 L123 298 L122 303 L101 301 Z" fill="#574E4B" />
        <path d="M110 299 H116" stroke="#C5B29B" strokeWidth="2" />
        <path d="M95 308 Q118 315 140 304 L139 311 Q119 318 96 313 Z" fill="#423F40" />
      </>;
    case 'shoes-mary-jane':
      return <>
        <GarmentSurface d="M101 298 Q113 293 123 298 Q133 296 136 288 L141 301 Q142 310 122 312 Q103 315 96 308 Q94 302 101 298 Z" palette={garmentPalettes.blush} />
        <path d="M113 295 Q128 302 136 289 L138 294 Q130 305 115 300 Z" fill="#594A59" fillOpacity=".65" stroke="none" />
        <path d="M110 292 Q119 299 134 291 L137 296 Q122 304 109 298 Z" fill="#C7A4A8" stroke="#79656E" />
        <path d="M112 294 Q120 300 132 294" fill="none" stroke="#DDC1BF" strokeWidth="1" />
        <rect x="127" y="291" width="7" height="6" rx="1.5" fill="#DCC9A0" /><path d="M131 292 V296" stroke="#826D69" />
        <path d="M100 302 Q105 298 113 301" fill="none" stroke="#DCC0C0" strokeWidth="2" />
        <path d="M97 309 Q117 316 140 303 L140 309 Q122 318 98 314 Z" fill="#635762" />
      </>;
    case 'shoes-ankle':
      return <>
        <GarmentSurface d="M102 274 Q119 281 136 274 L138 299 Q146 304 139 310 Q119 316 96 311 Q91 305 98 299 L104 296 Z" palette={garmentPalettes.sand} />
        <ShoeOpening left={102} right={136} y={274} palette={garmentPalettes.sand} />
        <path d="M104 279 Q119 285 134 279 L134 283 Q119 289 104 283 Z" fill="#BAAB91" stroke="none" />
        <path d="M128 285 L131 299" stroke="#554E4C" strokeWidth="2" /><path d="M130 286 L133 291" stroke="#D2BEA6" strokeWidth="2" />
        <path d="M103 300 Q109 298 117 302" fill="none" stroke="#C9B7A1" />
        <path d="M95 309 Q119 316 141 304 L141 312 L132 315 L128 312 Q111 317 96 314 Z" fill="#514A48" />
        <path d="M102 285 L104 293" stroke="#BDAA96" />
      </>;
    case 'shoes-rain':
      return <>
        <GarmentSurface d="M100 264 Q119 271 138 264 L137 294 Q148 300 142 309 Q125 317 97 313 Q89 307 96 301 L104 295 Z" palette={garmentPalettes.sage} />
        <ShoeOpening left={100} right={138} y={264} palette={garmentPalettes.sage} />
        <path d="M101 269 Q119 276 137 269 L137 274 Q119 281 101 274 Z" fill="#A4B29A" stroke="none" />
        <path d="M102 272 Q119 278 136 272" fill="none" stroke="#CFD9BF" strokeWidth=".9" />
        <path d="M130 276 V295" stroke="#858265" strokeWidth="3" /><path d="M108 278 L109 291 M101 303 Q109 298 119 303" fill="none" stroke="#E2D9B7" strokeWidth="2" />
        <path d="M95 309 Q120 316 144 303 L143 312 Q120 320 96 315 Z" fill="#72785E" />
        <path d="M99 312 L104 315 M111 314 V317 M121 314 V317 M131 312 L133 315" stroke="#A6AD8B" />
      </>;
    case 'shoes-sandal':
      return <>
        <GarmentSurface d="M101 299 Q118 296 136 296 Q146 302 139 309 Q122 317 99 313 Q90 308 101 299 Z" palette={garmentPalettes.sand} />
        <path d="M98 307 Q118 315 141 303 L141 309 Q121 318 98 313 Z" fill="#716E62" />
        <path d="M100 295 L107 292 L126 305 L121 310 Z M124 291 L133 291 L112 310 L105 306 Z" fill="#DDD2B9" />
        <path d="M135 288 Q146 298 137 304" fill="none" stroke="#C9BBA0" strokeWidth="5" />
        <rect x="130" y="291" width="7" height="5" rx="1" fill="#8A846D" /><path d="M133 291 V295" stroke="#E0D7BC" />
      </>;
    case 'shoes-slide':
      return <>
        <GarmentSurface d="M100 301 Q120 297 137 297 Q147 301 142 309 Q118 320 96 312 Q91 306 100 301 Z" palette={garmentPalettes.navy} />
        <path d="M100 302 Q112 298 126 307 L125 311 Q111 306 99 308 Z" fill="#2E3D50" fillOpacity=".8" stroke="none" />
        <GarmentSurface d="M99 299 Q104 288 118 291 L131 298 L125 309 Q113 301 99 305 Z" palette={garmentPalettes.mint} />
        <path d="M102 299 Q110 294 123 302 M106 294 Q116 293 126 300" fill="none" stroke="#DBE1D9" />
        <path d="M96 309 Q119 317 143 304 L142 311 Q120 321 97 314 Z" fill="#556676" />
        <path d="M130 302 L138 301" stroke="#9DADAF" />
      </>;
    case 'shoes-fuzzy':
      return <>
        <GarmentSurface d="M101 293 Q106 286 113 291 Q120 285 126 291 Q133 286 137 293 L141 301 Q149 307 138 312 Q117 320 96 312 Q89 308 94 301 Q93 295 101 293 Z" palette={garmentPalettes.blush} />
        <path d="M104 291 Q119 297 135 291 L136 296 Q121 303 103 297 Z" fill="#7F6674" stroke="none" />
        <path d="M102 293 Q106 291 111 295 Q116 294 120 296 Q125 294 130 295 Q134 291 137 294" fill="none" stroke="#DDC1BF" strokeWidth="3.5" />
        <path d="M98 301 L101 299 M108 297 L112 299 M120 300 L123 297 M131 303 L135 301 M104 307 L108 305 M118 308 L122 306" fill="none" stroke="#E5CFBB" strokeWidth="2" />
        <path d="M96 310 Q119 317 141 305 L140 312 Q119 320 97 315 Z" fill="#9E9085" />
      </>;
    default:
      return null;
  }
}

export function ShoeItem({ itemId }: { itemId: string }): ReactNode {
  const shoe = shoeGraphic(itemId);
  if (!shoe) return null;
  return <g aria-hidden="true" stroke="#58636A" strokeWidth="1.05" strokeLinejoin="round" strokeLinecap="round">
    {shoe}<g transform="translate(321 0) scale(-1 1)">{shoe}</g>
  </g>;
}
