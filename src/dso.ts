import { Client, ClientConfig } from "../deps.ts";
import { BaseModel } from "./model.ts";
import { sync } from "./sync.ts";
import { Transaction } from "./transaction.ts";

/** @ignore */
let _client: Client;

/** @ignore */
let _models: BaseModel[] = [];

/**
 * Global dso instance
 */
export const dso = {
  /**
   * set true will show exucte/query sql
   */
  showQueryLog: false,

  /**
   * Sync model to database table
   * @param force set true, will drop table before create table
   */
  async sync(force: boolean = false): Promise<void> {
    for (const model of _models) {
      await sync(_client, model, force);
    }
  },

  /**
   * Database client
   */
  get client(): Client {
    return _client;
  },

  /**
   * all models
   */
  get models() {
    return _models;
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

  transaction: Transaction.transaction,

  /**
   * connect to database
   * @param config client config
   */
  async connect(config: ClientConfig | Client) {
    if (config instanceof Client) {
      _client = config;
    } else {
      _client = new Client();
      await _client.connect(config);
    }
    return _client;
  },

  close(): void {
    _client.close();
  },
};
