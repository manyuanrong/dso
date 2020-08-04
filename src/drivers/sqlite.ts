import { Base } from "./base.ts";
import { SqliteClient } from "../../SqliteClient.ts";

export interface SqliteConfig extends Base {
  clientConfig: object;
  client?: SqliteClient;
}
