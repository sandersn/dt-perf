declare module "date-range-array" {
    function f(start: string, end: string): string[];
    export = f;
}
declare module "download-file-sync" {
    function f(url: string): any;
    export = f;
}
declare module "stats-lite" {
    /** @param percentile - ranges from 0.0 to 1.0 */
    export function percentile(ns: number[], percentile: number): number;
}
