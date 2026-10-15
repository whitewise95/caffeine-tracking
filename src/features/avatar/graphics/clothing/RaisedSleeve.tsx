import { GarmentSurface } from './GarmentSurface';
import type { GarmentPalette } from './garmentPalette';

type RaisedSleeveStyle = 'short' | 'long' | 'puff' | 'bell';

// One continuous shoulder-to-elbow panel replaces the two touching pieces.
// The short hem crosses the upper arm; long cuffs turn inward toward the cup.
const shapes: Record<RaisedSleeveStyle, { body: string; cuff: string; fold: string; light: string }> = {
  short: {
    body: 'M216 142 C229 139 242 147 251 159 Q254 163 254 166 Q245 177 230 180 Q222 176 218 168 Q218 154 216 142 Z',
    cuff: 'M250 160 Q243 171 228 175 L231 180 Q246 177 254 166 Z',
    fold: 'M221 150 Q224 158 223 166',
    light: 'M225 145 Q239 147 247 158',
  },
  puff: {
    body: 'M216 142 C231 137 246 141 254 152 Q262 162 257 171 Q246 182 231 184 Q221 178 218 168 Q219 154 216 142 Z',
    cuff: 'M253 165 Q244 175 229 178 L232 184 Q247 182 257 171 Z',
    fold: 'M227 146 Q237 153 235 168 M241 148 Q250 156 247 167',
    light: 'M224 144 Q241 141 251 153',
  },
  long: {
    body: 'M216 142 C230 138 243 147 253 162 C262 176 267 190 259 198 C250 208 235 204 225 198 Q215 192 211 177 Q224 171 232 161 L236 150 Q227 145 218 148 Z',
    cuff: 'M211 176 Q222 172 232 162 L237 168 Q227 180 216 184 Z',
    fold: 'M224 189 Q236 201 249 198 M244 177 Q241 184 235 187',
    light: 'M226 144 Q242 149 251 166 Q258 178 259 187',
  },
  bell: {
    body: 'M216 142 C230 138 243 147 253 162 C262 175 269 189 261 200 Q250 214 232 205 Q217 201 207 178 Q222 173 234 160 L237 150 Q227 145 218 148 Z',
    cuff: 'M207 177 Q223 173 234 160 L240 167 Q226 182 212 186 Z',
    fold: 'M219 188 Q229 199 240 201 M233 181 Q245 193 253 195',
    light: 'M226 144 Q241 148 251 165 Q259 179 261 190',
  },
};

export function RaisedSleeve({ palette, style = 'long', cuff = palette.shade, striped = false, opacity = 1 }: {
  palette: GarmentPalette;
  style?: RaisedSleeveStyle;
  cuff?: string;
  striped?: boolean;
  opacity?: number;
}) {
  const shape = shapes[style];
  return <g stroke={palette.edge} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
    <GarmentSurface d={shape.body} palette={palette} opacity={opacity} />
    <path d={shape.cuff} fill={cuff} fillOpacity={opacity} strokeOpacity=".65" />
    <path d={shape.fold} fill="none" stroke={palette.shade} strokeOpacity={.4 * opacity} />
    <path d={shape.light} fill="none" stroke={palette.light} strokeOpacity={.55 * opacity} strokeWidth="1.3" />
    {striped && <path d="M239 154 Q247 159 252 168 M240 175 Q249 180 260 180 M224 187 Q237 195 257 192" fill="none" stroke="#637184" strokeWidth="3.5" strokeOpacity=".8" />}
  </g>;
}
