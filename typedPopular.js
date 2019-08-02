const allPackages = require('all-the-package-names')
const d3 = require('d3-format')
const { getTypes, getPackage } = require('./shared')
const dtPath = "../../DefinitelyTyped/types"
const date = '06/03/2019'
async function main() {
    let total = 0
    let count = 0
    for (const name of allPackages) {
        total++
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
            process.stdout.write("!")
            continue
        }
        if (n < 30000) {
            break
        }
        if (getTypes(p.packag, name, dtPath)) {
            count++
            const mm = d3.format(".3s")
            console.log(name, mm(n))
        }
        else {
            process.stdout.write('.')
        }
    }
    console.log('Percent: ' + (count / total))
}
main().then(_ => { process.exit(0) }, e => { console.log(e); process.exit(1) })
