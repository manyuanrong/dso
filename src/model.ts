import { assert, Connection, Join, Order, Query, Where } from "../deps.ts";
import { dso } from "./dso.ts";
import { Defaults, FieldOptions, FieldType } from "./field.ts";

export interface QueryOptions {
  fields?: string[];
  where?: Where;
  order?: Order[];
  group?: string[];
  join?: Join[];
  limit?: [number, number];
  having?: Where;
}

/** Model Decorator */
export function Model<T extends BaseModel>(name: string) {
  return (target: { new (): T }) => {
    Reflect.defineMetadata("model:name", name, target.prototype);
  };
}

/** Model Fields list */
export type ModelFields<T> = Partial<Omit<T, keyof BaseModel>> & {
  created_at?: Date;
  updated_at?: Date;
};

/** Model base class */
export class BaseModel {
  created_at?: Date;
  updated_at?: Date;

  constructor(public connection?: Connection) {}

  /** get model name */
  get modelName(): string {
    return Reflect.getMetadata("model:name", this);
  }

  /** get primary key */
  get primaryKey(): FieldOptions | undefined {
    return this.modelFields.find((field) => field.primary);
  }

  /** get defined fields list */
  get modelFields(): FieldOptions[] {
    return (
      Reflect.getMetadata("model:fields", this) || [
        {
          type: FieldType.DATE,
          default: Defaults.CURRENT_TIMESTAMP,
          autoUpdate: true,
          name: "updated_at",
          property: "updated_at",
        },
        {
          type: FieldType.DATE,
          default: Defaults.CURRENT_TIMESTAMP,
          name: "created_at",
          property: "created_at",
        },
      ]
    );
  }

  /** return a new Query instance with table name */
  builder(): Query {
    const builder = new Query();
    return builder.table(this.modelName);
  }

  /**
   * Convert data object to model
   * @param data
   */
  private convertModel(data: {
    [key: string]: any;
  }): ModelFields<this> | undefined {
    if (!data) return;
    const model: any = {};
    const fieldsMapping: any = {};
    this.modelFields.map(
      (field) => (fieldsMapping[field.name] = field.property)
    );
    Object.keys(data).forEach((key) => {
      const propertyName = fieldsMapping[key];
      model[propertyName || key] = data[key];
    });
    return model;
  }

  /**
   * Convert model object to db object
   * @param model
   */
  private convertObject(model: ModelFields<this>): { [key: string]: any } {
    const data: any = {};
    const fieldsMapping: any = {};
    this.modelFields.map(
      (field) => (fieldsMapping[field.property!] = field.name),
    );
    Object.keys(model).forEach((key) => {
      const name = fieldsMapping[key];
      data[name || key] = model[key as keyof ModelFields<this>];
    });
    return data;
  }

  private optionsToQuery(options: QueryOptions) {
    const query = this.builder();
    if (options.fields) {
      query.select(...options.fields);
    } else {
      query.select(`${this.modelName}.*`);
    }

    if (options.where) query.where(options.where);
    if (options.group) query.groupBy(...options.group);
    if (options.having) query.having(options.having);
    if (options.join) {
      options.join.forEach((join) => query.join(join));
    }
    if (options.limit) query.limit(...options.limit);
    if (options.order) options.order.forEach((order) => query.order(order));
    return query;
  }

  /**
   * find one record
   * @param where conditions
   */
  async findOne(
    options: Where | QueryOptions,
  ): Promise<ModelFields<this> | undefined> {
    if (options instanceof Where) {
      options = {
        where: options,
      };
    }
    const result = await this.query(this.optionsToQuery(options).limit(0, 1));
    return this.convertModel(result[0]);
  }

  /**
   * delete by conditions
   * @param where
   */
  async delete(where: Where): Promise<number> {
    const result = await this.execute(
      this.builder()
        .delete()
        .where(where),
    );
    return result.affectedRows ?? 0;
  }

  /** find all records by given conditions */
  async findAll(options: Where | QueryOptions): Promise<ModelFields<this>[]> {
    if (options instanceof Where) {
      options = {
        where: options,
      };
    }
    const result = await this.query(this.optionsToQuery(options));
    return result.map((record) => this.convertModel(record)!);
  }

  /** find one record by primary key */
  async findById(id: string | number): Promise<ModelFields<this> | undefined> {
    assert(!!this.primaryKey);
    return await this.findOne(Where.field(this.primaryKey.name).eq(id));
  }

  /** insert record */
  async insert(fields: Partial<this>): Promise<number | undefined> {
    const query = this.builder().insert(this.convertObject(fields));
    const result = await this.execute(query);
    return result.lastInsertId;
  }

  /** update records by given conditions */
  async update(
    data: Partial<this>,
    where?: Where,
  ): Promise<number | undefined> {
    if (
      !where &&
      this.primaryKey &&
      data[this.primaryKey.property as keyof this]
    ) {
      where = Where.field(this.primaryKey.name).eq(
        data[this.primaryKey.property as keyof this],
      );
    }
    const query = this.builder()
      .update(this.convertObject(data))
      .where(where ?? "");

    const result = await this.execute(query);
    return result.affectedRows;
  }

  /**
   * query custom
   * @param query
   */
  async query(query: Query): Promise<any[]> {
    const sql = query.build();
    dso.showQueryLog && console.log(`\n[ DSO:QUERY ]\nSQL:\t ${sql}\n`);
    const result = this.connection
      ? await this.connection.query(sql)
      : await dso.client.query(sql);
    dso.showQueryLog && console.log(`REUSLT:\t`, result, `\n`);
    return result;
  }

  /**
   * excute custom
   * @param query
   */
  async execute(query: Query) {
    const sql = query.build();
    dso.showQueryLog && console.log(`\n[ DSO:EXECUTE ]\nSQL:\t ${sql}\n`);
    const result = this.connection
      ? await this.connection.execute(sql)
      : await dso.client.execute(sql);
    dso.showQueryLog && console.log(`REUSLT:\t`, result, `\n`);
    return result;
  }
}
