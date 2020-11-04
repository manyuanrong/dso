import { Connection } from "../deps.ts";
import { BaseModel } from "./model.ts";
import { MysqlClient } from "./MysqlClient.ts";

export class TransactionMysql {
  constructor(private _conn: Connection) { }

  getModel<T extends BaseModel>(
    Model: { new(conn: Connection): T },
  ): T {
    const model = new Model(this._conn);
    return model;
  }

  static async transaction<T>(
    processor: (transaction: TransactionMysql) => Promise<T>, 
    client: MysqlClient
  ): Promise<T> {

    return (
      await client.client.transaction(async (conn) => {
        const trans = new TransactionMysql(conn);
        return await processor(trans);
      })
    ) as T;
  }
}
