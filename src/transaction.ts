import { Connection } from "../deps.ts";
import { dso } from "./dso.ts";
import { BaseModel } from "./model.ts";

export class Transaction {
  constructor(private _conn: Connection) {}
  getModel<T extends BaseModel>(Model: { new (conn: Connection): T }): T {
    const model = new Model(this._conn);
    return model;
  }

  static async transaction<T>(
    processor: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return (await dso.client.transaction(async (conn) => {
      const trans = new Transaction(conn);
      return await processor(trans);
    })) as T;
  }
}
