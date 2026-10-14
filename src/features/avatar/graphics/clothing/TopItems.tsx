import type { ReactNode } from 'react';
import type { ClothingLayer } from '../ClothingItems';

const edge = '#5B616B';
const seam = '#F4EEE3';
const torso = 'M106 149 Q123 155 137 151 Q160 165 183 151 Q201 155 214 149 L217 180 Q214 210 222 239 Q162 250 99 239 Q105 207 103 180 Z';
const leftSleeve = 'M106 149 Q86 157 74 180 Q66 197 69 208 Q74 218 86 214 L106 188 Z';
const leftShortSleeve = 'M106 149 Q86 156 75 177 L92 193 Q103 187 110 176 Z';

type SleeveStyle = 'short' | 'long';

function Sleeves({ fill, cuff, drinking, style = 'long', raised = false, striped = false }: {
  fill: string;
  cuff: string;
  drinking: boolean;
  style?: SleeveStyle;
  raised?: boolean;
  striped?: boolean;
}) {
  if (raised) {
    if (!drinking) return null;
    // The cup is held by the exposed upper-left hand. Cloth follows the lower
    // shoulder and elbow, with its cuff ending before that glass hand.
    return <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round">
      <path d={style === 'short'
        ? 'M216 179 L235 176 L253 187 Q260 197 246 202 Q234 207 223 196 Z'
        : 'M215 179 L226 172 L236 158 Q249 161 257 177 Q266 190 254 199 Q240 208 224 197 Z'} fill={fill} />
      <path d={style === 'short' ? 'M235 176 Q243 181 253 187' : 'M226 172 Q230 161 236 158 L243 162 Q236 168 232 177 Z'} fill={cuff} />
      <path d="M225 187 Q237 201 250 195" fill="none" stroke="#111821" strokeOpacity=".17" strokeWidth="3" />
      {striped && <path d="M235 178 Q247 183 257 187" fill="none" stroke="#747C8B" strokeWidth="4" />}
    </g>;
  }
  const sleeve = <g>
    <path d={style === 'short' ? leftShortSleeve : leftSleeve} fill={fill} />
    {style === 'short'
      ? <path d="M77 176 L94 190 L91 195 L73 180 Z" fill={cuff} />
      : <path d="M68 201 Q77 209 90 205 L87 214 Q75 221 69 211 Z" fill={cuff} />}
    {striped && <path d="M86 163 L103 175 M77 178 L96 190 M70 193 L91 204" fill="none" stroke="#747C8B" strokeWidth="4" />}
    <path d="M100 155 Q83 168 77 185" fill="none" stroke={seam} strokeOpacity=".22" />
  </g>;
  return <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round">
    {sleeve}
    {!drinking && <g transform="translate(320 0) scale(-1 1)">{sleeve}</g>}
  </g>;
}

function Body({ fill, children }: { fill: string; children?: ReactNode }) {
  return <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
    <path d={torso} fill={fill} />
    <path d="M109 180 Q112 209 106 235 Q160 245 216 235" fill="none" stroke="#FFF7E7" strokeOpacity=".16" />
    <path d="M210 187 Q209 215 216 234 L217 238 Q164 247 104 238 L105 232 Q162 242 208 231 Z" fill="#111821" fillOpacity=".1" stroke="none" />
    {children}
  </g>;
}

function RoundNeck({ color }: { color: string }) {
  return <path d="M136 151 Q160 165 184 151 L186 157 Q160 174 134 157 Z" fill={color} />;
}

function RibbedHem({ color }: { color: string }) {
  return <g>
    <path d="M100 230 Q160 242 220 230 L222 239 Q161 252 98 239 Z" fill={color} />
    <path d="M110 234 V240 M120 236 V242 M130 238 V244 M140 239 V245 M150 240 V246 M160 240 V246 M170 240 V246 M180 239 V245 M190 238 V244 M200 236 V242 M210 234 V240" fill="none" stroke="#F8F1DF" strokeOpacity=".22" />
  </g>;
}

const sleeveMaterials: Record<string, { fill: string; cuff: string; style?: SleeveStyle; striped?: boolean }> = {
  'top-tee': { fill: '#DBD7CB', cuff: '#CBC6B8', style: 'short' },
  'top-striped': { fill: '#DBDBD5', cuff: '#A5ADB1', striped: true },
  'top-sweatshirt': { fill: '#7C898C', cuff: '#657578' },
  'top-hoodie': { fill: '#AE9DAE', cuff: '#927F94' },
  'top-zip-hoodie': { fill: '#687586', cuff: '#505F72' },
  'top-cardigan': { fill: '#C6B39A', cuff: '#A89277' },
  'top-varsity': { fill: '#E3D7BD', cuff: '#556D69' },
  'top-windbreaker': { fill: '#7F9FAD', cuff: '#455D6B' },
  'top-raincoat': { fill: 'rgba(169, 217, 208, .2)', cuff: 'rgba(195, 229, 222, .35)' },
};

export function TopItem({ itemId, layer, drinking }: { itemId: string; layer: ClothingLayer; drinking: boolean }): ReactNode {
  const material = sleeveMaterials[itemId];
  if (layer === 'sleeve') return material ? <Sleeves {...material} drinking={drinking} raised /> : null;
  if (layer === 'back') {
    if (itemId === 'top-hoodie' || itemId === 'top-zip-hoodie') return <g stroke={edge} strokeWidth="1.4">
      <path d="M104 158 C89 140 97 123 115 128 Q160 150 204 128 C225 123 232 145 216 160 L194 178 H126 Z" fill={itemId === 'top-hoodie' ? '#8E7B91' : '#4D5B70'} />
      <path d="M105 146 Q102 132 115 135 M205 135 Q218 134 218 147" fill="none" stroke={seam} strokeOpacity=".35" />
    </g>;
    if (itemId === 'top-raincoat') return <g stroke="#ABCBC5" strokeWidth="1.4">
      <path d="M103 164 Q91 155 97 142 L105 129 Q159 145 214 129 Q230 145 219 165 L205 179 H119 Z" fill="#BDDFD7" fillOpacity=".13" />
      <path d="M101 147 Q101 137 107 135" fill="none" stroke="#F4FFF4" strokeOpacity=".7" />
    </g>;
    return null;
  }
  if (layer !== 'body') return null;

  let body: ReactNode;
  switch (itemId) {
    case 'top-tee':
      body = <Body fill="#DBD7CB"><RoundNeck color="#C0BCAE" /><path d="M179 177 H199 V195 Q189 204 179 195 Z" fill="#CEC9BC" /><path d="M180 181 H198 M108 232 Q160 242 213 232" fill="none" stroke="#A5A69F" /></Body>;
      break;
    case 'top-striped':
      body = <Body fill="#DBDBD5"><path d="M106 177 Q159 185 215 177 M105 193 Q160 201 216 193 M104 209 Q160 217 218 209 M101 225 Q160 233 220 225" fill="none" stroke="#747C8B" strokeWidth="5" /><RoundNeck color="#687282" /><path d="M103 237 Q160 247 218 237" fill="none" stroke="#AEB1B4" /></Body>;
      break;
    case 'top-sweatshirt':
      body = <Body fill="#7C898C"><RoundNeck color="#657578" /><path d="M153 167 L160 177 L167 167 M112 158 L125 179 M208 158 L195 179" fill="none" stroke="#AFBBBA" /><RibbedHem color="#657578" /><path d="M145 195 Q160 187 175 195" fill="none" stroke="#C1C8C3" strokeOpacity=".55" /></Body>;
      break;
    case 'top-hoodie':
      body = <Body fill="#AE9DAE"><path d="M132 149 Q160 165 188 149 L181 164 Q160 175 139 164 Z" fill="#D0BFD0" /><path d="M142 163 L140 186 M179 163 L181 186" fill="none" stroke="#E5D8E1" strokeWidth="2" /><path d="M139 183 V188 M182 183 V188" stroke="#62576D" strokeWidth="3" /><path d="M136 202 Q160 211 184 202 L195 222 Q160 233 125 222 Z" fill="#A18EA2" /><path d="M136 204 L130 216 M184 204 L190 216" stroke="#D3C3D1" /><RibbedHem color="#927F94" /></Body>;
      break;
    case 'top-zip-hoodie':
      body = <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M106 149 L134 152 Q145 175 146 192 L143 242 Q119 245 99 238 Q104 204 103 180 Z" fill="#687586" />
        <path d="M214 149 L186 152 Q175 175 174 192 L177 242 Q202 244 222 238 Q216 206 217 180 Z" fill="#687586" />
        <path d="M132 150 L146 177 L139 187 L121 158 M188 150 L174 177 L181 187 L200 158" fill="#8D9AA9" />
        <path d="M145 184 L142 239 M175 184 L178 239" stroke="#D9D8CC" strokeWidth="2" />
        <path d="M142 190 V234 M178 190 V234" stroke="#354255" strokeDasharray="2 3" />
        <path d="M110 212 L129 202 V224 L108 229 M210 212 L191 202 V224 L212 229" fill="#596A7E" />
        <path d="M104 233 Q124 239 140 235 M180 235 Q200 239 217 233" fill="none" stroke="#35465D" strokeWidth="5" />
        <path d="M130 165 L128 188 M190 165 L192 188" fill="none" stroke="#CDCABD" />
        <path d="M177 231 V238" stroke="#E1DAC9" strokeWidth="3" />
      </g>;
      break;
    case 'top-knit-vest':
      body = <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M115 151 L136 154 L160 179 L184 154 L205 151 Q204 177 216 190 L222 239 Q160 251 99 239 L104 190 Q117 176 115 151 Z" fill="#BFB998" />
        <path d="M132 153 L160 183 L188 153 L182 153 L160 175 L138 153 Z" fill="#E3DDC0" />
        <path d="M116 154 Q121 179 107 192 M204 154 Q199 179 213 192" fill="none" stroke="#DDD7B8" strokeWidth="4" />
        <path d="M133 184 L140 194 L133 204 L140 214 L133 224 M160 191 L167 201 L160 211 L167 221 M187 184 L194 194 L187 204 L194 214 L187 224" fill="none" stroke="#E1DABD" strokeWidth="2" />
        <path d="M138 184 L131 194 L138 204 L131 214 L138 224 M165 191 L158 201 L165 211 L158 221 M192 184 L185 194 L192 204 L185 214 L192 224" fill="none" stroke="#968F73" strokeOpacity=".6" />
        <RibbedHem color="#A5A080" />
      </g>;
      break;
    case 'top-cardigan':
      body = <g stroke={edge} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M107 150 L132 153 Q135 181 148 201 L149 243 Q123 246 97 238 Q104 207 103 180 Z" fill="#C6B39A" />
        <path d="M213 150 L188 153 Q185 181 172 201 L171 243 Q197 246 224 238 Q216 207 217 180 Z" fill="#C6B39A" />
        <path d="M131 153 Q135 182 148 202 V242 M189 153 Q185 182 172 202 V242" fill="none" stroke="#E4D4BB" strokeWidth="6" />
        <path d="M109 211 H133 V227 Q121 232 109 227 Z M187 211 H211 V227 Q199 232 187 227 Z" fill="#BAA486" />
        <path d="M112 215 H130 M190 215 H208 M105 236 L138 241 M182 241 L217 236" fill="none" stroke="#E1CFB3" />
        <circle cx="172" cy="208" r="2.3" fill="#716B61" /><circle cx="172" cy="221" r="2.3" fill="#716B61" /><circle cx="172" cy="234" r="2.3" fill="#716B61" />
        <path d="M146 208 H149 M146 221 H149 M146 234 H149" stroke="#8F7E68" />
      </g>;
      break;
    case 'top-varsity':
      body = <Body fill="#556D69"><path d="M133 151 Q160 168 187 151 L188 158 Q160 177 132 158 Z" fill="#E3D7BD" /><path d="M135 156 Q160 170 185 156 M160 172 V239" fill="none" stroke="#738985" strokeWidth="2" /><RibbedHem color="#D5C9AC" /><path d="M103 235 Q160 248 218 235" fill="none" stroke="#536D69" strokeWidth="2" /><path d="M113 216 L132 207 M207 216 L188 207" stroke="#E0D5BD" strokeWidth="4" /><path d="M180 181 L185 198 L190 183 L195 198 L200 181" fill="none" stroke="#E4D8BB" strokeWidth="3" /><g fill="#DFD8C5"><circle cx="160" cy="183" r="2" /><circle cx="160" cy="197" r="2" /><circle cx="160" cy="211" r="2" /><circle cx="160" cy="225" r="2" /></g></Body>;
      break;
    case 'top-windbreaker':
      body = <Body fill="#7F9FAD"><path d="M106 149 L133 153 L147 173 H173 L187 153 L214 149 L217 180 L161 195 L104 180 Z" fill="#B6C8C8" /><path d="M143 155 V174 H177 V155 Q160 163 143 155 Z" fill="#455D6B" /><path d="M160 171 V239 M110 210 L136 200 M210 210 L184 200" fill="none" stroke="#354B5B" strokeWidth="2" /><path d="M161 180 V188" stroke="#DFE3D8" strokeWidth="3" /><path d="M104 233 Q160 246 217 233" stroke="#526F7B" strokeWidth="5" fill="none" /><path d="M113 227 L110 234 M207 227 L210 234" stroke="#E4E5DC" /><path d="M177 191 H190" stroke="#E1E5DC" strokeWidth="2.5" /></Body>;
      break;
    case 'top-raincoat':
      body = <g stroke="#B9D2CB" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M106 149 L136 153 Q160 165 184 153 L214 149 L217 180 Q214 212 227 249 Q160 261 94 249 Q105 211 103 180 Z" fill="#C2DFD8" fillOpacity=".13" />
        <path d="M137 152 L159 169 L145 181 L126 156 M183 152 L161 169 L175 181 L194 156" fill="#D4E9DE" fillOpacity=".25" />
        <path d="M160 171 V253 M105 244 Q160 257 217 244" fill="none" strokeOpacity=".8" />
        <path d="M112 211 H140 V230 Q127 235 111 230 Z M180 211 H208 V230 Q193 235 180 230 Z" fill="#DAEADC" fillOpacity=".12" />
        <path d="M111 211 H140 M180 211 H209 M111 164 L110 190 M104 219 L101 238" fill="none" stroke="#F2FFF4" strokeOpacity=".7" strokeWidth="2.2" />
        <g fill="#E4F0E3" stroke="none"><circle cx="160" cy="187" r="2" /><circle cx="160" cy="207" r="2" /><circle cx="160" cy="227" r="2" /></g>
      </g>;
      break;
    default:
      return null;
  }
  return <g aria-hidden="true">{material && <Sleeves {...material} drinking={drinking} />}{body}</g>;
}
