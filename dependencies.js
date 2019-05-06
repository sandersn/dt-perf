const fs = require('fs');
const sh = require('shelljs');
const packages = JSON.parse(fs.readFileSync('1-percent.json', 'utf8'))
for (let p in packages) {
    console.log("==== " + p + " =====");
    console.log(sh.grep('react', ["/home/nathansa/DefinitelyTyped/types/" + p + "/*.ts"]).stdout)
}
