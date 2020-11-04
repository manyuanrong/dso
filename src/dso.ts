import { Client } from "../deps.ts";
import { BaseModel } from "./model.ts";
import { sync } from "./sync.ts";
import { Transaction } from "./transaction.ts";
import { PostgresConfig } from "./drivers/postgres.ts";
import { MysqlConfig } from "./drivers/mysql.ts";
import { SqliteConfig } from "./drivers/sqlite.ts";
import { SqliteClient } from "../SqliteClient.ts";
import { PostgresClient } from "../PostgresClient.ts";

/** @ignore */
let _client: Client;

/** @ignore */
let _clientPostgres: PostgresClient;

/** @ignore */
let _clientSqlite: SqliteClient;

/** @ignore */
let _models: BaseModel[] = [];

/** @ignore */
export type _ClientType = {
  mysql?: Client;
  postgres?: PostgresClient;
  sqlite?: SqliteClient;
};
/** @ignore */
let _configClientReturn: _ClientType;

/**
 * Global dso instance
 */
export const dso = {
  /**
   * set true will show execute/query sql
   */
  showQueryLog: false,

  /**
   * Sync model to database table
   * @param force set true, will drop table before create table
   
  async sync(force: boolean = false): Promise<void> {
    if (_configClientReturn["mysql"]) {
      for (const model of _models) {
        await sync(_client, model, force);
      }
    } else if (_configClientReturn["postgres"]) {
      for (const model of _models) {
        await sync(_clientPostgres, model, force);
      }
    } else if (_configClientReturn["sqlite"]) {
      for (const model of _models) {
        await sync(_clientSqlite, model, force);
      }
    }
  },*/

  /**
   * MySQL Database client
   */
  get client(): Client {
    return _client;
  },

  /**
  * Postgres Database client
  */
  get clientPostgres(): PostgresClient {
    return _clientPostgres;
  },

  /**
  * Sqlite Database client
  */
  get clientSqlite(): SqliteClient {
    return _clientSqlite;
  },

  /**
  * Current driver client
  */
  get configClientReturn(): _ClientType {
    return _configClientReturn;
  },

  

  /**
   * add model
   * @param model
   */
  define<T extends BaseModel>(ModelClass: { new (): T }): T {
    const model = new ModelClass();
    _models.push(model);
    return model;
  },

  /*
  * Transaction object selected for each driver 
  */
  //transaction: Transaction.transaction,

  /**
   * connect to database mysql | postgres | Sqlite
   * @param config client config
   */
  async connect<T extends PostgresConfig | MysqlConfig | SqliteConfig>(
    config: T,
  ): Promise<_ClientType | undefined> {
    if (config["type"].toUpperCase() === "POSTGRES") {
      _clientPostgres = new PostgresClient(config["clientConfig"]);
      await _clientPostgres.connect();

      return _configClientReturn = {
        postgres: _clientPostgres,
      };
    } else if (config["type"].toUpperCase() === "MYSQL") {
      if (config["client"] && config["client"] instanceof Client) {
        _client = config["client"];
      } else {
        _client = new Client();
        await _client.connect(config["clientConfig"]);
      }
      return _configClientReturn = {
        mysql: _client,
      };
    } else if (config["type"].toUpperCase() === "SQLITE") {
      const configgy: any = config["clientConfig"];

      _clientSqlite = new SqliteClient(configgy["database"]);

      return _configClientReturn = {
        sqlite: _clientSqlite,
      };
    }
    return undefined;
  },

  close(): void {
    if (_configClientReturn["mysql"]) {
      _client.close();
    } else if (_configClientReturn["postgres"]) {
      _clientPostgres.end();
    } else if (_configClientReturn["sqlite"]) {
      _clientSqlite.close();
    }
  },
};
