import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { log } from "./sqlite_deps.ts";
import SqliteError from "https://deno.land/x/sqlite/src/error.ts";
import { Rows } from "./sqlite_deps.ts";

/** Transaction processor */
export interface TransactionProcessor<T> {
  (connection: SqliteClient): Promise<T>;
}

export class SqliteClient {
  protected db: DB;
  constructor(path: string) {
    this.db = new DB(path);
  }

  query(sql: string): Rows {
    return this.db.query(sql);
  }

  execute(sql: string): Rows {
    return this.db.query(sql);
  }

  /**
 * DB.close
 *
 * Close database handle. This must be called if
 * DB is no longer used, to avoid leaking file
 * resources.
 *
 * If force is specified, any on-going transactions
 * will be closed.
 */
  close(force: boolean = false) {
    this.db.close(force);
  }

  /**
 * DB.lastInsertRowId
 *
 * Get last inserted row id. This corresponds to
 * the SQLite function `sqlite3_last_insert_rowid`.
 * 
 * By default, it will return 0 if there is no row
 * inserted yet.
 */
  get lastInsertRowId(): number {
    return this.db.lastInsertRowId;
  }

  /**
 * DB.changes
 *
 * Return the number of rows modified, inserted or
 * deleted by the most recently completed query.
 * This corresponds to the SQLite function
 * `sqlite3_changes`.
 */
  get changes(): number {
    return this.db.changes;
  }

  /**
 * DB.totalChanges
 *
 * Return the number of rows modified, inserted or
 * deleted since the database was opened.
 * This corresponds to the SQLite function
 * `sqlite3_total_changes`.
 */
  get totalChanges(): number {
    return this.db.totalChanges;
  }

  /**
   * Use a connection for transaction processor
   * 
   * @param fn transation processor
   */
  async useConnection<T>(fn: (conn: this) => Promise<T>) {
    if (!this.db) {
      throw new Error("Unconnected");
    }
    try {
      const result = await fn(this);
      return result;
    } catch (error) {
      throw new SqliteError("connection", 2);
    }
  }

  /**
   * Execute a transaction process, and the transaction successfully
   * returns the return value of the transaction process
   * @param processor transation processor
   */
  async transaction<T>(processor: TransactionProcessor<T>): Promise<T> {
    return await this.useConnection(async (connection) => {
      try {
        await connection.query("BEGIN");
        const result = await processor(connection);
        await connection.query("COMMIT");
        return result;
      } catch (error) {
        log.info(`ROLLBACK: ${error.message}`);
        await connection.query("ROLLBACK");
        throw new SqliteError("transaction", 1);
      }
    });
  }
}
