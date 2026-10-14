import type { ReactNode } from 'react';

const edge = '#565D68';
const shorts = 'M100 238 Q160 249 221 238 Q228 257 226 277 Q204 288 178 279 L169 267 Q160 270 151 267 L143 280 Q119 288 95 276 Q93 259 100 238 Z';
const trousers = 'M100 238 Q160 249 221 238 Q231 261 226 283 L222 300 Q202 311 180 299 L171 277 Q160 273 149 277 L140 301 Q120 312 98 299 L94 281 Q91 260 100 238 Z';

function Waistband({ fill = '#747B82' }: { fill?: string }) {
  return <path d="M100 238 Q160 249 221 238 L224 248 Q160 258 97 248 Z" fill={fill} />;
}

function Drawstring({ color = '#E2DCCF' }: { color?: string }) {
  return <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
    <path d="M160 251 Q145 244 149 252 Q151 256 160 252 Q173 244 173 251 Q171 256 160 252 M158 253 L154 264 M162 253 L166 263" />
  </g>;
}

function PocketSeams({ color }: { color: string }) {
  return <path d="M116 251 Q115 265 101 267 M204 251 Q205 265 220 267" fill="none" stroke={color} />;
}

export function BottomItem({ itemId }: { itemId: string }): ReactNode {
  let graphic: ReactNode;
  switch (itemId) {
    case 'bottom-denim':
      graphic = <>
        <path d={shorts} fill="#6688A9" />
        <Waistband fill="#526F90" />
        <path d="M98 270 Q120 278 146 271 L143 281 Q119 290 95 278 Z M174 271 Q200 278 225 270 L227 278 Q201 290 177 281 Z" fill="#91ABC1" />
        <PocketSeams color="#C3D0D0" />
        <path d="M158 250 V266 Q164 268 167 263 M110 242 L108 251 M134 246 V254 M187 246 V254 M211 242 L213 251" fill="none" stroke="#B3C6CE" />
        <path d="M99 274 Q121 282 143 276 M179 276 Q201 282 224 274" fill="none" stroke="#D3DCDB" strokeDasharray="2 3" />
        <circle cx="161" cy="249" r="2.2" fill="#D5C199" /><circle cx="114" cy="252" r="1.3" fill="#D5C199" /><circle cx="206" cy="252" r="1.3" fill="#D5C199" />
      </>;
      break;
    case 'bottom-chino':
      graphic = <>
        <path d="M99 239 Q160 249 222 239 L227 278 Q204 285 178 279 L168 267 H152 L143 280 Q119 286 94 278 Z" fill="#C3B497" />
        <Waistband fill="#B6A68A" />
        <path d="M114 251 L103 268 M206 251 L217 268 M160 251 V267 M113 273 L140 275 M180 275 L214 273" fill="none" stroke="#8C836F" />
        <path d="M106 243 L105 250 M135 247 V253 M185 247 V253 M214 243 L215 250" fill="none" stroke="#E1D5BA" strokeWidth="3" />
        <path d="M98 275 Q121 282 142 277 M179 277 Q203 282 223 275" fill="none" stroke="#E6D9BE" />
        <circle cx="162" cy="249" r="2" fill="#726D62" />
      </>;
      break;
    case 'bottom-cargo':
      graphic = <>
        <path d="M100 238 Q160 249 221 238 L229 277 Q208 287 179 280 L169 268 H152 L143 281 Q115 288 92 277 Z" fill="#879184" />
        <Waistband fill="#687566" />
        <path d="M94 256 L116 258 L117 278 Q105 283 92 278 Z M204 258 L227 256 L229 278 Q216 283 203 278 Z" fill="#758170" />
        <path d="M93 255 L117 257 L115 266 L95 264 Z M203 257 L227 255 L226 264 L205 266 Z" fill="#A4AD99" />
        <path d="M129 252 L122 262 M192 252 L198 262 M159 252 V265 M103 270 L109 271 M211 271 L218 270" fill="none" stroke="#CBD0B9" />
        <circle cx="105" cy="261" r="1.6" fill="#4F5E50" /><circle cx="215" cy="261" r="1.6" fill="#4F5E50" /><circle cx="162" cy="249" r="1.8" fill="#C6C6AD" />
      </>;
      break;
    case 'bottom-training':
      graphic = <>
        <path d="M100 239 Q160 249 221 239 Q229 252 225 272 Q201 286 177 276 L168 263 H152 L143 277 Q116 286 94 271 Q92 253 100 239 Z" fill="#566575" />
        <Waistband fill="#405064" />
        <path d="M99 248 L98 268 Q117 280 143 272 M221 248 L222 268 Q202 280 177 272" fill="none" stroke="#E2D8C8" strokeWidth="3" />
        <path d="M106 253 L102 266 M214 253 L218 266" stroke="#ACB8BC" strokeWidth="2" />
        <Drawstring />
        <path d="M126 261 H136" stroke="#C5CBD0" strokeWidth="2" />
      </>;
      break;
    case 'bottom-jogger':
      graphic = <>
        <path d={trousers} fill="#727B86" />
        <Waistband fill="#596370" />
        <path d="M98 289 Q118 299 144 290 L140 301 Q119 313 99 300 Z M177 290 Q201 299 224 289 L222 300 Q200 312 181 300 Z" fill="#505D6B" />
        <PocketSeams color="#A9B1B7" /><Drawstring />
        <path d="M116 271 L112 287 M205 271 L209 287 M102 296 L139 297 M182 297 L218 296" fill="none" stroke="#9BA5AD" />
      </>;
      break;
    case 'bottom-wide':
      graphic = <>
        <path d="M100 239 Q160 249 221 239 Q230 267 233 301 Q208 312 174 302 L170 275 Q160 271 150 275 L146 303 Q116 312 88 301 Q91 267 100 239 Z" fill="#A6A2B0" />
        <Waistband fill="#8C8799" />
        <path d="M130 254 L119 299 M190 254 L201 299 M159 252 V270 M98 296 Q120 303 143 298 M177 298 Q204 303 225 296" fill="none" stroke="#D3CFD7" />
        <path d="M109 251 L103 265 M211 251 L217 265" fill="none" stroke="#787483" />
        <path d="M144 278 L139 298 M176 278 L181 298" stroke="#757180" strokeOpacity=".4" />
        <circle cx="161" cy="250" r="2" fill="#E1D8C7" />
      </>;
      break;
    case 'bottom-pajama':
      graphic = <>
        <path d={trousers} fill="#A8B7B1" />
        {/* Bounded individual checks avoid a global pattern or clipping ID. */}
        <g stroke="none" fill="#D0D6C8">
          <path d="M104 252 L120 254 V267 L98 264 Z M137 256 L152 257 V270 L136 269 Z M169 257 L184 256 L185 269 L170 270 Z M201 254 L220 251 L224 264 L202 267 Z" />
          <path d="M97 280 L120 282 V295 L99 291 Z M136 282 L146 280 L141 294 L136 295 Z M174 280 L186 282 V295 L181 293 Z M202 282 L225 278 L222 291 L202 295 Z" />
        </g>
        <path d="M123 254 V300 M197 254 V299 M99 271 Q124 277 149 274 M172 274 Q202 277 225 271 M99 295 Q121 302 141 296 M180 296 Q200 302 222 295" fill="none" stroke="#6D8681" strokeWidth="2" />
        <Waistband fill="#879E96" /><Drawstring color="#EBE7D7" />
        <path d="M99 299 Q119 310 140 300 M181 300 Q200 310 222 299" stroke="#D9DFCF" strokeWidth="3" fill="none" />
      </>;
      break;
    case 'bottom-pleated':
      graphic = <>
        <path d="M101 239 Q160 250 220 239 L241 283 Q164 307 80 283 Z" fill="#9C9EB5" />
        <path d="M108 249 L91 283 L111 288 L122 252 M135 253 L128 291 L148 294 L149 255 M169 255 L173 294 L192 292 L185 253 M200 252 L211 289 L230 284 L214 250" fill="#777D99" stroke="none" />
        <path d="M108 249 L91 283 M135 253 L128 291 M169 255 L173 294 M200 252 L211 289" fill="none" stroke="#C5C7D3" />
        <Waistband fill="#7C829E" />
        <path d="M85 282 Q160 303 236 282" fill="none" stroke="#D0D0D8" />
      </>;
      break;
    case 'bottom-a-line':
      graphic = <>
        <path d="M102 239 Q160 250 220 239 Q225 264 242 287 Q162 311 79 287 Q95 264 102 239 Z" fill="#BB9D99" />
        <path d="M104 251 Q97 272 90 285 Q152 303 229 286" fill="none" stroke="#E0C7BD" strokeWidth="2" />
        <path d="M161 252 V296 M112 258 Q115 275 133 270 M208 258 Q205 275 187 270" fill="none" stroke="#866D73" />
        <Waistband fill="#A98B88" />
        <g fill="#D9D1B9"><circle cx="161" cy="261" r="2.3" /><circle cx="161" cy="273" r="2.3" /><circle cx="161" cy="285" r="2.3" /></g>
        <path d="M217 265 Q222 276 226 285 L209 289" fill="none" stroke="#856D71" strokeOpacity=".4" strokeWidth="3" />
      </>;
      break;
    case 'bottom-balloon':
      graphic = <>
        <path d="M103 239 Q160 250 219 239 Q244 267 230 287 Q218 304 184 298 L172 278 Q160 272 148 278 L136 299 Q107 305 92 289 Q77 268 103 239 Z" fill="#CEBBA1" />
        <Waistband fill="#B5A287" />
        <path d="M99 288 Q114 299 139 289 L136 300 Q112 309 100 298 Z M181 289 Q205 299 222 288 L221 298 Q203 308 184 300 Z" fill="#A18E76" />
        <path d="M111 252 Q101 270 108 281 M132 255 Q122 272 127 285 M187 255 Q197 271 192 285 M209 252 Q219 270 212 281" fill="none" stroke="#EDDBC0" strokeWidth="2" />
        <path d="M159 253 V267 M114 296 L132 296 M188 296 L213 295" fill="none" stroke="#7F756A" />
        <circle cx="161" cy="250" r="2.2" fill="#827768" />
      </>;
      break;
    default:
      return null;
  }
  return <g aria-hidden="true" stroke={edge} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">{graphic}</g>;
}
