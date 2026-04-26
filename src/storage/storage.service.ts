import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export interface StorageUploadInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  contentDisposition?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface StorageSignedUrlOptions {
  expiresIn?: number;
  downloadFileName?: string;
}

export interface StoragePresignedUploadInput {
  key: string;
  contentType: string;
  expiresIn?: number;
  cacheControl?: string;
}

export interface StoragePresignedUploadResult {
  key: string;
  uploadUrl: string;
  method: 'PUT';
  headers: {
    'Content-Type': string;
    'Cache-Control'?: string;
  };
  expiresIn: number;
  publicUrl: string | null;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;
  private readonly client: S3Client;
  private static readonly IMAGE_EXTENSION_BY_CONTENT_TYPE: Record<
    string,
    string
  > = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/gif': 'gif',
  };

  constructor(private readonly configService: ConfigService) {
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    const endpoint = this.configService.getOrThrow<string>('R2_ENDPOINT');
    const bucket = this.configService.getOrThrow<string>('R2_BUCKET');
    const region = this.configService.get<string>('R2_REGION') ?? 'auto';

    this.bucket = bucket;
    this.publicBaseUrl = this.normalizeOptionalUrl(
      this.configService.get<string>('R2_PUBLIC_BASE_URL'),
    );

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async upload(input: StorageUploadInput) {
    const normalizedKey = this.normalizeKey(input.key);

    const commandInput: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: normalizedKey,
      Body: input.body,
      ContentType: input.contentType,
      ContentDisposition: input.contentDisposition,
      CacheControl: input.cacheControl,
      Metadata: input.metadata,
    };

    await this.execute(
      () => this.client.send(new PutObjectCommand(commandInput)),
      '上传文件失败',
      { key: commandInput.Key },
    );

    return {
      key: normalizedKey,
      bucket: this.bucket,
      url: this.getPublicUrl(normalizedKey),
    };
  }

  async deleteObject(key: string) {
    const normalizedKey = this.normalizeKey(key);

    await this.execute(
      () =>
        this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: normalizedKey,
          }),
        ),
      '删除文件失败',
      { key: normalizedKey },
    );
  }

  async exists(key: string): Promise<boolean> {
    const normalizedKey = this.normalizeKey(key);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: normalizedKey,
        }),
      );
      return true;
    } catch (error: unknown) {
      const metadata = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata;
      if (metadata?.httpStatusCode === HttpStatus.NOT_FOUND) {
        return false;
      }

      this.logger.error(
        `R2 object exists check failed: ${normalizedKey}`,
        (error as Error).stack,
      );
      throw new HttpException('检查文件状态失败', HttpStatus.BAD_GATEWAY);
    }
  }

  async getSignedDownloadUrl(
    key: string,
    options?: StorageSignedUrlOptions,
  ): Promise<string> {
    const normalizedKey = this.normalizeKey(key);
    const expiresIn = this.normalizeExpiresIn(options?.expiresIn);

    return this.execute(
      () =>
        getSignedUrl(
          this.client,
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: normalizedKey,
            ResponseContentDisposition: options?.downloadFileName
              ? `attachment; filename="${encodeURIComponent(options.downloadFileName)}"`
              : undefined,
          }),
          { expiresIn },
        ),
      '生成下载地址失败',
      { key: normalizedKey },
    );
  }

  async getSignedUploadUrl(
    input: StoragePresignedUploadInput,
  ): Promise<StoragePresignedUploadResult> {
    const normalizedKey = this.normalizeKey(input.key);
    const expiresIn = this.normalizeExpiresIn(input.expiresIn ?? 600);

    const uploadUrl = await this.execute(
      () =>
        getSignedUrl(
          this.client,
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: normalizedKey,
            ContentType: input.contentType,
            CacheControl: input.cacheControl,
          }),
          {
            expiresIn,
            signableHeaders: new Set(['content-type']),
          },
        ),
      '生成上传地址失败',
      { key: normalizedKey },
    );

    return {
      key: normalizedKey,
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
        ...(input.cacheControl
          ? { 'Cache-Control': input.cacheControl }
          : undefined),
      },
      expiresIn,
      publicUrl: this.getPublicUrl(normalizedKey),
    };
  }

  buildObjectKey(params: {
    businessType: string;
    userId: string;
    contentType: string;
  }): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const extension = this.getExtensionByContentType(params.contentType);
    const safeBusinessType = params.businessType.replace(/[^a-z0-9-_]/gi, '-');
    const safeUserId = params.userId.replace(/[^a-zA-Z0-9-_]/g, '-');

    return `${safeBusinessType}/${safeUserId}/${today}/${randomUUID()}.${extension}`;
  }

  getPublicUrl(key: string): string | null {
    const normalizedKey = this.normalizeKey(key);
    if (!this.publicBaseUrl) {
      return null;
    }

    return `${this.publicBaseUrl}/${normalizedKey}`;
  }

  private normalizeKey(key: string): string {
    return key.replace(/^\/+/, '');
  }

  private normalizeOptionalUrl(url?: string): string | undefined {
    if (!url?.trim()) {
      return undefined;
    }

    return url.replace(/\/+$/, '');
  }

  private normalizeExpiresIn(expiresIn?: number): number {
    if (!expiresIn || Number.isNaN(expiresIn)) {
      return 3600;
    }

    return Math.min(Math.max(Math.floor(expiresIn), 1), 60 * 60 * 24 * 7);
  }

  private getExtensionByContentType(contentType: string): string {
    const normalizedContentType = contentType.trim().toLowerCase();
    const extension =
      StorageService.IMAGE_EXTENSION_BY_CONTENT_TYPE[normalizedContentType];

    if (!extension) {
      throw new HttpException('暂不支持该图片类型', HttpStatus.BAD_REQUEST);
    }

    return extension;
  }

  private async execute<T>(
    runner: () => Promise<T>,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<T> {
    try {
      return await runner();
    } catch (error: unknown) {
      this.logger.error(
        `${message}: ${JSON.stringify(context ?? {})}`,
        (error as Error).stack,
      );
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }
}
