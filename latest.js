import * as fs from 'fs'
import semver from 'semver'
import { clientGet } from './shared.js'
for (const dir of fs.readdirSync('/home/nathansa/DefinitelyTyped/types')) {
    const p = await clientGet('https://registry.npmjs.org/@types/' + dir, { timeout: 1000 })
    const latest = Object.keys(p['versions']).filter(v => !v.endsWith('-alpha')).sort((a,b) => semver.cmp(a,">",b) ? -1 : 1)
    if (p['dist-tags'].latest !== latest[0]) {
        console.log(`${dir}: ${p['dist-tags'].latest} /= ${latest[0]}`)
    }
}
