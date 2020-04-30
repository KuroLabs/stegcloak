const Buffer = require('safe-buffer').Buffer
const R = require('ramda')

// Compliment an array
const _not = x => x.map(y => ~y)

// Slice a buffer
const buffSlice = (x, y, z = x.length) => toBuffer(byarr(x).slice(y, z))

// Convert to byte array and apply complement
const compliment = x => _not(byarr(x))

// Map in steps along with closure over the passed input
const stepMap = R.curry((callback, step, array) => {
  return array.slice().map((d, i, array) => {
    if (i % step === 0) {
      return callback(d, i, array)
    }
  }).filter((d, i) => i % step === 0)
})

// Concatenate buffers
const concatBuff = x => Buffer.concat(x)

// convert byte array to buffer
const toBuffer = x => Buffer.from(x)

// convert buffer to byte array
const byarr = x => Uint8Array.from(x)

// Number to Binary String conversion
const nTobin = x => x.toString(2)

// Byte array to Binary String conversion
const byteToBin = R.compose(R.join(''), R.map(y => zeroPad(nTobin(y), 8)), Array.from)

// Binary String to Byte Array conversion
const binToByte = str => {
  var arr = []
  for (let i = 0; i < str.length; i += 8) {
    arr.push(str.slice(i, i + 8))
  }
  return new Uint8Array(arr.map(x => parseInt(x, 2)))
}

// Pad with zeroes to get required length
const zeroPad = (num, x) => {
  var zero = ''
  for (let i = 0; i < x; i++) {
    zero += '0'
  }
  return zero.slice(String(num).length) + num
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
