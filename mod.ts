import {
  Client,
  ClientConfig,
  replaceParams
} from "https://deno.land/x/mysql/mod.ts";
import { assert } from "https://deno.land/x/testing/asserts.ts";
import { syncModels } from "./sync.ts";
import { camel2line, line2camel } from "./util.ts";
export { replaceParams } from "https://deno.land/x/mysql/mod.ts";

export interface Field {
  type(): any;
  name?: string;
  length?: number;
  default?: any;
  primary?: boolean;
  autoIncrement?: boolean;
  notNull?: boolean;
  autoUpdate?: boolean;
}

export const FieldTypes = {
  DATE: (): Date => null,
  INT: (): number => null,
  STRING: (): string => null,
  TEXT: (): string => null,
  BOOLEAN: (): boolean => null
};

export const DefaultValues = {
  CURRENT_TIMESTAMP: "CURRENT_TIMESTAMP"
};

export interface ModelSchema {
  [key: string]: Field;
  createdAt?: Field;
  updatedAt?: Field;
}

export type ModelReturn<M extends ModelSchema> = {
  [key in keyof M]?: ReturnType<M[key]["type"]>
};

export type ModelWhere<M extends ModelSchema> = {
  [key in keyof M]?: ReturnType<M[key]["type"]> | Function
};

export function define<M extends ModelSchema>(name: string, def: M) {
  const defaultDef = {
    createdAt: {
      type: FieldTypes.DATE,
      default: DefaultValues.CURRENT_TIMESTAMP
    },
    updatedAt: {
      type: FieldTypes.DATE,
      default: DefaultValues.CURRENT_TIMESTAMP,
      autoUpdate: true
    }
  };
  return new Model(name, { ...defaultDef, ...def });
}

export function where(where: Object): string {
  if (!where) return "";
  return (
    "WHERE " +
    Object.keys(where)
      .map(key => {
        key = camel2line(key);
        let val = where[key];
        // If the type of field value is a function, treat it as a custom OP
        if (typeof val === "function")
          return replaceParams("?? ", [key]) + val();
        return replaceParams(`?? = ?`, [key, val]);
      })
      .join("AND ")
  );
}
const buildWhere = where;

export class Model<
  M extends ModelSchema,
  T = ModelReturn<M>,
  W = ModelWhere<M>
> {
  name: string;
  pk: Field;
  fields: Field[] = [];

  constructor(tableName: string, readonly def: M) {
    this.name = tableName.toLocaleLowerCase();
    for (const key in def) {
      def[key].name = key;
      this.fields.push(def[key]);
      if (def[key].primary) {
        this.pk = def[key];
      }
    }
    models.push(this);
  }

  async findById(id: string | number): Promise<T> {
    assert(
      this.pk != null,
      `No field was designated as primary key in ${this.name}`
    );
    const pk = camel2line(this.pk.name);
    const result = await client.query(`SELECT * FROM ?? WHERE ?? = ?`, [
      this.name,
      pk,
      id
    ]);
    return result.length ? this.parseModel(result[0]) : null;
  }

  findAll(where?: W): Promise<T[]>;
  findAll(where: string, params: any[]): Promise<T[]>;
  async findAll(where: any, params?: any): Promise<T[]> {
    if (typeof where === "string") {
      const rows: any[] = await client.query(`SELECT * FROM ?? ${where}`, [
        this.name,
        ...params
      ]);
      return rows.map(row => this.parseModel(row));
    } else {
      const rows: any[] = await client.query(
        `SELECT * FROM ?? ${buildWhere(where)}`,
        [this.name]
      );
      return rows.map(row => this.parseModel(row));
    }
  }

  findOne(where?: W): Promise<T>;
  findOne(where: string, params: any[]): Promise<T>;
  async findOne(where: any, params?: any): Promise<T> {
    let rows = [];
    if (typeof where === "string") {
      rows = await client.query(`SELECT * FROM ?? ${where} LIMIT 1`, [
        this.name,
        ...params
      ]);
    } else {
      rows = await client.query(
        `SELECT * FROM ?? ${buildWhere(where)} LIMIT 1`,
        [this.name]
      );
    }
    return rows.length ? this.parseModel(rows[0]) : null;
  }

  async execute(sql: string, params: any[]) {
    return client.execute(sql, params);
  }

  async insert(data: T): Promise<string | number> {
    const result = await client.execute(`INSERT INTO ?? ?? VALUES ?`, [
      this.name,
      Object.keys(data),
      Object.values(data)
    ]);
    return result.lastInsertId;
  }

  async update(data: T, where?: T | string): Promise<number> {
    // 如果没有提供where但data中包含主键，使用主键作为限制条件
    if (!where && this.pk && data[this.pk.name]) {
      const pkVal = data[this.pk.name];
      where = <T>{};
      where[this.pk.name] = pkVal;
    }
    where = buildWhere(where);
    let val = Object.keys(data)
      .map(key => {
        return replaceParams(`?? = ?`, [key, data[key]]);
      })
      .join(", ");
    const result = await client.execute(`UPDATE ?? SET ${val} ${where}`, [
      this.name
    ]);
    return result.affectedRows;
  }

  delete(where?: W): Promise<number>;
  delete(where: string, params: any[]): Promise<number>;
  async delete(where: any, params?: any) {
    if (typeof where === "string") {
      const result = await client.execute(`DELETE FROM ?? WHERE ${where}`, [
        this.name,
        ...params
      ]);
      return result.affectedRows;
    } else {
      const result = await client.execute(
        `DELETE FROM ?? ${buildWhere(where)}`,
        [this.name]
      );
      return result.affectedRows;
    }
  }

  private parseModel(data: any): T {
    const result: T = <T>{};
    for (let key in data) {
      result[line2camel(key)] = data[key];
    }
    return result;
  }
}

let client: Client;
const models: Model<any>[] = [];

export async function connect(config: ClientConfig | Client) {
  if (config instanceof Client) {
    client = config;
  } else {
    client = new Client();
    await client.connect(config);
  }
}

export async function sync(force: boolean = false) {
  await syncModels(client, models, force);
}
