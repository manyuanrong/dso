import { Client, ClientConfig } from "../deps.ts";
import { BaseModel } from "./model.ts";
import { sync } from "./sync.ts";

/** @ignore */
let _client: Client = null;

/** @ignore */
let _models: BaseModel<any>[] = [];

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
  async sync(force: boolean = false) {
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
  define(model: BaseModel<any>) {
    _models.push(model);
    return model;
  },

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
  }
};
