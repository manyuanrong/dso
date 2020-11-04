import { dso } from "./mod.ts";
import "./test/model.ts";
import { ClientConfig } from "./deps.ts";
import { MysqlClient } from "./src/MysqlClient.ts";

const config: ClientConfig = {
  hostname: "127.0.0.1",
  port: 3306,
  poolSize: 6,
  debug: true,
  username: "root",
  password: "",
  db: "test_orm",
};

export async function clientTest(fn: Function, clientiele: MysqlClient) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await clientiele.connect(config);
      await clientiele.sync(true);
      await fn();
      clientiele.close();
    },
  });
}

const client: MysqlClient = new MysqlClient();
async function main() {
  await client.connect(config);
  await client.query(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await client.query(`USE test_orm`);
  await client.close();
}

await main();
