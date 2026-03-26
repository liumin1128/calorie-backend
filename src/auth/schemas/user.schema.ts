import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ trim: true })
  nickname: string;

  @Prop({ type: String, enum: Gender })
  gender?: string;

  @Prop({ type: Date })
  birthday?: Date;

  @Prop({ trim: true, maxlength: 200 })
  signature?: string;

  @Prop({ type: Number, min: 30, max: 300 })
  targetWeight?: number;

  @Prop({ type: [String] })
  healthConditions?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
