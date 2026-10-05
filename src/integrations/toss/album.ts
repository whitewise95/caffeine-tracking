import { Device, FetchAlbumPhotosPermissionError } from '@apps-in-toss/web-framework'

/** Official SDK asks for photos/read permission; cancellation does not replace a photo. */
export async function pickTossAlbumPhoto(): Promise<string | null> {
  try {
    if (await Device.getPhotos.getPermission() === 'denied' && await Device.getPhotos.openPermissionDialog() !== 'allowed') {
      throw new FetchAlbumPhotosPermissionError()
    }
    const [photo] = await Device.getPhotos({ maxCount: 1, maxWidth: 360, base64: true })
    if (!photo) return null
    return photo.dataUri.startsWith('data:') ? photo.dataUri : `data:image/jpeg;base64,${photo.dataUri}`
  } catch (cause) {
    if (cause instanceof FetchAlbumPhotosPermissionError) {
      throw new Error('사진을 선택하려면 앨범 접근을 허용해 주세요.', { cause })
    }
    throw new Error('앨범을 열지 못했어요. 다시 시도해 주세요.', { cause })
  }
}
