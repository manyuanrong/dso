import { dso } from "./mod.ts";
import "./test/model.ts";

const config = {
  hostname: "127.0.0.1",
  port: 3306,
  poolSize: 3,
  debug: false,
  username: "root",
  password: "",
  db: "",
};
export async function clientTest(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.mysqlClient.connect({ ...config, db: "test_orm" });
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
