'use strict'

const Buffer = require('safe-buffer').Buffer

const {
  map,
  join,
  pipe,
  slice,
  curry,
  flip,
  dropLast,
  isEmpty,
  takeLast
} = require('ramda')

// Compliment an array
const _not = x => ~x;

// Slice a buffer
const buffSlice = (x, y, z = x.length) => pipe(byarr, slice(y, z), toBuffer)(x);

// Concatenate buffers
const concatBuff = Buffer.concat

// convert byte array to buffer
const toBuffer = Buffer.from

// convert buffer to byte array
const byarr = x => Uint8Array.from(x) // Cannot be point-free since Uint8Array.from() needs to be bound to its prototype

// Number to Binary String conversion
const nTobin = x => x.toString(2)


// Convert to byte array and apply complement

const compliment = pipe(byarr, map(_not));

// Map in steps along with closure over the passed input
const stepMap = curry((callback, step, array) => {
  return array.slice().map((d, i, array) => {
    if (i % step === 0) {
      return callback(d, i, array)
    }
  }).filter((d, i) => i % step === 0)
});




// Pure recursive regular expression replace

const recursiveReplace = (data, patternArray, replaceArray) => {
  if (isEmpty(patternArray) && isEmpty(replaceArray)) {
    return data;
  }
  const [pattern] = takeLast(1, patternArray);
  const [replaceTo] = takeLast(1, replaceArray);
  data = data.replace(new RegExp(pattern, 'g'), replaceTo);
  return recursiveReplace(data, dropLast(1, patternArray), dropLast(1, replaceArray));
}


// Pad with zeroes to get required length
const zeroPad = curry((x, num) => {
  var zero = '';
  for (let i = 0; i < x; i++) {
    zero += '0';
  }
  return zero.slice(String(num).length) + num;
});

// Byte array to Binary String conversion
const byteToBin = pipe(
  Array.from,
  map(nTobin),
  map(zeroPad(8)),
  join(''),
);


// Binary String to Byte Array conversion
const binToByte = (str) => {
  var arr = [];
  for (let i = 0; i < str.length; i += 8) {
    arr.push(
      pipe(slice(i, i + 8), flip(parseInt)(2))(str)
    );
  }
  return new Uint8Array(arr);
};





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
  stepMap,
  recursiveReplace,
}