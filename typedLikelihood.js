const random = require('random')
const allPackages = require('all-the-package-names')
const download = require('download-file-sync')
const d3 = require('d3-format')
const fs = require('fs')
const path = require('path')
const npmApi = require('npm-api')
var npm = new npmApi()

const dtPath = "../../DefinitelyTyped/types"
const sampleSize = 100000

async function main() {
    let typedPackages = 0
    let definitelyTypedPackages = 0
    let typedDownloads = 0
    let downloads = 0
    let skipped = 0
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const repo = new npm.Repo(name)
        let p
        let n
        try {
            p = await repo.package()
            n = JSON.parse(download(`https://api.npmjs.org/downloads/point/last-month/${name}`)).downloads
        }
        catch (e) {
            // do nothing, handle below
        }
        if (p === undefined || n === undefined) {
            process.stdout.write("!")
            skipped++
            continue
        }
        let typed = false
        if (p.typings || p.types) {
            process.stdout.write('-')
            typedPackages++
            typed = true
        }
        else if (fs.existsSync(path.join(dtPath, mangleScoped(name)))) {
            process.stdout.write("^")
            typedPackages++
            definitelyTypedPackages++
            typed = true
        }
        else {
            process.stdout.write('.')
        }
        downloads += n
        if (typed)
            typedDownloads += n
    }
    const pct = d3.format(".0%")
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

/** @param {string} name */
function mangleScoped(name) {
    return name[0] === "@" ? name.slice(1).replace('/', "__") : name
}


main().catch(e => { console.log(e); process.exit(1) });