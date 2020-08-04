import { Client } from "./deps.ts";
import { dso } from "./mod.ts";
import "./test/model.ts";
import { ClientConfig } from "./deps.ts";

const config: ClientConfig = {
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

const mysqlConfig = {
  type: "MYSQL",
  clientConfig: { ...config, db: "test_orm" },
};

export async function clientTest(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.connect(mysqlConfig);
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

const config2 = {
  user: "postgres",
  database: "test_orm",
  hostname: "127.0.0.1",
  //password: "",
  password: "",
  port: 5432,
};

const postgresConfig = {
  type: "POSTGRES",
  clientConfig: config2,
};

export async function clientTestPostgres(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.connect(postgresConfig);
      await dso.sync(true);
      await fn();
      dso.close();
    },
  });
}

const sqliteConfig = {
  type: "SQLITE",
  clientConfig: { database: "test.db" },
};

export async function clientTestSQLITE(fn: Function) {
  Deno.test({
    name: fn.name,
    fn: async () => {
      await dso.connect(sqliteConfig);
      await dso.sync(true);
      await fn();
      dso.close();
    },
  });
}
