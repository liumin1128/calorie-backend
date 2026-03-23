import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalorieEntryDocument = HydratedDocument<CalorieEntry>;

export enum CalorieType {
  INTAKE = 'intake',
  BURN = 'burn',
}

@Schema({ timestamps: true })
export class CalorieEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: CalorieType })
  type: CalorieType;

  @Prop({ required: true, min: 0 })
  calories: number;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true })
  entryDate: Date;
}

export const CalorieEntrySchema = SchemaFactory.createForClass(CalorieEntry);

CalorieEntrySchema.index({ userId: 1, entryDate: -1 });
