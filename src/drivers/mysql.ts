import {
  Client,
  ClientConfig,
  Connection,
} from "https://deno.land/x/mysql@2.1.0/mod.ts";
import { DriverName } from "../types.ts";
import { DsoClient, DsoConnection, DsoTransaction, PoolInfo } from "./base.ts";

class MySqlConnection implements DsoConnection {
  #connection: Connection;

  constructor(conn: Connection) {
    this.#connection = conn;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const result = await this.#connection.query(sql, params);
    return result as T;
  }

  async execute<T = any>(sql: string, params?: any[]): Promise<T> {
    const result = await this.#connection.execute(sql, params);
    return result as T;
  }
}

export class MysqlClient extends DsoClient {
  #client: Client = new Client();

  get driverName(): DriverName {
    return DriverName.MYSQL;
  }

  async close(): Promise<void> {
    this.#client.close();
  }

  async connect(config: ClientConfig): Promise<this> {
    await this.#client.connect(config);
    return this;
  }

  get pool(): PoolInfo {
    const poolInfo = {
      size: this.#client.pool?.size,
      maxSize: this.#client.pool?.maxSize,
      available: this.#client.pool?.available,
    };
    return poolInfo;
  }

  useConnection<T>(fn: (conn: DsoConnection) => Promise<T>): Promise<T> {
    return this.#client.useConnection((mysqlConn) => {
      return fn(new MySqlConnection(mysqlConn));
    });
  }

  async transaction<T>(
    processor: (transaction: DsoTransaction) => Promise<T>,
  ): Promise<T> {
    return (
      await this.#client.transaction(async (conn) => {
        const trans = new DsoTransaction(new MySqlConnection(conn));
        return await processor(trans);
      })
    ) as T;
  }
}
