import { MysqlClient } from "./MysqlClient.ts";

export enum ClientType {
  MYSQL = "MYSQL",
  POSTGRESS = "POSTGRESS",
  SQLITE = "SQLITE",
}

export interface DsoConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
  execute<T = any>(sql: string, params?: any[]): Promise<T>;
}

/** Transaction processor */
export interface TransactionProcessor<T> {
  (connection: MysqlClient): Promise<T>;
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
  /** get pool info */
  abstract get pool(): PoolInfo | undefined;

  /**
     * connect to database
     * @param config config for client
     * @returns Clinet instance
     */
  abstract connect<T>(config: T): Promise<DsoClient>;

  /**
     * excute query sql
     * @param sql query sql string
     * @param params query params
     */
  abstract async query<T = any>(sql: string, params?: any[]): Promise<T>;

  /**
     * excute sql
     * @param sql sql string
     * @param params query params
     */
  abstract async execute<T = any>(sql: string, params?: any[]): Promise<T>;

  /**
     * close connection
     */
  abstract async close(): Promise<void>;
}
