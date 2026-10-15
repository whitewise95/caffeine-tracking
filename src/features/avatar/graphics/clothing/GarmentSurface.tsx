import { useId, type ReactNode } from 'react';

import type { GarmentPalette } from './garmentPalette';

// Cheap shading with an instance-specific ID so previews and thumbnails coexist.
export function GarmentSurface({ d, palette, opacity = 1, className, children }: {
  d: string;
  palette: GarmentPalette;
  opacity?: number;
  className?: string;
  children?: ReactNode;
}) {
  const id = `cloth-${useId().replace(/:/g, '')}`;
  return <g className={className} strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="12%">
        <stop stopColor={palette.shade} />
        <stop offset=".16" stopColor={palette.base} />
        <stop offset=".36" stopColor={palette.light} />
        <stop offset=".62" stopColor={palette.base} />
        <stop offset="1" stopColor={palette.shade} />
      </linearGradient>
    </defs>
    <path data-garment-surface="true" d={d} fill={`url(#${id})`} fillOpacity={opacity} stroke={palette.edge} strokeOpacity={Math.max(.45, opacity)} strokeWidth="1.15" />
    {children}
  </g>;
}
