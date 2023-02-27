// @ts-check
import fs from 'fs'
const fields = /** @type {const} */(['name', 'files', 'library', 'definitions', 'typescript', 'javascript', 'json', 'other', 'identifiers', 'symbols', 'types', 'instantiations', 'memory', 'Parse', 'ResolveTypeReference', 'Program', 'Bind', 'Check', 'ResolveModule', "total"])
/** @type {Record<string, Record<typeof fields[number], string | number>>} */
const all = {}
const commit = process.argv[2]
for (const file of fs.readdirSync('/home/nathansa/.dts/perf/')) {
    const json = JSON.parse(fs.readFileSync('/home/nathansa/.dts/perf/' + file, 'utf8'))
    const name = Object.keys(json)[0]
    all[name] = json[name]
    all[name].name = name
    all[name].total = all[name]["total time"]
    delete all[name]["total time"]
}
let memories = []
let total = 0
let csv = fields.join(',') + '\n'
for (const run of Object.values(all)) {
    csv += fields.map(f => run[f]).join(',') + '\n'
    memories.push(run.memory)
    total += +run.memory
}
memories.sort((m1, m2) => m1 > m2 ? 1 : -1)
console.log('average', total / memories.length / 1_000_000)
console.log('median', +memories[Math.floor(memories.length / 2)] / 1_000_000)
fs.writeFileSync(commit + '.json', JSON.stringify(all))
fs.writeFileSync(commit + '.csv', csv)
