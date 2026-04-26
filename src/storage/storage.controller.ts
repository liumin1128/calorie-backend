import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  CreatePresignedUploadDto,
  StorageBusinessType,
} from './dto/create-presigned-upload.dto';
import {
  GetSignedDownloadUrlDto,
  GetStorageUrlDto,
} from './dto/get-storage-url.dto';
import { StorageService } from './storage.service';

@ApiTags('存储')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presign-upload')
  async createPresignedUpload(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePresignedUploadDto,
  ) {
    const key = this.storageService.buildObjectKey({
      businessType: this.resolveBusinessPrefix(dto.businessType),
      userId: req.user.sub,
      contentType: dto.contentType,
    });

    return this.storageService.getSignedUploadUrl({
      key,
      contentType: dto.contentType,
      expiresIn: 600,
    });
  }

  @Get('public-url')
  getPublicUrl(@Query() query: GetStorageUrlDto) {
    return {
      key: query.key,
      url: this.storageService.getPublicUrl(query.key),
    };
  }

  @Get('signed-download-url')
  async getSignedDownloadUrl(@Query() query: GetSignedDownloadUrlDto) {
    const url = await this.storageService.getSignedDownloadUrl(query.key, {
      expiresIn: query.expiresIn,
      downloadFileName: query.downloadFileName,
    });

    return {
      key: query.key,
      url,
      expiresIn: query.expiresIn ?? 3600,
    };
  }

  private resolveBusinessPrefix(businessType: StorageBusinessType): string {
    switch (businessType) {
      case StorageBusinessType.AiAnalysis:
        return 'ai-analysis';
      case StorageBusinessType.CalorieImage:
        return 'calorie-entry';
      case StorageBusinessType.UserAvatar:
        return 'avatar';
      default:
        return 'misc';
    }
  }
}
