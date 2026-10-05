import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Device, FetchAlbumPhotosPermissionError } from '@apps-in-toss/web-framework'
import { pickTossAlbumPhoto } from './album'

vi.mock('@apps-in-toss/web-framework', () => ({
  Device: { getPhotos: Object.assign(vi.fn(), { getPermission: vi.fn(), openPermissionDialog: vi.fn() }) },
  FetchAlbumPhotosPermissionError: class extends Error {},
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(Device.getPhotos.getPermission).mockResolvedValue('allowed')
})

describe('Toss album adapter', () => {
  it('requests one small base64 photo using the official device API', async () => {
    vi.mocked(Device.getPhotos).mockResolvedValue([{ id: 'photo', dataUri: '/9j/AA==' }])
    expect(await pickTossAlbumPhoto()).toBe('data:image/jpeg;base64,/9j/AA==')
    expect(Device.getPhotos).toHaveBeenCalledWith({ maxCount: 1, maxWidth: 360, base64: true })
    expect(Device.getPhotos.openPermissionDialog).not.toHaveBeenCalled()
  })
  it('leaves the existing selection unchanged when the album is cancelled', async () => {
    vi.mocked(Device.getPhotos).mockResolvedValue([])
    expect(await pickTossAlbumPhoto()).toBeNull()
  })
  it('requests permission again only after the user tries adding a photo', async () => {
    vi.mocked(Device.getPhotos.getPermission).mockResolvedValue('denied')
    vi.mocked(Device.getPhotos.openPermissionDialog).mockResolvedValue('allowed')
    vi.mocked(Device.getPhotos).mockResolvedValue([{ id: 'photo', dataUri: 'data:image/jpeg;base64,/9j/AA==' }])
    expect(await pickTossAlbumPhoto()).toBe('data:image/jpeg;base64,/9j/AA==')
    expect(Device.getPhotos.openPermissionDialog).toHaveBeenCalledOnce()
  })
  it('reports denied permission without attempting to read album contents', async () => {
    vi.mocked(Device.getPhotos.getPermission).mockResolvedValue('denied')
    vi.mocked(Device.getPhotos.openPermissionDialog).mockResolvedValue('denied')
    await expect(pickTossAlbumPhoto()).rejects.toThrow('앨범 접근을 허용')
    expect(Device.getPhotos).not.toHaveBeenCalled()
  })
  it('reports OS permission errors and native failures without a different picker fallback', async () => {
    vi.mocked(Device.getPhotos).mockRejectedValueOnce(new FetchAlbumPhotosPermissionError())
    await expect(pickTossAlbumPhoto()).rejects.toThrow('앨범 접근을 허용')
    vi.mocked(Device.getPhotos).mockRejectedValueOnce(new Error('bridge failed'))
    await expect(pickTossAlbumPhoto()).rejects.toThrow('앨범을 열지 못했어요')
  })
})
