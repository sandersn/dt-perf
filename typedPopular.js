const allPackages = require('all-the-package-names')
const d3 = require('d3-format')
const { getTypes, getPackage } = require('./shared')
const readline = require('readline')

const pct = d3.format(".1%")
const mm = d3.format(".3s")
const dtPath = "../../DefinitelyTyped/types"
const date = '08/03/2018'
const skiplist = [
    /babel-preset/,
    /grunt-contrib/,
    /-cli$/,
    /-loader$/,
    /ember-cli/,
    /^karma-.+-launcher$/,
]
async function main() {
    let total = 0
    let count = 0
    let skipped = 0
    let missing = 0
    let totals = {
        types: 0,
        typings: 0,
        dt: 0,
        index: 0,
    }
    const untypeds = []
    const skippeds = []
    for (const name of allPackages) {
        if (skiplist.some(re => re.test(name))) {
            skippeds.push(name)
            continue
        }
        total++
        if (total > 500) break
        let p
        let n
        try {
            p = await getPackage(name, date, /*reportDownloads*/ true)
            n = p && p.downloads
        }
        catch (e) {
            // do nothing, handle below
        }
        if (p === undefined || n === undefined) {
            missing++
            continue
        }
        // if (n < 30000) {
            // break
        // }
        const t = await getTypes(p.packag, name, dtPath)
        if (t) {
            totals[t]++
        }
        else {
            untypeds.push(name)
        }
        summary(total, totals, name, n)
    }
    // console.log("\n\nSkipped: ")
    // console.log(skippeds)
    // console.log("\n\nUntyped: ")
    // console.log(untypeds)
    console.log("\n\nMissing:", missing, '            ')
}

/**
 * @param {number} total
 * @param {{ [s: string]: number }} totals
 * @param {string} name
 * @param {number} downloads
 */
function summary(total, totals, name, downloads) {
    readline.clearLine(process.stdout, /*left*/ -1)
    readline.cursorTo(process.stdout, 0, 0)
    const typedPercent = (totals.types + totals.typings + totals.index) / total
    const msg = `${total} (${pct(typedPercent)}): ${Object.keys(totals).map(k => `${k}: ${totals[k]}`).join(', ')} -- ${name} ${mm(downloads)}`
    process.stdout.write(msg + '\n')
}

main().then(_ => { process.exit(0) }, e => { console.log(e); process.exit(1) })
