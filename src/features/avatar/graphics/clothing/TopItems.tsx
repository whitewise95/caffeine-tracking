import type { ReactNode } from 'react';
import type { ClothingLayer } from '../ClothingItems';
import { GarmentSurface } from './GarmentSurface';
import { garmentPalettes, type GarmentPalette } from './garmentPalette';

// These curves follow the jelly's shoulders, short fins and rounded waist.
// The bowed hem overlaps the bottoms' waistband, including at its outer edges.
const torso = 'M103 142 C113 141 124 147 135 149 Q160 162 185 149 C196 147 207 141 217 142 C219 155 221 171 221 188 C222 207 229 226 229 243 Q160 263 94 243 C94 226 99 208 99 188 C99 171 101 155 103 142 Z';
const leftSleeve = 'M105 141 C94 149 80 165 72 182 C67 192 64 201 67 208 Q75 217 87 212 C99 204 108 188 113 171 Q118 156 116 148 Q111 143 105 141 Z';
const leftShortSleeve = 'M105 141 C93 149 82 162 75 175 Q82 186 97 190 C106 180 114 163 116 148 Q111 143 105 141 Z';

type SleeveStyle = 'short' | 'long';
type SleeveMaterial = { palette: GarmentPalette; cuff: string; style?: SleeveStyle; striped?: boolean; opacity?: number };

const sleeveMaterials: Record<string, SleeveMaterial> = {
  'top-tee': { palette: garmentPalettes.cream, cuff: '#BBB6A9', style: 'short' },
  'top-striped': { palette: garmentPalettes.cream, cuff: '#778391', striped: true },
  'top-sweatshirt': { palette: garmentPalettes.sage, cuff: '#667D74' },
  'top-hoodie': { palette: garmentPalettes.lavender, cuff: '#8D8298' },
  'top-zip-hoodie': { palette: garmentPalettes.navy, cuff: '#43576A' },
  'top-cardigan': { palette: garmentPalettes.sand, cuff: '#A19279' },
  'top-varsity': { palette: garmentPalettes.cream, cuff: '#536E65' },
  'top-windbreaker': { palette: garmentPalettes.denim, cuff: '#41586B' },
  'top-raincoat': { palette: garmentPalettes.mint, cuff: '#C4DCD1', opacity: .2 },
};

function Sleeves({ palette, cuff, drinking, style = 'long', raised = false, striped = false, opacity = 1 }: SleeveMaterial & {
  drinking: boolean;
  raised?: boolean;
}) {
  if (raised) {
    if (!drinking) return null;
    // The sleeve reaches the outer shoulder and bends around the elbow. Its
    // diagonal cuff opens toward the visible glass hand, beside the cup.
    const raisedPath = style === 'short'
      ? 'M235 145 Q247 151 254 162 Q247 175 232 183 L222 175 Q232 163 235 145 Z'
      : 'M235 144 C250 151 263 171 264 185 C265 196 256 205 245 205 C232 205 221 198 216 187 Q213 179 217 171 Q230 165 235 144 Z';
    return <g stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
      <GarmentSurface d={raisedPath} palette={palette} opacity={opacity} />
      <path d={style === 'short'
        ? 'M249 157 Q244 168 229 178 L233 184 Q248 176 255 163 Z'
        : 'M235 144 Q231 162 217 171 L222 178 Q238 167 242 149 Z'} fill={cuff} fillOpacity={opacity} />
      <path d={style === 'short' ? 'M240 157 Q238 168 230 175' : 'M222 186 Q232 199 247 199 Q255 197 258 189'} fill="none" stroke={palette.shade} strokeOpacity=".45" strokeWidth="2" />
      <path d={style === 'short' ? 'M239 151 Q246 156 249 162' : 'M243 154 Q256 167 258 181'} fill="none" stroke={palette.light} strokeOpacity=".6" strokeWidth="1.3" />
      {striped && <path d="M241 162 Q252 165 257 175 M232 179 Q246 182 262 183 M228 191 Q241 198 255 195" fill="none" stroke="#637184" strokeWidth="3.5" strokeOpacity=".8" />}
    </g>;
  }
  const sleeve = <g>
    <GarmentSurface d={style === 'short' ? leftShortSleeve : leftSleeve} palette={palette} opacity={opacity} />
    {style === 'short'
      ? <path d="M77 172 Q85 182 99 186 L96 193 Q82 189 73 179 Z" fill={cuff} fillOpacity={opacity} />
      : <path d="M66 201 Q75 209 91 205 L86 214 Q75 220 67 211 Z" fill={cuff} fillOpacity={opacity} />}
    {striped && <path d="M88 158 Q96 167 109 171 M78 175 Q86 184 101 186 M70 192 Q79 201 93 199" fill="none" stroke="#637184" strokeWidth="4" strokeOpacity=".8" />}
    <path d="M98 150 Q81 169 75 186" fill="none" stroke={palette.light} strokeOpacity=".55" strokeWidth="1.5" />
    {style === 'long' && <path d="M82 201 Q91 192 95 184" fill="none" stroke={palette.shade} strokeOpacity=".4" />}
  </g>;
  return <g stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
    {sleeve}
    {drinking
      ? <GarmentSurface d="M212 142 Q224 138 239 147 L235 153 Q225 147 219 150 L219 162 Q220 170 224 174 L218 180 Q212 165 212 142 Z" palette={palette} opacity={opacity} />
      : <g transform="translate(320 0) scale(-1 1)">{sleeve}</g>}
  </g>;
}

function Body({ palette, children }: { palette: GarmentPalette; children?: ReactNode }) {
  return <g stroke={palette.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
    <GarmentSurface d={torso} palette={palette} />
    <path d="M104 173 Q107 190 103 211 M100 229 L100 239 Q160 257 220 239" fill="none" stroke={palette.light} strokeOpacity=".45" />
    <path d="M214 177 Q214 216 222 241 Q160 260 98 241 L99 236 Q159 252 214 237 Q208 207 214 177 Z" fill={palette.shade} fillOpacity=".2" stroke="none" />
    <path d="M111 156 Q105 171 104 188 M209 156 Q215 171 216 188" fill="none" stroke={palette.shade} strokeOpacity=".3" />
    {children}
  </g>;
}

function RoundNeck({ color }: { color: string }) {
  return <g>
    <path d="M134 148 Q160 162 186 148 L188 154 Q160 172 132 154 Z" fill={color} />
    <path d="M137 152 Q160 165 183 152" fill="none" stroke="#F0EEE4" strokeOpacity=".3" />
  </g>;
}

function RibbedHem({ color }: { color: string }) {
  return <g>
    <path d="M95 234 Q161 253 228 234 L229 243 Q160 263 94 243 Z" fill={color} />
    <path d="M103 238 L102 244 M114 241 L113 247 M126 244 L125 249 M138 246 V252 M150 247 V253 M162 248 V253 M174 247 V252 M186 246 L187 251 M198 243 L199 249 M210 240 L211 245 M220 237 L221 242" fill="none" stroke="#F5F0E3" strokeOpacity=".2" />
    <path d="M99 237 Q160 255 221 237" fill="none" stroke="#18232A" strokeOpacity=".14" />
  </g>;
}

function RearCollar({ itemId }: { itemId: string }) {
  const material = sleeveMaterials[itemId];
  const palette = material?.palette ?? garmentPalettes.sand;
  if (itemId === 'top-hoodie' || itemId === 'top-zip-hoodie') return <g>
    <GarmentSurface d="M100 157 C88 143 96 125 111 126 Q160 145 209 126 C225 125 232 143 220 157 L201 177 Q160 188 119 177 Z" palette={palette} />
    <path d="M100 145 Q99 132 111 133 M209 133 Q221 133 221 145" fill="none" stroke={palette.light} strokeOpacity=".55" strokeWidth="1.3" strokeLinecap="round" />
  </g>;
  if (itemId === 'top-raincoat') return <g>
    <GarmentSurface d="M99 160 Q91 148 100 134 Q104 129 112 127 Q160 144 208 127 Q225 130 224 149 L220 165 L204 178 H116 Z" palette={garmentPalettes.mint} opacity={.17} />
    <path d="M100 145 Q100 137 106 133" fill="none" stroke="#E2EEE2" strokeOpacity=".65" strokeWidth="1.5" strokeLinecap="round" />
  </g>;
  return <GarmentSurface d="M100 149 Q98 139 108 137 Q160 150 212 137 Q222 139 220 149 Q160 170 100 149 Z" palette={palette} />;
}

export function TopItem({ itemId, layer, drinking }: { itemId: string; layer: ClothingLayer; drinking: boolean }): ReactNode {
  const material = sleeveMaterials[itemId];
  if (!material && itemId !== 'top-knit-vest') return null;
  if (layer === 'sleeve') return material ? <Sleeves {...material} drinking={drinking} raised /> : null;
  if (layer === 'back') return <RearCollar itemId={itemId} />;
  if (layer !== 'body') return null;

  let body: ReactNode;
  switch (itemId) {
    case 'top-tee':
      body = <Body palette={garmentPalettes.cream}>
        <RoundNeck color="#BBB6A9" />
        <path d="M178 177 Q189 180 201 176 L200 193 Q190 204 180 196 Z" fill="#C5BDAA" />
        <path d="M180 181 Q189 183 198 180 M100 238 Q160 255 220 238" fill="none" stroke="#96998F" strokeOpacity=".7" />
        <path d="M107 214 Q111 222 109 230 M209 223 Q214 228 214 235" fill="none" stroke="#999B91" strokeOpacity=".35" />
      </Body>;
      break;
    case 'top-striped':
      body = <Body palette={garmentPalettes.cream}>
        <path d="M101 173 Q160 188 219 173 M100 191 Q160 207 220 191 M99 209 Q160 226 222 209 M96 228 Q160 246 224 228" fill="none" stroke="#637184" strokeWidth="5" strokeOpacity=".86" />
        <RoundNeck color="#6D7988" />
        <path d="M99 239 Q160 257 221 239" fill="none" stroke="#A1A39A" />
      </Body>;
      break;
    case 'top-sweatshirt':
      body = <Body palette={garmentPalettes.sage}>
        <RoundNeck color="#667D74" />
        <path d="M153 165 Q160 176 167 165 M112 150 Q123 160 126 178 M208 150 Q197 160 194 178" fill="none" stroke="#B2C4B7" strokeOpacity=".65" />
        <path d="M145 195 Q160 188 175 195" fill="none" stroke="#D2D8C9" strokeOpacity=".6" />
        <path d="M105 213 Q113 219 111 231 M215 214 Q207 220 209 231" fill="none" stroke="#526E62" strokeOpacity=".4" />
        <RibbedHem color="#667D74" />
      </Body>;
      break;
    case 'top-hoodie':
      body = <Body palette={garmentPalettes.lavender}>
        <path d="M129 146 Q160 164 191 146 Q185 159 181 164 Q160 175 139 164 Q134 157 129 146 Z" fill="#C3B7C7" />
        <path d="M138 155 Q160 167 182 155" fill="none" stroke="#786C85" strokeOpacity=".6" />
        <path d="M141 163 Q138 176 140 187 M179 163 Q182 176 180 187" fill="none" stroke="#E4D9DF" strokeWidth="1.7" />
        <path d="M140 185 V189 M180 185 V189" fill="none" stroke="#6F647C" strokeWidth="2.4" />
        <path d="M136 203 Q160 211 184 203 Q188 215 195 224 Q160 237 125 224 Q132 215 136 203 Z" fill="#998BA3" />
        <path d="M136 206 Q133 213 130 219 M184 206 Q187 213 190 219 M131 225 Q160 234 189 225" fill="none" stroke="#D1C4D0" strokeOpacity=".7" />
        <RibbedHem color="#8D8298" />
      </Body>;
      break;
    case 'top-zip-hoodie':
      body = <g stroke={garmentPalettes.navy.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
        <GarmentSurface d="M103 142 Q116 141 132 148 C139 160 145 174 146 191 Q146 221 143 252 Q118 250 94 243 C94 226 99 208 99 188 Q98 163 103 142 Z" palette={garmentPalettes.navy} />
        <GarmentSurface d="M217 142 Q204 141 188 148 C181 160 175 174 174 191 Q174 221 177 252 Q203 250 229 243 C229 226 222 208 221 188 Q222 163 217 142 Z" palette={garmentPalettes.navy} />
        <path d="M130 146 Q140 159 146 178 L139 188 Q126 171 121 150 Z M190 146 Q180 159 174 178 L181 188 Q194 171 199 150 Z" fill="#8B9BA8" />
        <path d="M145 184 Q147 215 143 249 M175 184 Q173 215 177 249" fill="none" stroke="#C4CEC9" strokeWidth="2" />
        <path d="M143 190 Q145 218 141 245 M177 190 Q175 218 179 245" fill="none" stroke="#34485B" strokeDasharray="2 3" />
        <path d="M109 211 Q120 209 131 203 L133 224 Q120 231 106 229 Z M211 211 Q200 209 189 203 L187 224 Q200 231 214 229 Z" fill="#4C6379" />
        <path d="M110 214 Q122 211 128 208 M210 214 Q198 211 192 208" fill="none" stroke="#9CADB6" strokeOpacity=".65" />
        <path d="M97 237 Q119 245 140 247 M180 247 Q201 245 223 237" fill="none" stroke="#3E5266" strokeWidth="6" />
        <path d="M130 164 Q127 175 129 188 M190 164 Q193 175 191 188" fill="none" stroke="#C8D0CC" strokeWidth="1.5" />
        <path d="M176 237 V244" fill="none" stroke="#D9DCCC" strokeWidth="2.8" />
        <path d="M105 176 Q103 198 106 204 M215 176 Q217 198 214 204" fill="none" stroke="#B8C8CC" strokeOpacity=".3" />
      </g>;
      break;
    case 'top-knit-vest':
      body = <g stroke={garmentPalettes.sand.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
        <GarmentSurface d="M111 145 Q122 145 135 150 Q149 163 160 178 Q171 163 185 150 Q198 145 209 145 C206 164 208 180 221 190 C222 207 229 226 229 243 Q160 263 94 243 C94 226 99 208 99 190 C112 180 114 164 111 145 Z" palette={garmentPalettes.sand} />
        <path d="M132 149 Q148 165 160 183 Q172 165 188 149 L181 151 Q169 165 160 175 Q151 165 139 151 Z" fill="#DED3B8" />
        <path d="M112 148 Q119 174 101 192 M208 148 Q201 174 219 192" fill="none" stroke="#DAD0B4" strokeWidth="4" />
        <path d="M130 187 Q142 194 133 203 Q125 211 137 218 Q142 223 135 230 M158 192 Q170 199 161 208 Q153 216 165 223 Q170 228 163 235 M186 187 Q198 194 189 203 Q181 211 193 218 Q198 223 191 230" fill="none" stroke="#E3D8BE" strokeWidth="2.3" strokeOpacity=".8" />
        <path d="M137 187 Q125 194 134 203 Q142 211 130 218 Q125 223 132 230 M165 192 Q153 199 162 208 Q170 216 158 223 Q153 228 160 235 M193 187 Q181 194 190 203 Q198 211 186 218 Q181 223 188 230" fill="none" stroke="#897E67" strokeOpacity=".65" />
        <RibbedHem color="#A39578" />
      </g>;
      break;
    case 'top-cardigan':
      body = <g stroke={garmentPalettes.sand.edge} strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
        <GarmentSurface d="M103 142 Q116 141 131 148 C133 166 138 185 148 202 Q149 227 148 253 Q119 251 94 243 C94 226 99 208 99 188 Q98 163 103 142 Z" palette={garmentPalettes.sand} />
        <GarmentSurface d="M217 142 Q204 141 189 148 C187 166 182 185 172 202 Q171 227 172 253 Q202 251 229 243 C229 226 222 208 221 188 Q222 163 217 142 Z" palette={garmentPalettes.sand} />
        <path d="M130 148 C132 169 139 190 147 204 Q149 228 147 250 M190 148 C188 169 181 190 173 204 Q171 228 173 250" fill="none" stroke="#E0D0B5" strokeWidth="6" />
        <path d="M109 210 Q121 213 134 210 L134 229 Q122 236 108 229 Z M186 210 Q199 213 211 210 L212 229 Q198 236 186 229 Z" fill="#AA997E" />
        <path d="M112 214 Q121 216 131 214 M189 214 Q199 216 208 214 M99 239 Q120 247 141 249 M179 249 Q200 247 221 239" fill="none" stroke="#DDCDB1" />
        <g fill="#817763" stroke="none"><circle cx="173" cy="209" r="2.1" /><circle cx="172" cy="224" r="2.1" /><circle cx="173" cy="239" r="2.1" /></g>
        <path d="M145 209 H148 M146 224 H149 M145 239 H148" fill="none" stroke="#8F7D64" />
        <path d="M106 173 Q104 187 105 198 M214 173 Q216 187 215 198" fill="none" stroke="#E4D9BF" strokeOpacity=".45" />
      </g>;
      break;
    case 'top-varsity':
      body = <Body palette={garmentPalettes.sage}>
        <path d="M133 148 Q160 163 187 148 L188 155 Q160 174 132 155 Z" fill="#DFD4B9" />
        <path d="M136 153 Q160 167 184 153 M160 168 V247" fill="none" stroke="#556E65" strokeWidth="2" />
        <RibbedHem color="#D2C6AA" />
        <path d="M98 239 Q160 258 222 239" fill="none" stroke="#536E65" strokeWidth="2" />
        <path d="M111 217 Q121 211 132 208 M209 217 Q199 211 188 208" fill="none" stroke="#DED4BB" strokeWidth="3.5" />
        <path d="M179 179 L184 196 L189 181 L194 196 L199 179" fill="none" stroke="#E2D8BF" strokeWidth="3" />
        <g fill="#E5DDC9" stroke="none"><circle cx="160" cy="181" r="2" /><circle cx="160" cy="197" r="2" /><circle cx="160" cy="213" r="2" /><circle cx="160" cy="229" r="2" /></g>
      </Body>;
      break;
    case 'top-windbreaker':
      body = <Body palette={garmentPalettes.denim}>
        <path d="M103 142 Q118 141 134 149 Q145 167 160 169 Q175 167 186 149 Q202 141 217 142 Q220 160 221 177 Q194 184 160 196 Q126 184 99 177 Q100 160 103 142 Z" fill="#ACBFC0" stroke="none" />
        <path d="M140 151 Q160 161 180 151 L179 171 Q160 179 141 171 Z" fill="#435A6B" />
        <path d="M160 172 V248 M109 214 Q123 206 135 203 M211 214 Q197 206 185 203" fill="none" stroke="#354D62" strokeWidth="1.7" />
        <path d="M160 180 V188" fill="none" stroke="#E0E4D7" strokeWidth="2.5" />
        <path d="M98 239 Q160 258 222 239" fill="none" stroke="#4A657C" strokeWidth="5" />
        <path d="M110 231 L108 240 M210 231 L212 240 M179 193 H190" fill="none" stroke="#D4DFD9" strokeWidth="1.7" />
        <path d="M105 190 Q111 199 108 205 M216 222 Q208 227 212 234" fill="none" stroke="#A8BFCD" strokeOpacity=".5" />
      </Body>;
      break;
    case 'top-raincoat':
      body = <g stroke="#B1C9BE" strokeWidth="1.15" strokeLinejoin="round" strokeLinecap="round">
        <GarmentSurface d="M103 142 Q116 142 135 149 Q160 163 185 149 Q204 142 217 142 Q222 163 221 188 C222 214 227 236 230 249 Q160 270 90 249 C93 236 98 213 99 188 Q98 163 103 142 Z" palette={garmentPalettes.mint} opacity={.18} />
        <path d="M135 148 Q147 157 159 169 L145 182 Q132 170 126 151 Z M185 148 Q173 157 161 169 L175 182 Q188 170 194 151 Z" fill="#D6E8DC" fillOpacity=".26" />
        <path d="M160 171 V259 M95 245 Q160 265 225 245" fill="none" strokeOpacity=".75" />
        <path d="M110 211 Q125 215 141 211 L140 232 Q126 239 109 232 Z M179 211 Q195 215 210 211 L211 232 Q194 239 180 232 Z" fill="#DFECE0" fillOpacity=".13" />
        <path d="M110 211 Q125 215 141 211 M179 211 Q195 215 210 211 M107 158 Q103 174 104 192 M100 219 L97 239" fill="none" stroke="#E8F3E6" strokeOpacity=".7" strokeWidth="1.7" />
        <path d="M213 164 Q217 179 216 193 M219 224 Q222 235 223 240" fill="none" stroke="#678D80" strokeOpacity=".5" />
        <g fill="#DEEDDC" stroke="none"><circle cx="160" cy="189" r="2" /><circle cx="160" cy="211" r="2" /><circle cx="160" cy="233" r="2" /></g>
      </g>;
      break;
    default:
      return null;
  }
  return <g aria-hidden="true">{material && <Sleeves {...material} drinking={drinking} />}{body}</g>;
}
