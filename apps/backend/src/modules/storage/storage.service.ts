import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { Readable } from 'stream'

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get('CLOUDINARY_API_KEY'),
      api_secret: config.get('CLOUDINARY_API_SECRET'),
    })
  }

  async uploadMenuItemPhoto(
    buffer: Buffer,
    itemId: string,
  ): Promise<{ photoUrl: string; photoMediumUrl: string; photoThumbUrl: string }> {
    const result = await this.uploadBuffer(buffer, `parce/menu/${itemId}`)

    // Cloudinary genera variantes por URL — sin necesidad de subir 3 archivos
    const base = result.secure_url.replace('/upload/', '/upload/')
    const medium = result.secure_url.replace('/upload/', '/upload/c_fill,w_600,h_400,q_85,f_webp/')
    const thumb = result.secure_url.replace('/upload/', '/upload/c_fill,w_200,h_200,q_80,f_webp/')

    return {
      photoUrl: result.secure_url,
      photoMediumUrl: medium,
      photoThumbUrl: thumb,
    }
  }

  private uploadBuffer(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: 'image',
          format: 'webp',
          quality: 'auto',
        },
        (error, result) => {
          if (error || !result) return reject(error)
          resolve(result)
        },
      )
      Readable.from(buffer).pipe(uploadStream)
    })
  }
}
