#!/usr/bin/env node
'use strict'

const {
  program
} = require('commander');
const StegCloak = require('./stegcloak');
const chalk = require('chalk');
const clipboardy = require('clipboardy');
var inquirer = require('inquirer');
const ora = require('ora');
const fs=require('fs');


program
  .command('hide [secret] [cover]')
  .option('-f, --file <file> ', "Extract input from file")
  .option('-n, --nocrypt', "If you don't need encryption", false)
  .option('-i, --integrity', 'If additional security of preventing tampering is needed', false)
  .option('-o, --output <output> ', "Extract results to output file")
  .action(async (secret,cover, args) => {
    console.log('\n');
    let questions = [{
      type: 'password',
      message: "Enter password :",
      name: 'password',
      mask: true
    }];

    let qsecret="What's your secret? :";

    let qcover="Enter the text you want to hide your secret within? (Minimum 2 words):";
   
    if(args.file){
      var fileData=fs.readFileSync(args.file,'utf-8');
      var {fileChoice} = await inquirer.prompt([{type:'list',message:`Use data from ${args.file} as secret or cover text?`,name:"fileChoice",choices:[new inquirer.Separator("== What's your decision ?=="),"Secret","Cover text"]}]);
      if(fileChoice==="Secret"){
        secret=fileData;
      }else{
        cover=fileData;
      }
    }

    if(!secret && !cover){
      questions.push(createStringQuestion(qsecret,'secret'),createStringQuestion(qcover,'cover'));
    }else if(!secret){
      questions.push(createStringQuestion(qsecret,'secret'));
    }else if(!cover){
      questions.push(createStringQuestion(qcover,'cover'));
    }

     const answers= await inquirer.prompt(questions)
    cliHide(answers.secret || secret, answers.password, cover || answers.cover, !args.nocrypt, args.integrity,args.output);
      
  });


program
  .command('reveal [data]')
  .option('-f, --file <file> ', "Extract input from file")
  .option('-cp, --clip', 'Copy Data directly from clipboard')
  .option('-o, --output <output> ', "Output file that secret will be extracted to")
  .action((data, args) => {
    console.log('\n');
    const questions=[{
      type: 'password',
      message: "Enter password :",
      name: 'password',
      mask: true
    },{type:'string',message:"Enter data to decrypt :",name:'payload'}];

    if(args.file){
     data=fs.readFileSync(args.file,'utf-8');
     console.log(chalk.cyan(`Extracted text from ${args.file} to be decrypted !`));
     console.log();
    }

    if (args.clip || data) {
      inquirer.prompt([questions[0]]).then(answers=>{
      cliReveal(data || clipboardy.readSync(),answers.password,args.output);
      });
    } else {
        inquirer.prompt(questions).then(answers=>{
          cliReveal(answers.payload,answers.password,args.output);
        })
    }
  });

program.parse(process.argv)



function cliHide(secret, password, cover, crypt, integrity,op) {
  const stegcloak = new StegCloak(crypt, integrity);
  const spinner=ora(chalk.cyan.bold("Hiding your text"));
  spinner.start();

  const payload=stegcloak.hide(secret, password, cover,op);
  clipboardy.writeSync(payload);
  setTimeout(() => {
    spinner.stop();
    if(op){
      fs.writeFileSync(op,secret);
      console.log(chalk.grey(`\n Written to ${op} \n`));
      process.exit(0);
    }
    console.log('\n');
    console.log(payload);
    console.log(chalk.grey('\nCopied to clipboard\n'));
    process.exit(0);
  },300);
};

function createStringQuestion(str,nameIt){
  return {type:'string',message:str,name:nameIt}
}


function cliReveal(payload,password,op) {
  const stegcloak = new StegCloak();
  var spinner=ora(chalk.cyan.bold("Decrypting"));
  spinner.start();
  const secret = stegcloak.reveal(payload, password);
  setTimeout(() => {
    spinner.stop();
    if(op){
      fs.writeFileSync(op,secret);
      console.log(chalk.grey(`\n Written to ${op} \n`));
    }
    console.log('\n');
    console.log(chalk.cyan.bold('         Secret: ') + chalk.green.bold(secret));
    console.log('\n');
    process.exit(0);
  },300);
};



