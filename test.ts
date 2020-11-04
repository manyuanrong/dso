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

export async function clientTest(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.mysqlClient.connect(config);
      await dso.mysqlClient.sync(true);
      await fn();
      dso.mysqlClient.close();
    },
  });
}

async function main() {
  await dso.mysqlClient.connect(config);
  await dso.mysqlClient.query(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await dso.mysqlClient.query(`USE test_orm`);
  await dso.mysqlClient.close();
}

await main();
