const dateRange = require('date-range-array')
const download = require('download-file-sync')
const { dateKey, parsePerformance } = require('./shared')
const { percentile }  = require('stats-lite')
const fs = require('fs')
// 2019-04-25 -- 2019-05-15
if (process.argv.length < 4) {
    console.log('Usage: node percentileOf.js 2019-04-25 2019-05-15')
    console.log('    - start date (should be at least 2019-04-25)')
    console.log('    - end date')
}
/** @type {Array<{ id: number, queueTime: string, date: Date }>} */
const builds = JSON.parse(download('https://dev.azure.com/definitelyTyped/DefinitelyTyped/_apis/build/builds?api-version=5.0&definitions=2&reasonFilter=schedule')).value
for (const b of builds) {
    b.date = new Date(b.queueTime)
}
for (const date of dateRange(process.argv[2], process.argv[3]).map(s => new Date(s))) {
    const key = dateKey(date)
    const build = builds.find(b => dateKey(b.date) === key)
    if (!build) {
        console.error("Couldn't find build for", key)
        break
    }
    let log
    if (fs.existsSync(`data/${key}.log`)) {
        log = fs.readFileSync(`data/${key}.log`, 'utf8')
    }
    else {
        log = download(JSON.parse(download(`https://dev.azure.com/definitelyTyped/DefinitelyTyped/_apis/build/builds/${build.id}/logs?api-version=5.0`)).value[5].url)
        fs.writeFileSync(`data/${key}.log`, log, 'utf8')
    }
    const perf = parsePerformance(log)
    const ns = Object.values(perf)
    // console.log("  * Percentiles: ");
    // console.log("99:", percentile(types, 0.99));
    // console.log("95:", percentile(types, 0.95));
    // console.log("90:", percentile(types, 0.90));
    // console.log("70:", percentile(types, 0.70));
    console.log([key, percentile(ns, 0.50), percentile(ns, 0.70), percentile(ns, 0.90), percentile(ns, 0.95), percentile(ns, 0.99)].join(','))
}
