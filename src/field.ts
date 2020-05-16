import { BaseModel } from "./model.ts";
import { camel2line } from "./util.ts";

export enum Defaults {
  CURRENT_TIMESTAMP = "CURRENT_TIMESTAMP",
  NULL = "NULL",
}

/** Field type */
export enum FieldType {
  DATE,
  INT,
  STRING,
  TEXT,
  BOOLEAN,
  LONGTEXT,
  GeoPOINT,
}

/** Field Decorator */
export function Field(options: Partial<FieldOptions> & { type: FieldType }) {
  return (target: BaseModel, property: string) => {
    const fields = target.modelFields;
    const name = camel2line(property);
    fields.push({ ...options, property, name });
    Reflect.defineMetadata("model:fields", fields, target);
  };
}

/** Field Options */
export interface FieldOptions {
  name: string;
  type: FieldType;
  property?: string;
  primary?: boolean;
  length?: number;
  default?: any;
  autoIncrement?: boolean;
  notNull?: boolean;
  autoUpdate?: boolean;
}
