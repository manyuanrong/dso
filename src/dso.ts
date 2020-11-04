import { MysqlClient } from "./MysqlClient.ts";

/**
 * Global dso instance containing all clients
 */
export const dso = {
  /**
   * set true will show execute/query sql
   */
  showQueryLog: false,

  /**
   * MYSQL CLIENT 
   */
  mysqlClient: new MysqlClient(),
};
