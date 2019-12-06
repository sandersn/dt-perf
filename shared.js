const fs = require('fs')
const path = require('path')
const download = require('download-file-sync')
const npmApi = require('npm-api')
const NpmRegistry = require('npm-registry-client')
const npm = new npmApi()
const client = new NpmRegistry()

/**
 * @param {string} url
 * @param {object} options
 */
const clientGet = (url, options) => new Promise((resolve, reject) => client.get(url, options, (e, d) => {
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
module.exports.dateKey = function (d) {
    const iso = d.toISOString()
    return iso.slice(0, iso.indexOf("T"))
}
/**
 * @param {string} log
 * @return {{ [s: string]: number }}
 */
module.exports.parsePerformance = function(log) {
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
 * @return {'dt' | 'typings' | 'types' | 'index' | undefined}
 */
module.exports.getTypes = function (p, name, dtPath) {
    if (p.typings) {
        return 'typings'
    }
    if (p.types) {
        return 'types'
    }
    else if (fs.existsSync(path.join(dtPath, mangleScoped(name)))) {
        return 'dt'
    }
    else if (queryAlgolia(name)) {
        return 'index'
    }
}


/** @param {string} name */
function mangleScoped(name) {
    return name[0] === "@" ? name.slice(1).replace('/', "__") : name
}

/** @param {string} name */
function queryAlgolia(name) {
    const response = JSON.parse(download(`https://ofcncog2cu-dsn.algolia.net/1/indexes/npm-search/${name}?attributes=types&x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.27.1&x-algolia-application-id=OFCNCOG2CU&x-algolia-api-key=f54e21fa3a2a0160595bb058179bfb1e`))
    return response.types && response.types.ts && response.types.ts === "included";
}

/**
 * @param {string} name
 * @param {string} [date]
 * @param {boolean} [reportDownloads]
 * @return {Promise<{ packag: import('npm-api').Package, downloads: number } | undefined>}
 */
module.exports.getPackage = async function (name, date, reportDownloads) {
    const version = await getLatestVersion(name, date)
    let packag
    let downloads
    const repo = new npm.Repo(name)
    try {
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
 * @param {string | undefined} date
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
        if (d > date)
            continue
        if (d > latest) {
            latest = d
            latestVersion = v
        }
    }
    return latestVersion
}
