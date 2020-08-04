import { Base } from "./base.ts";
import { ClientConfig, Client } from "../../deps.ts";

export interface MysqlConfig extends Base {
  clientConfig: ClientConfig;
  client?: Client;
}
