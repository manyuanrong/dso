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
  db: "test1_orm",
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
  await client.query(`CREATE DATABASE IF NOT EXISTS test1_orm`);
  await client.query(`USE test1_orm`);
  await client.close();
 
}

await main();

/*** 
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
}**/
