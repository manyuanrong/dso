import { dso } from "./mod.ts";
import { DriverName } from "./src/types.ts";
import "./test/model.ts";

const config = {
  driver: DriverName.MYSQL,
  options: {
    hostname: "127.0.0.1",
    port: 3306,
    poolSize: 3,
    debug: false,
    username: "root",
    password: "",
    db: "",
  },
};

export async function clientTest(testFn: Function) {
  Deno.test({
    name: testFn.name,
    fn: async () => {
      await dso.connect(
        {
          ...config,
          options: {
            ...config.options,
            db: "test_orm",
          },
        },
      );
      await dso.sync(true);
      await testFn();
      dso.client.close();
    },
  });
}

async function main() {
  await dso.connect(config);
  await dso.client.query(`DROP DATABASE IF EXISTS test_orm`);
  await dso.client.query(`CREATE DATABASE IF NOT EXISTS test_orm`);
  await dso.client.query(`USE test_orm`);
  await dso.client.close();
}

await main();
