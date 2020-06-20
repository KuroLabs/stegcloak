#!/usr/bin/env node
'use strict'

// CLI TOOL Full of sideffects !

const {
  program
} = require('commander')
const StegCloak = require('./stegcloak')
const R = require('ramda')
const chalk = require('chalk')
const clipboardy = require('clipboardy')
var inquirer = require('inquirer')
const ora = require('ora')
const fs = require('fs')
const jsonfile = require('jsonfile');
const { zwcHuffMan } = require('./components/compact')
const { zwcOperations } = require("./components/message");
const { expand } = zwcHuffMan(StegCloak.zwc)
const { detach } = zwcOperations(StegCloak.zwc);


function cliHide(secret, password, cover, crypt, integrity, op) {
  const stegcloak = new StegCloak(crypt, integrity)
  const spinner = ora(chalk.cyan.bold('Hiding your text'))
  spinner.start()
  let payload
  try {
    payload = stegcloak.hide(secret, password, cover, op)
  } catch (e) {
    console.log('\n')
    console.log(chalk.red(e))
    process.exit(0)
  }
  clipboardy.writeSync(payload)
  setTimeout(() => {
    spinner.stop()
    if (op) {
      fs.writeFileSync(op, payload)
      console.log(chalk.grey(`\n Written to ${op} \n`))
      process.exit(0)
    }
    console.log(chalk.grey('\nCopied to clipboard\n'))
    process.exit(0)
  }, 300)
};

function createStringQuestion(str, nameIt) {
  return { type: 'string', message: str, name: nameIt }
}

function cliReveal(payload, password, op) {
  const stegcloak = new StegCloak()
  var spinner = ora(chalk.cyan.bold('Decrypting'))
  spinner.start()
  let secret
  try {
    secret = stegcloak.reveal(payload, password)
  } catch (e) {
    console.log('\n')
    console.log(chalk.red(e))
    process.exit(0)
  }
  setTimeout(() => {
    spinner.stop()
    if (op) {
      fs.writeFileSync(op, secret)
      console.log(chalk.grey(`\n Written to ${op} \n`))
    }
    console.log('\n')
    console.log(chalk.cyan.bold('         Secret: ') + chalk.green.bold(secret))
    console.log('\n')
    process.exit(0)
  }, 300)
};

program
  .command('hide [secret] [cover]')
  .option('-fc, --fcover <fcover> ', 'Extract cover text from file')
  .option('-fs, --fsecret <fsecret> ', 'Extract secret text from file')
  .option('-n, --nocrypt', "If you don't need encryption", false)
  .option('-i, --integrity', 'If additional security of preventing tampering is needed', false)
  .option('-o, --output <output> ', 'Stream the results to an output file')
  .option('-c, --config <config>', 'Config file')
  .action(async (secret, cover, args) => {
    if (args.config) {
      jsonfile.readFile(args.config)
        .then(obj => {
          if (!("secret" in obj && "cover" in obj)) {
            console.error(chalk.red("Config Parse error") + " : Missing inputs");
            process.exit(0);
          }
          secret = obj.secret;
          cover = obj.cover;
          let password = obj.password || process.env["STEGCLOAK_PASSWORD"];
          if (!obj.password && process.env["STEGCLOAK_PASSWORD"]) {
            console.warn(chalk.yellow("Warning:") + " using password from environment variable");
          }
          let integrity = obj.integrity || false;
          let nocrypt = obj.nocrypt || false;
          let output = obj.output || false;
          cliHide(secret, password, cover, !nocrypt, integrity, output);
        })
        .catch(error => console.error(error))
      return;
    }

    const questions = process.env["STEGCLOAK_PASSWORD"] ? (console.warn(chalk.yellow("Warning:") + " using password from environment variable\n"), []) : [{
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }];

    const qsecret = "What's your secret? :"

    const qcover = 'Enter the text you want to hide your secret within? (Minimum 2 words):'

    if (args.nocrypt) questions.pop()

    if (args.fcover) {
      cover = fs.readFileSync(args.fcover, 'utf-8');
    }

    if (args.fsecret) {
      secret = fs.readFileSync(args.fsecret, 'utf-8')
    }

    if (!secret && !cover) {
      questions.push(createStringQuestion(qsecret, 'secret'), createStringQuestion(qcover, 'cover'))
    } else if (!secret) {
      questions.push(createStringQuestion(qsecret, 'secret'))
    } else if (!cover) {
      questions.push(createStringQuestion(qcover, 'cover'))
    }
    let answers = {};
    if (questions.length) {
      answers = await inquirer.prompt(questions);
    }
    cliHide(answers.secret || secret, answers.password || process.env["STEGCLOAK_PASSWORD"], cover || answers.cover, !args.nocrypt, args.integrity, args.output)
  })

// CLI

program
  .command('reveal [message]')
  .option('-f, --file <file> ', 'Extract message to be revealed from file')
  .option('-cp, --clip', 'Copy message directly from clipboard')
  .option('-o, --output <output> ', 'Stream the secret to an output file')
  .option('-c, --config <config>', 'Config file')
  .action((data, args) => {

    if (args.config) {
      jsonfile.readFile(args.config)
        .then(obj => {
          if (!("message" in obj)) {
            console.error(chalk.red("Config Parse error") + " : Missing inputs");
            process.exit(0);
          }
          data = obj.message;
          if (!obj.password && process.env["STEGCLOAK_PASSWORD"]) {
            console.warn(chalk.yellow("Warning:") + " using password from environment variable");
          }
          let password = obj.password || process.env["STEGCLOAK_PASSWORD"];
          let output = obj.output || false;
          cliReveal(data, password, output)
        })
        .catch(error => console.error(error));
      return;
    }

    const questions = [{ type: 'string', message: 'Enter message to decrypt:', name: 'payload' }, {
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }];


    if (args.file) {
      data = fs.readFileSync(args.file, 'utf-8')
      console.log(chalk.cyan(`Extracted text from ${args.file} to be decrypted !`))
      console.log()
    }

    if (args.clip || data) {
      const mutatedQuestions = questions.slice(1)

      data = data || clipboardy.readSync()

      const stream = expand(detach(data))

      if (stream[0] === StegCloak.zwc[2] || process.env["STEGCLOAK_PASSWORD"]) {
        if (process.env["STEGCLOAK_PASSWORD"]) {
          console.warn(chalk.yellow("Warning:") + " using password from environment variable");
        }
        mutatedQuestions.pop()
      }

      if (mutatedQuestions.length) {
        inquirer.prompt(mutatedQuestions).then(answers => {
          cliReveal(data, answers.password || process.env["STEGCLOAK_PASSWORD"], args.output)
        })
      } else {
        cliReveal(data, process.env["STEGCLOAK_PASSWORD"] || null, args.output)
      }
    }

    else {
      inquirer.prompt([questions[0]]).then(answers => {
        const stream = expand(detach(answers.payload))

        if (stream[0] === StegCloak.zwc[2]) {
          cliReveal(answers.payload, null, args.output)
        } else {
          if (!process.env["STEGCLOAK_PASSWORD"]) {
            inquirer.prompt([questions[1]]).then(ans => {
              cliReveal(answers.payload, ans.password, args.output)
            })
          } else {
            cliReveal(answers.payload, process.env["STEGCLOAK_PASSWORD"], args.output)
          }

        }
      })
    }
  })

program.parse(process.argv)
