import type { ReactNode } from 'react';
import type { OutfitLayer } from '../../components/AvatarOutfitLayers';
import { TOP_COLLECTION_ITEMS, type TopCollectionItemId } from '../../data/collections/topCollection';
import { garmentPalettes as p } from '../clothing/garmentPalette';
import { TopBack, TopBody, TopBow, TopButtons, TopFlower, TopHem, TopNeck, TopSleeves, TopStar, type TopMaterial } from './TopCollectionShapes';

const materials = {
  'top-bear-pocket': { palette: p.sand, sleeve: 'long' },
  'top-rabbit-knit': { palette: p.cream, sleeve: 'long' },
  'top-cat-hood': { palette: p.grey, sleeve: 'long', hood: true },
  'top-toast-apron': { palette: p.cream, sleeve: 'short' },
  'top-cloud-pajama': { palette: p.denim, sleeve: 'long', cut: 'blouse' },
  'top-cocoa-shawl': { palette: p.sand, sleeve: 'bell', cut: 'open' },
  'top-strawberry-knit': { palette: p.cream, sleeve: 'puff' },
  'top-quilted-vest': { palette: p.mint, sleeve: 'none', cut: 'vest' },
  'top-ribbon-blouse': { palette: p.cream, sleeve: 'bell', cut: 'blouse' },
  'top-scallop-cardigan': { palette: p.lavender, sleeve: 'long' },
  'top-petal-wrap': { palette: p.blush, sleeve: 'bell', cut: 'blouse' },
  'top-rose-bolero': { palette: p.navy, sleeve: 'puff', cut: 'bolero' },
  'top-heart-puff': { palette: p.blush, sleeve: 'puff', cut: 'blouse' },
  'top-daisy-collar': { palette: p.sage, sleeve: 'short', cut: 'blouse' },
  'top-lace-camisole': { palette: p.cream, sleeve: 'long' },
  'top-ballet-wrap': { palette: p.lavender, sleeve: 'long', cut: 'vneck' },
  'top-utility-vest': { palette: p.sage, sleeve: 'none', cut: 'vest' },
  'top-flight-bomber': { palette: p.charcoal, sleeve: 'long' },
  'top-track-jacket': { palette: p.navy, sleeve: 'long' },
  'top-rugby-polo': { palette: p.sage, sleeve: 'long' },
  'top-denim-jacket': { palette: p.denim, sleeve: 'long' },
  'top-tech-anorak': { palette: p.grey, sleeve: 'long', hood: true },
  'top-mesh-jersey': { palette: p.navy, sleeve: 'short', cut: 'vneck' },
  'top-padded-gilet': { palette: p.charcoal, sleeve: 'none', cut: 'vest' },
  'top-sailor-shirt': { palette: p.cream, sleeve: 'short' },
  'top-double-blazer': { palette: p.navy, sleeve: 'long', cut: 'coat' },
  'top-argyle-vest': { palette: p.sand, sleeve: 'long', sleevePalette: p.cream, cut: 'vneck' },
  'top-oxford-shirt': { palette: p.denim, sleeve: 'long', cut: 'blouse' },
  'top-duffle-coat': { palette: p.sand, sleeve: 'long', cut: 'coat', hood: true },
  'top-herringbone-waistcoat': { palette: p.grey, sleeve: 'none', cut: 'vest' },
  'top-cricket-knit': { palette: p.cream, sleeve: 'long', cut: 'vneck' },
  'top-breton-cape': { palette: p.navy, sleeve: 'bell', cut: 'blouse' },
  'top-leaf-tunic': { palette: p.sage, sleeve: 'short', cut: 'tunic' },
  'top-moon-robe': { palette: p.navy, sleeve: 'bell', cut: 'open', hood: true },
  'top-star-capelet': { palette: p.charcoal, sleeve: 'long' },
  'top-fairy-petal': { palette: p.mint, sleeve: 'none', cut: 'petal' },
  'top-adventurer-jacket': { palette: p.sand, sleeve: 'long', cut: 'coat' },
  'top-dragon-scale': { palette: p.grey, sleeve: 'none', cut: 'vest' },
  'top-cloud-courier': { palette: p.denim, sleeve: 'puff', cut: 'blouse' },
  'top-crystal-armor': { palette: p.lavender, sleeve: 'short', cut: 'tunic' },
} satisfies Record<TopCollectionItemId, TopMaterial>;

// Each design is composed at garment scale. Large collars, seams and motifs
// remain identifiable in the 56 116 214 153 top thumbnail crop.
function TopDetails({ itemId }: { itemId: TopCollectionItemId }): ReactNode {
  switch (itemId) {
    case 'top-bear-pocket':
      return <>
        <TopNeck color={p.sand.shade} /><TopHem color={p.sand.shade} />
        <path d="M117 154 Q126 167 128 178 M203 154 Q194 167 192 178" fill="none" stroke={p.sand.light} />
        <g fill={p.cream.base}>
          <circle cx="142" cy="191" r="8" /><circle cx="178" cy="191" r="8" />
          <path d="M139 196 Q160 184 181 196 L181 217 Q160 234 139 217 Z" />
        </g>
        <g fill={p.sand.shade} stroke="none"><circle cx="151" cy="203" r="2.2" /><circle cx="169" cy="203" r="2.2" /></g>
        <ellipse cx="160" cy="212" rx="9" ry="6" fill={p.sand.light} />
        <path d="M157 209 Q160 207 163 209 L160 213 Z M160 213 V216" fill={p.sand.shade} />
        <path d="M143 221 Q160 231 177 221" fill="none" stroke={p.sand.shade} strokeDasharray="2 3" />
      </>;
    case 'top-rabbit-knit':
      return <>
        <path d="M135 147 Q160 160 185 147 L184 162 Q160 174 136 162 Z" fill={p.sand.base} />
        <path d="M142 152 V163 M151 156 V166 M160 157 V168 M169 156 V166 M178 152 V163" fill="none" stroke={p.cream.light} />
        <TopHem color={p.sand.base} />
        <path d="M118 171 Q133 180 121 190 Q109 200 124 209 Q134 218 122 230 M127 171 Q112 180 124 190 Q136 200 121 209 Q111 218 123 230 M146 177 Q161 185 149 196 Q137 206 152 216 Q162 224 150 235 M155 177 Q140 185 152 196 Q164 206 149 216 Q139 224 151 235" fill="none" stroke={p.sand.base} strokeWidth="2" />
        <g fill={p.sand.light}><ellipse cx="183" cy="186" rx="4" ry="12" transform="rotate(-13 183 186)" /><ellipse cx="196" cy="185" rx="4" ry="12" transform="rotate(11 196 185)" /><ellipse cx="190" cy="206" rx="14" ry="15" /></g>
        <path d="M184 205 H185 M195 205 H196 M188 212 Q190 214 192 212" fill="none" stroke={p.sand.shade} strokeWidth="2" />
      </>;
    case 'top-cat-hood':
      return <>
        <path d="M127 147 Q160 164 193 147 L182 168 Q160 181 138 168 Z" fill={p.grey.light} />
        <path d="M139 164 L138 190 M181 164 L182 190" fill="none" stroke={p.cream.base} strokeWidth="2" />
        <path d="M132 212 L139 193 L151 205 Q160 201 169 205 L181 193 L188 212 L188 227 Q160 240 132 227 Z" fill={p.charcoal.base} />
        <path d="M145 216 Q148 212 151 216 M169 216 Q172 212 175 216 M158 222 L160 224 L162 222 M139 220 L147 222 M173 222 L181 220" fill="none" stroke={p.cream.base} strokeWidth="1.5" />
        <TopHem color={p.grey.shade} />
      </>;
    case 'top-toast-apron':
      return <>
        <TopNeck color={p.cream.shade} />
        <path d="M124 150 L135 153 L130 190 M196 150 L185 153 L190 190" fill="none" stroke={p.sand.shade} strokeWidth="8" />
        <path d="M128 176 Q160 183 192 176 L194 205 Q201 224 211 248 Q160 262 109 248 Q119 224 126 205 Z" fill={p.sand.base} />
        <path d="M128 181 Q160 188 192 181 M123 214 Q160 226 197 214 M116 244 Q160 258 205 244" fill="none" stroke={p.sand.light} strokeWidth="2" />
        <path d="M145 223 V207 Q135 198 146 191 Q160 184 174 191 Q185 198 175 207 V223 Z" fill={p.sand.shade} />
        <path d="M149 219 V204 Q141 200 149 195 Q160 190 171 195 Q179 200 171 204 V219 Z" fill={p.cream.light} />
        <rect x="155" y="201" width="10" height="9" rx="2" fill={p.sand.base} />
      </>;
    case 'top-cloud-pajama':
      return <>
        <path d="M132 148 L159 166 L143 184 L122 153 Z M188 148 L161 166 L177 184 L198 153 Z" fill={p.denim.light} />
        <path d="M160 166 V252 M99 240 Q160 258 222 240" fill="none" stroke={p.cream.light} strokeWidth="2" />
        <TopButtons start={189} count={3} color={p.cream.light} />
        <path d="M177 187 Q191 191 205 187 L204 211 Q191 218 178 211 Z" fill={p.denim.base} stroke={p.cream.base} />
        <g fill={p.cream.light} stroke="none">
          <path d="M111 196 Q106 190 113 187 Q116 177 124 184 Q133 182 134 190 Q139 196 132 199 H116 Z" />
          <path d="M176 236 Q172 231 178 228 Q183 219 190 226 Q199 223 200 232 Q205 238 197 240 H181 Z" />
          <path d="M118 227 Q115 222 121 220 Q125 213 130 220 Q136 219 137 225 Q140 230 133 231 H122 Z" />
        </g>
      </>;
    case 'top-cocoa-shawl':
      return <>
        <path d="M129 147 Q138 166 151 183 L142 205 Q124 187 116 153 Z M191 147 Q182 166 169 183 L178 205 Q196 187 204 153 Z" fill={p.sand.light} />
        <path d="M124 153 Q130 180 145 192 M196 153 Q190 180 175 192" fill="none" stroke={p.sand.base} strokeWidth="2" />
        <path d="M109 211 Q122 214 136 211 V232 Q122 239 108 232 Z M184 211 Q198 214 211 211 L212 232 Q198 239 184 232 Z" fill={p.sand.shade} />
        <path d="M117 218 H127 V226 Q122 231 117 226 Z M127 220 Q134 218 132 224 L127 226" fill={p.cream.base} />
        <path d="M120 216 Q117 213 120 210 M125 216 Q128 213 125 210 M102 239 L102 244 M113 242 V247 M126 245 V251 M136 247 V252 M184 247 V252 M195 245 V251 M207 242 V247 M219 239 V244" fill="none" stroke={p.sand.light} />
      </>;
    case 'top-strawberry-knit':
      return <>
        <TopNeck color={p.blush.base} /><TopHem color={p.cream.shade} />
        <path d="M110 181 L114 185 L118 181 M131 185 L135 189 L139 185 M181 185 L185 189 L189 185 M202 181 L206 185 L210 181 M117 222 L121 226 L125 222 M195 222 L199 226 L203 222" fill="none" stroke={p.sand.base} />
        <path d="M142 199 Q144 190 160 195 Q176 190 178 199 Q176 217 160 228 Q144 217 142 199 Z" fill={p.blush.base} />
        <path d="M160 196 Q150 195 147 186 L157 189 L160 182 L164 189 L175 186 Q170 196 160 196 Z" fill={p.sage.base} />
        <path d="M150 202 L151 204 M161 201 V203 M170 203 L169 205 M156 212 L157 214 M165 213 L164 215 M160 221 V222" stroke={p.cream.light} strokeWidth="2" />
      </>;
    case 'top-quilted-vest':
      return <>
        <TopNeck color={p.mint.shade} v />
        <path d="M114 149 Q121 173 102 191 M206 149 Q199 173 218 191" fill="none" stroke={p.cream.base} strokeWidth="5" />
        <path d="M104 198 L147 244 M119 182 L182 249 M141 187 L207 240 M173 184 L219 231 M215 198 L174 244 M201 183 L139 249 M178 189 L113 239 M145 190 L101 231" fill="none" stroke={p.mint.shade} strokeOpacity=".65" />
        <path d="M160 180 V253" fill="none" stroke={p.cream.base} strokeWidth="5" />
        <TopButtons start={189} count={4} color={p.sand.shade} />
        <path d="M108 221 L136 229 M184 229 L212 221" stroke={p.cream.light} strokeWidth="3" />
      </>;
    case 'top-ribbon-blouse':
      return <>
        <path d="M132 148 Q143 156 160 159 Q177 156 188 148 L181 171 L160 163 L139 171 Z" fill={p.cream.light} />
        <TopBow x={160} y={170} color={p.navy.base} scale={.88} />
        <path d="M139 194 Q134 216 138 243 M148 198 L148 248 M181 194 Q186 216 182 243 M172 198 V248" fill="none" stroke={p.sand.base} strokeOpacity=".7" />
        <path d="M97 235 Q160 253 227 235 L228 243 Q160 264 95 243 Z" fill={p.cream.light} />
        <path d="M103 240 Q109 249 115 243 Q121 252 127 246 Q133 256 139 249 Q145 259 151 251 Q157 261 163 252 Q169 261 175 250 Q181 258 187 248 Q193 255 199 245 Q205 252 211 242 Q217 249 223 240" fill="none" stroke={p.sand.base} />
      </>;
    case 'top-scallop-cardigan':
      return <>
        <path d="M129 147 Q135 164 143 160 Q151 174 160 166 Q169 174 177 160 Q185 164 191 147 L186 149 Q160 166 134 149 Z" fill={p.cream.light} />
        <path d="M160 166 V254" stroke={p.cream.base} strokeWidth="7" />
        <TopButtons start={181} count={4} color={p.lavender.shade} />
        <path d="M112 203 Q125 207 140 203 L139 223 Q126 231 111 223 Z M180 203 Q195 207 208 203 L209 223 Q194 231 181 223 Z" fill={p.lavender.light} />
        <path d="M113 204 Q119 212 125 206 Q131 213 138 205 M182 205 Q189 213 195 206 Q201 212 207 204" fill="none" stroke={p.cream.light} strokeWidth="2" />
        <path d="M96 239 Q104 252 113 245 Q121 258 130 250 Q139 263 148 254 Q160 267 172 254 Q181 263 190 250 Q199 258 207 245 Q216 252 227 239" fill="none" stroke={p.cream.base} strokeWidth="5" />
      </>;
    case 'top-petal-wrap':
      return <>
        <path d="M132 148 Q166 174 193 205 Q202 221 221 240 Q160 262 98 242 Q102 220 111 197 Z" fill={p.blush.light} fillOpacity=".58" />
        <path d="M132 148 Q152 171 174 185 Q187 196 193 205 M187 149 Q170 175 147 198 Q130 217 111 228" fill="none" stroke={p.cream.light} strokeWidth="4" />
        <path d="M100 224 Q160 246 223 224" fill="none" stroke={p.blush.shade} strokeWidth="5" />
        <TopBow x={116} y={229} color={p.blush.shade} scale={.58} />
        <TopFlower x={191} y={194} color={p.cream.light} scale={.6} />
        <path d="M191 202 Q182 213 180 225 M182 218 Q171 209 172 218 Q174 222 181 221" fill="none" stroke={p.sage.shade} />
      </>;
    case 'top-rose-bolero':
      return <>
        <path d="M132 150 Q135 177 146 191 Q135 205 103 209 M188 150 Q185 177 174 191 Q185 205 218 209" fill="none" stroke={p.navy.light} strokeWidth="4" />
        <path d="M137 176 Q160 188 183 176 M141 184 Q160 195 179 184" fill="none" stroke={p.sand.base} strokeWidth="2" />
        <path d="M118 214 L118 244 M134 218 L134 249 M150 220 V253 M170 220 V253 M186 218 L186 249 M202 214 L202 244" fill="none" stroke={p.sand.base} strokeOpacity=".55" />
        <TopFlower x={134} y={179} color={p.blush.base} scale={.85} />
        <path d="M129 190 Q119 185 120 194 Q124 199 130 194 M136 191 Q145 190 143 198 Q137 198 136 191" fill={p.sage.base} />
        <path d="M99 240 Q160 260 223 240" fill="none" stroke={p.sand.base} strokeWidth="4" />
      </>;
    case 'top-heart-puff':
      return <>
        <path d="M131 148 Q142 153 160 158 Q178 153 189 148 Q183 174 160 174 Q137 174 131 148 Z" fill={p.cream.light} />
        <path d="M160 174 V253" fill="none" stroke={p.blush.shade} strokeOpacity=".55" />
        <TopButtons start={185} count={4} color={p.cream.light} />
        <path d="M116 185 Q112 175 122 177 Q130 172 134 181 Q135 188 124 196 Z M184 210 Q178 200 188 199 Q195 192 201 201 Q205 208 194 220 Z M118 223 Q114 216 121 216 Q127 211 131 218 Q134 224 125 232 Z" fill={p.blush.shade} fillOpacity=".75" />
        <path d="M104 231 Q160 249 219 231 M106 235 Q160 253 217 235" fill="none" stroke={p.cream.light} />
      </>;
    case 'top-daisy-collar':
      return <>
        <path d="M132 148 Q145 153 160 159 Q154 179 139 175 Q126 171 125 151 Z M188 148 Q175 153 160 159 Q166 179 181 175 Q194 171 195 151 Z" fill={p.cream.light} />
        <path d="M160 177 V254" stroke={p.sage.shade} strokeWidth="3" /><TopButtons start={185} count={4} color={p.cream.light} />
        <TopFlower x={139} y={164} scale={.42} /><TopFlower x={181} y={164} scale={.42} />
        <TopFlower x={120} y={208} scale={.7} /><TopFlower x={193} y={229} scale={.6} />
        <path d="M120 215 Q123 228 132 234 M128 230 Q118 226 119 232 Q123 237 131 234 M194 235 L199 241" fill="none" stroke={p.cream.base} />
      </>;
    case 'top-lace-camisole':
      return <>
        <TopNeck color={p.cream.shade} />
        <path d="M125 152 L130 185 M195 152 L190 185" fill="none" stroke={p.charcoal.base} strokeWidth="6" />
        <path d="M119 179 Q139 185 160 191 Q181 185 201 179 Q205 213 226 242 Q160 264 96 242 Q115 213 119 179 Z" fill={p.charcoal.base} />
        <path d="M119 179 Q126 190 132 184 Q139 196 146 189 Q153 202 160 193 Q167 202 174 189 Q181 196 188 184 Q194 190 201 179" fill="none" stroke={p.cream.base} strokeWidth="3" />
        <path d="M105 239 Q111 250 118 243 Q124 254 131 247 Q138 259 145 251 Q152 264 160 254 Q168 264 175 251 Q182 259 189 247 Q196 254 203 243 Q210 250 217 239" fill="none" stroke={p.cream.base} strokeWidth="2" />
        <TopBow x={160} y={198} color={p.blush.base} scale={.42} />
        <path d="M130 204 Q122 219 120 235 M190 204 Q198 219 200 235" fill="none" stroke={p.grey.light} strokeOpacity=".5" />
      </>;
    case 'top-ballet-wrap':
      return <>
        <path d="M133 148 Q159 172 188 202 Q207 218 224 229" fill="none" stroke={p.lavender.light} strokeWidth="7" />
        <path d="M186 149 Q162 182 135 203 Q117 217 101 222" fill="none" stroke={p.lavender.shade} strokeWidth="5" />
        <path d="M98 227 Q160 249 225 227 L228 243 Q160 262 94 243 Z" fill={p.lavender.shade} />
        <path d="M102 233 Q160 252 221 233 M104 239 Q160 258 219 239" fill="none" stroke={p.lavender.light} />
        <TopBow x={204} y={229} color={p.cream.base} scale={.67} />
        <path d="M128 195 L125 213 M137 203 L134 221 M181 210 L185 223" fill="none" stroke={p.lavender.light} strokeOpacity=".6" />
      </>;
    case 'top-utility-vest':
      return <>
        <TopNeck color={p.sage.shade} v /><path d="M160 181 V253" stroke={p.charcoal.shade} strokeWidth="3" />
        <path d="M111 185 L144 189 L143 211 L109 207 Z M177 189 L209 185 L211 207 L178 211 Z M105 218 L143 224 L142 246 L102 237 Z M178 224 L215 218 L219 237 L179 246 Z" fill={p.sage.shade} />
        <path d="M111 185 L144 189 L137 198 L116 195 Z M177 189 L209 185 L204 195 L183 198 Z M105 218 L143 224 L136 231 L110 227 Z M178 224 L215 218 L211 227 L185 231 Z" fill={p.sage.light} />
        <g fill={p.charcoal.base}><rect x="121" y="194" width="7" height="5" rx="1" /><rect x="191" y="194" width="7" height="5" rx="1" /></g>
        <path d="M155 193 V205 M154 234 H166" stroke={p.cream.base} strokeWidth="2" />
      </>;
    case 'top-flight-bomber':
      return <>
        <TopNeck color={p.charcoal.shade} /><TopHem color={p.charcoal.shade} />
        <path d="M160 168 V249" stroke={p.grey.light} strokeWidth="2.4" />
        <path d="M157 187 H163 V195 H157 Z" fill={p.cream.base} />
        <path d="M111 211 L137 202 M183 202 L209 211" stroke={p.grey.light} strokeWidth="3" />
        <path d="M179 177 L198 176 L200 193 L181 196 Z" fill={p.sage.base} />
        <path d="M183 184 L187 189 L195 181" fill="none" stroke={p.cream.base} strokeWidth="2" />
        <path d="M104 154 L121 166 M216 154 L199 166 M112 224 Q119 231 128 229 M192 229 Q201 231 208 224" fill="none" stroke={p.grey.base} />
        <path d="M97 238 Q160 258 224 238" stroke={p.grey.base} fill="none" />
      </>;
    case 'top-track-jacket':
      return <>
        <path d="M138 149 Q160 159 182 149 L181 173 Q160 183 139 173 Z" fill={p.navy.shade} />
        <path d="M108 145 Q116 169 116 189 L111 239 M116 147 Q124 169 124 191 L121 243 M212 145 Q204 169 204 189 L209 239 M204 147 Q196 169 196 191 L199 243" fill="none" stroke={p.cream.base} strokeWidth="3" />
        <path d="M160 171 V252" stroke={p.cream.light} strokeWidth="2" />
        <path d="M158 183 V191 M134 215 L143 210 M177 210 L186 215" stroke={p.cream.light} strokeWidth="3" />
        <path d="M179 188 L185 182 L191 188 M181 192 L187 186 L193 192" fill="none" stroke={p.cream.base} strokeWidth="2" />
        <TopHem color={p.navy.shade} />
      </>;
    case 'top-rugby-polo':
      return <>
        <path d="M100 179 Q160 195 220 179 L221 202 Q160 219 99 202 Z M97 222 Q160 240 224 222 L228 243 Q160 263 94 243 Z" fill={p.navy.base} />
        <path d="M131 148 L160 163 L145 183 L122 151 Z M189 148 L160 163 L175 183 L198 151 Z" fill={p.cream.light} />
        <path d="M156 163 H164 V194 H156 Z" fill={p.cream.base} />
        <TopButtons start={171} count={2} color={p.sage.shade} />
        <path d="M183 198 L196 195 L199 209 L188 216 L181 210 Z" fill={p.sand.light} />
        <path d="M187 202 L193 200 L195 207 L189 210 Z" fill={p.sage.shade} />
      </>;
    case 'top-denim-jacket':
      return <>
        <path d="M132 148 L160 165 L145 183 L121 151 Z M188 148 L160 165 L175 183 L199 151 Z" fill={p.denim.light} />
        <path d="M157 168 V252 M164 168 V252 M100 179 Q130 188 153 187 M167 187 Q193 188 220 179 M113 189 L109 237 M207 189 L211 237" fill="none" stroke={p.sand.light} strokeWidth="1.5" />
        <path d="M117 187 L144 191 L142 213 L116 208 Z M176 191 L203 187 L204 208 L178 213 Z" fill={p.denim.shade} />
        <path d="M117 187 L144 191 L131 201 Z M176 191 L203 187 L190 201 Z" fill={p.denim.light} />
        <TopButtons start={181} count={4} color={p.sand.light} />
        <path d="M99 236 Q160 255 223 236 L227 244 Q160 263 95 244 Z" fill={p.denim.shade} />
        <path d="M101 240 Q160 258 220 240" stroke={p.sand.light} strokeDasharray="3 2" fill="none" />
      </>;
    case 'top-tech-anorak':
      return <>
        <path d="M126 147 Q160 161 194 147 L184 174 Q160 187 136 174 Z" fill={p.charcoal.base} />
        <path d="M160 161 V205" stroke={p.cream.base} strokeWidth="2" />
        <path d="M157 179 H163 V188 H157 Z" fill={p.cream.base} />
        <path d="M101 190 Q160 213 220 190 L222 211 Q160 231 98 211 Z" fill={p.sage.base} />
        <path d="M125 209 Q160 220 195 209 L198 230 Q160 244 122 230 Z" fill={p.charcoal.base} />
        <path d="M126 211 Q160 222 194 211" stroke={p.cream.base} strokeWidth="2" fill="none" />
        <path d="M108 231 L108 244 M212 231 L212 244" stroke={p.charcoal.shade} strokeWidth="2" />
        <circle cx="108" cy="240" r="2.5" fill={p.cream.base} /><circle cx="212" cy="240" r="2.5" fill={p.cream.base} />
        <path d="M182 188 L193 185" stroke={p.cream.light} strokeWidth="3" />
      </>;
    case 'top-mesh-jersey':
      return <>
        <TopNeck color={p.cream.light} v />
        <path d="M104 151 Q114 175 111 195 L103 239 M216 151 Q206 175 209 195 L217 239" fill="none" stroke={p.sage.light} strokeWidth="9" />
        <path d="M139 190 H153 V224 H141 V200 H137 V190 Z M163 190 H185 V198 L174 224 H162 L174 200 H163 Z" fill={p.cream.light} />
        <path d="M133 183 Q160 191 188 183" fill="none" stroke={p.sage.light} strokeWidth="3" />
        <path d="M127 209 H129 M125 217 H127 M123 225 H125 M192 209 H194 M194 217 H196 M196 225 H198 M138 235 H140 M150 237 H152 M162 238 H164 M174 237 H176 M186 235 H188" stroke={p.navy.light} strokeWidth="2" />
        <path d="M97 240 Q160 259 224 240" stroke={p.cream.base} strokeWidth="4" fill="none" />
      </>;
    case 'top-padded-gilet':
      return <>
        <path d="M130 148 Q145 154 160 177 Q175 154 190 148 L183 168 L160 193 L137 168 Z" fill={p.charcoal.shade} />
        <path d="M115 149 Q121 175 102 192 M205 149 Q199 175 218 192" stroke={p.grey.light} strokeWidth="4" fill="none" />
        <path d="M106 196 Q128 208 155 207 M165 207 Q192 208 215 196 M101 213 Q128 225 155 224 M165 224 Q192 225 219 213 M98 232 Q127 243 155 242 M165 242 Q192 243 224 232" fill="none" stroke={p.grey.light} strokeOpacity=".65" strokeWidth="2.4" />
        <path d="M160 183 V253" stroke={p.grey.light} strokeWidth="3" />
        <path d="M107 221 L129 226 M191 226 L213 221" stroke={p.charcoal.shade} strokeWidth="4" />
        <path d="M159 199 V207" stroke={p.cream.light} strokeWidth="4" />
      </>;
    case 'top-sailor-shirt':
      return <>
        <path d="M111 144 Q135 150 160 160 Q185 150 209 144 L209 172 L180 180 L160 194 L140 180 L111 172 Z" fill={p.navy.base} />
        <path d="M117 150 V167 L142 174 L160 187 L178 174 L203 167 V150" fill="none" stroke={p.cream.light} strokeWidth="2" />
        <path d="M126 152 L144 168 L160 183 L176 168 L194 152" fill="none" stroke={p.cream.light} strokeWidth="1.5" />
        <TopBow x={160} y={190} color={p.navy.base} scale={.76} />
        <path d="M98 233 Q160 252 223 233 M97 240 Q160 259 224 240" fill="none" stroke={p.navy.base} strokeWidth="3" />
      </>;
    case 'top-double-blazer':
      return <>
        <path d="M133 148 Q160 158 187 148 L171 191 L159 211 L148 185 Z" fill={p.cream.light} />
        <path d="M155 160 H165 L163 168 L169 192 L160 202 L151 192 L157 168 Z" fill={p.sage.shade} />
        <path d="M128 146 L153 184 L144 196 L170 218 L174 253 L151 257 L149 217 L114 179 L126 172 L116 150 Z" fill={p.navy.light} />
        <path d="M192 146 L167 184 L177 195 L156 214 L165 226 L205 180 L194 171 L204 150 Z" fill={p.navy.base} />
        <path d="M109 222 L136 229 M184 229 L212 222 M179 181 L199 177" fill="none" stroke={p.cream.base} strokeWidth="2.5" />
        <TopButtons x={149} start={215} count={2} color={p.sand.light} /><TopButtons x={175} start={215} count={2} color={p.sand.light} />
        <path d="M162 239 L163 258" fill="none" stroke={p.navy.shade} />
      </>;
    case 'top-argyle-vest':
      return <>
        <path d="M106 143 Q119 143 134 149 L160 176 L186 149 Q201 143 214 143 L208 177 L219 190 Q222 218 228 243 Q160 263 95 243 Q98 218 101 190 L112 177 Z" fill={p.sand.base} />
        <path d="M130 148 L160 177 L190 148 L180 150 L160 169 L140 150 Z" fill={p.cream.light} />
        <path d="M132 148 L146 157 L139 172 L123 153 Z M188 148 L174 157 L181 172 L197 153 Z" fill={p.cream.light} />
        <path d="M127 182 L144 206 L127 229 L110 204 Z M160 189 L177 213 L160 237 L143 213 Z M193 182 L210 204 L193 229 L176 206 Z" fill={p.navy.base} />
        <path d="M112 181 L143 222 L160 244 L177 222 L208 181 M111 223 L143 181 L160 203 L177 181 L209 223" fill="none" stroke={p.cream.light} strokeWidth="1.5" />
        <TopHem color={p.sand.shade} />
      </>;
    case 'top-oxford-shirt':
      return <>
        <path d="M131 148 L160 164 L145 184 L122 151 Z M189 148 L160 164 L175 184 L198 151 Z" fill={p.denim.light} />
        <path d="M156 166 V254 M165 166 V254" stroke={p.denim.shade} strokeOpacity=".6" fill="none" />
        <TopButtons start={181} count={4} color={p.cream.light} />
        <g fill={p.cream.light} stroke="none"><circle cx="143" cy="177" r="1.8" /><circle cx="177" cy="177" r="1.8" /></g>
        <path d="M178 186 Q190 190 204 185 L203 209 Q190 220 179 210 Z" fill={p.denim.base} />
        <path d="M179 190 Q190 194 203 189 M115 177 L112 236 M130 184 L129 244 M191 220 L192 246 M208 175 L212 236" fill="none" stroke={p.denim.light} strokeWidth="1.4" />
        <path d="M99 239 Q160 262 224 239" fill="none" stroke={p.denim.shade} strokeOpacity=".65" />
      </>;
    case 'top-duffle-coat':
      return <>
        <path d="M126 147 Q160 166 194 147 L182 171 Q160 187 138 171 Z" fill={p.sand.light} />
        <path d="M160 173 V260" fill="none" stroke={p.sand.shade} strokeWidth="4" />
        <path d="M139 187 H180 M139 207 H180 M139 227 H180" fill="none" stroke={p.charcoal.base} strokeWidth="2" />
        <path d="M144 181 L151 184 L150 191 L143 193 Z M144 201 L151 204 L150 211 L143 213 Z M144 221 L151 224 L150 231 L143 233 Z" fill={p.sand.shade} />
        <g fill={p.cream.light}><rect x="168" y="182" width="16" height="8" rx="4" transform="rotate(7 176 186)" /><rect x="168" y="202" width="16" height="8" rx="4" transform="rotate(7 176 206)" /><rect x="168" y="222" width="16" height="8" rx="4" transform="rotate(7 176 226)" /></g>
        <path d="M104 217 L128 221 L127 241 L102 235 Z M192 221 L216 217 L219 235 L193 241 Z" fill={p.sand.shade} />
        <path d="M105 220 L126 224 M194 224 L215 220" stroke={p.sand.light} fill="none" />
      </>;
    case 'top-herringbone-waistcoat':
      return <>
        <TopNeck color={p.grey.shade} v />
        <path d="M160 182 V250 L146 254 M160 250 L174 254" fill="none" stroke={p.charcoal.shade} strokeWidth="2" />
        <path d="M116 179 L124 184 L116 188 L124 193 L116 197 L124 202 M137 184 L145 189 L137 193 L145 198 L137 202 L145 207 M183 184 L175 189 L183 193 L175 198 L183 202 L175 207 M204 179 L196 184 L204 188 L196 193 L204 197 L196 202 M122 221 L130 226 L122 230 L130 235 M198 221 L190 226 L198 230 L190 235" fill="none" stroke={p.grey.light} strokeOpacity=".75" />
        <TopButtons start={191} count={4} color={p.sand.light} />
        <path d="M107 212 L138 218 M182 218 L213 212" stroke={p.charcoal.shade} strokeWidth="4" />
        <path d="M181 221 Q195 243 211 221" fill="none" stroke={p.sand.light} strokeWidth="1.5" />
        <circle cx="211" cy="220" r="2.5" fill={p.sand.light} />
      </>;
    case 'top-cricket-knit':
      return <>
        <path d="M131 148 L160 184 L189 148" fill="none" stroke={p.navy.base} strokeWidth="8" />
        <path d="M132 148 L160 182 L188 148" fill="none" stroke={p.sage.light} strokeWidth="2" />
        <path d="M114 175 Q125 182 116 191 Q108 200 119 207 Q128 215 117 225 M122 176 Q111 184 119 191 Q127 200 116 208 Q107 216 120 227 M146 193 Q157 201 149 209 Q140 217 152 225 Q160 231 151 237 M154 193 Q143 201 151 209 Q159 217 148 225 Q140 231 149 237 M191 181 Q202 188 194 196 Q185 204 197 213 Q205 220 196 230 M199 180 Q188 188 196 196 Q204 204 193 213 Q185 220 194 231" fill="none" stroke={p.sand.base} strokeWidth="1.7" />
        <TopHem color={p.cream.shade} />
        <path d="M98 239 Q160 258 223 239 M100 244 Q160 262 221 244" fill="none" stroke={p.navy.base} strokeWidth="2" />
      </>;
    case 'top-breton-cape':
      return <>
        <path d="M103 190 Q160 207 219 190 M101 207 Q160 224 222 207 M98 225 Q160 243 225 225" stroke={p.cream.base} strokeWidth="5" fill="none" />
        <path d="M108 145 Q131 147 160 159 Q189 147 212 145 Q218 162 225 185 Q193 197 160 188 Q127 197 95 185 Q102 162 108 145 Z" fill={p.cream.base} />
        <path d="M109 152 Q104 169 101 181 Q130 191 160 182 Q190 191 219 181 Q215 169 211 152" fill="none" stroke={p.navy.base} strokeWidth="2" />
        <TopNeck color={p.navy.base} />
        <path d="M160 168 V189 M155 172 H165 M153 185 Q160 195 167 185" fill="none" stroke={p.navy.base} strokeWidth="2" />
      </>;
    case 'top-leaf-tunic':
      return <>
        <path d="M132 149 Q139 173 160 181 Q181 173 188 149 Q170 161 160 162 Q150 161 132 149 Z" fill={p.sage.light} />
        <path d="M160 162 L160 180 M142 157 L148 170 M178 157 L172 170" stroke={p.sage.shade} fill="none" />
        <path d="M101 222 Q160 243 222 222 L225 231 Q160 252 97 231 Z" fill={p.sand.shade} />
        <rect x="151" y="232" width="19" height="11" rx="2" fill={p.sand.light} /><path d="M156 236 H166 V240 H156 Z" fill={p.sand.shade} />
        <path d="M181 188 Q204 183 200 205 Q182 210 181 188 Z M139 207 Q122 187 112 204 Q122 224 139 207 Z" fill={p.sage.light} />
        <path d="M185 192 L197 204 M185 198 L191 197 M191 203 L194 198 M135 207 L116 205 M129 206 L125 213 M124 206 L122 201" fill="none" stroke={p.sage.shade} />
        <path d="M100 246 L143 257 L159 247 L175 257 L222 246" fill="none" stroke={p.sand.light} strokeDasharray="3 3" />
      </>;
    case 'top-moon-robe':
      return <>
        <path d="M130 148 Q135 173 149 198 L147 251 M190 148 Q185 173 171 198 L173 251" fill="none" stroke={p.sand.light} strokeWidth="5" />
        <path d="M123 154 Q128 179 140 196 M197 154 Q192 179 180 196" fill="none" stroke={p.navy.light} strokeWidth="2" />
        <path d="M126 199 C106 198 106 224 125 224 Q115 219 116 211 Q117 203 126 199 Z" fill={p.cream.light} />
        <TopStar x={199} y={216} scale={.55} /><TopStar x={119} y={238} scale={.35} />
        <path d="M145 207 Q160 217 175 207 M145 210 Q160 220 175 210" fill="none" stroke={p.sand.base} />
        <path d="M160 215 L166 237 L160 243 L154 237 Z" fill={p.sand.base} />
        <path d="M100 240 Q121 248 144 251 M176 251 Q199 248 222 240" fill="none" stroke={p.sand.light} strokeDasharray="2 4" strokeWidth="2" />
      </>;
    case 'top-star-capelet':
      return <>
        <path d="M108 144 Q132 148 160 159 Q188 148 212 144 Q221 165 226 187 Q211 198 192 198 L160 186 L128 198 Q109 198 94 187 Q99 165 108 144 Z" fill={p.navy.base} />
        <path d="M108 150 Q103 168 100 184 Q112 193 129 192 L160 181 L191 192 Q208 193 220 184 Q217 168 212 150" fill="none" stroke={p.sand.light} strokeWidth="2" />
        <TopStar x={160} y={173} scale={.9} />
        <path d="M126 209 L146 200 L167 220 L193 206 L205 228 L178 239 L167 220" fill="none" stroke={p.grey.light} strokeWidth="1.3" />
        <g fill={p.cream.light}><circle cx="126" cy="209" r="2.2" /><circle cx="146" cy="200" r="2" /><circle cx="167" cy="220" r="2.5" /><circle cx="193" cy="206" r="2" /><circle cx="205" cy="228" r="2.3" /><circle cx="178" cy="239" r="2" /></g>
        <TopHem color={p.navy.shade} />
      </>;
    case 'top-fairy-petal':
      return <>
        <path d="M116 149 Q130 150 142 155 L160 178 Q143 183 130 172 Z M204 149 Q190 150 178 155 L160 178 Q177 183 190 172 Z" fill={p.mint.light} />
        <path d="M160 180 Q151 211 138 255 M160 180 Q169 211 181 255 M133 183 Q120 214 112 251 M187 183 Q200 214 207 251" fill="none" stroke={p.mint.shade} strokeOpacity=".6" />
        <path d="M102 219 Q132 226 160 230 Q188 226 220 219" fill="none" stroke={p.sage.shade} strokeWidth="2" />
        <TopFlower x={140} y={226} color={p.cream.light} scale={.55} /><TopFlower x={162} y={231} color={p.blush.light} scale={.7} /><TopFlower x={184} y={225} color={p.cream.light} scale={.55} />
        <path d="M122 222 Q114 211 111 218 Q111 225 122 222 M200 222 Q208 211 211 218 Q211 225 200 222" fill={p.sage.base} />
        <path d="M115 195 Q125 202 129 195 M191 195 Q195 202 205 195" fill="none" stroke={p.cream.light} strokeWidth="1.8" />
      </>;
    case 'top-adventurer-jacket':
      return <>
        <path d="M130 148 L158 169 L142 185 L120 152 Z M190 148 L162 169 L178 185 L200 152 Z" fill={p.sand.light} />
        <path d="M160 171 V259" stroke={p.sand.shade} strokeWidth="3" />
        <path d="M111 188 L142 192 L141 214 L110 210 Z M178 192 L208 188 L210 210 L179 214 Z" fill={p.sand.shade} />
        <path d="M111 188 L142 192 L127 202 Z M178 192 L208 188 L193 202 Z" fill={p.sand.light} />
        <path d="M98 224 Q160 243 224 224 L227 235 Q160 254 94 235 Z" fill={p.charcoal.base} />
        <rect x="150" y="235" width="22" height="13" rx="2" fill={p.sand.light} /><path d="M155 239 H168 V244 H155 Z" fill={p.charcoal.base} />
        <path d="M110 146 L130 163 M210 146 L190 163" stroke={p.sand.shade} strokeWidth="6" />
        <circle cx="180" cy="185" r="6" fill={p.sage.base} /><path d="M180 180 L182 185 L180 190 L178 185 Z" fill={p.cream.light} />
        <path d="M104 243 L133 251 M187 251 L216 243" stroke={p.sand.light} strokeDasharray="3 2" fill="none" />
      </>;
    case 'top-dragon-scale':
      return <>
        <TopNeck color={p.charcoal.base} v />
        <path d="M113 151 Q121 176 102 192 M207 151 Q199 176 218 192" fill="none" stroke={p.charcoal.base} strokeWidth="4" />
        <g fill={p.sage.base}>
          <path d="M111 189 Q123 181 135 190 Q131 206 123 210 Q115 204 111 189 Z M140 192 Q152 185 164 195 Q160 210 152 214 Q144 208 140 192 Z M169 195 Q181 185 193 192 Q189 208 181 214 Q173 210 169 195 Z" />
          <path d="M103 211 Q115 203 127 213 Q123 229 115 233 Q107 227 103 211 Z M132 215 Q145 207 157 217 Q153 233 145 237 Q137 231 132 215 Z M162 217 Q175 207 187 215 Q183 231 175 237 Q167 233 162 217 Z M192 213 Q204 203 216 211 Q212 227 204 233 Q196 229 192 213 Z" />
        </g>
        <path d="M116 193 L123 203 M145 196 L152 207 M174 199 L181 208 M108 215 L115 227 M137 219 L145 230 M168 220 L175 230 M197 216 L204 226" fill="none" stroke={p.mint.light} strokeOpacity=".7" />
        <TopHem color={p.charcoal.base} />
      </>;
    case 'top-cloud-courier':
      return <>
        <path d="M129 148 L151 160 L146 178 L124 153 Z M191 148 L169 160 L174 178 L196 153 Z" fill={p.cream.base} />
        <path d="M151 161 L159 172 L169 160 L173 168 L160 185 L147 168 Z" fill={p.sand.base} />
        <path d="M145 184 L145 249" stroke={p.cream.base} strokeWidth="3" /><TopButtons x={145} start={193} count={3} color={p.cream.light} />
        <path d="M174 191 L201 185 L207 210 L180 217 Z" fill={p.cream.light} />
        <path d="M174 191 L191 200 L201 185 M180 217 L188 201 M207 210 L195 199" fill="none" stroke={p.denim.shade} />
        <path d="M108 211 Q104 205 111 202 Q114 192 122 199 Q131 196 133 206 Q140 213 132 216 L115 217 Z" fill={p.cream.base} />
        <path d="M104 227 L126 229 M110 233 L132 235" fill="none" stroke={p.cream.light} strokeWidth="2" />
        <TopHem color={p.denim.shade} />
      </>;
    case 'top-crystal-armor':
      return <>
        <path d="M131 148 Q160 163 189 148 L183 173 L160 183 L137 173 Z" fill={p.grey.base} />
        <path d="M137 154 L143 168 L160 176 L177 168 L183 154" fill="none" stroke={p.cream.light} strokeWidth="2" />
        <path d="M160 185 L182 207 L174 228 L160 239 L146 228 L138 207 Z" fill={p.lavender.light} />
        <path d="M160 185 L151 207 L160 239 L169 207 Z" fill={p.denim.light} />
        <path d="M138 207 H182 M151 207 L146 228 M169 207 L174 228" fill="none" stroke={p.lavender.shade} />
        <path d="M110 184 L128 191 L124 211 L106 204 Z M210 184 L192 191 L196 211 L214 204 Z" fill={p.grey.base} />
        <path d="M114 191 L122 195 L120 204 M206 191 L198 195 L200 204" fill="none" stroke={p.cream.light} />
        <path d="M101 231 L139 243 L160 252 L181 243 L220 231 M101 239 L142 252 M178 252 L219 239" fill="none" stroke={p.grey.shade} strokeWidth="3" />
      </>;
  }
}

export function TopCollectionGraphic({ itemId, layer, drinking }: { itemId: string; layer: OutfitLayer; drinking: boolean }): ReactNode {
  const item = TOP_COLLECTION_ITEMS.find(candidate => candidate.id === itemId);
  if (!item) return null;
  const material: TopMaterial = materials[item.id];
  if (layer === 'back') return <TopBack material={material} />;
  if (layer === 'sleeve') return <TopSleeves material={material} drinking={drinking} raised />;
  if (layer !== 'body') return null;
  return <g aria-hidden="true">
    <TopSleeves material={material} drinking={drinking} />
    <TopBody material={material}><TopDetails itemId={item.id} /></TopBody>
  </g>;
}
