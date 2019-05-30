declare module "date-range-array" {
    function f(start: string, end: string): string[];
    export = f;
}
declare module "download-file-sync" {
    function f(url: string): any;
    export = f;
}
declare module "node-wget-promise" {
    function download(source: string, options: { verbose?: boolean, output?: string, onStart?: any, onProgress?: any}): Promise<void>;
    export = download;
}
declare module "stats-lite" {
    /** @param percentile - ranges from 0.0 to 1.0 */
    export function percentile(ns: number[], percentile: number): number;
}
declare module "all-the-package-names" {
    const names: string[];
    export = names;
}
declare module "random" {
    export function uniform(min: number, max: number): () => number;
    export function uniformInt(min: number, max: number): () => number;
}
declare module "npm-api" {
    class Repo {
        constructor(name: string)
        package(): Promise<{
            typings?: string
            types?: string
            repository?: {
                type: 'git' | 'x'
                url: string
            }
            dependencies: { [s: string]: string }
            dist: {
                integrity: string
                shasum: string
                tarball: string
                fileCount: number
                unpackedSize: number
                'npm-signature': string
            }
            [s: string]: any
        }>
    }
    class NpmApi {
        Repo: typeof Repo
    }
    export = NpmApi;
}
