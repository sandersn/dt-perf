import * as fs from 'fs'
import * as path from 'path'
import download from 'download-file-sync'
import npmApi from 'npm-api'
import NpmRegistry from 'npm-registry-client'
import wget from 'node-wget-promise'
import tar from 'tar'
const npm = new npmApi()
const client = new NpmRegistry()

/**
 * @param {string} url
 * @param {object} options
 */
export const clientGet = (url, options) => new Promise((resolve, reject) => client.get(url, options, (e, d) => {
    if (e) {
        reject(e)
    }
    else {
        resolve(d)
    }
}))

/**
 * @param {Date} d
 * @return string
 */
export function dateKey(d) {
    const iso = d.toISOString()
    return iso.slice(0, iso.indexOf("T"))
}
/**
 * @param {string} log
 * @return {{ [s: string]: number }}
 */
export function parsePerformance(log) {
    const lines = log.split('\n')
    const i = lines.findIndex(line => line.match(/PERFORMANCE/))
    if (i === -1) {
        throw new Error('could not find performance log')
    }
    const jsonline = lines[i + 2]
    return JSON.parse(jsonline.slice(jsonline.indexOf("Z") + 1))
}


/**
 * @param {import('npm-api').Package} p
 * @param {string} name
 * @param {string} dtPath
 * @return {Promise<'dt' | 'typings' | 'types' | 'index' | 'exports' | 'imports' | undefined>}
 */
export async function getTypes(p, name, dtPath) {
    if (p.typings) {
        return 'typings'
    }
    else if (p.types) {
        return 'types'
    }
    else if (p.exports && Object.values(p.exports).some(e => e?.types)) {
        return 'exports'
    }
    else if (p.imports && Object.values(p.imports).some(e => e?.types)) {
        return 'imports'
    }
    else if (fs.existsSync(path.join(dtPath, mangleScoped(name)))) {
        return 'dt'
    }
    // TODO: Also check for .js/.mjs/.cjs files in main/exports and look for those files next to them
    else if (await downloadTar(p.dist.tarball)) {
        return 'index'
    }
}


/** @param {string} name */
function mangleScoped(name) {
    return name[0] === "@" ? name.slice(1).replace('/', "__") : name
}

/** @param {string} url */
async function downloadTar(url) {
    let cachepath = path.join('data', path.basename(url))
    if (!fs.existsSync(cachepath)) {
        try {
            await wget(url, { output: cachepath })
        }
        catch (e) {
            console.log(e)
            return false
        }
    }
    let found = false
    try {
        tar.list({
            sync: true,
            file: cachepath,
            filter(name) {
                if (name.match(/package\/index.d.ts/)) {
                    found = true
                    return true
                }
                return false
            }
        })
    }
    catch (e) {
        console.log(e)
        return false
    }
    return found
}

/**
 * @param {string} name
 * @param {Date | string} [date]
 * @param {boolean} [reportDownloads]
 * @return {Promise<{ packag: import('npm-api').Package, downloads: number } | undefined>}
 */
export async function getPackage(name, date, reportDownloads) {
    const version = await getLatestVersion(name, date)
    let packag
    let downloads
    const repo = new npm.Repo(name)
    try {
        if (date && !version) {
            return undefined
        }
        packag = version ? await repo.package(version) : await repo.package()
        downloads = reportDownloads ? JSON.parse(download(`https://api.npmjs.org/downloads/point/last-month/${name}`)).downloads : 0
    }
    catch (e) {
        // do nothing, caller needs to handle it
    }
    return packag !== undefined && downloads !== undefined ? { packag, downloads } : undefined
}

/**
 * @param {string} name
 * @param {Date | string | undefined} date
 */
async function getLatestVersion(name, date) {
    if (date) {
        let repo
        try {
            repo = await clientGet('https://registry.npmjs.org/' + name, { timeout: 10000 })
        }
        catch (e) {
        }
        if (repo && repo.time) {
            return findLatestVersion(repo.time, new Date(date))
        }
    }
}

/**
 * @param {{ [s: string]: string }} time
 * @param {Date} date
 */
function findLatestVersion (time, date) {
    let latest = new Date(0)
    let latestVersion
    for (const v of Object.keys(time)) {
        if (v === 'modified' || v === 'created')
            continue
        const d = new Date(time[v])
        if (d < date)
            continue
        if (d > latest) {
            latest = d
            latestVersion = v
        }
    }
    return latestVersion
}
