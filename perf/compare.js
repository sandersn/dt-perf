// @ts-check
/**
 * Usage: $ node compare.js before.json after.json
 */
import fs from 'fs'
import d3 from 'd3-format'
import wilcoxon from '@stdlib/stats-wilcoxon'
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
/** @type {Record<string, number[]>} */
const befores = {}
/** @type {Record<string, number[]>} */
const afters = {}
for (const [before,after] of Object.values(both)) {
    for (const k of Object.keys(before)) {
        if (k in after && after[k] != null && before[k] != null) {
            ;(befores[k] = (befores[k] ?? [])).push(before[k])
            ;(afters[k] = (afters[k] ?? [])).push(after[k])
            beforetotal[k] = (beforetotal[k] ?? 0) + before[k]
            aftertotal[k] = (aftertotal[k] ?? 0) + after[k]
        }
    }
}
for (const k of Object.keys(beforetotal)) {
    if (k === 'name') continue
    console.log(`${k}:\t\t${pct((aftertotal[k] - beforetotal[k]) / beforetotal[k])}\t${wc(befores[k], afters[k])}`)
    // console.log(`${k}:\t\t${beforetotal[k]}\t${aftertotal[k]}\t${pct((aftertotal[k] - beforetotal[k]) / beforetotal[k])}\t${wc(befores[k], afters[k])}`)
}

/**
 * @param {number[]} before
 * @param {number[]} after
 */
function wc(before, after) {
    if (before.every((v, i) => v === after[i]))
        return '-'
    const result = wilcoxon(before, after)
    if (result.rejected) {
        return result.pValue < 0.01 ? '**' : result.pValue < 0.05 ? '*' : '?'
    }
    else {
        return ''
    }
}
