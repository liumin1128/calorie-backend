import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WaterIntakeDocument = HydratedDocument<WaterIntake>;

@Schema({ timestamps: true })
export class WaterIntake {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  /** 日期 YYYY-MM-DD */
  @Prop({ required: true })
  date!: string;

  /** 饮水量 (ml) */
  @Prop({ required: true, min: 0 })
  amount!: number;
}

export const WaterIntakeSchema = SchemaFactory.createForClass(WaterIntake);

WaterIntakeSchema.index({ userId: 1, date: 1 }, { unique: true });
