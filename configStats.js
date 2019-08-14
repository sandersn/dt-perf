const download = require('download-file-sync')
const random = require('random')
const allPackages = require('all-the-package-names')
const d3 = require('d3-format')
const readline = require('readline')
const { getTypes, getPackage } = require('./shared')

const pct = d3.format(".0%")

const sampleSize = 10000

async function main() {
    let tsconfig = 0
    let jsconfig = 0
    let checkjs = 0
    let allowjs = 0
    let strict = 0
    let allowstrict = 0
    let checkstrict = 0
    let skipped = 0
    const sampler = random.uniformInt(0, allPackages.length - 1)
    for (let i = 0; i < sampleSize; i++) {
        const name = allPackages[sampler()]
        const p = await getPackage(name)
        if (p === undefined || name.startsWith("@types/") || p.packag.repository === undefined || p.packag.repository.url === undefined) {
            skipped++
            continue
        }
        // now find the github project
        const url = toHttps(p.packag.repository.url)
        let o = getjson(url + '/master/tsconfig.json')
        if (o === 'bad') {
            skipped++
            continue
        }
        if (o && o.compilerOptions) {
            tsconfig++
        }
        else {
            o = getjson(url + '/master/jsconfig.json')
            if (o && o.compilerOptions) {
                jsconfig++
            }
        }
        if (o && o.compilerOptions) {
            if (o.compilerOptions.allowJs) allowjs++
            if (o.compilerOptions.checkJs) checkjs++
            const isstrict = (o.compilerOptions.strict && (o.compilerOptions.noImplicitAny === undefined || o.compilerOptions.noImplicitAny === true)
                || o.compilerOptions.noImplicitAny)
            if (isstrict) strict++
            if (isstrict && o.compilerOptions.allowJs) allowstrict++
            if (isstrict && o.compilerOptions.checkJs) checkstrict++
        }

        summary(i, skipped, tsconfig, jsconfig, allowjs, checkjs, strict, allowstrict, checkstrict)
    }
}

/**
 * @param {string} url
 */
function getjson(url) {
    let s
    try {
        s = download(url)
    }
    catch (e) {
        // bad protocol is the most common I think
        if (e.status > 0 || e.message && e.message.test && e.message.test(/Command failed/)) {
            return /** @type {'bad'} */('bad')
        }
        else {
            throw e;
        }
    }
    if (s !== '404: Not Found\n' && s !== '400: Invalid Request\n') {
        try {
            return /** @type {{ compilerOptions?: { allowJs?: boolean, checkJs?: boolean, strict?: boolean, noImplicitAny?: boolean }}} */(JSON.parse(s))
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                // not json! do nothing
            }
            else {
                throw e;
            }
        }
    }
}

main().catch(e => { console.log(e); process.exit(1) });

/**
 * Convert url protocol to https
 * @param {string} url
 */
function toHttps(url) {
    return url.replace(/^git\+/, '')
        .replace(/^git@github.com:/, 'https://github.com/')
        .replace(/^git:\/\//, 'https://')
        .replace(/^ssh:\/\/git@github.com\//, 'https://github.com/')
        .replace(/\.git$/, '')
        .replace(/https?:\/\/github.com/, 'https://raw.githubusercontent.com')
}

/**
 * @param {number} i
 * @param {number} skipped
 * @param {number} tsconfig
 * @param {number} jsconfig
 * @param {number} allowjs
 * @param {number} checkjs
 * @param {number} strict
 * @param {number} allowstrict
 * @param {number} checkstrict
 */
function summary(i, skipped, tsconfig, jsconfig, allowjs, checkjs, strict, allowstrict, checkstrict) {
    if (i % 100) {
        readline.clearLine(process.stdout, /*left*/ -1)
        readline.cursorTo(process.stdout, 0)
    }
    else {
        process.stdout.write('\n')
    }
    const msg = `${i}: ${tsconfig}+${jsconfig}, allowjs: ${allowjs}, checkjs: ${checkjs}, strict: ${strict}, allowstrict: ${allowstrict}, checkstrict: ${checkstrict}; (skipped: ${skipped})`
    process.stdout.write(msg)
}
