'use strict'

const Buffer = require('safe-buffer').Buffer

const R = require('ramda')

// Compliment an array
const _not = x => x.map(y => ~y)

// convert buffer to byte array
const byarr = Uint8Array.from

// Slice a buffer
const buffSlice = (x, y, z = x.length) => R.compose(toBuffer, R.slice(y, z), byarr)

// Convert to byte array and apply complement
const compliment = R.compose(_not, byarr);

// Map in steps along with closure over the passed input
const stepMap = R.curry((callback, step, array) => {
  return array.map((d, i, array) => {
    if (i % step === 0) {
      return callback(d, i, array)
    }
  }).filter((d, i) => i % step === 0)
})

// Concatenate buffers
const concatBuff = Buffer.concat

// convert byte array to buffer
const toBuffer = Buffer.from

// Pad with zeroes to get required length
const zeroPad = R.curry((x, num) => {
  var zero = ''
  for (let i = 0; i < x; i++) {
    zero += '0'
  }
  return zero.slice(String(num).length) + num
})

// Number to Binary String conversion
const nTobin = x => x.toString(2)

// Byte array to Binary String conversion
const byteToBin = R.compose(R.join(''), R.map(zeroPad(8)), R.map(nTobin), Array.from)

// Binary String to Byte Array conversion
const binToByte = str => {
  var arr = []
  for (let i = 0; i < str.length; i += 8) {
    arr.push(
      R.compose(R.flip(parseInt)(2), R.slice(i, i + 8))(str)
    )
  }
  return new Uint8Array(arr)
}

module.exports = {
  toBuffer,
  byarr,
  compliment,
  byteToBin,
  nTobin,
  zeroPad,
  binToByte,
  concatBuff,
  buffSlice,
  stepMap
}