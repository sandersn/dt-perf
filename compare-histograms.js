import fs from 'fs'
// 1. I'm sampling a fixed number, even with skips -- but I include skips. Should just go for fixed number after skips
// 2. Number of deps per package vary -- but I don't want to normalise for this. (but I have to to work around sum-*'s 
/** @typedef {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} Histogram */
/** @type {Histogram} */
const old = JSON.parse(fs.readFileSync('1-1-large.json', 'utf-8'))
/** @type {Histogram} */
const noo = JSON.parse(fs.readFileSync('4-4-large.json', 'utf-8'))
const results = []
const { total: totalold, untyped: untypedold } = sampleCounts(old)
const { total: totalnew, untyped: untypednew, untypedSamples: sorted } = sampleCounts(noo)
console.log('old', totalold, untypedold)
console.log('new', totalnew, untypednew)
console.log('sorted', sorted.map(s => [s.name, s.count]).slice(100))
for (const k in noo) {
    // if (old[k].types === 'dt' && !(k in noo)) {
    //     results.push(`delete ${k}: ${old[k].count}`)
    // }
    // if (old[k].types === 'dt' && k in noo && noo[k].types !== 'dt') {
    //     results.push(`remove ${k}: ${old[k].count} vs ${noo[k].count}`)
    // }
    if (noo[k].types === undefined) {
        results.push(`untyped ${k}: ${old[k]?.count} vs ${noo[k].count}`)
    }

}
// total samples
// total untyped samples (old vs new)
// sorted untyped samples (new)
// console.log(JSON.stringify(results, undefined, 2))
console.log(results.length, Object.keys(noo).length, Object.keys(old).length)

/** 
 * @param {Histogram} h
 * @return {{ total: number, untyped: number, untypedSamples: { name: string, count: number, types: 'dt' | 'types' | 'file' | undefined | '' }[] }}
 */
function sampleCounts(h) {
    let total = 0
    let untyped = 0
    let untypedSamples = []
    for (const [k, sample] of Object.entries(h)) {
        total += sample.count
        if (sample.types === undefined) {
            untyped += sample.count
            untypedSamples.push({ ...sample, name: k })
        }
    }
    untypedSamples.sort((s, t) => s.count < t.count ? 1 : -1)
    return { total, untyped, untypedSamples }
}
