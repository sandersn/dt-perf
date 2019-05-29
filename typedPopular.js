const allPackages = require('all-the-package-names')
const download = require('download-file-sync')
const d3 = require('d3-format')
const fs = require('fs')
const path = require('path')
const npmApi = require('npm-api')
var npm = new npmApi()
const dtPath = "../../DefinitelyTyped/types"
async function main() {
    for (const name of allPackages) {
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
            continue
        }
        if (n < 30000) {
            break
        }
        if (!(p.typings || p.types || fs.existsSync(path.join(dtPath, mangleScoped(name))))) {
            const mm = d3.format(".3s")
            console.log(name, mm(n))
        }
    }
}
main().then(_ => { process.exit(0) }, e => { console.log(e); process.exit(1) })

/** @param {string} name */
function mangleScoped(name) {
    return name[0] === "@" ? name.slice(1).replace('/', "__") : name
}

