// @ts-check
import fs from 'fs'
const lines = fs.readFileSync('failures.txt', 'utf8').split('\n')
let starts = []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith("Error in ")) {
    starts.push(i)
  }
}
let spans = []
for (let i = 1; i < starts.length; i++) {
  spans.push(lines.slice(starts[i - 1], starts[i]))
}
/** @param {string} name @param {string[]} lines */
function match(name, lines) {
  const s = lines.join('\n')
  if (s.includes("can only be default-imported using the 'esModuleInterop' flag")) {
    return 'no-import-default-of-exports-equals'
  }
  else if (s.includes("Conflicting definitions for 'node' found at")) {
    return 'conflicting-node-versions'
  }
  else if (s.includes("The declaration should use 'export =' syntax")) {
    return 'npm-naming-export-equals'
  }
  else if (name === 'absolute-url') {
    return 'failed-module-augmentation'
  }
  else if (name === 'ag-channel/v4') {
    return 'old-version-test-depends-on-new-version'
  }
  else if (name === 'apollo-upload-client') {
    return 'pnpm-install-old-graphql-15' // fixed by explicitly request ^15.7 not 14-16
  }
  else {
    return 'unknown'
  }
}
/** @type {Record<string, [name: string, rest: any[]][]>} */
let groups = {}
for (const span of spans) {
  const name = span[0].slice("Error in ".length)
  const rest = span.slice(1)
  const k = match(name, rest)
  const group = groups[k] || []
  group.push([name, rest])
  groups[k] = group
}
let sum = 0
for (const k in groups) {
  console.log('\t', groups[k].length, ':\t', k)
  sum += groups[k].length
}
console.log(sum, '===', spans.length, '\n')

let i = 0
for (const [name, _] of groups['unknown']) {
  console.log(name)
  if (i > 10) break
  i++
}
