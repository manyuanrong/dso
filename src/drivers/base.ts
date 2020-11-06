import { Query } from "../../deps.ts";
import { dso } from "../dso.ts";
import { BaseModel } from "../model.ts";
import { DriverName } from "../types.ts";

export interface DsoConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
  execute<T = any>(sql: string, params?: any[]): Promise<T>;
}

export interface PoolInfo {
  size: number | undefined;
  maxSize: number | undefined;
  available: number | undefined;
}

/**
   * DSO client
   */
export abstract class DsoClient {
  /** get driver name */
  abstract get driverName(): DriverName;

  /** get pool info */
  abstract get pool(): PoolInfo | undefined;

  /**
     * connect to database
     * @param config config for client
     * @returns Clinet instance
     */
  abstract connect<T>(config: T): Promise<this>;

  abstract async useConnection<T>(
    fn: (conn: DsoConnection) => Promise<T>,
  ): Promise<T>;

  /**
     * close connection
     */
  abstract async close(): Promise<void>;

  abstract async transaction<T>(
    processor: (transaction: DsoTransaction) => Promise<T>,
    client: DsoClient,
  ): Promise<T>;

  /**
   * query custom
   * @param query
   */
  async query(query: Query | string): Promise<any[]> {
    const sql = typeof query === "string" ? query : query.build();
    dso.showQueryLog && console.log(`\n[ DSO:QUERY ]\nSQL:\t ${sql}\n`);
    const result = this.useConnection((conn) => {
      return conn.query(sql);
    });
    dso.showQueryLog && console.log(`RESULT:\t`, result, `\n`);
    return result;
  }

  /**
   * excute custom
   * @param query
   */
  async execute(query: Query | string) {
    const sql = typeof query === "string" ? query : query.build();
    dso.showQueryLog && console.log(`\n[ DSO:EXECUTE ]\nSQL:\t ${sql}\n`);
    const result = this.useConnection((conn) => {
      return conn.execute(sql);
    });
    dso.showQueryLog && console.log(`RESULT:\t`, result, `\n`);
    return result;
  }
}

export class DsoTransaction {
  #connection: DsoConnection;

  constructor(conn: DsoConnection) {
    this.#connection = conn;
  }

  getModel<T extends BaseModel>(
    Model: { new (conn: DsoConnection): T },
  ): T {
    const model = new Model(this.#connection);
    return model;
  }
}
