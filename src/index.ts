import {BaseModel} from "./model.ts";

export enum IndexType {
    INDEX,
    UNIQUE,
    SPATIAL,
    FULLTEXT
}

export const columnIndexesList: { [key: number]: string; } = {
    [IndexType.INDEX]: "INDEX",
    [IndexType.UNIQUE]: "UNIQUE",
    [IndexType.SPATIAL]: "SPATIAL INDEX",
    [IndexType.FULLTEXT]: "FULLTEXT"
};

export interface Index {
    type: keyof typeof columnIndexesList,
    property?: string;
    columns: Array<string>
}

/** Field Decorator */
export function Index(options: Index) {
    return (target: BaseModel, property: string) => {
        const indexes = target.indexes;
        indexes.push({ ...options, property });
        Reflect.defineMetadata("model:indexes", indexes, target);
    };
}