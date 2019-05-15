const download = require('download-file-sync')
const { dateKey, parsePerformance } = require('./shared')
const fs = require('fs')
if (process.argv.length < 4) {
    console.log('Usage: node percentileOf.js lodash 55000')
    console.log('    - packageName')
    console.log('    - new type count')
}
/** @type {{ id: number, queueTime: string, date: Date }} */
const recent = JSON.parse(download('https://dev.azure.com/definitelyTyped/DefinitelyTyped/_apis/build/builds?api-version=5.0&definitions=2&reasonFilter=schedule')).value[0]
recent.date = new Date(recent.queueTime)
const key = dateKey(recent.date)
let log
if (fs.existsSync(`data/${key}.log`)) {
    log = fs.readFileSync(`data/${key}.log`, 'utf8')
}
else {
    log = download(JSON.parse(download(`https://dev.azure.com/definitelyTyped/DefinitelyTyped/_apis/build/builds/${recent.id}/logs?api-version=5.0`)).value[5].url)
    fs.writeFileSync(`data/${key}.log`, log, 'utf8')
}
const perf = parsePerformance(log)
const name = process.argv[2]
if (!(name in perf)) {
    console.error(name, 'not found in performance data')
}
else {
    console.log(`${name}:`)
    console.log('Before\tCount:\tPercentile:')
    console.log(`\t${perf[name]}\t${percentileOf(perf[name], Object.values(perf))}`)
    console.log('After:')
    console.log(`\t${process.argv[3]}\t${percentileOf(parseInt(process.argv[3]), Object.values(perf))}`)
}

/**
 * @param {number} m
 * @param {number[]} ns - must be sorted from large to small
 * @return Percentile expressed as a percent, rounded to one decimal place.
 */
function percentileOf(m, ns) {
    for (var i = 0; i < ns.length && m < ns[i]; i++) {
    }
    return Math.round((1 - (i / ns.length)) * 1000) / 10
}
