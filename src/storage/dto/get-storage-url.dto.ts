import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetStorageUrlDto {
  @ApiProperty({
    example: 'ai-analysis/user-id/20260426/example.jpg',
    description: '对象存储中的文件 key',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

export class GetSignedDownloadUrlDto extends GetStorageUrlDto {
  @ApiProperty({
    example: 'meal.jpg',
    required: false,
    description: '可选，下载时建议文件名',
  })
  @IsString()
  @IsOptional()
  downloadFileName?: string;

  @ApiProperty({
    example: 3600,
    required: false,
    description: '签名 URL 有效期，单位秒，默认 3600，最大 604800',
  })
  @Min(1)
  @Max(604800)
  @IsOptional()
  expiresIn?: number;
}
