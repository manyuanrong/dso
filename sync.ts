import { Client } from "https://deno.land/x/mysql/mod.ts";
import { assert } from "https://deno.land/x/testing/asserts.ts";
import { Model, FieldTypes } from "./mod.ts";
import { camel2line } from "./util.ts";

export async function syncModels(client: Client, models: Model<any>[], force: boolean) {
    for (let index = 0; index < models.length; index++) {
        const model = models[index];
        if (force) {
            await client.execute(`DROP TABLE IF EXISTS ${model.name}`);
        }

        let fieldsDef = model.fields.map(field => {
            let def = camel2line(field.name);
            let type = "";
            switch (field.type) {
                case FieldTypes.STRING:
                    type = `VARCHAR(${field.length || 255})`;
                    break;
                case FieldTypes.INT:
                    type = `INT(${field.length || 11})`;
                    break;
                case FieldTypes.DATE:
                    type = `TIMESTAMP`;
                    break;
                case FieldTypes.BOOLEAN:
                    type = `TINYINT(1)`;
                    break;
                case FieldTypes.TEXT:
                    type = `TEXT(${field.length})`;
                    break;
            }
            def += ` ${type}`;
            if (field.notNull) def += " NOT NULL";
            if (field.autoIncrement) def += " AUTO_INCREMENT";
            if (field.default) def += ` DEFAULT ${field.default}`;
            if (field.autoUpdate) {
                assert(field.type === FieldTypes.DATE, "AutoUpdate only support Date field");
                def += ` ON UPDATE CURRENT_TIMESTAMP()`;
            }
            return def;
        }).join(", ");

        if (model.pk) fieldsDef += `, PRIMARY KEY (${model.pk.name})`;
        const sql = `CREATE TABLE IF NOT EXISTS ${model.name} (${fieldsDef}) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
        console.log(sql);
        await client.execute(sql);
    }
}