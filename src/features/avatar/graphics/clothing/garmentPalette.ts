export type GarmentPalette = { base: string; light: string; shade: string; edge: string };

// Muted cloth colors shared by clothing, headwear, bags and shoes.
export const garmentPalettes = {
  cream: { base: '#D6CDBA', light: '#EEE6D7', shade: '#8A877E', edge: '#646B70' },
  navy: { base: '#52677B', light: '#8195A4', shade: '#2E3D50', edge: '#394654' },
  grey: { base: '#818994', light: '#B6BDC3', shade: '#4B5665', edge: '#48535F' },
  sage: { base: '#81968D', light: '#B8C9BA', shade: '#4E655D', edge: '#4D615A' },
  lavender: { base: '#A79DAC', light: '#D2C8CF', shade: '#736C82', edge: '#625F70' },
  sand: { base: '#BAAB91', light: '#E3D5BC', shade: '#827762', edge: '#6B695F' },
  denim: { base: '#627F9A', light: '#A0B9CA', shade: '#3B506D', edge: '#40546A' },
  charcoal: { base: '#4D5662', light: '#89949D', shade: '#2B333F', edge: '#333D49' },
  blush: { base: '#B79298', light: '#DDC1BF', shade: '#7F6674', edge: '#79656E' },
  mint: { base: '#A0B8AD', light: '#D3E2D3', shade: '#657F77', edge: '#607B73' },
} satisfies Record<string, GarmentPalette>;
