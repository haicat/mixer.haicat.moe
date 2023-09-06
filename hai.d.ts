/// <reference types="node" />
/// <reference types="node" />
import { IncomingMessage, ServerResponse } from "http";
import { UrlWithParsedQuery } from "url";
import { logLevel } from "./common";
export default abstract class hai {
    abstract readonly name: string;
    abstract match(request: IncomingMessage, extra: haiArgs): boolean;
    abstract run(request: IncomingMessage, response: ServerResponse, extra?: haiArgs): void;
    log(out: string, level?: logLevel): void;
}
export interface haiArgs {
    subdomain: string;
    url: UrlWithParsedQuery;
}
