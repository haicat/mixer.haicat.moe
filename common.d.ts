/// <reference types="node" />
import { IncomingMessage } from "http";
export declare function domainCheck(request: IncomingMessage): string;
export declare enum logLevel {
    debug = 0,
    routine = 1,
    summary = 2,
    warning = 3,
    error = 4
}
export declare function log(output: string, level?: logLevel, prefix?: string): void;
