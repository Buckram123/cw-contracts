// To parse this data:
//
//   import { Convert, ExecuteMsg, InstantiateMsg, QueryMsg } from "./file";
//
//   const executeMsg = Convert.toExecuteMsg(json);
//   const instantiateMsg = Convert.toInstantiateMsg(json);
//   const queryMsg = Convert.toQueryMsg(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * Messages that can modify state
 *
 * New to do list
 *
 * Update to do list
 *
 * Delete to do list
 */
export interface ExecuteMsg {
    new_entry?:    NewEntry;
    update_entry?: UpdateEntry;
    delete_entry?: DeleteEntry;
}

export interface DeleteEntry {
    id: number;
}

export interface NewEntry {
    /**
     * Description of the to do item
     */
    description: string;
    /**
     * Priority for the to do item
     */
    priority?: Priority | null;
}

export enum Priority {
    High = "High",
    Low = "Low",
    Medium = "Medium",
    None = "None",
}

export interface UpdateEntry {
    /**
     * updated description
     */
    description?: null | string;
    id:           number;
    /**
     * updated priority
     */
    priority?: Priority | null;
    /**
     * updated status
     */
    status?: Status | null;
}

export enum Status {
    Cancelled = "Cancelled",
    Done = "Done",
    InProgress = "InProgress",
    ToDo = "ToDo",
}

/**
 * Message for contract initializing
 */
export interface InstantiateMsg {
    /**
     * owner of this to do list
     */
    owner?: null | string;
}

/**
 * Messages for viewing the state
 *
 * Check to do item at id
 *
 * List to do items with pagination
 */
export interface QueryMsg {
    query_entry?: QueryEntry;
    query_list?:  QueryList;
}

export interface QueryEntry {
    id: number;
}

export interface QueryList {
    limit?:       number | null;
    start_after?: number | null;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toExecuteMsg(json: string): ExecuteMsg {
        return cast(JSON.parse(json), r("ExecuteMsg"));
    }

    public static executeMsgToJson(value: ExecuteMsg): string {
        return JSON.stringify(uncast(value, r("ExecuteMsg")), null, 2);
    }

    public static toInstantiateMsg(json: string): InstantiateMsg {
        return cast(JSON.parse(json), r("InstantiateMsg"));
    }

    public static instantiateMsgToJson(value: InstantiateMsg): string {
        return JSON.stringify(uncast(value, r("InstantiateMsg")), null, 2);
    }

    public static toQueryMsg(json: string): QueryMsg {
        return cast(JSON.parse(json), r("QueryMsg"));
    }

    public static queryMsgToJson(value: QueryMsg): string {
        return JSON.stringify(uncast(value, r("QueryMsg")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any = ''): never {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`, );
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases, val);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue("array", val);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue("Date", val);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue("object", val);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val);
    }
    if (typ === false) return invalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "ExecuteMsg": o([
        { json: "new_entry", js: "new_entry", typ: u(undefined, r("NewEntry")) },
        { json: "update_entry", js: "update_entry", typ: u(undefined, r("UpdateEntry")) },
        { json: "delete_entry", js: "delete_entry", typ: u(undefined, r("DeleteEntry")) },
    ], false),
    "DeleteEntry": o([
        { json: "id", js: "id", typ: 0 },
    ], "any"),
    "NewEntry": o([
        { json: "description", js: "description", typ: "" },
        { json: "priority", js: "priority", typ: u(undefined, u(r("Priority"), null)) },
    ], "any"),
    "UpdateEntry": o([
        { json: "description", js: "description", typ: u(undefined, u(null, "")) },
        { json: "id", js: "id", typ: 0 },
        { json: "priority", js: "priority", typ: u(undefined, u(r("Priority"), null)) },
        { json: "status", js: "status", typ: u(undefined, u(r("Status"), null)) },
    ], "any"),
    "InstantiateMsg": o([
        { json: "owner", js: "owner", typ: u(undefined, u(null, "")) },
    ], "any"),
    "QueryMsg": o([
        { json: "query_entry", js: "query_entry", typ: u(undefined, r("QueryEntry")) },
        { json: "query_list", js: "query_list", typ: u(undefined, r("QueryList")) },
    ], false),
    "QueryEntry": o([
        { json: "id", js: "id", typ: 0 },
    ], "any"),
    "QueryList": o([
        { json: "limit", js: "limit", typ: u(undefined, u(0, null)) },
        { json: "start_after", js: "start_after", typ: u(undefined, u(0, null)) },
    ], "any"),
    "Priority": [
        "High",
        "Low",
        "Medium",
        "None",
    ],
    "Status": [
        "Cancelled",
        "Done",
        "InProgress",
        "ToDo",
    ],
};
