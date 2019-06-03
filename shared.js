const fs = require('fs')
const path = require('path')
const wget = require('node-wget-promise')
const tar = require('tar')
const download = require('download-file-sync')
const npmApi = require('npm-api')

const npm = new npmApi()
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
 * @return {Promise<'dt' | 'typings' | 'types' | 'index' | undefined>}
 */
module.exports.getTypes = async function (p, name, dtPath) {
    if (p.typings) {
        return 'typings'
    }
    if (p.types) {
        return 'types'
    }
    else if (fs.existsSync(path.join(dtPath, mangleScoped(name)))) {
        return 'dt'
    }
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
 * @param {boolean} [reportDownloads]
 * @return {Promise<{ packag: import('npm-api').Package, downloads: number } | undefined>}
 */
module.exports.getPackage = async function (name, reportDownloads) {
    let packag
    let downloads
    const repo = new npm.Repo(name)
    try {
        packag = await repo.package()
        downloads = reportDownloads ? JSON.parse(download(`https://api.npmjs.org/downloads/point/last-month/${name}`)).downloads : 0
    }
    catch (e) {
        // do nothing, caller needs to handle it
    }
    return packag !== undefined && downloads !== undefined ? { packag, downloads } : undefined
}
