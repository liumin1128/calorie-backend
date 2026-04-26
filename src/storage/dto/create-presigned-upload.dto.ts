import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';

export enum StorageBusinessType {
  AiAnalysis = 'ai-analysis',
  CalorieImage = 'calorie-image',
  UserAvatar = 'user-avatar',
}

export class CreatePresignedUploadDto {
  @ApiProperty({
    enum: StorageBusinessType,
    description: '业务类型，用于决定对象存储目录前缀',
  })
  @IsEnum(StorageBusinessType)
  businessType: StorageBusinessType;

  @ApiProperty({
    example: 'meal.jpg',
    description: '原始文件名，仅用于前端展示和扩展性保留',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: '图片 MIME 类型，仅支持常见图片格式',
  })
  @IsString()
  @Matches(/^image\/(jpeg|png|webp|heic|heif|gif)$/i, {
    message: '仅支持 jpeg、png、webp、heic、heif、gif 图片类型',
  })
  contentType: string;
}
