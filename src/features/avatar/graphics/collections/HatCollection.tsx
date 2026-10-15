import type { ReactNode } from 'react';

import type { OutfitLayer } from '../../components/AvatarOutfitLayers';
import { GarmentSurface } from '../clothing/GarmentSurface';
import { garmentPalettes } from '../clothing/garmentPalette';

type HatTone = keyof typeof garmentPalettes;
type HatCollectionProps = { itemId: string; layer: OutfitLayer; drinking: boolean };
const ink = '#505B64';
const ivory = '#EEE6D7';
const gold = '#C8B68B';

function Cloth({ d, tone = 'cream', children }: { d: string; tone?: HatTone; children?: ReactNode }) {
  return <GarmentSurface d={d} palette={garmentPalettes[tone]}>{children}</GarmentSurface>;
}

function Ribbon({ x, y, size = 1, tone = 'blush' }: { x: number; y: number; size?: number; tone?: HatTone }) {
  const p = garmentPalettes[tone];
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M-2 -2 Q-21 -15 -21 -3 L-19 11 Q-10 10 -2 3 M2 -2 Q21 -15 21 -3 L19 11 Q10 10 2 3" fill={p.base} stroke={p.edge} />
    <path d="M-5 3 L-9 21 L-2 17 L3 21 L3 5 M5 3 L13 19 L15 13 L21 14 L10 0" fill={p.shade} stroke={p.edge} />
    <path d="M-15 -2 L-4 1 M15 -2 L4 1" stroke={p.light} fill="none" />
    <rect x="-4" y="-5" width="8" height="13" rx="3" fill={p.light} stroke={p.edge} />
  </g>;
}

function Daisy({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {[0, 60, 120, 180, 240, 300].map(angle => <ellipse key={angle} cx="0" cy="-7" rx="3.7" ry="6" transform={`rotate(${angle})`} fill={ivory} stroke="#A4AA98" strokeWidth=".8" />)}
    <circle r="4.2" fill={gold} stroke="#8C8363" strokeWidth=".8" />
  </g>;
}

function Star({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <path transform={`translate(${x} ${y}) scale(${size})`} d="M0 -7 L2 -2 L7 -1 L3 3 L4 8 L0 5 L-5 8 L-4 2 L-8 -1 L-2 -2 Z" fill={gold} stroke="#8C826B" strokeWidth=".8" />;
}

function RearHat({ itemId }: { itemId: string }): ReactNode {
  switch (itemId) {
    case 'hat-rabbit-flap':
      return <Cloth d="M108 73 Q101 87 105 108 Q111 112 118 106 L124 78 M196 78 L202 106 Q209 112 216 107 Q219 87 211 73" tone="cream" />;
    case 'hat-kitten-hood':
      return <Cloth d="M107 73 Q99 90 106 110 L119 109 L127 81 M192 81 L200 109 L214 110 Q222 89 211 73" tone="grey" />;
    case 'hat-lace-bonnet':
      return <Cloth d="M103 65 Q93 87 106 109 L119 106 L122 74 M199 73 L202 106 L215 109 Q227 85 216 65" tone="blush" />;
    case 'hat-cable-earmuffs':
      return <g><path d="M104 94 V77 C104 22 217 22 217 77 V94" fill="none" stroke="#596773" strokeWidth="9" /><path d="M104 88 V76 C104 28 217 28 217 76 V88" fill="none" stroke="#CFD6CF" strokeWidth="4" /></g>;
    case 'hat-studio-headphones':
      return <g><path d="M102 91 V73 C102 22 219 22 219 73 V91" fill="none" stroke="#303D4A" strokeWidth="11" /><path d="M104 73 C104 26 217 26 217 73" fill="none" stroke="#9AADB9" strokeWidth="3" /><path d="M103 77 V95 M218 77 V95" stroke="#BFC7C6" strokeWidth="5" /></g>;
    case 'hat-stargazer':
      return <Cloth d="M111 63 Q95 84 103 109 L119 110 L128 76 M192 76 L202 110 L217 109 Q225 84 208 63" tone="navy" />;
    case 'hat-dragon-horns':
      return <Cloth d="M109 73 L102 104 L113 109 L127 81 M193 81 L207 109 L219 104 L210 73" tone="sage" />;
    default: return null;
  }
}

function FrontHat({ itemId }: { itemId: string }): ReactNode {
  switch (itemId) {
    case 'hat-bear-knit':
      return <g>
        <Cloth d="M113 58 C93 49 100 26 116 30 Q130 31 131 47 M188 47 Q190 30 204 30 C222 31 227 52 208 61" tone="sand" />
        <path d="M109 47 Q107 34 117 37 Q125 39 123 49 M196 48 Q196 37 204 37 Q215 38 211 49" fill="#E3D5BC" stroke="#827762" />
        <Cloth d="M109 81 C110 50 131 40 160 40 C190 40 210 55 212 83 Z" tone="sand" />
        <path d="M126 71 Q129 52 139 48 M144 72 Q144 51 150 45 M162 72 V45 M179 72 Q179 53 174 46 M196 73 Q193 57 187 51" fill="none" stroke="#E3D5BC" />
        <Cloth d="M107 76 Q160 70 214 78 L214 94 Q160 101 106 92 Z" tone="cream" />
        <path d="M116 82 V90 M125 81 V91 M134 81 V92 M143 80 V93 M153 80 V93 M163 80 V94 M173 81 V93 M183 81 V93 M193 82 V92 M203 83 V91" stroke="#A79C87" />
        <rect x="149" y="81" width="22" height="11" rx="4" fill="#BAAB91" stroke="none" /><path d="M154 86 H166" stroke={ivory} />
      </g>;
    case 'hat-rabbit-flap':
      return <g>
        <Cloth d="M121 54 C107 38 109 8 119 7 C131 5 138 39 139 49 M180 49 C184 25 191 6 201 10 C213 15 204 43 196 55" />
        <path d="M121 17 Q117 27 126 45 M197 19 Q198 28 188 45" fill="none" stroke="#CAB3B3" strokeWidth="6" />
        <Cloth d="M109 86 C106 59 129 43 157 43 C188 40 214 59 212 88 L200 97 Q160 86 119 96 Z" />
        <path d="M119 84 Q157 72 202 86" fill="none" stroke="#AA9D8B" strokeWidth="2" />
        <path d="M115 89 L112 105 M206 90 L210 105" stroke="#D6CDBA" strokeWidth="5" />
        <circle cx="112" cy="105" r="5" fill={ivory} stroke="#8A877E" /><circle cx="210" cy="105" r="5" fill={ivory} stroke="#8A877E" />
        <path d="M132 59 Q145 49 160 50" stroke={ivory} strokeWidth="2.4" fill="none" />
      </g>;
    case 'hat-kitten-hood':
      return <g>
        <Cloth d="M106 89 L108 35 Q110 28 116 32 L137 48 Q161 39 184 48 L205 32 Q211 29 212 36 L215 91 L202 96 Q160 79 119 97 Z" tone="grey" />
        <path d="M116 42 L119 64 L133 53 Z M203 42 L188 53 L203 64 Z" fill="#C5B4BC" stroke="#7D7783" />
        <path d="M124 83 Q160 68 199 83" fill="none" stroke="#D8D9D5" strokeWidth="6" /><path d="M126 83 Q160 70 197 83" fill="none" stroke="#737D88" strokeWidth="1.2" />
        <path d="M151 55 L154 66 M160 53 V64 M169 55 L166 66" stroke="#4B5665" strokeWidth="2" />
      </g>;
    case 'hat-sheep-bonnet':
      return <g>
        <Cloth d="M118 72 Q94 76 98 59 Q100 51 116 56 M202 56 Q220 51 224 62 Q225 77 204 74" tone="sand" />
        <Cloth d="M110 83 Q98 71 108 62 Q100 49 115 45 Q116 29 133 34 Q140 21 154 29 Q166 20 177 31 Q194 25 202 42 Q219 42 216 58 Q228 70 213 82 L202 94 Q160 85 118 94 Z" />
        <path d="M119 63 Q118 53 128 54 Q139 56 135 65 M150 43 Q146 35 156 34 Q166 34 164 44 M180 55 Q178 45 188 45 Q198 46 195 55 M149 68 Q146 58 157 57 Q166 58 163 66" fill="none" stroke="#A99F8B" strokeWidth="1.3" />
        <path d="M114 84 Q160 76 209 85" fill="none" stroke="#BAAB91" strokeWidth="4" />
        <Ribbon x={204} y={88} size={.5} tone="sage" />
      </g>;
    case 'hat-strawberry-puff':
      return <g>
        <Cloth d="M108 75 C105 50 125 34 160 34 C196 34 218 52 213 76 Q203 97 160 99 Q116 95 108 75 Z" tone="blush" />
        <path d="M144 36 L133 25 L150 28 L159 16 L165 29 L182 23 L177 37 L193 42 Q172 48 160 39 Q146 48 129 43 Z" fill="#81968D" stroke="#4E655D" />
        <path d="M159 31 Q157 20 163 15" fill="none" stroke="#4E655D" strokeWidth="3" />
        <path d="M125 57 L128 62 M145 52 L147 58 M172 54 L171 60 M194 59 L191 64 M134 76 L137 80 M157 70 V76 M180 77 L177 82" stroke="#F0DCD0" strokeWidth="2.5" />
        <path d="M117 83 Q159 97 204 84" fill="none" stroke="#7F6674" strokeWidth="2" />
      </g>;
    case 'hat-tangerine-knot':
      return <g>
        <Cloth d="M106 74 C106 49 131 35 160 36 C191 34 215 53 215 75 Q211 94 161 97 Q112 94 106 74 Z" tone="sand" />
        <path d="M161 38 Q161 25 169 21" fill="none" stroke="#607B73" strokeWidth="4" />
        <path d="M164 29 Q180 10 192 23 Q183 38 164 29 Z" fill="#A0B8AD" stroke="#607B73" /><path d="M169 28 L185 23" stroke="#607B73" />
        <path d="M143 43 Q126 66 138 86 M161 43 Q153 69 160 91 M181 43 Q195 66 181 86" fill="none" stroke="#A18D6F" strokeWidth="1.5" />
        <path d="M118 66 Q124 51 137 47" fill="none" stroke="#F0E0C1" strokeWidth="3" />
        <path d="M116 84 Q157 97 205 84" fill="none" stroke="#827762" strokeWidth="2" />
      </g>;
    case 'hat-toast-cushion':
      return <g>
        <Cloth d="M118 91 L117 59 C102 51 109 30 126 28 Q159 20 194 29 C211 33 218 53 202 61 L203 92 Q161 99 118 91 Z" tone="sand" />
        <path d="M126 85 L125 56 C112 48 118 37 130 36 Q159 29 189 37 Q206 42 195 55 L195 86 Q160 92 126 85 Z" fill="#EEE0C3" stroke="#B7A281" strokeWidth="1.5" />
        <path d="M132 47 Q148 40 166 43" fill="none" stroke="#FFF3DC" strokeWidth="3" />
        <rect x="148" y="59" width="27" height="21" rx="5" transform="rotate(-8 161 69)" fill="#D9C99F" stroke="#B7A281" /><path d="M154 64 H168" stroke="#F6EACD" strokeWidth="2" />
      </g>;
    case 'hat-croissant-roll':
      return <g>
        <Cloth d="M106 86 Q91 80 99 62 L116 44 Q125 30 142 37 Q157 23 174 36 Q195 29 206 47 L221 67 Q228 84 212 90 L192 77 Q160 91 130 77 Z" tone="sand" />
        <path d="M113 48 Q115 64 130 77 M137 38 Q133 58 145 82 M164 34 Q170 59 161 84 M188 38 Q193 58 180 80 M206 49 Q205 66 192 77" fill="none" stroke="#8F795D" strokeWidth="2.5" />
        <path d="M121 47 Q125 41 132 43 M147 40 Q156 34 163 40 M176 42 Q183 39 188 45" fill="none" stroke="#F3DFC0" strokeWidth="3" />
        <path d="M103 68 L107 77 L117 74 M214 70 L210 80 L203 75" fill="none" stroke="#DCC5A1" strokeWidth="2" />
      </g>;
    case 'hat-lace-bonnet':
      return <g>
        <Cloth d="M105 87 C96 50 123 29 160 29 C198 29 223 52 215 89 L204 97 Q160 75 116 97 Z" tone="blush" />
        <path d="M113 87 C109 60 129 44 159 43 C190 43 211 63 207 87" fill="none" stroke={ivory} strokeWidth="10" />
        <path d="M111 85 Q104 79 114 75 Q107 68 119 65 Q114 58 126 58 Q124 48 136 51 Q137 41 147 47 Q154 38 160 45 Q168 38 175 48 Q185 42 188 53 Q200 49 199 61 Q212 61 206 71 Q218 77 209 85" fill="none" stroke="#BFAF9E" strokeWidth="1" />
        <path d="M116 90 L112 108 M205 91 L209 108" stroke="#DDC1BF" strokeWidth="4" />
        <Ribbon x={205} y={84} size={.56} />
      </g>;
    case 'hat-ribbon-cloche':
      return <g>
        <Cloth d="M116 81 Q111 39 158 34 Q202 33 204 81 L216 95 Q159 109 103 94 Z" tone="lavender" />
        <path d="M117 72 Q158 82 202 71 L205 83 Q159 95 114 83 Z" fill="#736C82" stroke="#625F70" />
        <path d="M108 94 Q158 104 211 94" fill="none" stroke="#D2C8CF" strokeWidth="2" />
        <path d="M129 61 Q135 43 153 43" fill="none" stroke="#E3D7DE" strokeWidth="2.5" />
        <Ribbon x={191} y={78} size={.7} tone="cream" />
      </g>;
    case 'hat-petal-beret':
      return <g>
        <Cloth d="M107 73 Q92 55 117 48 Q119 29 141 37 Q156 21 176 36 Q201 26 207 48 Q229 51 218 70 Q211 91 183 87 Q156 100 134 85 Q114 88 107 73 Z" tone="blush" />
        <path d="M117 50 Q145 47 160 66 M141 38 Q157 48 160 66 M177 37 Q165 47 160 66 M205 49 Q183 48 160 66 M211 73 Q184 61 160 66 M135 84 Q144 68 160 66" fill="none" stroke="#7F6674" strokeOpacity=".75" />
        <circle cx="160" cy="65" r="7" fill="#DDC1BF" stroke="#7F6674" />
        <path d="M122 84 Q160 94 202 82 L201 92 Q160 100 122 93 Z" fill="#7F6674" stroke={ink} />
        <path d="M123 43 Q131 38 138 43 M151 35 Q159 29 168 36" fill="none" stroke="#EDD8D4" strokeWidth="2" />
      </g>;
    case 'hat-daisy-wreath':
      return <g>
        <path d="M109 83 Q159 35 211 83" fill="none" stroke="#4E655D" strokeWidth="5" />
        <path d="M112 77 Q102 61 116 62 L125 68 M132 59 Q128 43 141 49 L147 54 M173 52 Q185 36 190 51 L186 59 M197 69 Q216 57 217 72 L207 80" fill="#A0B8AD" stroke="#607B73" />
        <Daisy x={116} y={73} size={.8} /><Daisy x={138} y={57} size={.9} /><Daisy x={162} y={52} /><Daisy x={186} y={59} size={.86} /><Daisy x={207} y={77} size={.8} />
        <path d="M110 81 L108 101 M210 83 L214 104" fill="none" stroke="#D6CDBA" strokeWidth="3" />
      </g>;
    case 'hat-tulip-bell':
      return <g>
        <Cloth d="M107 93 Q115 65 123 43 Q142 48 159 29 Q178 49 198 43 Q207 68 216 93 Q205 103 192 94 Q178 106 161 96 Q144 107 128 95 Q116 103 107 93 Z" tone="lavender" />
        <path d="M125 47 Q146 64 128 95 M160 34 Q146 64 161 96 M194 48 Q173 64 192 94" fill="none" stroke="#736C82" strokeWidth="1.5" />
        <path d="M133 52 Q146 55 151 45 M175 49 Q184 56 190 53" fill="none" stroke="#DCD3DD" strokeWidth="2" />
        <path d="M110 92 Q118 99 128 91 Q146 103 161 93 Q178 103 192 91 Q203 100 213 92" fill="none" stroke="#D6CDBA" strokeWidth="2" />
        <Daisy x={195} y={75} size={.52} />
      </g>;
    case 'hat-veil-pillbox':
      return <g>
        <Cloth d="M132 45 Q157 28 191 37 Q202 41 202 56 L198 70 Q165 87 131 66 Z" tone="navy" />
        <path d="M133 45 Q163 56 201 44 M134 49 L134 63 Q166 80 198 65" fill="none" stroke="#8195A4" strokeWidth="1.3" />
        <path d="M128 62 Q168 68 210 60 L213 98 Q163 89 122 99 Z" fill="#D6CDBA" fillOpacity=".09" stroke="#AAA998" />
        <path d="M132 65 L160 95 M151 67 L178 94 M171 67 L199 96 M192 64 L212 86 M209 65 L180 94 M190 66 L160 95 M170 68 L141 96 M149 66 L124 91" fill="none" stroke="#C4C3B8" strokeWidth=".8" strokeOpacity=".7" />
        <Ribbon x={195} y={51} size={.65} tone="cream" />
      </g>;
    case 'hat-picnic-ribbon':
      return <g>
        <Cloth d="M118 77 L126 47 Q160 34 195 47 L203 78 Z" tone="sand" />
        <path d="M127 53 Q159 42 194 53 M124 61 Q159 50 197 61 M122 69 Q160 59 200 69" fill="none" stroke="#DCCFB8" strokeWidth="1.8" />
        <Cloth d="M115 74 Q159 81 205 74 Q221 78 232 94 Q226 106 201 104 Q159 98 118 104 Q93 103 89 94 Q98 79 115 74 Z" />
        <path d="M100 92 Q160 111 221 92 M107 85 Q160 102 214 85" fill="none" stroke="#B2A68B" />
        <path d="M121 69 Q160 77 200 69 L203 78 Q159 86 118 78 Z" fill="#81968D" stroke="#4D615A" />
        <Ribbon x={199} y={77} size={.8} tone="sage" />
      </g>;
    case 'hat-pearl-headband':
      return <g>
        <path d="M108 88 Q160 19 213 88" fill="none" stroke="#827762" strokeWidth="7" /><path d="M108 87 Q160 24 213 87" fill="none" stroke="#E3D5BC" strokeWidth="3" />
        {[{x:114,y:77},{x:124,y:65},{x:135,y:56},{x:148,y:50},{x:162,y:48},{x:176,y:51},{x:188,y:58},{x:199,y:68},{x:208,y:80}].map(({x,y}) => <g key={x}><circle cx={x} cy={y} r="4.2" fill={ivory} stroke="#A29F8D" /><circle cx={x-1} cy={y-1} r="1.1" fill="#FFFFFF" stroke="none" /></g>)}
        <Ribbon x={202} y={79} size={.65} tone="navy" />
      </g>;
    case 'hat-five-panel':
      return <g>
        <Cloth d="M109 83 L119 54 L143 41 H177 L200 56 L211 84 Z" tone="charcoal" />
        <path d="M141 43 L136 80 M178 43 L184 81 M119 55 L137 63 M199 56 L184 63" stroke="#89949D" fill="none" />
        <Cloth d="M108 81 Q157 76 210 82 L229 96 Q231 102 219 102 Q188 99 162 91 Q132 90 108 93 Z" tone="sage" />
        <path d="M173 86 Q194 89 220 97" stroke="#B8C9BA" fill="none" />
        <rect x="147" y="55" width="26" height="17" rx="2" fill="#D6CDBA" stroke="#394654" /><path d="M152 67 L159 59 L167 67 M157 67 H170" stroke="#52677B" fill="none" />
        <path d="M123 65 L125 66 M194 65 L196 66" stroke="#B6BDC3" strokeWidth="2" />
      </g>;
    case 'hat-backward-cap':
      return <g>
        <Cloth d="M105 78 Q95 75 91 84 L91 93 Q105 100 122 91 L128 80 Z" tone="denim" />
        <Cloth d="M110 84 C111 54 131 40 160 40 C190 40 211 56 212 85 L196 94 H125 Z" tone="denim" />
        <path d="M159 42 Q145 57 145 80 M160 42 Q176 57 177 81" fill="none" stroke="#A0B9CA" />
        <path d="M110 79 Q126 83 137 83 Q139 65 159 65 Q180 65 183 83 Q198 83 212 80 L213 93 Q199 97 180 97 L179 84 Q177 73 160 73 Q143 73 141 84 L141 97 Q121 97 110 92 Z" fill="#3B506D" stroke="#40546A" />
        <path d="M139 85 Q160 89 183 85 L183 93 Q162 98 140 93 Z" fill="#BAAB91" stroke="#6B695F" /><path d="M148 90 H174" stroke="#E3D5BC" strokeWidth="1.5" />
        <circle cx="151" cy="90" r="1.2" fill="#6B695F" stroke="none" /><circle cx="158" cy="90" r="1.2" fill="#6B695F" stroke="none" /><circle cx="165" cy="90" r="1.2" fill="#6B695F" stroke="none" />
      </g>;
    case 'hat-denim-patch':
      return <g>
        <Cloth d="M120 47 Q159 37 198 49 L208 81 H109 Z" tone="denim" />
        <path d="M145 44 L143 83 M176 44 L181 83" stroke="#A0B9CA" strokeDasharray="3 2" />
        <Cloth d="M110 77 Q158 86 207 78 L223 99 Q160 111 98 100 Z" tone="navy" />
        <path d="M107 96 Q159 105 215 96 M115 86 Q159 96 209 86" fill="none" stroke="#A0B9CA" strokeDasharray="3 2" />
        <path d="M120 57 L137 53 L141 71 L125 74 Z" fill="#B6BDC3" stroke="#40546A" /><path d="M124 58 L135 56 L138 69 L127 72 Z" fill="none" stroke="#627F9A" strokeDasharray="2 2" />
        <path d="M173 58 H192 V72 H173 Z" fill="#D6CDBA" stroke="#40546A" /><path d="M177 63 H188 M178 67 H184" stroke="#827762" />
      </g>;
    case 'hat-cable-earmuffs':
      return <g>
        <Cloth d="M100 77 Q108 71 116 79 Q120 92 115 106 Q109 114 100 107 Q94 94 100 77 Z M205 79 Q213 72 221 78 Q227 94 221 107 Q213 114 206 106 Q201 92 205 79 Z" />
        <path d="M104 81 Q112 87 104 93 Q112 99 106 105 M213 81 Q221 87 213 93 Q221 99 215 105" fill="none" stroke="#BAAB91" strokeWidth="2" />
        <path d="M111 80 V105 M220 82 V103" stroke="#F7EEE0" strokeWidth="1.3" />
      </g>;
    case 'hat-studio-headphones':
      return <g>
        <Cloth d="M98 77 Q106 72 115 78 L115 106 Q107 112 99 106 Z M206 78 Q214 72 223 77 L222 106 Q214 112 206 106 Z" tone="charcoal" />
        <rect x="98" y="81" width="10" height="22" rx="4" fill="#8195A4" stroke="#394654" /><rect x="213" y="81" width="10" height="22" rx="4" fill="#8195A4" stroke="#394654" />
        <path d="M102 86 V98 M217 86 V98" stroke="#CFD6D7" strokeWidth="1.5" /><path d="M110 82 V101 M209 82 V101" stroke="#89949D" />
      </g>;
    case 'hat-racer-visor':
      return <g>
        <path d="M109 73 Q160 59 211 73 L211 86 Q160 75 109 86 Z" fill="#D6CDBA" stroke="#646B70" />
        <path d="M111 77 Q160 66 209 77" fill="none" stroke="#89949D" strokeWidth="3" />
        <Cloth d="M116 82 Q161 72 208 82 Q223 88 231 98 Q226 106 203 101 L157 90 L114 92 Z" tone="charcoal" />
        <path d="M150 83 Q192 82 222 97" fill="none" stroke="#A0B9CA" strokeWidth="2" />
        <path d="M126 73 L135 72 L133 78 L125 79 Z M138 71 L145 71 L143 77 L136 78 Z" fill="#52677B" stroke="none" />
      </g>;
    case 'hat-rib-watch':
      return <g>
        <Cloth d="M113 78 Q113 43 160 42 Q204 44 208 80 Z" tone="charcoal" />
        <path d="M126 72 Q126 55 137 49 M140 72 Q141 52 147 47 M155 72 V46 M170 73 Q171 54 168 47 M186 74 Q184 56 179 49 M198 75 Q195 61 190 56" stroke="#89949D" fill="none" />
        <Cloth d="M111 72 Q160 66 209 73 L210 88 Q162 95 111 87 Z" tone="grey" />
        <path d="M118 77 V84 M126 76 V86 M134 75 V87 M143 74 V88 M152 74 V88 M161 74 V89 M170 74 V88 M179 75 V88 M188 76 V86 M198 77 V85" stroke="#4B5665" />
        <path d="M122 77 L135 76 L136 86 L123 86 Z" fill="#D6CDBA" stroke="none" /><path d="M126 80 L131 83 M131 79 L126 84" stroke="#52677B" />
      </g>;
    case 'hat-bandana-knot':
      return <g>
        <Cloth d="M112 84 Q114 57 135 46 L161 39 L189 47 Q210 60 210 86 Q161 76 112 92 Z" tone="navy" />
        <path d="M116 79 Q160 65 207 80 L210 91 Q160 79 113 94 Z" fill="#8195A4" stroke="#394654" />
        <path d="M119 82 Q160 71 204 82" stroke="#D6CDBA" fill="none" strokeDasharray="4 3" />
        <path d="M131 64 Q135 56 140 62 Q143 68 137 69 Q132 69 134 65 M173 58 Q179 51 184 59 Q185 65 179 65 M156 47 L160 52 L156 56 L152 52 Z M190 68 L194 72 L190 76 L186 72 Z" fill="none" stroke="#D6CDBA" strokeWidth="1.3" />
        <path d="M204 84 Q228 70 226 83 L216 92 L230 100 L216 104 L205 94 Z" fill="#52677B" stroke="#394654" /><circle cx="208" cy="89" r="6" fill="#8195A4" stroke="#394654" />
      </g>;
    case 'hat-mortarboard':
      return <g>
        <Cloth d="M123 58 Q161 44 197 59 L194 86 Q160 97 126 85 Z" tone="charcoal" />
        <path d="M91 47 L157 20 L231 47 L165 76 Z" fill="#52677B" stroke="#394654" strokeWidth="1.5" /><path d="M98 47 L158 25 L222 47 L165 71 Z" fill="none" stroke="#8195A4" />
        <path d="M161 48 L210 52 L211 90" fill="none" stroke="#C8B68B" strokeWidth="2" /><circle cx="161" cy="47" r="4" fill="#2E3D50" stroke="#8195A4" />
        <path d="M211 87 L205 103 L216 103 Z" fill="#C8B68B" stroke="#8F8064" /><path d="M211 91 V100" stroke="#EEE6D7" />
      </g>;
    case 'hat-newsboy':
      return <g>
        <Cloth d="M104 77 Q94 58 119 48 Q126 34 157 35 Q189 34 205 49 Q225 59 214 78 Q160 94 104 77 Z" tone="sand" />
        <path d="M157 36 Q126 49 116 78 M158 36 Q145 56 144 83 M159 36 Q170 53 174 83 M160 36 Q191 50 205 78" fill="none" stroke="#827762" strokeWidth="1.2" />
        <circle cx="158" cy="36" r="4" fill="#827762" stroke="#6B695F" />
        <path d="M111 78 Q160 87 208 77 L207 88 Q160 98 112 88 Z" fill="#827762" stroke="#6B695F" />
        <path d="M120 87 Q161 80 203 88 Q201 103 161 104 Q125 103 120 87 Z" fill="#BAAB91" stroke="#6B695F" /><path d="M128 92 Q162 104 196 92" fill="none" stroke="#E3D5BC" />
      </g>;
    case 'hat-porkpie':
      return <g>
        <Cloth d="M116 74 L121 47 Q159 34 200 47 L204 76 Z" tone="navy" />
        <ellipse cx="160" cy="47" rx="39" ry="11" fill="#52677B" stroke="#394654" /><ellipse cx="160" cy="47" rx="30" ry="6" fill="#2E3D50" stroke="#8195A4" />
        <path d="M118 66 Q160 78 202 66 L204 80 Q160 91 116 79 Z" fill="#BAAB91" stroke="#6B695F" />
        <Cloth d="M99 76 Q160 96 222 77 L223 88 Q159 108 98 88 Z" tone="navy" />
        <path d="M103 80 Q161 98 219 81" fill="none" stroke="#8195A4" strokeWidth="2" /><rect x="183" y="70" width="12" height="10" rx="1" fill="#52677B" stroke="#D6CDBA" />
      </g>;
    case 'hat-captain':
      return <g>
        <Cloth d="M111 68 Q95 54 114 43 Q160 27 207 44 Q226 54 209 69 L202 82 H120 Z" />
        <path d="M115 50 Q158 36 204 50" stroke="#FFF3E1" fill="none" strokeWidth="2.4" />
        <path d="M115 69 Q160 76 207 69 L205 87 Q160 97 116 87 Z" fill="#2E3D50" stroke="#394654" />
        <path d="M120 78 Q160 90 201 78" fill="none" stroke={gold} strokeWidth="2" />
        <path d="M125 86 Q160 81 197 86 Q190 103 161 105 Q132 103 125 86 Z" fill="#52677B" stroke="#394654" />
        <path d="M147 55 L160 49 L173 55 L169 67 Q161 74 152 67 Z" fill={gold} stroke="#8F8064" /><path d="M160 54 V66 M155 60 H165 M155 63 Q160 70 165 63" stroke="#52677B" fill="none" />
      </g>;
    case 'hat-bowler':
      return <g>
        <Cloth d="M119 79 V64 Q120 32 160 31 Q200 31 201 64 V80 Z" tone="charcoal" />
        <path d="M130 57 Q136 39 157 40" fill="none" stroke="#89949D" strokeWidth="2.5" />
        <path d="M119 70 Q160 78 201 70 V83 Q160 92 119 83 Z" fill="#2B333F" stroke="#333D49" />
        <Cloth d="M99 79 Q110 74 120 82 Q160 96 202 81 Q213 74 222 80 Q224 93 204 97 Q159 109 116 97 Q96 92 99 79 Z" tone="grey" />
        <path d="M103 82 Q105 89 119 91 Q160 104 204 91 Q216 88 218 82" stroke="#B6BDC3" fill="none" /><path d="M186 75 H196 V83 H186 Z" fill="#BAAB91" stroke="none" />
      </g>;
    case 'hat-deerstalker':
      return <g>
        <Cloth d="M113 82 Q109 53 139 42 Q160 36 183 44 Q209 55 208 82 Z" tone="sand" />
        <path d="M125 50 V79 M143 42 V82 M161 41 V84 M179 44 V82 M196 55 V80 M117 57 Q160 49 203 59 M114 70 Q160 62 207 70" stroke="#827762" strokeWidth="1.2" fill="none" />
        <path d="M111 72 L118 50 Q133 47 137 65 L130 87 Q120 92 111 81 M208 72 L201 50 Q188 47 183 65 L190 87 Q202 92 208 81" fill="#BAAB91" stroke="#6B695F" /><path d="M119 61 L126 77 M199 61 L193 77" stroke="#E3D5BC" strokeWidth="2" />
        <path d="M120 85 Q159 77 201 85 Q196 101 162 102 Q129 100 120 85 Z" fill="#827762" stroke="#6B695F" /><path d="M140 44 L160 51 L180 44 M160 51 L160 58" fill="none" stroke="#52677B" strokeWidth="2" />
      </g>;
    case 'hat-boater':
      return <g>
        <Cloth d="M119 76 L121 43 Q158 33 200 44 L202 77 Z" tone="cream" />
        <ellipse cx="160" cy="43" rx="39" ry="8" fill="#E3D5BC" stroke="#8A877E" />
        <path d="M123 50 Q160 58 199 50 M122 57 Q160 65 200 57" stroke="#BAAB91" fill="none" strokeWidth="1.3" />
        <path d="M120 63 Q159 73 201 63 L202 78 Q160 89 119 77 Z" fill="#52677B" stroke="#394654" />
        <Cloth d="M94 79 Q160 71 227 80 L229 93 Q159 106 92 92 Z" />
        <path d="M97 87 Q159 99 224 87 M98 82 Q160 76 223 83" fill="none" stroke="#BAAB91" /><Ribbon x={193} y={72} size={.5} tone="navy" />
      </g>;
    case 'hat-garrison':
      return <g>
        <Cloth d="M108 81 L121 49 Q143 32 167 32 L207 55 L213 89 Q160 102 108 89 Z" tone="sage" />
        <path d="M121 50 Q154 58 167 33 L196 54 Q163 68 118 61 Z" fill="#B8C9BA" stroke="#4D615A" />
        <path d="M111 75 Q159 90 210 77 L213 89 Q160 102 108 89 Z" fill="#4E655D" stroke="#4D615A" /><path d="M115 82 Q160 96 208 84" fill="none" stroke="#A0B8AD" />
        <path d="M186 64 L193 59 L200 64 V75 L193 79 L186 74 Z" fill={gold} stroke="#827762" /><path d="M193 63 V73 M190 68 H196" stroke="#4E655D" />
      </g>;
    case 'hat-crescent-wizard':
      return <g>
        <Cloth d="M119 83 Q130 43 165 8 Q170 4 171 10 Q170 26 190 42 L204 83 Z" tone="navy" />
        <path d="M165 13 Q151 46 147 80 M172 30 Q187 48 190 78" fill="none" stroke="#8195A4" strokeWidth="1.3" />
        <path d="M162 44 A12 12 0 1 0 174 59 A13 13 0 0 1 162 44" fill={gold} stroke="#8C826B" />
        <Cloth d="M114 77 Q158 92 207 77 L230 94 Q205 111 162 103 Q122 111 93 95 Z" tone="navy" />
        <path d="M104 93 Q157 108 219 93" fill="none" stroke="#A0B9CA" />
        <path d="M120 75 Q160 85 201 76" fill="none" stroke="#C8B68B" strokeWidth="3" /><Star x={185} y={66} size={.5} /><Star x={145} y={36} size={.36} />
      </g>;
    case 'hat-forest-elf':
      return <g>
        <Cloth d="M107 87 Q112 49 141 39 Q169 26 193 12 Q199 10 197 17 Q189 33 205 57 Q214 69 211 87 Q160 99 107 87 Z" tone="sage" />
        <path d="M185 24 Q170 56 190 86" fill="none" stroke="#4E655D" strokeWidth="2" /><path d="M124 68 Q132 47 156 43" stroke="#B8C9BA" strokeWidth="2.5" fill="none" />
        <path d="M108 80 Q160 91 211 80 L211 94 L195 88 L182 100 L166 91 L150 101 L136 91 L120 97 L108 92 Z" fill="#A0B8AD" stroke="#607B73" />
        <path d="M182 66 Q189 44 206 47 Q207 62 182 66 Z" fill="#D6CDBA" stroke="#827762" /><path d="M183 66 L201 51" stroke="#827762" />
      </g>;
    case 'hat-stargazer':
      return <g>
        <Cloth d="M104 85 Q104 44 134 35 L159 20 L188 36 Q218 46 217 85 L207 98 Q160 76 115 98 Z" tone="navy" />
        <path d="M113 87 Q116 57 143 49 L159 38 L179 50 Q205 59 208 87" fill="none" stroke="#D6CDBA" strokeWidth="5" />
        <path d="M122 57 L137 45 L150 51 M181 47 L190 60 L203 65" fill="none" stroke="#A0B9CA" strokeWidth=".9" />
        <circle cx="122" cy="57" r="2" fill={ivory} stroke="none" /><circle cx="137" cy="45" r="2" fill={ivory} stroke="none" /><circle cx="150" cy="51" r="2" fill={ivory} stroke="none" /><circle cx="190" cy="60" r="2" fill={ivory} stroke="none" /><Star x={181} y={47} size={.42} /><Star x={203} y={65} size={.4} />
        <path d="M116 91 L111 109 M207 91 L213 109" stroke="#BAAB91" strokeWidth="2" />
      </g>;
    case 'hat-mushroom':
      return <g>
        <Cloth d="M94 82 Q102 37 158 33 Q213 34 229 80 Q227 96 162 98 Q100 98 94 82 Z" tone="blush" />
        <ellipse cx="161" cy="84" rx="63" ry="12" fill="#D6CDBA" stroke="#8A877E" />
        <path d="M112 80 L134 86 M130 76 L145 87 M151 74 L155 88 M172 75 L166 88 M193 77 L178 87 M211 80 L190 87" stroke="#A79C87" />
        <path d="M94 81 Q105 37 158 33 Q213 34 229 80 Q164 70 94 81 Z" fill="#B79298" stroke="#79656E" />
        <ellipse cx="132" cy="55" rx="13" ry="8" transform="rotate(-25 132 55)" fill="#E3D5BC" stroke="none" /><ellipse cx="180" cy="48" rx="10" ry="6" transform="rotate(15 180 48)" fill="#E3D5BC" stroke="none" /><ellipse cx="201" cy="66" rx="8" ry="5" fill="#E3D5BC" stroke="none" /><circle cx="158" cy="67" r="5" fill="#E3D5BC" stroke="none" />
      </g>;
    case 'hat-acorn':
      return <g>
        <Cloth d="M118 70 Q114 41 160 36 Q204 39 203 70 L195 91 Q158 101 124 91 Z" tone="sand" />
        <path d="M160 37 Q154 24 166 18 Q171 20 166 27 L166 38" fill="#827762" stroke="#6B695F" />
        <Cloth d="M114 60 Q160 36 207 62 L212 82 Q159 99 108 81 Z" tone="sand" />
        <path d="M117 65 L140 87 M132 57 L162 91 M150 53 L184 87 M169 54 L201 80 M188 59 L208 74 M202 65 L179 88 M188 56 L156 91 M168 52 L135 86 M149 54 L116 79" fill="none" stroke="#827762" strokeWidth="1.1" />
        <path d="M111 80 Q158 96 209 81" stroke="#E3D5BC" strokeWidth="3" fill="none" />
        <path d="M127 90 Q159 99 193 91" stroke="#827762" fill="none" />
      </g>;
    case 'hat-feather-adventurer':
      return <g>
        <Cloth d="M113 80 L127 45 Q137 34 157 45 L188 30 Q198 31 198 44 L206 82 Z" tone="sage" />
        <path d="M132 47 L157 53 L187 38" fill="none" stroke="#B8C9BA" strokeWidth="2" />
        <path d="M115 70 Q160 81 203 69 L207 83 Q160 95 111 83 Z" fill="#827762" stroke="#6B695F" />
        <Cloth d="M98 75 Q127 102 163 91 Q195 84 224 64 L224 83 Q209 103 163 103 Q117 107 96 88 Z" tone="sage" />
        <path d="M101 80 Q119 96 142 98 M177 94 Q209 85 221 70" fill="none" stroke="#B8C9BA" strokeWidth="2" />
        <path d="M190 76 Q186 37 216 20 Q230 45 190 76 Z" fill="#D6CDBA" stroke="#827762" /><path d="M190 77 L216 25 M197 62 L207 62 M202 51 L214 51 M205 47 L201 37" stroke="#827762" fill="none" /><rect x="185" y="72" width="11" height="8" rx="2" fill={gold} stroke="#6B695F" />
      </g>;
    case 'hat-dragon-horns':
      return <g>
        <path d="M115 58 Q94 45 105 20 Q110 36 131 40 M189 40 Q211 36 215 20 Q228 45 207 59" fill="#D6CDBA" stroke="#8A877E" /><path d="M108 35 L119 43 M211 36 L200 44" stroke="#A79C87" />
        <Cloth d="M107 86 Q106 48 141 39 L159 31 L179 40 Q215 49 214 86 L201 97 L184 82 Q160 74 136 83 L120 97 Z" tone="sage" />
        <path d="M150 42 L159 25 L169 43 L163 57 Z M156 58 L164 58 L166 74 L154 74 Z" fill="#B8C9BA" stroke="#4D615A" />
        <path d="M121 65 L130 59 L139 65 L131 71 Z M182 65 L191 59 L200 65 L191 71 Z" fill="#4E655D" stroke="none" /><path d="M117 82 Q132 75 144 78 M177 78 Q192 75 205 82" fill="none" stroke="#D3E2D3" strokeWidth="2" />
      </g>;
    case 'hat-cloud-halo':
      return <g>
        <ellipse cx="160" cy="33" rx="39" ry="10" fill="none" stroke="#8F8064" strokeWidth="5" /><ellipse cx="160" cy="32" rx="39" ry="10" fill="none" stroke="#E3D5BC" strokeWidth="2.5" />
        <path d="M128 63 L132 45 M192 63 L188 45" stroke="#C8C9BD" strokeWidth="1.2" />
        <Cloth d="M108 81 Q96 66 112 59 Q111 43 128 45 Q137 31 151 43 Q163 32 175 45 Q192 36 201 52 Q220 49 221 65 Q233 77 216 86 Q198 91 184 84 Q162 95 143 84 Q120 94 108 81 Z" />
        <path d="M114 67 Q118 57 129 61 M140 53 Q148 45 157 53 M179 57 Q189 48 198 60 M158 76 Q170 66 182 75" fill="none" stroke="#B0AC9A" strokeWidth="1.3" />
        <Star x={115} y={94} size={.5} /><Star x={208} y={97} size={.45} />
      </g>;
    default: return null;
  }
}

/** Independent headwear geometry; head motion is inherited from the jelly. */
export function HatCollectionGraphic({ itemId, layer }: HatCollectionProps): ReactNode {
  const art = layer === 'back' ? RearHat({ itemId }) : layer === 'front' ? FrontHat({ itemId }) : null;
  return art ? <g aria-hidden="true" data-avatar-item={itemId} data-avatar-layer={layer} stroke={ink} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">{art}</g> : null;
}
