import { assert, assertEquals, assertThrowsAsync } from "../deps.ts";
import { BaseModel, dso, Field, FieldType, Join, Model, Query, Where } from "../mod.ts";
import { clientTest } from "../test.ts";

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
  nickName: string;

  @Field({ type: FieldType.STRING, length: 30 })
  password: string;

  @Field({ type: FieldType.INT, default: 0 })
  defaultVal: string;
}

@Model("topics")
class TopicModel extends BaseModel {
  @Field({ type: FieldType.INT, autoIncrement: true, primary: true })
  id: number;

  @Field({ type: FieldType.INT, notNull: true })
  userId: number;

  @Field({ type: FieldType.STRING })
  title: string;
}

const userModel = dso.define(UserModel);
const topicModel = dso.define(TopicModel);

clientTest(async function testInsert() {
  assertEquals(
    await userModel.insert({
      nickName: "foo",
      password: "bar"
    }),
    1
  );
  assertEquals(
    await userModel.insert({
      nickName: "foo",
      password: "bar"
    }),
    2
  );
});

clientTest(async function testUpdate() {
  const id: number = await userModel.insert({ nickName: "foo" });
  assertEquals(
    await userModel.update({
      id,
      password: "BAR"
    }),
    1
  );
  const user = await userModel.findById(id);
  assertEquals(user, {
    updated_at: user.updated_at,
    created_at: user.created_at,
    defaultVal: 0,
    id: 1,
    nickName: "foo",
    password: "BAR"
  });
});

clientTest(async function testFindOneByWhere() {
  await userModel.insert({ nickName: "foo" });
  await topicModel.insert({ title: "foo", userId: 1 });
  const user = await userModel.findOne(
    Where.and(
      Where.field("id").eq(1),
      Where.field("password").isNull(),
      Where.field("default_val").lt(10)
    )
  );
  const topic = await topicModel.findById(1);
  assertEquals(user, {
    id: 1,
    nickName: "foo",
    password: null,
    defaultVal: 0,
    updated_at: user.updated_at,
    created_at: user.created_at
  });
  assert(!!topic.created_at);
  assertEquals(topic, {
    updated_at: topic.updated_at,
    created_at: topic.created_at,
    id: 1,
    title: "foo",
    userId: 1
  });
});

clientTest(async function testDelete() {
  await userModel.insert({ nickName: "foo" });
  await userModel.insert({ nickName: "bar" });
  await userModel.insert({ nickName: "noo" });
  const count = await userModel.delete(
    Where.or(Where.field("id").eq(1), Where.field("nick_name").eq("noo"))
  );

  assertEquals(count, 2);
});

clientTest(async function testFindOneByOptions() {
  await userModel.insert({ nickName: "foo" });
  await topicModel.insert({ title: "foo", userId: 1 });
  const user = await userModel.findOne({
    where: Where.and(
      Where.field("id").eq(1),
      Where.field("password").isNull(),
      Where.field("default_val").lt(10)
    )
  });
  const topic = await topicModel.findOne({
    where: Where.field("topics.id").eq(1),
    fields: ["topics.*", "users.nick_name as userNickName"],
    join: [Join.left("users").on("users.id", "topics.user_id")]
  });
  assert(!!topic.created_at);
  assert(!!topic.updated_at);
  assertEquals(topic, {
    id: 1,
    title: "foo",
    userId: 1,
    userNickName: "foo",
    updated_at: topic.updated_at,
    created_at: topic.created_at
  });
});

clientTest(async function testTransactionFail() {
  let id: number;
  await assertThrowsAsync(async () => {
    await userModel.transaction<boolean>(async model => {
      id = await model.insert({ nickName: "foo", password: "bar" });
      let user = await model.findById(id);
      assert(!!user);
      await model.query(new Query().table("notexixts").select("*"));
      return true;
    });
  });
  const user = await userModel.findById(id);
  assert(!user);
});

clientTest(async function testTransactionSuccess() {
  let id: number;
  await userModel.transaction<boolean>(async model => {
    id = await model.insert({ nickName: "foo", password: "bar" });
    let user = await model.findById(id);
    assert(!!user);
    return true;
  });
  const user = await userModel.findById(id);
  assert(!!user);
});
