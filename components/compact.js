'use strict'

const R = require('ramda')

const lzutf8 = require('lzutf8')

const compress = x => lzutf8.compress(x, {
  outputEncoding: 'Buffer'
})

// Curried decompress

const _lzutf8Decompress = R.curry(lzutf8.decompress)(R.__, {
  inputEncoding: 'Buffer',
  outputEncoding: 'String'
})

// Decompress a buffer using LZ decompression
const decompress = R.pipe(Buffer.from, _lzutf8Decompress)

// Builds a ranking table and filters the two characters that can be compressed that yield good results

const findOptimal = (secret, characters) => {
  const dict = characters.reduce((acc, data) => {
    acc[data] = {}
    return acc
  }, {})
  const size = secret.length
  for (let j = 0; j < size; j++) {
    let count = 1
    while (j < size && secret[j] === secret[j + 1]) {
      count++
      j++
    }
    if (count >= 2) {
      let itr = count
      while (itr >= 2) {
        dict[secret[j]][itr] = (dict[secret[j]][itr] || 0) + Math.floor(count / itr) * (itr - 1)
        itr--
      }
    }
  }
  const getOptimal = []
  for (const key in dict) {
    for (const count in dict[key]) {
      getOptimal.push([key + count, dict[key][count]])
    }
  }
  const rankedTable = R.sort((a, b) => b[1] - a[1], getOptimal)

  let reqZwc = rankedTable.filter((val) => val[0][1] === '2').slice(0, 3).map(chars => chars[0][0])

  if (reqZwc.length !== 3) {
    reqZwc = reqZwc.concat(R.difference(characters, reqZwc).slice(0, 3 - reqZwc.length))
  }

  return reqZwc.slice().sort()
}

const zwcHuffMan = (zwc) => {
  const tableMap = [zwc[0] + zwc[1] + zwc[2], zwc[0] + zwc[1] + zwc[3], zwc[0] + zwc[2] + zwc[3], zwc[1] + zwc[2] + zwc[3]]

  const _getCompressFlag = (zwc1, zwc2, zwc3) => zwc[tableMap.indexOf(zwc1 + zwc2 + zwc3)] // zwA,zwB,zwcC => zwD

  const _extractCompressFlag = zwc1 => tableMap[zwc.indexOf(zwc1)].split('') // zwcD => zwA,zwcB,zwcC

  const shrink = (secret) => {
    const repeatChars = findOptimal(secret, zwc.slice(0,4))

    return _getCompressFlag(...repeatChars) + secret.replace(new RegExp(repeatChars[0] + repeatChars[0], 'g'), zwc[4]).replace(new RegExp(repeatChars[1] + repeatChars[1], 'g'), zwc[5]).replace(new RegExp(repeatChars[2] + repeatChars[2], 'g'), zwc[6])
  }

  const expand = (secret) => {
    const flag = secret[0]
    const invisibleStream = secret.slice(1)
    const repeatChars = _extractCompressFlag(flag)
    return invisibleStream.replace(new RegExp(zwc[4], 'g'), repeatChars[0] + repeatChars[0]).replace(new RegExp(zwc[5], 'g'), repeatChars[1] + repeatChars[1]).replace(new RegExp(zwc[6], 'g'), repeatChars[2] + repeatChars[2])
  }

  return {
    shrink,
    expand
  }
}

module.exports = {
  compress,
  decompress,
  zwcHuffMan
}
