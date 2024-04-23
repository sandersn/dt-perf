import * as fs from 'fs'
import * as path from 'path'
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
 * @return {Promise<'dt' | 'types' | 'file' | undefined>}
 */
export async function getTypes(p, name, dtPath) {
    if (p.typings || p.types) {
        return 'types'
    }
    // TODO: Also check for .js/.mjs/.cjs files in main/exports and look for those files next to them
    else if (await downloadTar(p.dist.tarball)) {
        return 'file'
    }
    else if (fs.existsSync(path.join(dtPath, mangleScoped(name)))) {
        return 'dt'
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
                if (name.match(/\.d\.[cm]?ts/)) {
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
 * @param {Date} start
 * @param {Date} end
 * @return {Promise<import('npm-api').Package | undefined>}
 */
export async function getPackage(name, start, end) {
    const version = await getLatestVersion(name, start, end)
    if (!version) {
        return undefined
    }
    try {
        return await new npm.Repo(name).package(version)
    }
    catch (e) {
        return undefined
    }
}

/**
 * @param {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} h
 * @param {number} n
 */
export function sortHistogram(h, n) {
    return Object.entries(h).sort((x,y) => x[1].count < y[1].count ? 1 : -1).slice(0, n)
}

/**
 * @param {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} h
 * @param {number} n
 */
export function dumpHistogram(h, n) {
    return sortHistogram(h, n).map(([name,count]) => `${name}(${count.count})`).join(',')
}

/**
 * @param {string} name
 * @param {Date} start
 * @param {Date} end
 */
async function getLatestVersion(name, start, end) {
    let repo
    try {
        repo = await clientGet('https://registry.npmjs.org/' + name, { timeout: 10000 })
    }
    catch (e) {
    }
    if (repo && repo.time) {
        return findLatestVersion(repo.time, start, end)
    }
}

/**
 * @param {{ [s: string]: string }} time
 * @param {Date} start
 * @param {Date} end
 */
function findLatestVersion(time, start, end) {
    let latestPublish = new Date(0)
    let latestVersion
    for (const v of Object.keys(time)) {
        if (v === 'modified' || v === 'created')
            continue
        const publishDate = new Date(time[v])
        if (publishDate < start || end < publishDate)
            continue
        if (publishDate > latestPublish) {
            latestPublish = publishDate
            latestVersion = v
        }
    }
    return latestVersion
}

