## Deno Simple Orm

[![Build Status](https://www.travis-ci.org/manyuanrong/dso.svg?branch=master)](https://www.travis-ci.org/manyuanrong/dso)
![GitHub](https://img.shields.io/github/license/manyuanrong/dso.svg)
![GitHub release](https://img.shields.io/github/release/manyuanrong/dso.svg)
![(Deno)](https://img.shields.io/badge/deno-1.0.0-green.svg)

`dso` is a simple ORM Library based on [deno_mysql](https://github.com/manyuanrong/deno_mysql)

### Example

```ts
import {
  BaseModel,
  Defaults,
  dso,
  Field,
  FieldType,
  Join,
  Model,
  Where
} from "https://deno.land/x/dso@v1.0.0/mod.ts";

// Define a database model
@Model("users")
class UserModel extends BaseModel {
  // The ! operator is needed for primary key since it's never null 
  @Field({
    type: FieldType.INT,
    primary: true,
    length: 11,
    autoIncrement: true
  })
  id!: number; 
  
  // We use ! since name is never null 
  @Field({ type: FieldType.STRING, length: 30, notNull: true }) 
  name!: string;

  // We use ? since password is nullable
  @Field({ type: FieldType.STRING, length: 30 }) 
  password?: string;
}

const userModel = dso.define(UserModel);

async function main() {
  // The database must be created before linking
  await dso.connect({
    hostname: "127.0.0.1",
    port: 3306,
    username: "root",
    password: "",
    db: "dbname"
  });

  /*  
    When installing or initializing a database,
    you can use dso.sync to synchronize the database model to the database.
    Use false as the parameter if you want to sync only newly added models,
    Use true as the parameter if you want to sync the whole defined models
    to the database tables.
    
    == WARNING! ==
    Using true as the parameter will reset your whole database! Use with caution.
  */
  await dso.sync(false);

  // You can add records using insert method
  const insertId = await userModel.insert({
    name: "user1",
    password: "password"
  });

  // You can use the Model.findById method to get a record
  const user = await userModel.findById(1);
}
main();
```

## Running
Since this library needs to use Typescript Decorators and other features, a custom `tsconfig.json` needs to be added. Example config file can be found [here](https://github.com/manyuanrong/dso/blob/master/tsconfig.json), or just copy the contents below and create a new `tsconfig.json` file in your root directory.  
  
`tsconfig.json`
```json
{
  "compilerOptions": {
    "allowJs": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "module": "esnext"
  }
}
```
To run, use:
```sh
deno run --allow-net -c tsconfig.json main.ts
```
where `main.ts` is your Typescript file for Deno.

### Top Level API

#### dso.showQueryLog

Set whether query debugging information is displayed

```ts
dso.showQueryLog = true;
```

#### dso.connect

You need to use this method to link to the database before you can manipulate the database

```ts
await dso.connect({
  hostname: "127.0.0.1", // database hostname
  port: 3306, // database port
  username: "root", // database username
  password: "", // database password
  db: "dbname" // database name. (tips: The database must be created before linking)
});
```

#### dso.define()

Add an annotated `Model` instance and return the instance.

```ts
@Model("users")
class UserModel extends BaseModel {
  @Field({
    type: FieldType.INT,
    primary: true,
    length: 11,
    autoIncrement: true
  })
  id: number;

  @Field({ type: FieldType.STRING, length: 30 })
  name: string;

  @Field({ type: FieldType.STRING, length: 30 })
  password: string;
}

export default const userModel = dso.define(UserModel);

// userModel.findById(...)
// userModel.findAll(...)
// userModel.findOne(...)
// userModel.insert(...)
// userModel.update(...)
// userModel.delete(...)
```

#### dso.sync

When installing or initializing a database, you can use sync to synchronize the database model to the database.

```ts
// If set to FORCE, tables will be deleted before they are created,
// otherwise only new models will be synchronized.
const force = true; // force
await dso.sync(force);
```

#### dso.transaction<T>(processor: (transaction: Transaction) => Promise<T>): Promise<T>

Create and start a transaction.

New `Model` instances must be obtained through `getModel(Model)`. Otherwise, it will not be controlled by transactions.

```ts
const result = await dso.transaction<boolean>(async trans => {
  const userModel = trans.getModel(UserModel);
  const topicModel = trans.getModel(TopicModel);

  userId = await userModel.insert({ nickName: "foo", password: "bar" });
  topicId = await topicModel.insert({ title: "zoo", userId });
  return true;
});
```

### Top Level Types

#### FieldType

- `DATE`
- `INT`
- `TEXT`
- `STRING`
- `BOOLEAN`

#### Field

Field type describes the following properties of a field

| key           | type                                 | default value | desc                                                                                         |
| ------------- | ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------- |
| type          | one of the [FieldTypes](https://github.com/manyuanrong/dso/blob/8d32e64489baaea053d09d64a378fa19b7331ecb/src/field.ts#L10) | null          | types of database fields                                                                     |
| length        | number                               | unfixed       | field length                                                                                 |
| primary       | boolean                              | false         | database primary key?                                                                        |
| default       | any                                  | null          | default values for fields                                                                    |
| autoIncrement | boolean                              | false         | identify auto-increment fields. It can only be used for INT types                            |
| notNull       | boolean                              | false         | identity fields can not be null                                                              |
| autoUpdate    | boolean                              | false         | updated automatically according to the current timestamp. It can only be used for DATE types |
