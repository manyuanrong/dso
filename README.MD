## Deno Simple Orm

[![Build Status](https://www.travis-ci.org/manyuanrong/dso.svg?branch=master)](https://www.travis-ci.org/manyuanrong/dso)

`dso` is a simple ORM Library based on [deno_mysql](https://github.com/manyuanrong/deno_mysql)

### Example

```ts
const * as orm from "https://deno.land/x/dso/mod.ts";
// const * as orm from "https://raw.githubusercontent.com/manyuanrong/dso/master/mod.ts";

// Define a database model
const User = orm.define("users", {
    id: { autoIncrement: true, length: 11, type: FieldTypes.INT, primary: true },
    name: { length: 30, type: FieldTypes.STRING },
    password: { length: 30, type: FieldTypes.STRING },
});

async function main(){
    // The database must be created before linking
    await orm.connect({
        hostname: "127.0.0.1",
        port: 3306,
        username: "root",
        passwod: "",
        db: "dbname"
    });

    // When installing or initializing a database, 
    // you can use sync to synchronize the database model to the database.

    // await orm.sync(false);

    // You can add records using insert method
    const insertId = await User.insert({name: "user1", password: "password"});

    // You can use the Model.findById method to get a record
    const user = await User.findById(1);
}
main();
```

### Top Level API

#### connect

You need to use this method to link to the database before you can manipulate the database

```ts
await orm.connect({
    hostname: "127.0.0.1", // database hostname
    port: 3306, // database port
    username: "root", // database username
    passwod: "", // database password
    db: "dbname" // database name. (tips: The database must be created before linking)
});
```

#### define
Define database model `orm.deine(tableName:string, schema: Object)`;

Each key of the `schema` object is defined as a database field.
Each value inherits the [orm.Field](#field) interface, describing the specific types of fields, default values, whether they are primary keys, and so on.

This method returns the defined database model, which has a series of database operation methods.
```ts
const User = orm.define("users", {
    id: { autoIncrement: true, length: 11, type: FieldTypes.INT, primary: true },
    name: { length: 30, type: FieldTypes.STRING },
    password: { length: 30, type: FieldTypes.STRING },
});
// User.findById(...)
// User.findAll(...)
// User.findOne(...)
// User.insert(...)
// User.update(...)
// User.delete(...)
```

#### sync
When installing or initializing a database, you can use sync to synchronize the database model to the database.
```ts
// If set to FORCE, tables will be deleted before they are created,
// otherwise only new models will be synchronized.
const force = true; // force 
await orm.sync(force);
```

#### replaceParams
Use parameters to automatically replace placeholders in SQL statements. export from `deno_mysql`
```
console.log(orm.replaceParams("select ?? from ?? where id = ?", [["id","name"], "users", 1]));
// select (`id`,`name`) from `users` where id = 1
```

### Top Level Types

#### FieldTypes
* `DATE`
* `INT`
* `TEXT`
* `STRING`
* `BOOLEAN`

#### Field
Field type describes the following properties of a field

| key | type | default value | desc |
| --- | --- | --- | --- | --- |
| type | one of the [FieldTypes](#fieldtypes) | null | types of database fields |
| length | number | unfixed | field length |
| primary | boolean | false | database primary key? |
| default | any | null | default values for fields |
| autoIncrement | boolean | false | identify auto-increment fields. It can only be used for INT types |
| notNull | boolean | false | identity fields can not be null |
| autoUpdate | boolean | false | updated automatically according to the current timestamp. It can only be used for DATE types |