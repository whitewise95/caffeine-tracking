import type { ReactNode } from 'react';
import type { OutfitLayer } from '../../components/AvatarOutfitLayers';
import { GarmentSurface } from '../clothing/GarmentSurface';
import { garmentPalettes } from '../clothing/garmentPalette';

type Tone = keyof typeof garmentPalettes;
const ink = '#515B66', gold = '#D3BB85', ivory = '#E5DDC9';

function Fabric({ d, tone, children }: { d: string; tone: Tone; children?: ReactNode }) {
  return <GarmentSurface d={d} palette={garmentPalettes[tone]}>{children}</GarmentSurface>;
}
function Strap({ tone = 'sand' }: { tone?: Tone }) {
  const p = garmentPalettes[tone];
  return <g><path d="M206 149 Q168 178 122 217" stroke="#18232A" strokeOpacity=".2" strokeWidth="9" />
    <path d="M204 146 Q168 176 120 215" stroke={p.shade} strokeWidth="6" />
    <path d="M204 146 Q168 176 120 215" stroke={p.light} strokeWidth="2" /></g>;
}
function Cord({ long = false, color = gold }: { long?: boolean; color?: string }) {
  return <path d={long ? 'M120 151 Q127 185 160 203 Q192 185 200 151' : 'M124 152 Q160 197 196 152'} stroke={color} strokeWidth="2" />;
}
function Flower({ x, y, color = ivory, size = 1 }: { x: number; y: number; color?: string; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} strokeWidth=".9">
    <path d="M0-4 C-9-17-18-3-7 1 C-20 8-9 20-2 8 C2 22 17 13 8 4 C23 3 16-13 5-6 C8-22-8-21 0-4Z" fill={color} />
    <circle r="4" fill={gold} /><path d="M-2-2L1 1" stroke={ivory} />
  </g>;
}
function Bow({ x, y, tone = 'blush', size = 1 }: { x: number; y: number; tone?: Tone; size?: number }) {
  const p = garmentPalettes[tone];
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M-3-3Q-20-15-20-4L-18 9Q-15 13-3 4M3-3Q20-15 20-4L18 9Q15 13 3 4" fill={p.base} />
    <path d="M-4 2L-9 21L-1 17L4 3M4 2L12 20L16 15L9 4" fill={p.shade} />
    <rect x="-4" y="-5" width="8" height="11" rx="3" fill={p.light} />
  </g>;
}
function Star({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}><path d="M0-15L5-5L16-3L8 5L10 16L0 10L-10 16L-8 5L-16-3L-5-5Z" fill={gold} /><path d="M-8-1L-2-3L0-9" stroke={ivory} /></g>;
}
function Rear({ itemId }: { itemId: string }) {
  switch (itemId) {
    case 'accessory-bear-pack': return <g>
      <circle cx="111" cy="158" r="15" fill="#A28E70" /><circle cx="210" cy="158" r="15" fill="#A28E70" />
      <Fabric d="M112 154Q159 139 211 155Q237 171 232 229Q229 258 204 260H116Q88 257 88 227L88 181Q89 162 112 154Z" tone="sand" />
      <path d="M94 203Q85 208 86 237M228 203Q237 208 234 239" stroke="#D5C4A7" strokeWidth="8" />
    </g>;
    case 'accessory-butterfly-cape': return <g>
      <Fabric d="M110 151C95 128 72 138 76 173Q79 203 110 214Q78 218 82 242Q90 265 121 252L160 176L198 252Q230 266 239 242Q244 220 210 214Q241 199 244 172C248 137 225 128 210 151L160 171Z" tone="lavender" />
      <path d="M93 151Q96 176 120 190M84 166Q94 193 112 201M95 233Q108 233 126 219M227 151Q224 176 200 190M236 166Q226 193 208 201M225 233Q212 233 194 219" stroke="#D9CFD6" strokeWidth="2" />
    </g>;
    case 'accessory-petal-shawl': return <Fabric d="M105 149Q160 130 215 149L239 208Q229 222 214 211Q202 230 186 214Q160 231 136 214Q117 232 104 212Q90 222 80 209Z" tone="blush" />;
    case 'accessory-moon-mantle': return <g>
      <Fabric d="M107 146Q160 132 213 146Q235 187 249 251L220 247L207 266Q180 257 160 267Q139 256 112 266L101 247L72 251Q86 184 107 146Z" tone="navy" />
      <path d="M106 158Q92 206 84 241M215 158Q228 205 237 241" stroke={gold} strokeWidth="2" />
      <path d="M223 220A13 13 0 1 0 238 237A13 13 0 0 1 223 220Z" fill={gold} />
      <Star x={92} y={222} size={.36} />
    </g>;
    case 'accessory-fairy-wings': return <g>
      <Fabric d="M148 179C128 126 82 119 74 143C68 163 92 190 124 198C88 196 74 211 82 234C93 259 127 231 151 194L168 194C192 231 227 259 238 234C246 211 231 196 196 198C228 190 252 163 246 143C238 119 191 126 172 179Z" tone="mint" />
      <path d="M146 185Q116 151 84 142M144 192Q115 212 91 231M174 185Q204 151 236 142M176 192Q205 212 229 231" stroke="#DDE8D7" strokeWidth="2" />
      <path d="M91 147Q102 173 130 186M229 147Q218 173 190 186" stroke="#657F77" />
      <circle cx="83" cy="152" r="3" fill={ivory} /><circle cx="237" cy="152" r="3" fill={ivory} />
    </g>;
    default: return null;
  }
}

function Front({ itemId, drinking }: { itemId: string; drinking: boolean }): ReactNode {
  switch (itemId) {
    case 'accessory-bunny-bag': return <g><Strap tone="blush" />
      <Fabric d="M106 214C97 189 101 178 108 181L118 206L127 180Q137 174 136 190L132 214Z" tone="cream" />
      <Fabric d="M104 210Q123 197 143 211L145 239Q124 252 103 240Z" tone="cream" />
      <path d="M107 188L113 205M131 188L128 204" stroke="#C59DA4" strokeWidth="3" />
      <circle cx="116" cy="222" r="2" fill={ink} /><circle cx="132" cy="222" r="2" fill={ink} />
      <path d="M122 228L125 231L128 228M125 231V235" stroke="#A28287" />
    </g>;
    case 'accessory-bear-pack': return <g>
      <path d="M114 149Q105 177 123 207M200 149Q210 178 194 207" stroke="#8C7B62" strokeWidth="10" />
      <path d="M114 149Q105 177 123 207M200 149Q210 178 194 207" stroke="#DDCFB3" strokeWidth="5" />
      <circle cx="121" cy="198" r="7" fill="#A78F70" /><circle cx="118" cy="196" r="1.4" fill={ink} /><circle cx="124" cy="196" r="1.4" fill={ink} />
      <ellipse cx="121" cy="201" rx="3" ry="2" fill={ivory} />
      <rect x="190" y="194" width="10" height="6" rx="1" fill="#A9ACAA" />
    </g>;
    case 'accessory-toast-pouch': return <g>
      <path d="M99 232Q160 254 223 232" stroke="#9F8C70" strokeWidth="6" />
      <Fabric d="M132 227C121 217 127 205 139 207Q159 196 180 207C193 204 198 219 187 227L188 250Q160 262 132 251Z" tone="sand" />
      <path d="M139 224Q132 213 142 214Q160 205 178 214Q189 213 180 225L181 247Q160 254 139 247Z" fill={ivory} />
      <circle cx="150" cy="234" r="1.7" fill={ink} /><circle cx="171" cy="234" r="1.7" fill={ink} /><path d="M157 239Q161 243 165 239" />
    </g>;
    case 'accessory-berry-pin': return <g>
      <path d="M122 167C109 155 102 167 107 178Q112 190 124 197Q137 187 141 175C145 161 132 156 122 167Z" fill="#B77C85" />
      <path d="M113 163L119 157L123 163L130 156L131 164L137 166L125 170Z" fill="#89A58B" />
      <path d="M114 174L116 177M128 174L129 177M122 182L123 185M133 182L134 184" stroke={ivory} strokeWidth="1.7" />
    </g>;
    case 'accessory-cloud-muffler': return <g>
      <Fabric d="M108 154Q104 143 119 145Q124 134 136 147Q145 140 157 151Q174 142 186 147Q199 135 205 148Q218 141 219 155Q221 169 208 173Q190 186 164 176Q140 186 123 175Q105 178 108 154Z" tone="cream" />
      <Fabric d="M122 173L118 210Q130 224 142 209L145 178Z" tone="cream" />
      <path d="M123 211L120 221M130 214V226M138 211L140 221" stroke="#A8A59A" strokeWidth="2" />
    </g>;
    case 'accessory-shoulder-kitten': return <g transform="translate(100 151)">
      <path d="M6 15Q-24 25-27 8Q-29-3-21-5" stroke="#A9ADB4" strokeWidth="7" />
      <Fabric d="M-13-2L-15-24L-2-14Q7-19 14-13L26-23L24-1Q30 8 22 18Q11 28-6 20Q-18 13-13-2Z" tone="grey" />
      <path d="M-9-17L-7-9M21-15L19-8" stroke="#D3B3BC" strokeWidth="3" />
      <path d="M-3 1L0 3M13 2L16 0M5 8L8 10L11 8" stroke={ink} strokeWidth="1.6" />
      <path d="M-8 8H-16M19 8H27" stroke={ivory} />
    </g>;
    case 'accessory-daisy-tote': return <g><Strap tone="sage" />
      <path d="M107 214V202Q124 186 140 202V213" stroke="#A6AF94" strokeWidth="5" />
      <Fabric d="M100 211Q123 217 149 210L146 247Q122 259 104 246Z" tone="sage" />
      <path d="M108 219L107 242M116 220L115 247M132 220L132 249M140 218L140 245" stroke="#BCC8B4" />
      <Flower x={124} y={232} size={.64} />
    </g>;
    case 'accessory-cookie-medal': return <g><path d="M111 151L112 174L123 169L132 177L139 154" fill="#8DA4AD" />
      <path d="M126 170L129 174L135 173L138 179L143 183L140 190L140 196L133 198L127 203L121 199L114 198L112 191L107 186L111 180L112 174L120 174Z" fill="#BA9D74" />
      <circle cx="126" cy="186" r="10" fill="#D6C098" strokeDasharray="1 3" />
      <path d="M119 184L122 183M129 179L132 181M124 191L128 193M133 188L134 190" stroke="#85715E" strokeWidth="2.6" />
    </g>;
    case 'accessory-lace-collar': return <g>
      <path d="M111 149Q159 171 209 149L214 170Q211 183 201 175Q195 188 186 181Q178 194 169 184Q159 198 150 184Q139 194 132 182Q119 190 117 177Q103 183 106 169Z" fill={ivory} />
      <path d="M114 154Q160 177 206 154M116 166Q159 190 204 166" stroke="#B7AA96" strokeDasharray="2 4" />
      <Bow x={160} y={174} size={.47} />
    </g>;
    case 'accessory-pearl-garland': return <g><Cord color="#B7AA96" />
      {[[-32,158],[-26,166],[-18,172],[-9,176],[0,178],[9,176],[18,172],[26,166],[32,158]].map(([x,y])=><circle key={x} cx={160+x} cy={y} r="3.1" fill={ivory} />)}
      <Flower x={160} y={192} color="#C9A4AE" size={.6} />
    </g>;
    case 'accessory-rosette-sash': return <g>
      <Fabric d="M112 148Q156 190 218 231L209 244Q149 205 104 158Z" tone="blush" />
      <path d="M110 152Q158 198 213 237" stroke={ivory} strokeDasharray="2 4" />
      <path d="M123 179L121 206L130 201L136 209L139 182" fill="#9D7989" />
      <Flower x={129} y={177} color="#C8A4B1" size={1.06} /><circle cx="129" cy="177" r="6" fill={ivory} />
    </g>;
    case 'accessory-ribbon-purse': return <g><Strap tone="blush" />
      <Fabric d="M105 213Q124 202 144 213L150 239Q129 254 102 242Z" tone="blush" />
      <path d="M108 216Q126 229 144 216M110 237Q125 245 143 237" stroke="#E1CBD0" />
      <Bow x={125} y={214} size={.65} />
    </g>;
    case 'accessory-heart-locket': return <g><Cord long />
      <path d="M160 207C146 192 137 209 146 220L160 235L174 220C183 209 174 192 160 207Z" fill={gold} />
      <path d="M160 212C151 202 146 212 152 219L160 227L168 219C174 212 169 202 160 212Z" fill="#BB959C" />
      <path d="M160 210V228M150 210L152 208" stroke={ivory} />
    </g>;
    case 'accessory-tulip-bouquet': return <g>
      <path d="M114 202L105 168M118 202L122 159M121 204L138 172" stroke="#849B7D" strokeWidth="3" />
      <path d="M95 156L105 163L114 155L115 169Q105 181 97 170Z M113 146L123 153L131 145L132 162Q121 173 114 162Z M129 159L139 166L147 159L148 175Q137 185 130 175Z" fill="#BD929B" />
      <path d="M99 185L137 190L124 223L116 225Z" fill={ivory} /><Bow x={119} y={205} tone="sage" size={.45} />
    </g>;
    case 'accessory-butterfly-cape': return <g>
      <Fabric d="M109 148Q159 171 211 148L205 163Q159 187 115 163Z" tone="lavender" />
      <Bow x={160} y={172} tone="lavender" size={.55} />
    </g>;
    case 'accessory-petal-shawl': return <g>
      <Fabric d="M107 147Q135 156 158 168Q183 157 213 147L221 177Q202 199 182 182Q161 203 140 182Q118 201 99 176Z" tone="blush" />
      <path d="M110 157Q123 178 141 178M210 157Q197 178 179 178" stroke="#DFCCD0" />
      <Flower x={160} y={174} size={.55} color={ivory} />
    </g>;
    case 'accessory-tech-sling': return <g><Strap tone="charcoal" />
      <Fabric d="M129 182L166 164Q179 165 182 180L162 215L134 227Q118 211 129 182Z" tone="charcoal" />
      <path d="M137 185L168 174M131 204L162 187" stroke="#A9B4B8" strokeWidth="2" />
      <rect x="156" y="193" width="10" height="7" rx="1" fill="#8BABA8" /><path d="M137 218L145 215" stroke={ivory} strokeWidth="3" />
    </g>;
    case 'accessory-utility-belt': return <g>
      <path d="M96 233Q160 250 225 233" stroke="#353F4A" strokeWidth="10" />
      <rect x="153" y="239" width="17" height="10" rx="2" fill="#A5ACA8" /><rect x="157" y="241" width="9" height="5" fill="#4D5662" />
      <Fabric d="M101 232L123 238L122 260Q109 263 99 254Z M194 237L216 232L219 254Q207 264 196 260Z" tone="charcoal" />
      <path d="M103 242L118 246M198 246L214 242" stroke="#9FACAB" strokeWidth="2" />
      <circle cx="135" cy="247" r="4" stroke="#BDBEB5" strokeWidth="2" />
    </g>;
    case 'accessory-neck-headphones': return <g>
      <path d="M119 155Q111 182 130 190Q160 207 191 190Q210 181 201 155" stroke="#3B4552" strokeWidth="9" />
      <path d="M124 163Q121 180 136 186M197 163Q200 180 185 186" stroke="#9EAFB5" strokeWidth="2" />
      <Fabric d="M118 166Q126 161 132 171L134 188Q131 198 120 192L115 176Z M187 171Q194 161 202 167L205 178Q203 197 193 194L186 186Z" tone="charcoal" />
      <path d="M123 173L127 187M197 173L193 187" stroke="#B2BBC0" strokeWidth="3" />
    </g>;
    case 'accessory-cassette-bag': return <g><Strap tone="charcoal" />
      <Fabric d="M100 208L149 213L147 246L98 242Z" tone="denim" />
      <path d="M106 215L143 219L142 232L105 229Z" fill={ivory} /><circle cx="115" cy="223" r="4" fill="#788592" /><circle cx="134" cy="225" r="4" fill="#788592" />
      <path d="M113 237L135 239L132 232L117 231Z" fill="#3E4F62" /><path d="M117 223L131 225" stroke="#5B6774" />
    </g>;
    case 'accessory-camera-bag': return <g><Cord long color="#596270" />
      <Fabric d="M132 207L141 201L154 201L159 208L187 208L190 241L131 241Z" tone="charcoal" />
      <rect x="136" y="213" width="12" height="7" rx="1" fill="#BEC6C5" />
      <circle cx="166" cy="225" r="13" fill="#899DA9" /><circle cx="166" cy="225" r="8" fill="#304456" /><path d="M160 223Q161 218 167 219" stroke="#D8E1D9" strokeWidth="2" />
    </g>;
    case 'accessory-carabiner': return <g>
      <path d="M115 214L112 238Q122 254 132 239L135 218Q130 206 120 210" stroke="#B6BCB8" strokeWidth="4" />
      <path d="M120 210L116 223" stroke="#879E9C" strokeWidth="5" /><circle cx="124" cy="247" r="6" stroke={gold} strokeWidth="2" />
      <path d="M121 253L117 266L123 266L125 261L129 263" stroke="#BFC7C3" strokeWidth="3" />
      <path d="M132 244L142 246L140 261L130 258Z" fill="#9B7F90" />
    </g>;
    case 'accessory-bandana': return <g>
      <Fabric d="M112 149Q160 168 208 149L182 176L158 207L139 177Z" tone="denim" />
      <path d="M124 158L142 174L158 196L177 173L196 157" stroke={ivory} strokeDasharray="2 3" />
      <path d="M152 171Q167 170 163 182Q153 185 153 177Q159 172 159 178" stroke="#B5C7CC" strokeWidth="1.6" />
    </g>;
    case 'accessory-messenger': return <g><Strap tone="sage" />
      <Fabric d="M94 210Q125 204 154 216L152 252Q123 260 94 246Z" tone="sage" />
      <Fabric d="M94 210Q124 204 154 216L150 231Q118 239 95 225Z" tone="charcoal" />
      <path d="M106 227V240M140 230V244" stroke="#BFCBBE" strokeWidth="5" /><rect x="117" y="217" width="15" height="6" fill="#A2B6B0" />
    </g>;
    case 'accessory-silk-ascot': return <g>
      <Fabric d="M112 149Q158 169 207 149L189 167L169 174L175 218L160 234L145 219L151 173L132 168Z" tone="navy" />
      <path d="M154 179L160 222L167 179M126 156L143 165M191 157L179 164" stroke="#A6B8C4" />
      <path d="M153 190L164 197M153 206L170 215" stroke={gold} strokeWidth="2" />
    </g>;
    case 'accessory-pocket-watch': return <g>
      <path d="M188 179Q172 221 129 216" stroke={gold} strokeWidth="2.2" /><path d="M187 179Q174 233 132 224" stroke={gold} strokeWidth="1" />
      <circle cx="124" cy="222" r="5" stroke={gold} strokeWidth="2" /><circle cx="124" cy="241" r="15" fill={gold} /><circle cx="124" cy="241" r="11" fill={ivory} />
      <path d="M124 233V241L131 245M115 241H117M131 241H133M124 248V250" stroke="#6E756F" strokeWidth="1.5" />
    </g>;
    case 'accessory-leather-satchel': return <g><Strap tone="sand" />
      <path d="M109 214V204Q125 193 141 207V218" stroke="#907B65" strokeWidth="4" />
      <Fabric d="M100 211L151 218L149 253L98 245Z" tone="sand" />
      <path d="M101 212L150 219L145 233L104 228Z" fill="#9F886E" /><path d="M112 226L111 244M139 230L138 249" stroke="#D7C4A3" strokeWidth="5" />
      <rect x="108" y="234" width="7" height="6" fill={gold} /><rect x="135" y="238" width="7" height="6" fill={gold} />
    </g>;
    case 'accessory-book-bag': return <g><Strap tone="navy" />
      <path d="M103 206L129 202L146 212L120 215Z" fill={ivory} /><path d="M104 206L122 211L144 207L145 239L121 249L102 243Z" fill="#7F9298" />
      <path d="M105 213L119 218M105 218L119 223M123 215V242" stroke={ivory} />
      <Fabric d="M98 227L121 235L151 224L148 253L122 261L100 251Z" tone="navy" />
      <path d="M107 230L107 247M141 232L139 250" stroke={gold} strokeWidth="2" />
    </g>;
    case 'accessory-crest-pin': return <g>
      <path d="M109 160L125 154L141 160L138 182Q130 192 125 194Q114 188 111 180Z" fill="#50697D" stroke={gold} strokeWidth="2" />
      <path d="M115 165L125 160L135 165L132 178L125 186L118 178Z" stroke={ivory} /><Star x={125} y={172} size={.38} />
      <path d="M108 190L103 197L126 195L148 198L142 190" fill="#D8C9A6" />
    </g>;
    case 'accessory-suspenders': return <g>
      <path d="M118 149Q119 193 127 244M202 149Q201 193 193 244" stroke="#594F4A" strokeWidth="8" />
      <path d="M118 149Q119 193 127 244M202 149Q201 193 193 244" stroke="#B0A18D" strokeWidth="3" />
      <rect x="118" y="193" width="11" height="7" rx="1" fill="#C9C6B7" /><rect x="192" y="193" width="11" height="7" rx="1" fill="#C9C6B7" />
      <circle cx="127" cy="244" r="4" fill={gold} /><circle cx="193" cy="244" r="4" fill={gold} />
    </g>;
    case 'accessory-sailor-collar': return <g>
      <Fabric d="M106 148L132 153L160 188L188 153L214 148L213 175L181 173L160 202L139 173L106 175Z" tone="navy" />
      <path d="M113 152L113 168L142 165L160 192L178 165L206 168L206 152" stroke={ivory} strokeWidth="2" /><Bow x={160} y={187} tone="cream" size={.44} />
    </g>;
    case 'accessory-tartan-scarf': return <g>
      <Fabric d="M114 150Q160 171 207 150L207 168Q160 189 113 168Z M125 174L119 222L143 231L151 179Z" tone="sand" />
      <path d="M117 156Q160 176 205 156M114 164Q160 185 205 164M125 186L148 193M123 204L145 211M122 216L143 224M133 177L128 225" stroke="#7C6A66" strokeWidth="3" />
      <path d="M129 154L127 170M149 160V178M173 159L175 176M193 154L197 170M140 181L136 228" stroke="#E0D7BB" strokeWidth="2" />
      <path d="M121 222L119 231M128 225L126 235M136 227L134 236M142 229L141 237" stroke="#99836C" strokeWidth="2" />
    </g>;
    case 'accessory-star-wand': return <g>
      <path d="M84 244L98 165" stroke="#827894" strokeWidth="6" /><path d="M85 240L97 168" stroke="#DBCFD8" strokeWidth="1.6" />
      <Star x={98} y={154} size={1} /><Bow x={95} y={177} tone="lavender" size={.45} />
      <path d="M93 183Q80 197 86 213M100 184Q109 200 100 213" stroke="#C3A8BC" strokeWidth="2" />
    </g>;
    case 'accessory-moon-mantle': return <g>
      <Fabric d="M109 147Q158 171 211 147L201 167Q159 190 119 167Z" tone="navy" />
      <path d="M117 158Q159 183 202 158" stroke={gold} strokeWidth="2" />
      <path d="M163 169A10 10 0 1 0 170 185A10 10 0 0 1 163 169Z" fill={gold} />
    </g>;
    case 'accessory-fairy-wings': return <g>
      <path d="M113 150Q118 177 135 185M207 150Q202 177 185 185" stroke="#AFC6AD" strokeWidth="3" />
      <Flower x={135} y={179} size={.45} color="#D4DED3" /><Flower x={185} y={179} size={.45} color="#D4DED3" />
    </g>;
    case 'accessory-leaf-satchel': return <g><Strap tone="sage" />
      <Fabric d="M123 201Q150 209 149 230Q141 252 108 251Q93 221 123 201Z" tone="sage" />
      <path d="M122 208Q126 229 108 251M123 218L137 217M121 229L136 229M115 238L129 240M118 223L109 216" stroke="#C4D1B6" strokeWidth="1.5" />
      <path d="M121 205Q116 194 124 191" stroke="#7F8F69" strokeWidth="3" />
    </g>;
    case 'accessory-potion-belt': return <g>
      <path d="M97 233Q160 254 225 233" stroke="#86745F" strokeWidth="7" />
      {([[115,242,'#8EACB4'],[160,249,'#AC96AC'],[205,242,'#9DAF94']] as const).map(([x,y,color])=><g key={x} transform={`translate(${x} ${y})`}>
        <path d="M-4-8H4V0Q14 11 7 18Q0 23-7 18Q-14 11-4 0Z" fill={ivory} fillOpacity=".8" />
        <path d="M-8 8H8Q12 18 0 19Q-12 18-8 8Z" fill={color} /><path d="M-5-8H5" stroke="#AD9472" strokeWidth="5" /><path d="M-5 7V12" stroke="#F2EDE1" strokeWidth="2" />
      </g>)}
    </g>;
    case 'accessory-compass': return <g><Cord long color="#AE9574" />
      <circle cx="160" cy="222" r="18" fill={gold} /><circle cx="160" cy="222" r="13" fill="#D5D9CD" />
      <path d="M160 209L164 220L160 235L156 224Z" fill="#8B737A" /><path d="M147 222H152M168 222H173M151 213L154 216M166 228L169 231" stroke="#7E8982" />
      <circle cx="160" cy="222" r="2" fill={gold} />
    </g>;
    case 'accessory-tiny-dragon': return <g transform={`translate(100 ${drinking ? 151 : 150})`}>
      <path d="M5 18Q-24 33-27 10L-18 14L-20 4L-10 9" fill="#86A79B" />
      <Fabric d="M-9-4L-8-17L-1-12L8-22L12-11Q28-9 26 4L18 9L19 20Q4 28-8 16Z" tone="sage" />
      <path d="M-9-1L-23-14L-24 2L-14 14Z" fill="#BBC6AA" /><path d="M-22-9L-14 6" stroke="#718F7C" />
      <circle cx="15" cy="-2" r="2.2" fill={ink} /><path d="M19 6H25M3 19L8 19" stroke="#D8DDC6" strokeWidth="2" />
    </g>;
    case 'accessory-orbit-pin': return <g>
      <ellipse cx="126" cy="177" rx="24" ry="9" transform="rotate(-28 126 177)" stroke="#C5B6A0" strokeWidth="2" />
      <Star x={126} y={176} size={.75} /><circle cx="104" cy="186" r="4" fill="#A4BDC3" /><circle cx="145" cy="163" r="3" fill="#B2A1BB" />
    </g>;
    default: return null;
  }
}

export function AccessoryCollectionGraphic({ itemId, layer, drinking }: { itemId: string; layer: OutfitLayer; drinking: boolean }): ReactNode {
  return <g fill="none" stroke={ink} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
    {layer === 'back' ? <Rear itemId={itemId} /> : layer === 'front' ? <Front itemId={itemId} drinking={drinking} /> : null}
  </g>;
}
