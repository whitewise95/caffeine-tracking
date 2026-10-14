import type { ReactNode } from 'react';

type ItemLayer = 'back' | 'body' | 'front';

interface HeadItemGraphicProps {
  itemId: string;
  layer: ItemLayer;
  drinking: boolean;
}

// These materials belong to the artwork, rather than the application's UI theme.
// Solid shaded shapes keep thumbnails cheap and avoid shared SVG definition IDs.
const ink = '#343A46';
const cream = '#E9DFCA';
const creamShade = '#BFB29C';
const denim = '#667F9E';
const denimShade = '#435773';
const rose = '#CCA0AF';
const roseShade = '#966E80';
const mint = '#A6BFB1';
const metal = '#C8C7C0';
const highlight = '#FFF5E3';

function HatGraphic({ itemId }: { itemId: string }): ReactNode {
  switch (itemId) {
    case 'hat-beanie':
      return <g>
        <path d="M108 86 C108 54 126 37 159 37 C192 37 211 55 213 86 Z" fill={denim} stroke={ink} />
        <path d="M182 42 C202 50 211 66 213 86 H196 C196 65 191 51 182 42" fill={denimShade} stroke="none" />
        <path d="M124 76 Q125 51 139 45 M143 75 Q143 51 148 43 M162 75 V43 M181 76 Q180 54 173 44 M198 78 Q194 59 188 53" fill="none" stroke="#97AEC5" strokeWidth="1.1" opacity=".7" />
        <path d="M108 78 Q160 71 212 78 L215 92 Q161 102 106 92 Z" fill={denimShade} stroke={ink} />
        <path d="M113 82 Q159 76 207 82" fill="none" stroke="#A6BCD1" opacity=".6" />
        <path d="M116 83 V91 M124 82 V92 M132 81 V93 M140 80 V94 M148 80 V94 M156 79 V94 M164 79 V94 M172 80 V94 M180 80 V94 M188 81 V93 M196 82 V92 M204 83 V91" stroke="#7892AE" strokeWidth="1" />
        <rect x="173" y="81" width="18" height="12" rx="2.5" fill={cream} stroke="none" />
        <path d="M178 85 H186 M178 88 H183" stroke={creamShade} strokeWidth="1" />
      </g>;
    case 'hat-beret':
      return <g>
        <path d="M155 44 Q151 36 158 32 Q163 32 161 43" fill={roseShade} stroke={ink} />
        <path d="M103 75 C92 59 113 44 143 41 C174 36 207 47 217 64 C230 85 188 91 148 88 C127 87 112 83 103 75 Z" fill={rose} stroke={ink} />
        <path d="M105 75 Q153 83 204 71 Q219 68 220 66 C225 86 185 91 148 88 Q118 87 105 75" fill={roseShade} stroke="none" />
        <path d="M116 79 Q158 85 199 78 L199 88 Q160 96 118 88 Z" fill="#765764" stroke={ink} />
        <path d="M113 61 Q127 47 152 47" fill="none" stroke="#EBD0D5" strokeWidth="3" opacity=".65" />
        <path d="M163 46 Q176 50 183 57" fill="none" stroke={roseShade} opacity=".55" />
      </g>;
    case 'hat-cap':
      return <g>
        <path d="M110 85 C111 58 130 43 158 43 C185 43 206 62 207 86 Z" fill={mint} stroke={ink} />
        <path d="M172 45 C195 53 205 67 207 86 H178 Q183 64 172 45" fill="#789489" stroke="none" />
        <path d="M155 44 Q143 60 143 81 M156 44 Q174 61 176 82" fill="none" stroke="#718B80" strokeWidth="1.1" />
        <ellipse cx="157" cy="44" rx="5" ry="2.5" fill="#718B80" stroke={ink} />
        <path d="M111 83 Q161 78 204 82 Q222 84 232 93 Q235 99 224 101 Q194 103 167 91 Q139 88 111 91 Z" fill="#789489" stroke={ink} />
        <path d="M159 85 Q194 85 223 96" fill="none" stroke="#C9D9C9" opacity=".65" />
        <path d="M123 69 Q126 56 139 52" fill="none" stroke={highlight} strokeWidth="2.5" opacity=".6" />
        <path d="M151 61 L157 57 L163 61 V71 H151 Z" fill={cream} stroke="#718B80" strokeWidth="1" />
      </g>;
    case 'hat-bucket':
      return <g>
        <path d="M121 50 Q160 42 198 51 L210 84 H109 Z" fill={cream} stroke={ink} />
        <path d="M185 49 L198 51 L210 84 H194 Z" fill={creamShade} stroke="none" />
        <path d="M114 72 Q159 78 204 73 L209 86 Q160 93 110 85 Z" fill="#D5C7B0" stroke="none" />
        <path d="M110 80 Q160 87 209 80 L226 98 Q228 103 221 104 Q160 112 100 103 Q94 102 97 97 Z" fill={cream} stroke={ink} />
        <path d="M104 97 Q160 107 218 98 M117 77 Q159 82 201 77" fill="none" stroke={creamShade} strokeWidth="1" strokeDasharray="3 3" />
        <path d="M124 54 Q149 49 173 51" fill="none" stroke={highlight} strokeWidth="2.5" />
        <circle cx="130" cy="65" r="2" fill={creamShade} stroke="none" />
        <circle cx="190" cy="65" r="2" fill={creamShade} stroke="none" />
      </g>;
    case 'hat-fedora':
      return <g>
        <path d="M118 82 L126 46 Q130 38 142 43 L157 49 L181 40 Q193 37 197 50 L206 84 Z" fill="#777987" stroke={ink} />
        <path d="M181 41 Q187 56 184 77 L205 84 L197 50 Q193 38 181 41" fill="#555A68" stroke="none" />
        <path d="M133 46 Q144 50 157 55 Q170 49 182 45" fill="none" stroke="#B7B6C1" strokeWidth="2" />
        <path d="M120 70 Q160 79 202 70 L206 85 Q161 95 118 84 Z" fill="#3F4351" stroke={ink} />
        <path d="M116 82 Q158 91 206 82 Q222 80 232 86 Q242 97 210 102 Q157 110 105 99 Q85 94 95 87 Q101 83 116 82 Z" fill="#777987" stroke={ink} />
        <path d="M100 90 Q156 103 223 91" fill="none" stroke="#B3B3BE" opacity=".65" />
        <path d="M186 75 L198 74 L200 82 L188 83 Z" fill={creamShade} stroke="none" />
      </g>;
    case 'hat-crown':
      return <g>
        <path d="M125 42 Q125 39 129 42 L143 54 L157 30 Q160 26 163 30 L177 54 L193 42 Q197 39 195 45 L188 71 Q160 78 132 71 Z" fill="#DDC27C" stroke="#7F6B48" />
        <path d="M185 48 L193 42 Q197 39 195 45 L188 71 Q160 78 132 71 L131 65 Q159 70 185 64 Z" fill="#B5985D" stroke="none" />
        <path d="M136 61 L130 48 M150 52 L159 36" fill="none" stroke={highlight} strokeWidth="2.5" />
        <path d="M133 65 Q160 71 190 64 L188 74 Q160 81 134 74 Z" fill="#E9CF91" stroke="#7F6B48" />
        <path d="M160 49 L165 56 L160 63 L155 56 Z" fill={rose} stroke="#997260" strokeWidth="1" />
        <circle cx="142" cy="69" r="2.5" fill="#B8C4B1" stroke="#7F6B48" strokeWidth="1" />
        <circle cx="178" cy="69" r="2.5" fill="#B8C4B1" stroke="#7F6B48" strokeWidth="1" />
      </g>;
    case 'hat-party':
      return <g>
        <path d="M143 75 L171 21 Q173 17 176 22 L198 80 Q171 90 143 75 Z" fill="#A2A1C4" stroke={ink} />
        <path d="M176 25 L198 80 Q186 84 181 82 Z" fill="#777A9E" stroke="none" />
        <path d="M155 51 Q169 59 187 59 L191 70 Q168 70 151 61 Z" fill={cream} stroke="none" />
        <path d="M163 36 Q171 41 181 41 L184 50 Q171 50 159 44 Z" fill={rose} stroke="none" />
        <path d="M143 75 Q169 85 198 80" fill="none" stroke={cream} strokeWidth="6" />
        <path d="M154 53 L168 28" fill="none" stroke={highlight} strokeWidth="1.6" opacity=".65" />
        <circle cx="174" cy="18" r="7" fill={cream} stroke={ink} />
        <path d="M170 16 Q173 13 176 15" fill="none" stroke={highlight} strokeWidth="2" />
      </g>;
    case 'hat-sleep':
      return <g>
        <path d="M113 82 Q119 45 155 41 C189 37 220 42 225 68 L219 77 Q211 55 190 61 Q192 76 205 85 Z" fill="#B9B4CF" stroke={ink} />
        <path d="M176 43 Q204 42 215 61 Q221 70 219 77 L225 68 Q222 42 193 41 Z" fill="#8885AA" stroke="none" />
        <path d="M126 69 Q132 50 151 49" fill="none" stroke="#E4DEED" strokeWidth="3" />
        <path d="M114 78 Q161 74 205 82 L206 96 Q161 89 111 92 Z" fill={cream} stroke={ink} />
        <path d="M118 82 Q156 79 199 86" fill="none" stroke={highlight} strokeWidth="2" />
        <circle cx="222" cy="78" r="10" fill={cream} stroke={ink} />
        <path d="M216 75 Q220 70 225 73" fill="none" stroke={highlight} strokeWidth="2.5" />
        <path d="M168 53 A7 7 0 1 0 177 62 A8 8 0 0 1 168 53" fill={cream} stroke="none" />
      </g>;
    case 'hat-sailor':
      return <g>
        <path d="M110 64 Q107 49 122 45 Q158 36 199 46 Q215 50 211 64 L203 82 H119 Z" fill={cream} stroke={ink} />
        <path d="M196 46 Q206 57 198 76 L203 82 L211 64 Q215 51 196 46" fill={creamShade} stroke="none" />
        <path d="M118 50 Q150 43 181 47" fill="none" stroke={highlight} strokeWidth="3" />
        <path d="M115 73 Q160 80 206 73 L207 91 Q159 100 114 91 Z" fill={denimShade} stroke={ink} />
        <path d="M119 79 Q160 86 202 79" fill="none" stroke="#AEC1D0" strokeWidth="1.2" />
        <path d="M159 81 V91 M153 86 Q159 96 165 86 M156 84 H162" fill="none" stroke={cream} strokeWidth="1.5" />
        <circle cx="159" cy="80" r="2" fill="none" stroke={cream} strokeWidth="1.5" />
        <path d="M198 89 L208 88 L218 107 L209 105 L207 111 Z" fill={denimShade} stroke={ink} />
      </g>;
    case 'hat-baker':
      return <g>
        <path d="M116 77 C98 75 99 54 112 50 C113 33 132 29 145 39 C154 23 178 27 184 42 C203 35 218 51 211 66 Q218 80 201 83 Z" fill={cream} stroke={ink} />
        <path d="M183 43 Q194 44 194 59 Q208 60 201 79 L201 83 Q218 80 211 66 C216 53 205 38 191 40 Z" fill={creamShade} stroke="none" />
        <path d="M111 60 Q108 52 120 49 M130 41 Q137 37 144 44 M153 37 Q165 29 176 40" fill="none" stroke={highlight} strokeWidth="3" />
        <path d="M119 74 Q160 81 201 75 L200 95 Q159 100 119 92 Z" fill="#D7C8AC" stroke={ink} />
        <path d="M126 80 V90 M143 83 V93 M161 84 V94 M179 83 V93 M194 81 V91" fill="none" stroke={creamShade} />
        <path d="M123 78 Q159 85 197 79" fill="none" stroke={highlight} strokeWidth="1.6" />
      </g>;
    default:
      return null;
  }
}

function GlassesGraphic({ itemId }: { itemId: string }): ReactNode {
  const arms = <path d="M122 113 L112 109 M197 113 L208 109" fill="none" stroke={metal} strokeWidth="2" />;
  const bridge = <path d="M155 116 Q160 112 165 116" fill="none" />;
  switch (itemId) {
    case 'glasses-round':
      return <g stroke={metal} strokeWidth="2">
        {arms}{bridge}
        <circle cx="139" cy="119" r="16" fill="#C3DDE8" fillOpacity=".09" />
        <circle cx="181" cy="119" r="16" fill="#C3DDE8" fillOpacity=".09" />
        <path d="M129 110 Q133 105 139 106 M171 110 Q175 105 181 106" fill="none" stroke={highlight} strokeWidth="1.1" />
      </g>;
    case 'glasses-square':
      return <g stroke={denim} strokeWidth="2.5">
        <path d="M120 110 L111 107 M200 110 L208 107" fill="none" />{bridge}
        <rect x="121" y="105" width="35" height="28" rx="7" fill="#AAC5D4" fillOpacity=".12" />
        <rect x="165" y="105" width="35" height="28" rx="7" fill="#AAC5D4" fillOpacity=".12" />
        <path d="M126 112 Q126 109 130 109 H140 M170 112 Q170 109 174 109 H184" fill="none" stroke="#D9E6E9" strokeWidth="1.2" />
      </g>;
    case 'glasses-oval':
      return <g stroke="#B8A68F" strokeWidth="2">
        {arms}<path d="M157 118 Q160 115 163 118" fill="none" />
        <ellipse cx="139" cy="120" rx="18" ry="12" fill="#E4CAB8" fillOpacity=".12" />
        <ellipse cx="181" cy="120" rx="18" ry="12" fill="#E4CAB8" fillOpacity=".12" />
        <path d="M126 117 Q131 111 142 111 M168 117 Q173 111 184 111" fill="none" stroke={highlight} strokeWidth="1" />
      </g>;
    case 'glasses-cat-eye':
      return <g stroke={roseShade} strokeWidth="2.3">
        <path d="M118 107 L111 104 M203 107 L210 104 M157 115 Q160 111 163 115" fill="none" />
        <path d="M117 103 Q135 106 153 106 Q159 108 156 120 Q152 133 137 132 Q122 131 117 103 Z" fill="#D8BBC7" fillOpacity=".13" />
        <path d="M204 103 Q186 106 168 106 Q162 108 165 120 Q169 133 184 132 Q199 131 204 103 Z" fill="#D8BBC7" fillOpacity=".13" />
        <path d="M121 107 Q137 110 150 109 M170 109 Q185 110 200 107" fill="none" stroke="#F1CFD7" strokeWidth="1.2" />
        <circle cx="122" cy="108" r="1.4" fill={cream} stroke="none" /><circle cx="199" cy="108" r="1.4" fill={cream} stroke="none" />
      </g>;
    case 'glasses-heart':
      return <g stroke={rose} strokeWidth="2.4">
        <path d="M119 110 L110 106 M201 110 L210 106 M156 114 Q160 110 164 114" fill="none" />
        <path d="M138 109 C127 95 114 105 119 117 Q123 128 138 137 Q154 126 157 116 C160 104 146 98 138 109 Z" fill="#6C515F" fillOpacity=".75" />
        <path d="M181 109 C171 95 157 105 164 117 Q168 128 181 137 Q197 126 201 116 C204 104 190 98 181 109 Z" fill="#6C515F" fillOpacity=".75" />
        <path d="M124 112 Q125 105 131 109 M169 112 Q170 105 175 109" fill="none" stroke="#F0D6DC" strokeWidth="1.8" />
      </g>;
    case 'glasses-star':
      return <g stroke="#D4C38E" strokeWidth="2.2">
        <path d="M121 110 L111 106 M200 110 L209 106 M156 116 Q160 112 164 116" fill="none" />
        <path d="M138 101 Q139 99 140 102 L146 111 L156 112 Q159 112 156 115 L149 123 L151 134 Q151 137 148 135 L138 130 L128 135 Q125 137 126 133 L128 123 L120 115 Q118 112 121 112 L132 110 Z" fill="#655F50" fillOpacity=".78" />
        <path d="M180 101 Q181 99 182 102 L188 111 L198 112 Q201 112 198 115 L191 123 L193 134 Q193 137 190 135 L180 130 L170 135 Q167 137 168 133 L170 123 L162 115 Q160 112 163 112 L174 110 Z" fill="#655F50" fillOpacity=".78" />
        <path d="M129 114 L134 114 L139 106 M171 114 L176 114 L181 106" fill="none" stroke={highlight} strokeWidth="1.2" />
      </g>;
    case 'glasses-rimless':
      return <g>
        <path d="M121 114 L111 110 M199 114 L209 110 M155 116 Q160 112 165 116" fill="none" stroke={metal} strokeWidth="1.4" />
        <path d="M123 109 Q139 104 154 109 L154 124 Q141 133 125 126 Z M166 109 Q181 104 197 109 L195 126 Q180 133 166 124 Z" fill="#D1E4EA" fillOpacity=".12" stroke="#C5D6DC" strokeOpacity=".7" strokeWidth=".8" />
        <path d="M128 111 Q137 108 146 110 M171 111 Q180 108 188 110" fill="none" stroke="#F3FBFC" strokeOpacity=".75" strokeWidth="1.2" />
        <path d="M122 114 H127 M151 116 H155 M165 116 H170 M194 114 H199" stroke={metal} strokeWidth="2" />
      </g>;
    case 'glasses-thick':
      return <g stroke="#434552" strokeWidth="5">
        <path d="M121 110 L111 107 M200 110 L209 107 M157 113 Q160 110 164 113" fill="none" />
        <path d="M121 107 Q140 103 156 108 L154 124 Q152 133 139 133 Q124 132 123 124 Z M165 108 Q182 103 200 107 L198 124 Q196 132 182 133 Q168 133 167 124 Z" fill="#B5C5D1" fillOpacity=".13" />
        <path d="M127 108 Q138 106 150 109 M171 109 Q183 106 194 108" fill="none" stroke="#9D9DAB" strokeWidth="1.1" />
        <path d="M123 111 H127 M194 111 H198" stroke={creamShade} strokeWidth="1.4" />
      </g>;
    case 'glasses-browline':
      return <g stroke={metal} strokeWidth="1.5">
        {arms}{bridge}
        <path d="M122 109 Q138 104 155 109 L153 124 Q150 134 138 133 Q124 133 123 121 Z M165 109 Q182 104 199 109 L197 121 Q195 133 181 133 Q169 134 167 124 Z" fill="#C8D8DC" fillOpacity=".1" />
        <path d="M122 111 L124 107 Q138 104 154 108 L155 113 M165 113 L166 108 Q183 104 197 107 L199 111" fill="none" stroke="#66616A" strokeWidth="5" />
        <path d="M127 107 Q138 105 151 108 M170 108 Q183 105 194 107" fill="none" stroke="#C2B9B3" strokeWidth="1" />
      </g>;
    case 'glasses-sport':
      return <g>
        <path d="M115 109 L106 105 M204 109 L213 105" fill="none" stroke={denimShade} strokeWidth="5" />
        <path d="M113 105 Q159 98 207 105 L202 122 Q200 132 182 133 Q166 134 160 122 Q154 134 138 133 Q119 132 117 122 Z" fill="#506C7C" fillOpacity=".7" stroke="#B2C2C7" strokeWidth="2.3" />
        <path d="M117 107 Q158 102 203 107" fill="none" stroke={denimShade} strokeWidth="5" />
        <path d="M122 111 Q144 106 158 109 M168 109 L184 109" fill="none" stroke="#D8E8EC" strokeWidth="1.4" opacity=".8" />
        <path d="M130 110 L125 124 M136 110 L131 126" fill="none" stroke="#D8E8EC" strokeWidth="2.2" opacity=".22" />
      </g>;
    default:
      return null;
  }
}

function AccessoryGraphic({ itemId, layer, drinking }: HeadItemGraphicProps): ReactNode {
  if (layer === 'back') {
    switch (itemId) {
      case 'accessory-backpack':
        return <g>
          <path d="M137 162 V150 Q159 130 183 151 V163" fill="none" stroke={creamShade} strokeWidth="8" />
          <path d="M137 162 V150 Q159 130 183 151 V163" fill="none" stroke={cream} strokeWidth="3" />
          <path d="M112 158 Q160 145 210 159 Q232 167 234 195 L232 239 Q230 255 211 257 H110 Q91 253 89 235 L88 193 Q89 167 112 158 Z" fill={denimShade} stroke={ink} />
          <path d="M104 173 Q91 190 97 231 M217 171 Q229 191 223 235" fill="none" stroke={denim} strokeWidth="3" />
          <path d="M89 207 L80 210 Q75 212 78 232 L81 242 Q84 247 94 246 M233 207 L241 210 Q247 213 243 234 L240 244 Q236 248 229 246" fill={denim} stroke={ink} />
        </g>;
      case 'accessory-cape':
        return <g>
          <path d={drinking ? 'M107 146 Q158 132 211 144 Q232 168 252 224 Q245 249 217 252 Q190 269 161 259 Q131 271 105 255 Q75 254 67 233 Q84 177 107 146 Z' : 'M107 146 Q159 132 211 146 Q230 177 249 234 Q242 253 216 254 Q190 269 161 259 Q130 271 104 255 Q76 254 68 234 Q85 177 107 146 Z'} fill="#82758F" stroke={ink} />
          <path d="M104 166 Q93 205 83 239 M123 165 Q113 217 113 254 M200 165 Q210 215 213 253 M217 165 Q230 211 235 240" fill="none" stroke="#665D78" strokeWidth="2.5" />
          <path d="M80 239 Q93 251 106 248 Q132 264 161 252 Q189 263 215 248 Q232 249 240 237" fill="none" stroke="#C3B2C7" strokeWidth="3" />
        </g>;
      default:
        return null;
    }
  }
  if (layer !== 'front') return null;
  switch (itemId) {
    case 'accessory-star':
      return <g>
        <path d="M124 158 Q125 155 127 159 L132 168 L142 170 Q146 171 142 174 L135 180 L136 191 Q136 194 132 192 L123 187 L114 191 Q110 192 111 188 L113 178 L106 171 Q103 168 108 168 L119 167 Z" fill="#DFCA8D" stroke="#8E7B54" />
        <path d="M125 163 L122 171 L113 171 M117 184 L124 180 L131 184" fill="none" stroke={highlight} strokeWidth="1.5" opacity=".8" />
        <circle cx="126" cy="176" r="2.5" fill="#B79C67" stroke="none" />
      </g>;
    case 'accessory-heart':
      return <g>
        <path d="M124 166 C116 155 104 162 107 173 C109 181 117 187 125 192 C134 186 142 177 141 169 C140 158 128 157 124 166 Z" fill={rose} stroke={roseShade} />
        <path d="M110 169 Q110 163 116 164" fill="none" stroke="#F1D4DC" strokeWidth="2.5" />
        <path d="M113 177 Q118 184 125 188 Q136 180 137 173" fill="none" stroke={roseShade} strokeWidth="1" />
        <path d="M121 171 H128 M124 168 V174" stroke="#E7C6D0" strokeWidth="1.2" />
      </g>;
    case 'accessory-bow':
      return <g>
        <path d="M153 158 Q131 146 128 153 Q123 164 130 177 Q133 181 153 169 Z M167 158 Q188 145 192 153 Q198 165 190 177 Q187 181 167 169 Z" fill={rose} stroke={ink} />
        <path d="M135 157 L153 163 L135 173 M185 157 L167 163 L185 173" fill="none" stroke={roseShade} />
        <path d="M150 162 L148 183 L158 179 L162 168 M170 163 L176 182 L166 179 L160 168" fill={roseShade} stroke={ink} />
        <rect x="153" y="156" width="14" height="17" rx="5" fill="#DDB8C1" stroke={ink} />
        <path d="M157 160 V167 M132 155 Q139 154 146 159" fill="none" stroke="#F1D4DC" strokeWidth="1.5" />
      </g>;
    case 'accessory-scarf':
      return <g>
        <path d="M129 165 Q130 191 117 215 Q130 224 144 219 Q155 193 151 169 Z" fill={mint} stroke={ink} />
        <path d="M136 181 Q135 199 128 215 M121 210 L145 214" fill="none" stroke="#718E81" />
        <path d="M120 216 L118 222 M127 219 L125 225 M135 220 L133 226 M142 218 L141 224" stroke={creamShade} strokeWidth="2" />
        <path d="M110 150 Q157 168 210 150 L211 166 Q160 187 111 166 Z" fill={mint} stroke={ink} />
        <path d="M114 154 Q158 171 204 155" fill="none" stroke="#CFE0D0" strokeWidth="2.3" />
        <path d="M113 162 Q157 179 207 163" fill="none" stroke="#718E81" />
        <path d="M134 158 Q146 161 150 167 L145 180 Q136 177 130 169 Z" fill="#8EAA9C" stroke={ink} />
      </g>;
    case 'accessory-pendant':
      return <g>
        <path d="M118 153 Q127 180 160 194 Q191 181 202 153" fill="none" stroke="#786F60" strokeWidth="3" />
        <path d="M118 153 Q127 180 160 194 Q191 181 202 153" fill="none" stroke="#DDD0AE" strokeWidth="1.4" />
        <ellipse cx="160" cy="195" rx="3.5" ry="5" fill="none" stroke="#DDD0AE" strokeWidth="1.8" />
        <path d="M150 203 Q160 195 170 203 L169 220 Q160 228 151 220 Z" fill={cream} stroke="#8F8064" />
        <path d="M156 205 Q160 202 165 205 L164 217 Q160 221 156 217 Z" fill={denim} stroke="#8F8064" strokeWidth="1" />
        <path d="M154 204 L153 216 M158 207 H161" fill="none" stroke={highlight} strokeWidth="1.3" />
      </g>;
    case 'accessory-crossbody':
      return <g>
        <path d={drinking ? 'M207 148 Q167 177 119 221' : 'M209 152 Q164 181 118 221'} fill="none" stroke={ink} strokeWidth="10" />
        <path d={drinking ? 'M207 148 Q167 177 119 221' : 'M209 152 Q164 181 118 221'} fill="none" stroke={creamShade} strokeWidth="7" />
        <path d="M185 166 L177 173" fill="none" stroke={cream} strokeWidth="3" />
        <path d="M102 205 Q122 199 144 208 L147 238 Q123 248 100 237 Z" fill={cream} stroke={ink} />
        <path d="M103 226 Q124 233 146 226 L147 238 Q123 248 100 237 L101 228" fill={creamShade} stroke="none" />
        <path d="M102 205 Q125 200 144 208 L141 221 Q121 228 103 218 Z" fill="#D7C9B0" stroke={ink} />
        <path d="M108 208 Q122 205 138 210" fill="none" stroke={highlight} strokeWidth="1.6" />
        <rect x="120" y="216" width="7" height="8" rx="2" fill={denimShade} stroke={ink} strokeWidth="1" />
      </g>;
    case 'accessory-backpack':
      return <g>
        <path d="M113 151 Q103 169 109 198 Q112 208 122 208 L126 198 Q118 179 124 157 Z" fill={creamShade} stroke={ink} />
        <path d={drinking ? 'M204 148 Q218 160 216 192 L212 203 L201 201 Q207 174 194 155 Z' : 'M204 151 Q218 170 212 199 Q208 209 198 208 L194 197 Q203 178 194 157 Z'} fill={creamShade} stroke={ink} />
        <path d="M114 160 Q108 176 114 192" fill="none" stroke={cream} strokeWidth="2" />
        <path d={drinking ? 'M205 158 Q213 174 208 191' : 'M205 160 Q212 176 206 192'} fill="none" stroke={cream} strokeWidth="2" />
        <rect x="110" y="188" width="13" height="12" rx="3" fill={denimShade} stroke={ink} />
        <rect x={drinking ? 201 : 198} y="188" width="13" height="12" rx="3" fill={denimShade} stroke={ink} />
        <path d="M114 192 H119 M116 196 H120" stroke={metal} strokeWidth="1" />
      </g>;
    case 'accessory-pouch':
      return <g>
        <path d="M98 222 Q162 236 226 220 L227 231 Q162 248 97 233 Z" fill={denimShade} stroke={ink} />
        <path d="M109 224 Q160 237 214 225" fill="none" stroke="#829AB4" strokeWidth="1.3" />
        <rect x="102" y="225" width="15" height="12" rx="3" fill={metal} stroke={ink} />
        <path d="M127 221 Q151 215 178 222 L176 244 Q152 255 131 244 Z" fill={denim} stroke={ink} />
        <path d="M131 235 Q153 243 177 234 L176 244 Q152 255 131 244 Z" fill={denimShade} stroke="none" />
        <path d="M133 226 Q151 223 172 227" fill="none" stroke={creamShade} strokeWidth="2" />
        <path d="M166 228 L166 234" stroke={cream} strokeWidth="2" />
        <path d="M134 222 Q146 219 156 221" fill="none" stroke="#ABC1D2" strokeWidth="1.4" />
      </g>;
    case 'accessory-bird':
      return <g>
        <path d="M91 150 L85 158 M102 151 L106 158" stroke="#B49A6D" strokeWidth="2" />
        <path d="M80 143 L70 133 Q69 130 73 131 L86 134" fill={mint} stroke={ink} />
        <path d="M81 136 C82 123 92 117 103 120 Q112 122 113 132 Q118 145 104 151 C93 156 81 151 81 142 Z" fill={cream} stroke={ink} />
        <path d="M84 134 Q94 127 101 136 Q106 145 96 147 Q86 147 84 134 Z" fill={mint} stroke="#718E81" strokeWidth="1.1" />
        <path d="M112 129 L121 134 L112 138" fill="#D4B478" stroke={ink} />
        <circle cx="105" cy="128" r="1.7" fill={ink} stroke="none" />
        <path d="M89 127 Q93 122 99 123 M88 136 Q92 132 96 136" fill="none" stroke={highlight} strokeWidth="1.6" />
        <path d="M84 143 L87 144 M101 148 L103 146" stroke={creamShade} strokeWidth="1" />
      </g>;
    case 'accessory-cape':
      return <g>
        <path d="M110 145 Q130 153 157 155 L148 175 Q123 171 108 159 Z M210 145 Q189 153 163 155 L173 175 Q198 171 212 159 Z" fill="#AB9AB5" stroke={ink} />
        <path d="M115 150 Q131 158 148 159 M169 159 Q188 158 204 150" fill="none" stroke="#D1C2D6" strokeWidth="1.6" />
        <path d="M153 163 Q160 171 168 163" fill="none" stroke={creamShade} strokeWidth="2" />
        <circle cx="152" cy="162" r="3" fill={cream} stroke="#8F8064" strokeWidth="1" />
        <circle cx="168" cy="162" r="3" fill={cream} stroke="#8F8064" strokeWidth="1" />
      </g>;
    default:
      return null;
  }
}

/** All paths use the jelly's own 320 × 366 coordinates and move with its shape. */
export function HeadItemGraphic({ itemId, layer, drinking }: HeadItemGraphicProps): ReactNode {
  let graphic: ReactNode = null;
  if (itemId.startsWith('hat-') && layer === 'front') graphic = HatGraphic({ itemId });
  if (itemId.startsWith('glasses-') && layer === 'front') graphic = GlassesGraphic({ itemId });
  if (itemId.startsWith('accessory-')) graphic = AccessoryGraphic({ itemId, layer, drinking });
  if (!graphic) return null;
  return <g aria-hidden="true" data-avatar-item={itemId} data-avatar-layer={layer} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{graphic}</g>;
}
