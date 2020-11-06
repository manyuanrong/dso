import { DsoClient } from "./drivers/base.ts";

export enum DriverName {
  MYSQL = "mysql",
  SQLITE = "sqlite",
}

export interface MysqlOptions {
  /** Database hostname */
  hostname?: string;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Database port */
  port?: number;
  /** Database name */
  db?: string;
  /** Whether to Display Packet Debugging Information */
  debug?: boolean;
  /** Connect timeout */
  timeout?: number;
  /** Connection pool size default 1 */
  poolSize?: number;
  /** charset */
  charset?: string;
}

export type ConnectOptions = DsoClient | {
  driver: DriverName;
  options?: MysqlOptions;
};
