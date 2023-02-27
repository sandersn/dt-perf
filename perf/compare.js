// @ts-check
/**
 * Usage: $ node compare.js before.json after.json
 */
import fs from 'fs'
import d3 from 'd3-format'
const pct = d3.format(".2%")
const beforedata = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const afterdata = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
/** @typedef {Record<string, number>} Perf */
/** @type {Record<string, [Perf, Perf]>} */
const both = {}
for (const k of Object.keys(beforedata)) {
    both[k] = [beforedata[k], afterdata[k]]
}
/** @type {Record<string, number>} */
const beforetotal = {}
/** @type {Record<string, number>} */
const aftertotal = {}
for (const [before,after] of Object.values(both)) {
    for (const k of Object.keys(before)) {
        if (k in after) {
            beforetotal[k] = (beforetotal[k] ?? 0) + before[k]
            aftertotal[k] = (aftertotal[k] ?? 0) + after[k]
        }
    }
}
for (const k of Object.keys(beforetotal)) {
    if (k === 'name') continue
    console.log(`${k}:\t\t${beforetotal[k]}\t${aftertotal[k]}\t${pct((aftertotal[k] - beforetotal[k]) / beforetotal[k])}\t${monteCarlo(both, k)}`)
}

/**
 * Note: I compare percent differences between runs, so small projects may have more weight than large projects.
 * I need to do some more thinking or reading to decide which is right here.
 * @param {Record<string, [Perf, Perf]>} both
 * @param {string} k
 * @param {number} [n=100]
 */
function monteCarlo(both, k, n = 100) {
    const values = Object.values(both)
    const original = values.map(([before, after]) => (after[k] - before[k]) / before[k]).reduce((a, b) => a + b, 0) // not scaled percentage per-project, so large projects have more weight
    // (percentage scaling would give small projects more weight)
    // The null hypothesis is that randomly shuffling which result is from before/after would produce at least as large a difference
    let nullHypothesis = 0
    for (let i = 0; i < n; i++) {
        const shuffled = values.map(([before, after]) => (Math.random() > 0.5 ? 1 : -1) * ((after[k] - before[k]) / before[k])).reduce((a, b) => a + b, 0)
        if (Math.abs(shuffled) > Math.abs(original)) {
            nullHypothesis++
        }
    }
    return nullHypothesis <= (n / 100) ? "**"
        : nullHypothesis <= (n / 20) ? "*"
        : `(${nullHypothesis} / ${n})`
}
