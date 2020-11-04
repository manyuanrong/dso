import { assert, Join, Order, Query, Where } from "../deps.ts";
import { Defaults, FieldOptions, FieldType } from "./field.ts";
import { Index, IndexType } from "./index.ts";
import { CharsetType } from "./charset.ts";
import { dso } from "./dso.ts";
import { Connection } from "../deps.ts";
import { MysqlClient } from "./MysqlClient.ts";

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
  charset: CharsetType = CharsetType.utf8;

  constructor(public connection?: Connection | MysqlClient) {}

  /** get model name */
  get modelName(): string {
    return Reflect.getMetadata("model:name", this);
  }

  /** get primary key */
  get primaryKey(): FieldOptions | undefined {
    return this.modelFields.find((field) => field.primary);
  }

  /** Returns array of all available without primary key */
  get columnIndexes(): { [key: number]: Array<FieldOptions> } {
    return {
      [IndexType.INDEX]: this.modelFields.filter((field) => field.index) || [],
      [IndexType.UNIQUE]: this.modelFields.filter((field) => field.unique) ||
        [],
      [IndexType.SPATIAL]: this.modelFields.filter((field) => field.spatial) ||
        [],
      [IndexType.FULLTEXT]:
        this.modelFields.filter((field) => field.fullText) || [],
    };
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

  /** get defined index list */
  get indexes(): Index[] {
    return Reflect.getMetadata("model:indexes", this) || [];
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
      (field) => (fieldsMapping[field.name] = field.property),
    );
    this.indexes.map(
      (index) => {
        if (index.property) model[index.property] = index;
      },
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
    let result;
    let resultSqlite: any;
    let resultPostgres: any;
    let converted: ModelFields<this> | undefined;

    result = await this.query(this.optionsToQuery(options).limit(0, 1));

    converted = this.convertModel(result[0]);

    return converted;
  }

  /**
   * delete by conditions
   * @param where
   */
  async delete(where: Where): Promise<number> {
    const query = this.builder().delete().where(where);
    let result: any;
    let deleteCounts: number | undefined;
    let resultPostgres: any;

    result = await this.execute(query);
    deleteCounts = result.affectedRows;

    return deleteCounts ?? 0;
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

    let result: any = await this.execute(query);
    let idReturn: number = result.lastInsertId;

    return idReturn;
  }

  /** insert record */
  async insertRowsAffected(fields: Partial<this>): Promise<number | undefined> {
    const query = this.builder().insert(this.convertObject(fields));

    let result: any = await this.execute(query);
    let updateCounts = result.affectedRows;

    return updateCounts;
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

    let result: any = await this.execute(query);
    let updateCounts = result.affectedRows;

    return updateCounts;
  }

  /**
   * query custom
   * @param query
   */
  async query(query: Query): Promise<any[]> {
    const sql = query.build();
    dso.showQueryLog && console.log(`\n[ DSO:QUERY ]\nSQL:\t ${sql}\n`);
    const result = await this.connection?.query(sql);
    dso.showQueryLog && console.log(`RESULT:\t`, result, `\n`);
    return result;
  }

  /**
   * excute custom
   * @param query
   */
  async execute(query: Query) {
    const sql = query.build();
    dso.showQueryLog && console.log(`\n[ DSO:EXECUTE ]\nSQL:\t ${sql}\n`);
    const result = await this.connection?.execute(sql);

    dso.showQueryLog && console.log(`RESULT:\t`, result, `\n`);
    return result;
  }
}
