import { Client, runTests, test, TestFunction } from "./deps.ts";
import { dso } from "./mod.ts";
import "./test/model.ts";

const client = new Client();
dso.showQueryLog = false;

export async function clientTest(fn: TestFunction) {
  test({
    name: fn.name,
    fn: async () => {
      await dso.sync(true);
      await fn();
    }
  });
}

async function main() {
  await client.connect({
    hostname: "127.0.0.1",
    port: 3306,
    debug: false,
    username: "root",
    password: "",
    db: ""
  });
  await client.execute(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await client.execute(`USE test_orm`);
  await dso.connect(client);
  await runTests();
  await client.close();
}

main();
