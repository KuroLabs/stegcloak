'use strict'

const R = require('ramda')
const {
  zeroPad,
  nTobin,
  stepMap,
  binToByte,findOptimal
} = require('./util.js');
const fs=require('fs');

const zwc = ["᠎", "‌", "‍", "⁢", "⁣", "⁤"] // 180e,200c,200d,2062,2063,2064 Where the magic happens !

// Map binary to ZWC

const _binToZWC = str => zwc[parseInt(str, 2)]

// Table functions

const tableMap = [zwc[0]+zwc[1],zwc[0]+zwc[2],zwc[0]+zwc[3],zwc[1]+zwc[2],zwc[1]+zwc[3],zwc[2]+zwc[3]];

const _getFlag = (zwc1,zwc2) => {console.log('+'+zwc[tableMap.indexOf(zwc1+zwc2)],tableMap.indexOf(zwc1+zwc2)); return zwc[tableMap.indexOf(zwc1+zwc2)]} // zwA,zwB => zwC

const _extractFlag = zwc1 => tableMap[zwc.indexOf(zwc1)].split('') // zwC => zwA,zwcB

const shrink = (repZWC,secret) =>{ return _getFlag(...repZWC) + secret.replace(new RegExp(repZWC[0]+repZWC[0],'g'),zwc[4]).replace(new RegExp(repZWC[1]+repZWC[1],'g'),zwc[5])};

const expand = (flag,secret) => {
  const repZWC=_extractFlag(flag);
  return secret.replace(new RegExp(zwc[4],'g'),repZWC[0]+repZWC[0]).replace(new RegExp(zwc[5],'g'),repZWC[1]+repZWC[1]);
}

// Map ZWC to binary

const _ZWCTobin = inp => zeroPad(nTobin(zwc.indexOf(inp)), 2);


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
  const arr = cover.split(' ');
  console.log("#",secret);
  console.log(secret.length);
  const repZWC = findOptimal(secret,zwc);
  secret = shrink(repZWC,secret);
  console.log(secret.length);
  fs.writeFileSync("bbfinal.txt",[arr[0]].concat([secret + arr[1]]).concat(arr.slice(2, arr.length)).join(' '));
  return [arr[0]].concat([secret + arr[1]]).concat(arr.slice(2, arr.length)).join(' ');
}

// Detach invisble stream from cover text

const detach = (str) => {
  const payload = str.split(' ')[1];
  const zwcBound = payload.split('');
  const intersection = R.intersection(zwc, zwcBound)
  if (intersection.length === 0) { throw new Error('Invisible stream not detected ! Please copy paste the stegcloak text sent by the sender') };
  const limit = zwcBound.findIndex((x, i) => !(~zwc.indexOf(x)));
  console.log(expand(payload[0],payload.slice(1,limit)).length)
  console.log('@'+expand(payload[0],payload.slice(1,limit))+'@');
  return expand(payload[0],payload.slice(1,limit));
};



module.exports = {
  embed,
  detach,
  concealToData,
  toConcealHmac,
  toConceal,
  noCrypt
}
