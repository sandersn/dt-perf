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
    let typedPackages = 0
    let definitelyTypedPackages = 0
    let typedDownloads = 0
    let downloads = 0
    let skipped = 0
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const p = await getPackage(name, /*reportDownloads*/ true)
        if (p === undefined || name.startsWith("@types/")) {
            skipped++
            continue
        }
        const typed = await getTypes(p.packag, name, dtPath)
        downloads += p.downloads
        if (typed) {
            typedPackages++
            typedDownloads += p.downloads
            if (typed === 'dt') {
                definitelyTypedPackages++
            }
        }
        summary(i, skipped, downloads, typedDownloads, typedPackages, definitelyTypedPackages)
    }
    const samples = sampleSize - skipped
    const pInstall = downloads / samples
    const pInstallGivenTyped = typedDownloads / typedPackages
    const pTyped = typedPackages / samples
    console.log()
    console.log('Sample size:', samples)
    console.log('Typed packages:', typedPackages, `(${pct(pTyped)})`)
    console.log('Definitely Typed-only packages:', definitelyTypedPackages, `(${pct(definitelyTypedPackages / typedPackages)} of all typed packages)`)
    console.log('Total downloads:', downloads)
    console.log('Average download count:', pInstall)
    console.log('Typed downloads:', typedDownloads)
    console.log('Average typed download count:', pInstallGivenTyped)
    console.log('Probability of an installed library being typed', pct(pInstallGivenTyped * pTyped / pInstall))
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * @param {number} i
 * @param {number} skipped
 * @param {number} downloads
 * @param {number} typedDownloads
 * @param {number} typedPackages
 * @param {number} definitelyTypedPackages
 */
function summary(i, skipped, downloads, typedDownloads, typedPackages, definitelyTypedPackages) {
    const samples = i - skipped
    const pInstall = downloads / samples
    const pInstallGivenTyped = typedDownloads / typedPackages
    const pTyped = typedPackages / samples
    readline.clearLine(process.stdout, /*left*/ -1)
    readline.cursorTo(process.stdout, 0)
    const msg = `P(typed|installed): ${pct(pInstallGivenTyped * pTyped / pInstall)} (${i}/${sampleSize}) (P(typed) ${pct(pTyped)}) (DT-only ${pct(definitelyTypedPackages / typedPackages)})`
    process.stdout.write(msg)
}
