import { sortHistogram } from './shared.js'
import fs from 'fs'
/** @type {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} */
const old = JSON.parse(fs.readFileSync('1-1-small.json', 'utf-8'))
/** @type {Record<string, { count: number, types: 'dt' | 'types' | 'file' | undefined | '' }>} */
const noo = JSON.parse(fs.readFileSync('4-1-small.json', 'utf-8'))
const results = []
for (const k in old) {
    if (old[k].types === 'dt' && !(k in noo)) {
        results.push(`delete ${k}: ${old[k].count}`)
    }
    else if (old[k].types === 'dt' && noo[k].types !== 'dt') {
        results.push(`remove ${k}: ${old[k].count} vs ${noo[k].count}`)
    }

}
console.log(JSON.stringify(results, undefined, 2))
console.log(results.length)
