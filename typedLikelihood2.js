import * as fs from 'fs'
import random from 'random'
import d3 from 'd3-format'
import readline from 'readline'
import { getTypes, getPackage, dumpHistogram } from './shared.js'
import allPackages from 'all-the-package-names' assert { type: 'json' }
// $ node typedLikelihood2.js 2>/dev/null
const pct = d3.format(".1%")

const dtPath = "../../DefinitelyTyped/types"
const sampleSize = 30_000
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
    let typedFiles = 0
    let perfect = 0
    let skipped = 0
    /** @type {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} */
    let packagecount = {}
    const sampler = random.uniformInt(0, allPackages.length - 1)
    const cache = new Map()
    const beginning = new Date('1/1/2000')
    // TODO: Check out DT and install all-the-package-names at the correct test date each time
    const startDate = new Date('4/1/2024') // new Date(Date.now())
    const endDate = new Date(startDate)
    startDate.setFullYear(startDate.getFullYear() - 2)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const p = await getPackage(name, startDate, endDate)
        if (p === undefined || name.startsWith("@types/")) {
            skipped++
            continue
        }
        // const m = p.packag.repository.url.match(/https:\/\/github.com\/([^/]+\/[^.]+)\.git/)
        // console.log(m)
        // const repo = m?.[1]
        // TODO: Construct github query to see if ts/js ratio is small enough to guess that it's a JS project
        // Exclude test and d.ts files from the count.
        let [total, typed, dt, typedFile, names] = await countDependencies(p.dependencies, cache, beginning, endDate)
        for (const [name, type] of names) {
            if (!(name in packagecount)) {
                packagecount[name] = { count: 0, types: '' }
            }
            packagecount[name].count++
            if (packagecount[name].types !== '' && type !== packagecount[name].types)
                throw new Error(`Inconsistent types for ${name}: ${packagecount[name].types} vs ${type}`)
            packagecount[name].types = type
        }
        dependencyCount += total
        typedDependencies += typed
        definitelyTypedPackages += dt
        typedFiles += typedFile
        if (total === typed && total > 0)
            perfect++
        summary(i, skipped, perfect, dependencyCount, typedDependencies, definitelyTypedPackages, typedFiles, packagecount)
    }
    console.log('\n\n\n' + dumpHistogram(packagecount, 100))
    fs.writeFileSync('histogram.json', JSON.stringify(packagecount, null, 2))
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * @param {{ [s: string]: string }} dependencies
 * @param {Map<string, { t: 'dt' | 'types' | 'file' | undefined, dp: import("npm-api").Package | undefined }>} cache
 * @param {Date} start
 * @param {Date} end
 * @return {Promise<[number, number, number, number, [string, 'dt' | 'types' | 'file' | undefined][]]>}
 */
async function countDependencies(dependencies, cache, start, end) {
    let total = 0
    let typed = 0
    let dt = 0
    let file = 0
    /** @type {[string, 'dt' |'types' | 'file' | undefined][]} */
    let names = []
    if (dependencies) {
        for (const d of Object.keys(dependencies)) {
            if (d.startsWith("@types/")) {
                continue
            }
            let { dp, t } = cache.get(d) ?? { dp: await getPackage(d, start, end), t: undefined }
            if (!cache.has(d)) {
                if (dp === undefined) {
                    continue
                }
                t = await getTypes(dp, d, dtPath)
                cache.set(d, { dp, t })
            }
            total++
            if (t) {
                typed++
                if (t === 'dt') {
                    dt++
                }
                else if (t === 'file') {
                    file++
                }
            }
            if (dp) 
                names.push([dp.name, t])
            else
                throw new Error(`No package for ${d} (somehow)`)
        }
    }
    return [total, typed, dt, file, names]
}

/**
 * @param {number} i
 * @param {number} skipped
 * @param {number} perfect
 * @param {number} dependencyCount
 * @param {number} typedDependencies
 * @param {number} definitelyTypedPackages
 * @param {number} typedFiles
 * @param {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} packagecount
 */
function summary(i, skipped, perfect, dependencyCount, typedDependencies, definitelyTypedPackages, typedFiles, packagecount) {
    const pTyped = typedDependencies / dependencyCount
    if (i % 100) {
        readline.clearLine(process.stdout, /*left*/ -1)
        readline.cursorTo(process.stdout, 0)
    }
    else {
        process.stdout.write('\n')
    }
    const msg = `P(typed-dep): ${pct(pTyped)} (total: ${dependencyCount}) (n: ${i}-${skipped}/${sampleSize}) (DT: ${pct(definitelyTypedPackages / typedDependencies)}, file: ${typedFiles}) PERFECT: ${pct(perfect / (i - skipped))}; ${dumpHistogram(packagecount, 3)}`
    process.stdout.write(msg)
}
