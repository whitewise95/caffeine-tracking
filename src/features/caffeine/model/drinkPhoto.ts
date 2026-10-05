export const DRINK_PHOTO_SIZE = 160
export const MAX_DRINK_PHOTO_DATA_URL_LENGTH = 48_000

/** Stored photos are bounded JPEG thumbnails, never remote URLs or SVG markup. */
export function isDrinkPhotoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_DRINK_PHOTO_DATA_URL_LENGTH
    && /^data:image\/jpeg;base64,\/9j\/(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
}
