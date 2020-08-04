import {
  Client,
  PostgresError,
  log,
  QueryResult,
  QueryConfig,
} from "./postgres_deps.ts";

/** Transaction processor */
export interface TransactionProcessor<T> {
  (connection: PostgresClient): Promise<T>;
}

export class PostgresClient {
  protected client: Client;

  constructor(config: object) {
    this.client = new Client(config);
  }

  async connect(): Promise<void> {
    return this.client.connect();
  }

  // TODO: can we use more specific type for args?
  async query(text: string): Promise<QueryResult> {
    return this.client.query(text);
  }

  // TODO: can we use more specific type for args?
  async execute(text: string): Promise<QueryResult> {
    return this.client.query(text);
  }

  async multiQuery(queries: QueryConfig[]): Promise<QueryResult[]> {
    const result: QueryResult[] = [];

    for (const query of queries) {
      result.push(await this.client.query(query));
    }

    return result;
  }

  async end(): Promise<void> {
    await this.client.end();
  }

  /**
     * Use a connection for transaction processor
     * 
     * @param fn transation processor
     */
  async useConnection<T>(fn: (conn: PostgresClient) => Promise<T>) {
    if (!this.client) {
      throw new Error("Unconnected");
    }
    try {
      const result = await fn(this);
      return result;
    } catch (error) {
      throw new PostgresError(
        { severity: "high", code: "TA", message: "transactions" },
      );
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
        throw new PostgresError(
          { severity: "high", code: "TA", message: "transactions" },
        );
      }
    });
  }
}
