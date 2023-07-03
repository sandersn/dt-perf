import fs from 'fs';
const h = new Map()
for (const line of fs.readFileSync('./oom.txt', 'utf8').split('\r\n')) {
  h.set(line, (h.get(line) ?? 0) + 1)
}
console.log(h)
