const fs = require('fs')
const random = require('random')
const d3 = require('d3-format')
const readline = require('readline')
const { getTypes, getPackage } = require('./shared')

const pct = d3.format(".1%")

const dtPath = "../../DefinitelyTyped/types"
const sampleSize = 10_000
if (!fs.existsSync(dtPath)) {
    console.error("Incorrect path to Definitely Typed: ", dtPath)
    process.exit(1)
}

// curl -o all-docs.json https://replicate.npmjs.com/registry/_all_docs gives a JSON of all non-scoped packages
// In April 2022, it had 1.8 million rows and was xxx MB
// all-the-package-names can also work, as long as it's been updated recently
async function main() {
    let typedDependencies = 0
    let dependencyCount = 0
    let definitelyTypedPackages = 0
    let perfect = 0
    let skipped = 0
    /** @type {Record<string, number>} */
    let packagecount = {}
    // const allPackages = Object.keys(allRepos)
    /* @type {Array<{id: string, key: string, value: { rev: string }}>} */
    /** @type {Array<string>} */
    const allPackages = require('all-the-package-names') // JSON.parse(fs.readFileSync('all-docs.json', 'utf8')).rows
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()] // allPackages[sampler()].id
        const startDate = new Date(Date.now())
        startDate.setFullYear(startDate.getFullYear() - 2)
        const p = await getPackage(name, startDate) // TODO: Calculate this instead of hard-coding it
        if (p === undefined || name.startsWith("@types/")) {
            skipped++
            continue
        }
        // const m = p.packag.repository.url.match(/https:\/\/github.com\/([^/]+\/[^.]+)\.git/)
        // console.log(m)
        // const repo = m?.[1]
        // TODO: Construct github query to see if ts/js ratio is small enough to guess that it's a JS project
        // Exclude test and d.ts files from the count.
        let [total, typed, dt, names] = await countDependencies(p.packag.dependencies)
        for (const name of names)
            packagecount[name] = (packagecount[name] || 0) + 1
        dependencyCount += total
        typedDependencies += typed
        definitelyTypedPackages += dt
        if (total === typed && total > 0)
            perfect++
        summary(i, skipped, perfect, dependencyCount, typedDependencies, definitelyTypedPackages, packagecount)
    }
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * @param {{ [s: string]: string }} dependencies
 * @return {Promise<[number,number, number, string[]]>}
 */
async function countDependencies(dependencies) {
    let total = 0
    let typed = 0
    let dt = 0
    let names = []
    if (dependencies) {
        for (const d of Object.keys(dependencies)) {
            const dp = await getPackage(d)
            if (dp === undefined || d.startsWith("@types/")) {
                continue
            }
            total++
            const t = getTypes(dp.packag, d, dtPath)
            if (t) {
                typed++
                names.push(dp.packag.name)
                if (t === 'dt') {
                    dt++
                }
            }
        }
    }
    return [total, typed, dt, names]
}

/**
 * @param {number} i
 * @param {number} skipped
 * @param {number} perfect
 * @param {number} dependencyCount
 * @param {number} typedDependencies
 * @param {number} definitelyTypedPackages
 * @param {Record<string, number>} packagecount
 */
function summary(i, skipped, perfect, dependencyCount, typedDependencies, definitelyTypedPackages, packagecount) {
    const pTyped = typedDependencies / dependencyCount
    if (i % 100) {
        readline.clearLine(process.stdout, /*left*/ -1)
        readline.cursorTo(process.stdout, 0)
    }
    else {
        process.stdout.write('\n')
    }
    const msg = `P(typed-dep): ${pct(pTyped)} (total: ${dependencyCount}) (samples: ${i}/${sampleSize}) (DT-only: ${pct(definitelyTypedPackages / typedDependencies)}) PERFECT: ${perfect} (${pct(perfect / (i - skipped))}); ${dumpHistogram(packagecount, 6)}`
    process.stdout.write(msg)
}

/**
 * @param {Record<string, number>} h
 * @param {number} n
 */
function dumpHistogram(h, n) {
    return Object.entries(h).sort((x,y) => x[1] < y[1] ? 1 : -1).slice(0, n).map(([name,count]) => `${name}(${count})`).join(',')
}
