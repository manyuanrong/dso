import { Connection } from "../deps.ts";
import { BaseModel } from "./model.ts";
import { PostgresClient } from "../PostgresClient.ts";
import { SqliteClient } from "../SqliteClient.ts";
import { dso } from "./dso.ts";
import { MysqlClient } from "./MysqlClient.ts";

export class Transaction {
  constructor(private _conn: Connection | PostgresClient | SqliteClient) {}
  
  getModel<T extends BaseModel>(
    Model: { new (conn: Connection | PostgresClient | SqliteClient): T },
  ): T {
    const model = new Model(this._conn);
    return model;
  }

  /**static async transaction<T>(
    processor: (transaction: Transaction) => Promise<T>,
    driverType: string,
  ): Promise<T> {
    if (driverType.toUpperCase() == "MYSQL") {
      return (
        await new MysqlClient().client.transaction(async (conn) => {
          const trans = new Transaction(conn);
          return await processor(trans);
        })
      ) as T;
    } else if (driverType.toUpperCase() == "POSTGRES") {
      return (
        await dso.clientPostgres.transaction(async (conn) => {
          const trans = new Transaction(conn);
          return await processor(trans);
        })
      ) as T;
    } else {
      return (
        await dso.clientSqlite.transaction(async (conn) => {
          const trans = new Transaction(conn);
          return await processor(trans);
        })
      ) as T;
    }
  }*/
}
