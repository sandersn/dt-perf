// @ts-check
/**
 * Count lines of jsdoc per file, with basic de-duping
 * Input: a file with one file per line, I think?
 */
import * as fs from 'fs'
let total = 0
let comments = 0
let seen = new Set()
for (const file of fs.readFileSync('all-dts.txt', 'utf8').split('\n')) {
    const nm = file.lastIndexOf('node_modules')
    const filename = nm >= 0 ? file.slice(nm + 'node_modules'.length + 1) : file
    if (seen.has(filename) || file === "") {
        continue
    }
    else {
        seen.add(filename)
    }
    let lines
    try {
        lines = fs.readFileSync(file, 'utf8').split('\n')
    }
    catch (e) {
        if (e.code === "EISDIR")
            continue
        else{
            console.log(`||${file}||`)
            throw e
        }
    }
    // console.log(filename, lines.length)
    total += lines.length
    let jsdoc = false
    // let prev = ""
    for (const line of lines) {
        if (line.trimStart().startsWith('/**')) {
            jsdoc = true
        }
        if (jsdoc) {
            comments++
        }
        if (line.trimStart().startsWith('*/')) {
            jsdoc = false
        }
    }
}
console.log(total, ',', comments)
