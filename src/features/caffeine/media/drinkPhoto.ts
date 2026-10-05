import { DRINK_PHOTO_SIZE, isDrinkPhotoDataUrl } from '../model/drinkPhoto'

/** Decode locally and store only a small square JPEG; the original is never persisted. */
export async function createDrinkPhoto(source: File | string): Promise<string> {
  if (source instanceof File && (!/^image\/(jpeg|png|webp|gif|avif|heic|heif)$/i.test(source.type) || source.size > 25 * 1024 * 1024)) {
    throw new Error('25MB 이하의 사진 파일을 선택해 주세요.')
  }
  if (typeof source === 'string' && (source.length > 2_000_000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(source))) {
    throw new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.')
  }
  const url = typeof source === 'string' ? source : URL.createObjectURL(source)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.'))
      image.src = url
    })
    const edge = Math.min(image.naturalWidth, image.naturalHeight)
    if (!edge) throw new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.')
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(DRINK_PHOTO_SIZE, edge)
    canvas.height = canvas.width
    const context = canvas.getContext('2d')
    if (!context) throw new Error('사진을 처리하지 못했어요. 다시 시도해 주세요.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, (image.naturalWidth - edge) / 2, (image.naturalHeight - edge) / 2, edge, edge, 0, 0, canvas.width, canvas.height)
    for (const quality of [.72, .5, .3]) {
      const photo = canvas.toDataURL('image/jpeg', quality)
      if (isDrinkPhotoDataUrl(photo)) return photo
    }
    throw new Error('사진 용량을 줄이지 못했어요. 다른 사진을 선택해 주세요.')
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url)
  }
}
