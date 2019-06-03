const fs = require('fs')
const random = require('random')
const allPackages = require('all-the-package-names')
const d3 = require('d3-format')
const readline = require('readline')
const { getTypes, getPackage } = require('./shared')

const pct = d3.format(".0%")

const dtPath = "../../DefinitelyTyped/types"
const sampleSize = 10000
if (!fs.existsSync(dtPath)) {
    console.error("Incorrect path to Definitely Typed: ", dtPath)
    process.exit(1)
}

async function main() {
    let typedDependencies = 0
    let typedDevDependencies = 0
    let dependencyCount = 0
    let devDependencyCount = 0
    let definitelyTypedPackages = 0
    let perfect = 0
    let skipped = 0
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const p = await getPackage(name)
        if (p === undefined || name.startsWith("@types/")) {
            skipped++
            continue
        }
        let [total, typed, dt] = await countDependencies(p.packag.dependencies)
        dependencyCount += total
        typedDependencies += typed
        definitelyTypedPackages += dt
        if (total === typed && total > 0)
            perfect++
        ;[total, typed, dt] = await countDependencies(p.packag.devDependencies)
        devDependencyCount += total
        typedDevDependencies += typed
        definitelyTypedPackages += dt
        summary(i, skipped, perfect, dependencyCount, devDependencyCount, typedDependencies, typedDevDependencies, definitelyTypedPackages)
    }
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * @param {{ [s: string]: string }} dependencies
 */
async function countDependencies(dependencies) {
    let total = 0
    let typed = 0
    let dt = 0
    if (dependencies) {
        for (const d of Object.keys(dependencies)) {
            const dp = await getPackage(d)
            if (dp === undefined || d.startsWith("@types/")) {
                continue
            }
            total++
            const t = await getTypes(dp.packag, d, dtPath)
            if (t) {
                typed++
                if (t === 'dt') {
                    dt++
                }
            }
        }
    }
    return [total, typed, dt]
}

/**
 * @param {number} i
 * @param {number} skipped
 * @param {number} perfect
 * @param {number} dependencyCount
 * @param {number} devDependencyCount
 * @param {number} typedDependencies
 * @param {number} typedDevDependencies
 * @param {number} definitelyTypedPackages
 */
function summary(i, skipped, perfect, dependencyCount, devDependencyCount, typedDependencies, typedDevDependencies, definitelyTypedPackages) {
    const pTyped = typedDependencies / dependencyCount
    const pBothTyped = (typedDependencies + typedDevDependencies) / (dependencyCount + devDependencyCount)
    if (i % 100) {
        readline.clearLine(process.stdout, /*left*/ -1)
        readline.cursorTo(process.stdout, 0)
    }
    else {
        process.stdout.write('\n')
    }
    const msg = `P(typed-dep): ${pct(pTyped)} P(typed-dep+dev): ${pct(pBothTyped)} (total: ${dependencyCount + devDependencyCount}) (samples: ${i}/${sampleSize}) (DT-only: ${pct(definitelyTypedPackages / (typedDependencies + typedDevDependencies))}) PERFECT: ${perfect} (${pct(perfect / (i - skipped))})`
    process.stdout.write(msg)
}
