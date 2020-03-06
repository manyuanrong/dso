import { Client } from "./deps.ts";
import { dso } from "./mod.ts";
import "./test/model.ts";

const client = new Client();
dso.showQueryLog = false;

export async function clientTest(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.sync(true);
      await fn();
    }
  });
}

async function main() {
  const config = {
    hostname: "127.0.0.1",
    port: 3306,
    poolSize: 3,
    debug: false,
    username: "root",
    password: "",
    db: ""
  };
  await client.connect(config);
  await client.execute(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await client.execute(`USE test_orm`);
  await client.close();
  await dso.connect({ ...config, db: "test_orm" });
  await Deno.runTests();
}

main();
