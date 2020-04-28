const {program} = require('commander');
const {reveal,hide} = require('./stegcloak');
const color = require('colors');
const clipboardy = require('clipboardy');


program
  .command('hide <secret> <password>')
  .option('-c, --cover <covertext>')
  .option('-i, --integrity')
  .action((secret,password, args) => {
      let cover = (args.cover)?args.cover:"This is a confidential text.";
      let payload=hide(secret,password,cover,args.integrity);
      clipboardy.writeSync(payload);
      console.log('Copied to clipboard'.grey);
});

program
  .command('reveal <password>')
  .option('-cp, --clip')
  .option('-d, --data <data>')
  .action((password,args) => {
      if(args.clip){payload=clipboardy.readSync();}
      else if(args.data){payload=args.data}
      else{console.log("Missing Data!"); return}
      let secret = reveal(payload,password);
      console.log("Secret:".blue,secret.green);
  });

program.parse(process.argv);