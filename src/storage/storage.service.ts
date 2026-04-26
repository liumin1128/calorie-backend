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

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  private readonly publicBaseUrl?: string;
  private readonly client: S3Client;

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
