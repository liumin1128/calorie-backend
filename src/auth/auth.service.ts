import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DynamicDataService } from '../dynamic-data/dynamic-data.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private dynamicDataService: DynamicDataService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) {
      throw new ConflictException('该邮箱已注册');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      nickname: dto.nickname || dto.email.split('@')[0],
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    return this.buildResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    return user;
  }

  private async buildResponse(user: UserDocument) {
    const payload = { sub: user._id, email: user.email };
    const userId = user._id.toString();

    const latestDynamicData =
      await this.dynamicDataService.findLatestByCategories(userId, [
        'height',
        'weight',
      ]);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
        gender: user.gender ?? null,
        birthday: user.birthday ?? null,
        signature: user.signature ?? null,
        latestHeight: latestDynamicData.get('height') ?? null,
        latestWeight: latestDynamicData.get('weight') ?? null,
      },
    };
  }
}
