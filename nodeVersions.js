/// What is the version distribution of @types/node dependencies?
/// node nodeVersion.js 2>/dev/null
const fs = require('fs')
const random = require('random')
const allRepos = require('all-the-package-repos')
const readline = require('readline')
const { getPackage } = require('./shared')
const { Range } = require('semver')

const date = '06/03/2019'
const sampleSize = 100_000
async function main() {
    /** @type {Record<string, number>} */
    let hist = {}
    let skipped = 0
    const allPackages = Object.keys(allRepos)
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const p = await getPackage(name, date)
        if (p === undefined || name.startsWith("@types/")) {
            skipped++
            continue
        }
        const version = p.packag.dependencies?.['@types/node'] ?? p.packag.devDependencies?.['@types/node']
        let major
        if (!version) {
            major = 'unused'
        }
        else {
            try {
                const r = new Range(version)
                major = r.set[0][0].semver.major
                if (major === undefined) {
                    console.log('bad r.set:', r.set[0][0].semver, 'for', version)
                }
            } catch {
                console.log(version)
                major = 'bad'
            }
        }
        hist[major] = (hist[major] || 0) + 1
        summary(i, skipped, hist)
    }
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * @param {number} i
 * @param {number} skipped
 * @param {Record<string, number>} hist
 */
function summary(i, skipped, hist) {
    if (i % 100) {
        readline.clearLine(process.stdout, /*left*/ -1)
        readline.cursorTo(process.stdout, 0)
    }
    else {
        process.stdout.write('\n')
    }
    const msg = `Skipped: ${skipped}, ${JSON.stringify(hist)}`
    process.stdout.write(msg)
}
