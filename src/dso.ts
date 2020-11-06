import { DsoClient } from "./drivers/base.ts";
import { MysqlClient } from "./drivers/mysql.ts";
import { BaseModel } from "./model.ts";
import { sync } from "./sync.ts";
import { ConnectOptions } from "./types.ts";

/** @ignore */
const models: BaseModel[] = [];

/** @ignore */
let client: DsoClient;

/**
 * Global dso instance containing all clients
 */
export const dso = {
  /**
   * set true will show execute/query sql
   */
  showQueryLog: false,

  get models(): BaseModel[] {
    return models;
  },

  get client(): DsoClient {
    return client;
  },

  /**
   * add model
   * @param model
   */
  define<T extends BaseModel>(ModelClass: { new (): T }): T {
    const model = new ModelClass();
    models.push(model);
    return model;
  },

  /**
   * Sync model to database table
   * @param force set true, will drop table before create table
   */
  async sync(force: boolean = false): Promise<void> {
    for (const model of models) {
      await sync(client, model, force);
    }
  },

  /**
   * connect to database
   * @param config client config
   */
  async connect(config: ConnectOptions) {
    if (config instanceof DsoClient) {
      client = config;
    } else if (config.driver === "mysql") {
      client = new MysqlClient();
      await client.connect(config.options);
    }
    return client;
  },
};
