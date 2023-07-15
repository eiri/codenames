const fs = require('fs')

try {
    const args = process.argv.slice(2)
    if (args.length != 2) {
        throw new Error('expectign exactly two arguments')
    }
    const fileIn = args[0]
    const fileOut = args[1]
    const data = fs.readFileSync(fileIn, 'utf8')
    let words = data.split(/[ ,]+/).map(w => w.toLowerCase())
    words = words.filter((v, i, a) => a.indexOf(v) === i)
    words.sort()
    fs.writeFileSync(fileOut, JSON.stringify(words, null, 2))
} catch (err) {
    console.error(err)
}
