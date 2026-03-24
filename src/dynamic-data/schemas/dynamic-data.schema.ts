import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DynamicDataDocument = HydratedDocument<DynamicData>;

@Schema({ timestamps: true })
export class DynamicData {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ required: true })
  value: number;

  @Prop({ type: Date, default: () => new Date() })
  recordedAt: Date;
}

export const DynamicDataSchema = SchemaFactory.createForClass(DynamicData);

DynamicDataSchema.index({ userId: 1, category: 1, recordedAt: -1 });
