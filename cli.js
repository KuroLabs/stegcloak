const { program } = require('commander')
const StegCloak = require('./stegcloak')
const color = require('colors')
const clipboardy = require('clipboardy')

program
  .command('hide <secret> <password>')
  .option('-c, --cover <covertext>', 'Text that you want to hide your secret within')
  .option('-cp, --clip', 'Copy Data directly from clipboard')
  .option('-n, --nocrypt', "If you don't need encryption", false)
  .option('-i, --integrity', 'If additional security of preventing tampering is needed', false)
  .action((secret, password, args) => {
    const stegcloak = new StegCloak(!args.nocrypt,args.integrity)
    const cover = args.clip ? clipboardy.readSync() : args.cover ? args.cover : 'This is a confidential text.'
    const payload = stegcloak.hide(secret, password, cover)
    clipboardy.writeSync(payload)
    console.log(color.grey('Copied to clipboard'))
  })

program
  .command('reveal <password>')
  .option('-cp, --clip', 'Copy Data directly from clipboard')
  .option('-d, --data <data>', 'Data to be decrypted')
  .action((password, args) => {
    const stegcloak = new StegCloak()
    let payload
    if (args.clip) { payload = clipboardy.readSync() } else if (args.data) { payload = args.data } else { console.log('Missing Data!'); return }
    const secret = stegcloak.reveal(payload, password)
    console.log('Secret: '.blue + color.green(secret))
  })

program.parse(process.argv)
