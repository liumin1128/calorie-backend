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
  BARCODE = 'barcode',
  AI = 'ai',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export interface Nutrition {
  /** 蛋白质 (g) */
  protein?: number;
  /** 脂肪 (g) */
  fat?: number;
  /** 碳水化合物 (g) */
  carbohydrates?: number;
  /** 膳食纤维 (g) */
  fiber?: number;
}

export interface Minerals {
  /** 钙 (mg) */
  calcium?: number;
  /** 镁 (mg) */
  magnesium?: number;
  /** 钾 (mg) */
  potassium?: number;
  /** 钠 (mg) */
  sodium?: number;
  /** 磷 (mg) */
  phosphorus?: number;
  /** 铁 (mg) */
  iron?: number;
  /** 锌 (mg) */
  zinc?: number;
  /** 锰 (mg) */
  manganese?: number;
  /** 铜 (mg) */
  copper?: number;
  /** 硒 (μg) */
  selenium?: number;
  /** 碘 (μg) */
  iodine?: number;
  /** 铬 (μg) */
  chromium?: number;
  /** 氟 (mg) */
  fluoride?: number;
}

@Schema({ timestamps: true })
export class CalorieEntry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: CalorieType })
  type!: CalorieType;

  /** 能量 (kcal) */
  @Prop({ required: true, min: 0 })
  calories!: number;

  /** 水分 (g) */
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

  /** 运动时长 (min)，仅 type=burn 时有效 */
  @Prop({ min: 0 })
  duration?: number;

  @Prop({ trim: true })
  externalId!: string;

  /** 营养成分 */
  @Prop(
    raw({
      protein: { type: Number, min: 0 }, // 蛋白质 (g)
      fat: { type: Number, min: 0 }, // 脂肪 (g)
      carbohydrates: { type: Number, min: 0 }, // 碳水化合物 (g)
      fiber: { type: Number, min: 0 }, // 膳食纤维 (g)
    }),
  )
  nutrition?: Nutrition;

  /** 矿物质 */
  @Prop(
    raw({
      calcium: { type: Number, min: 0 }, // 钙 (mg)
      magnesium: { type: Number, min: 0 }, // 镁 (mg)
      potassium: { type: Number, min: 0 }, // 钾 (mg)
      sodium: { type: Number, min: 0 }, // 钠 (mg)
      phosphorus: { type: Number, min: 0 }, // 磷 (mg)
      iron: { type: Number, min: 0 }, // 铁 (mg)
      zinc: { type: Number, min: 0 }, // 锌 (mg)
      manganese: { type: Number, min: 0 }, // 锰 (mg)
      copper: { type: Number, min: 0 }, // 铜 (mg)
      selenium: { type: Number, min: 0 }, // 硒 (μg)
      iodine: { type: Number, min: 0 }, // 碘 (μg)
      chromium: { type: Number, min: 0 }, // 铬 (μg)
      fluoride: { type: Number, min: 0 }, // 氟 (mg)
    }),
  )
  minerals?: Minerals;
}

export const CalorieEntrySchema = SchemaFactory.createForClass(CalorieEntry);

CalorieEntrySchema.index(
  { userId: 1, externalId: 1 },
  { unique: true, sparse: true },
);
