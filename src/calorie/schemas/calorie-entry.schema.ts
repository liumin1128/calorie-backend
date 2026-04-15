import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CalorieEntryDocument = HydratedDocument<CalorieEntry>;

export enum CalorieType {
  INTAKE = 'intake',
  BURN = 'burn',
}

export enum EntrySource {
  MANUAL = 'manual',
  HEALTHKIT = 'healthkit',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export interface Nutrition {
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  fiber?: number;
}

export interface Minerals {
  calcium?: number;
  magnesium?: number;
  potassium?: number;
  sodium?: number;
  phosphorus?: number;
  iron?: number;
  zinc?: number;
  manganese?: number;
  copper?: number;
  selenium?: number;
  iodine?: number;
  chromium?: number;
  fluoride?: number;
}

@Schema({ timestamps: true })
export class CalorieEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: CalorieType })
  type!: CalorieType;

  @Prop({ required: true, min: 0 })
  calories!: number;

  @Prop({ min: 0 })
  water?: number;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ required: true })
  entryDate!: Date;

  @Prop({ enum: EntrySource, default: EntrySource.MANUAL })
  source!: EntrySource;

  @Prop({ enum: MealType, default: MealType.SNACK })
  mealType!: MealType;

  @Prop({ trim: true })
  externalId!: string;

  @Prop(
    raw({
      protein: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      carbohydrates: { type: Number, min: 0 },
      fiber: { type: Number, min: 0 },
    }),
  )
  nutrition?: Nutrition;

  @Prop(
    raw({
      calcium: { type: Number, min: 0 },
      magnesium: { type: Number, min: 0 },
      potassium: { type: Number, min: 0 },
      sodium: { type: Number, min: 0 },
      phosphorus: { type: Number, min: 0 },
      iron: { type: Number, min: 0 },
      zinc: { type: Number, min: 0 },
      manganese: { type: Number, min: 0 },
      copper: { type: Number, min: 0 },
      selenium: { type: Number, min: 0 },
      iodine: { type: Number, min: 0 },
      chromium: { type: Number, min: 0 },
      fluoride: { type: Number, min: 0 },
    }),
  )
  minerals?: Minerals;
}

export const CalorieEntrySchema = SchemaFactory.createForClass(CalorieEntry);

CalorieEntrySchema.index(
  { userId: 1, externalId: 1 },
  { unique: true, sparse: true },
);
