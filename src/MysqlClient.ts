import { Connection } from "../deps.ts";
import { Client } from "../deps.ts";
import { TransactionProcessor } from "./DsoClient.ts";

import { DsoClient, PoolInfo } from "./DsoClient.ts";
import { BaseModel } from "./model.ts";
import { sync } from "./sync.ts";
import { TransactionMysql } from "./transactionMysql.ts";


export class MysqlClient extends DsoClient {

    #client: Client = new Client();

    /** @ignore */
    #models: BaseModel[] = [];
   

    /**
     * @param showQuerylog                            
     * set true will show execute/query sql
     *
     */
    constructor(private _conn?: Connection) {
        super();

    }



    /**
    * Sync model to database table
    * @param force set true, will drop table before create table
    */
    async sync(force: boolean = false): Promise<void> {

        for (const model of this.#models) {
            await sync(this, model, force);
        }

    }

    /**
     * MySQL Database client
     */
    get client(): Client {
        return this.#client;
    }

    /**
     * all models
    */
    get models() {
        return this.#models;
    }

    /**
     * add model
     * @param model
    */
    define<T extends BaseModel>(ModelClass: { new(connection: Connection| MysqlClient): T }): T {
        const model = new ModelClass(this);
        this.#models.push(model);
        return model;
    }

    async close(): Promise<void> {
        this.#client.close();
    }

    async connect<ClientConfig>(config: ClientConfig): Promise<DsoClient> {
        await this.#client.connect(config);
        return this;
    }


    get pool(): PoolInfo {

        const poolInfo = {
            size: this.#client.pool?.size ,
            maxSize: this.#client.pool?.maxSize ,
            available: this.#client.pool?.available,

        }
        return poolInfo;
    }
    async query<T = any>(sql: string, params?: any[]): Promise<any> {
        return await this.#client.query(sql, params);

    }
    async execute<T = any>(sql: string, params?: any[]): Promise<any> {

        return await this.#client.execute(sql, params);

    }
   transaction = TransactionMysql.transaction;

   static showQueryLog: boolean = false;

  


}