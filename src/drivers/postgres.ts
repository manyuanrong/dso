import { Base } from "./base.ts";
import { PostgresClient } from "../../PostgresClient.ts";

export interface PostgresConfig extends Base {
  clientConfig: object;
  client?: PostgresClient;
}
