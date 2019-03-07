import { define, connect, FieldTypes, sync, replaceParams } from "./mod.ts";
import { Client } from "https://deno.land/x/mysql/mod.ts";
import { test, runTests } from "https://deno.land/x/testing/mod.ts";
import { assertEquals, assert } from "https://deno.land/x/testing/asserts.ts";

const User = define("users", {
    id: { autoIncrement: true, length: 11, type: FieldTypes.INT, primary: true },
    name: { length: 30, type: FieldTypes.STRING },
    password: { length: 30, type: FieldTypes.STRING },
});

test(async function testInsert() {
    let id = await User.insert({
        name: "user1",
        password: "test"
    });
    assertEquals(id, 1);

    id = await User.insert({
        name: "user2",
        password: "test"
    });
    assertEquals(id, 2);

    id = await User.insert({
        name: "user3",
        password: "test"
    });
    assertEquals(id, 3);
});

test(async function testUpdate() {
    // update by primary key
    let affectedRows = await User.update({ id: 2, name: "USER2" });
    assertEquals(affectedRows, 1);

    // updte by where
    affectedRows = await User.update({ id: 4 }, { id: 3 });
    assertEquals(affectedRows, 1);

    // update no where
    affectedRows = await User.update({ password: "TEST" });
    assertEquals(affectedRows, 3);
});

test(async function testFindById() {
    const user = await User.findById(1);
    assert(user.createdAt != null);
    assert(user.updatedAt != null);
    delete user.createdAt;
    delete user.updatedAt;
    assertEquals(user, { id: 1, name: "user1", password: "TEST" });
});

test(async function testFindAll() {
    let users = await User.findAll();
    assertEquals(users.length, 3);
    users.forEach(user => {
        assertEquals(user.password, "TEST");
    });

    users = await User.findAll({ id: () => replaceParams("in ?", [[1, 2]]) });
    assertEquals(users.length, 2);
});

test(async function testDelete() {
    let affectedRows = await User.delete({ id: 1 });
    assertEquals(affectedRows, 1);

    affectedRows = await User.delete(`id = 2`, []);
    assertEquals(affectedRows, 1);
});

async function main() {
    const client = new Client();
    await client.connect({
        hostname: "127.0.0.1",
        port: 3306,
        debug: true,
        username: "root",
        password: "",
        db: ""
    });
    await client.execute(`CREATE DATABASE IF NOT EXISTS test_orm`);
    await client.execute(`USE test_orm`);
    await connect(client);
    await sync(true);
    runTests();
}
main();