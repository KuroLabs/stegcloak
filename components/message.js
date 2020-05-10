'use strict'

const R = require('ramda')
const {
  zeroPad,
  nTobin,
  stepMap,
  binToByte
} = require('./util.js')

const zwc = ['‌', '⁣', '‍', '⁤','⁢','᠎'] // 00-200C, 01-2063, 10-200D, 11-2064,2062,180e Where the magic happens !

// Map binary to ZWC
const _binToZWC = str => zwc[parseInt(str, 2)]

const tableMap = [zwc[0]+zwc[1],zwc[0]+zwc[2],zwc[0]+zwc[3],zwc[1]+zwc[2],zwc[1]+zwc[3],zwc[2]+zwc[3]]

const getTableZWC = (zwc1,zwc2) => zwc[tableMap.indexOf(zwc1+zwc2)] //zwc1 A,B => C

const extractTableZWC = zwc1 => tableMap[zwc.indexOf(zwc1)].split('') //zwc1,zwc2 C => A,B

// (ZWC1,ZWC2) ==getTableZWC==> ZWCNEW || secret = ZWCNEW + secret.replace(new RegExp(ZWC1+ZWC1,'g'),zwc[4]).replace(new RegExp(ZWC2+ZWC2,'g'),zwc[5])
// payload[0]=ZWCNEW ==extractTableZWC==>ZWC1,ZWC2 || payload.slice(1, limit).replace(new RegExp(zwc[4],'g'),ZWC1+ZWC1).replace(new RegExp(zwc[5],'g'),ZWC2+ZWC2)


// Map ZWC to binary
const _ZWCTobin = inp => zeroPad(nTobin(zwc.indexOf(inp)), 2)

// Data to ZWC hidden string
const _dataToZWC = (integrity, crypt, str) => {
  const flag = integrity && crypt ? zwc[0] : crypt ? zwc[1] : zwc[2]
  return flag + stepMap((x, i) => _binToZWC(str[i] + str[i + 1]))(2, new Array(str.length).fill()).join('') // Binary to zwc conversion)
}

// Check if encryption or hmac integrity check was performed during encryption

const flagDetector = x => {
  const i = zwc.indexOf(x[0])
  if (i === 0) { return { encrypt: true, integrity: true } } else if (i === 1) { return { encrypt: true, integrity: false } } else if (i === 2) { return { encrypt: false, integrity: false } }
}

// Message curried functions

const toConcealHmac = R.curry(_dataToZWC)(true)(true)

const toConceal = R.curry(_dataToZWC)(false)(true)

const noCrypt = R.curry(_dataToZWC)(false)(false)

// ZWC string to data
const concealToData = (str) => {
  const { encrypt, integrity } = flagDetector(str)
  return { encrypt, integrity, data: binToByte(str.slice(1).split('').map(x => _ZWCTobin(x)).join('')) }
}

// Embed invisble stream to cover text

const embed = (cover, secret) => {
  const arr = cover.split(' ')
  // console.log(secret.length)
  secret = secret.replace(new RegExp(zwc[0]+zwc[0],'g'),zwc[4]).replace(new RegExp(zwc[3]+zwc[3],'g'),zwc[5])
  // console.log(secret.length);
  return [arr[0]].concat([secret + arr[1]]).concat(arr.slice(2, arr.length)).join(' ')
}

// Detach invisble stream from cover text

const detach = (str) => {
  const payload = str.split(' ')[1]
  const zwcBound = payload.split('')
  const intersection = R.intersection(zwc, zwcBound)
  if (intersection.length === 0) { throw new Error('Invisible stream not detected ! Please copy paste the stegcloak text sent by the sender') };
  const limit = zwcBound.findIndex((x, i) => !(~zwc.indexOf(x)))
  return payload.slice(0, limit).replace(new RegExp(zwc[4],'g'),zwc[0]+zwc[0]).replace(new RegExp(zwc[5],'g'),zwc[3]+zwc[3])
}

module.exports = {
  embed,
  detach,
  concealToData,
  toConcealHmac,
  toConceal,
  noCrypt
}
