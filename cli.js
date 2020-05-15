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
const { zwcHuffMan } = require('./components/compact')
const { expand } = zwcHuffMan(StegCloak.zwc)

function cliHide (secret, password, cover, crypt, integrity, op) {
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
    console.log('\n')
    console.log(chalk.grey('\nCopied to clipboard\n'))
    process.exit(0)
  }, 300)
};

function createStringQuestion (str, nameIt) {
  return { type: 'string', message: str, name: nameIt }
}

function cliReveal (payload, password, op) {
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

const detach = (str, zwc, invisible = true) => {
  const payload = str.split(' ')[1]
  const zwcBound = payload.split('')
  const intersection = R.intersection(zwc, zwcBound)
  if (intersection.length === 0) {
    throw new Error('Invisible stream not detected ! Please copy paste the stegcloak text sent by the sender')
  };
  const limit = zwcBound.findIndex((x, i) => !(~zwc.indexOf(x)))

  const zwcStream = payload.slice(0, limit)

  const cleanedMessage = str.split(' ')[0] + (' ' + payload.slice(limit)) + str.split(' ').slice(2).join(' ')

  if (invisible) {
    return zwcStream
  } else {
    return cleanedMessage
  }
}

program
  .command('hide [secret] [cover]')
  .option('-f, --file <file> ', 'Extract input from file')
  .option('-n, --nocrypt', "If you don't need encryption", false)
  .option('-i, --integrity', 'If additional security of preventing tampering is needed', false)
  .option('-o, --output <output> ', 'Stream the results to an output file')
  .action(async (secret, cover, args) => {
    console.log('\n')
    const questions = [{
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }]

    const qsecret = "What's your secret? :"

    const qcover = 'Enter the text you want to hide your secret within? (Minimum 2 words):'

    if (args.nocrypt) questions.pop()

    if (args.file) {
      var fileData = fs.readFileSync(args.file, 'utf-8')
      var { fileChoice } = await inquirer.prompt([{ type: 'list', message: `Use data from ${args.file} as secret or cover text?`, name: 'fileChoice', choices: [new inquirer.Separator("== What's your decision ?=="), 'Secret', 'Cover text'] }])
      if (fileChoice === 'Secret') {
        secret = fileData
      } else {
        cover = fileData
      }
    }

    if (!secret && !cover) {
      questions.push(createStringQuestion(qsecret, 'secret'), createStringQuestion(qcover, 'cover'))
    } else if (!secret) {
      questions.push(createStringQuestion(qsecret, 'secret'))
    } else if (!cover) {
      questions.push(createStringQuestion(qcover, 'cover'))
    }

    const answers = await inquirer.prompt(questions)
    cliHide(answers.secret || secret, answers.password, cover || answers.cover, !args.nocrypt, args.integrity, args.output)
  })

// CLI

program
  .command('reveal [data]')
  .option('-f, --file <file> ', 'Extract input from file')
  .option('-cp, --clip', 'Copy Data directly from clipboard')
  .option('-o, --output <output> ', 'Stream the secret to an output file')
  .action((data, args) => {
    console.log('\n')

    const questions = [{ type: 'string', message: 'Enter data to decrypt :', name: 'payload' }, {
      type: 'password',
      message: 'Enter password :',
      name: 'password',
      mask: true
    }]

    if (args.file) {
      data = fs.readFileSync(args.file, 'utf-8')
      console.log(chalk.cyan(`Extracted text from ${args.file} to be decrypted !`))
      console.log()
    }

    if (args.clip || data) {
      const mutatedQuestions = questions.slice(1)

      data = data || clipboardy.readSync()

      const stream = expand(detach(data, StegCloak.zwc))

      if (stream[0] === StegCloak.zwc[2]) {
        mutatedQuestions.pop()
      }

      if (mutatedQuestions.length) {
        inquirer.prompt(mutatedQuestions).then(answers => {
          cliReveal(data, answers.password, args.output)
        })
      } else {
        cliReveal(data, null, args.output)
      }
    } else {
      inquirer.prompt([questions[0]]).then(answers => {
        const stream = expand(detach(answers.payload, StegCloak.zwc))

        if (stream[0] === StegCloak.zwc[2]) {
          cliReveal(answers.payload, null, args.output)
        } else {
          inquirer.prompt([questions[1]]).then(ans => {
            cliReveal(answers.payload, ans.password, args.output)
          })
        }
      })
    }
  })

program.parse(process.argv)
