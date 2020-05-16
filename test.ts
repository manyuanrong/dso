import { Client } from "./deps.ts";
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

const client = new Client();
dso.showQueryLog = false;

export async function clientTest(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.connect({ ...config, db: "test_orm" });
      await dso.sync(true);
      await fn();
      dso.close();
    },
  });
}

async function main() {
  await client.connect(config);
  await client.execute(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await client.execute(`USE test_orm`);
  await client.close();
}

await main();
