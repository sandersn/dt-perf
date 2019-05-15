const dateRange = require('date-range-array')
const download = require('download-file-sync')
const { percentile }  = require('stats-lite')
const fs = require('fs')
// 2019-04-25 -- 2019-05-15
/** @type {Array<{ id: number, queueTime: string, date: Date }>} */
const builds = JSON.parse(download('https://dev.azure.com/definitelyTyped/DefinitelyTyped/_apis/build/builds?api-version=5.0&definitions=2&reasonFilter=schedule')).value
for (const b of builds) {
    b.date = new Date(b.queueTime);
}
for (const date of dateRange(process.argv[2], process.argv[3]).map(s => new Date(s))) {
    const key = dateKey(date)
    const build = builds.find(b => dateKey(b.date) === key)
    if (!build) {
        console.error("Couldn't find build for", key)
        break;
    }
    let log;
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
/**
 * @param {Date} d
 * @return string
 */
function dateKey(d) {
    const iso = d.toISOString()
    return iso.slice(0, iso.indexOf("T"))
}
/**
 * @param {string} log
 * @return {{ [s: string]: number }}
 */
function parsePerformance(log) {
    const lines = log.split('\n')
    const i = lines.findIndex(line => line.match(/PERFORMANCE/))
    if (i === -1) {
        throw new Error('could not find performance log')
    }
    const jsonline = lines[i + 2]
    return JSON.parse(jsonline.slice(jsonline.indexOf("Z") + 1))
}

