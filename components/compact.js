'use strict'

const R = require('ramda')

const lzutf8 = require('lzutf8')

const compress = x => lzutf8.compress(x, { outputEncoding: 'Buffer' })

// Curried decompress

const _lzutf8Decompress = R.curry(lzutf8.decompress)(R.__, { inputEncoding: 'Buffer', outputEncoding: 'String' })

// Decompress a buffer using LZ decompression
const decompress = R.pipe(Buffer.from, _lzutf8Decompress)

// returns optimal zwcs through RLE for 2nd level compression
const findOptimal = (secret,zwc) => {
    let dict = zwc.reduce((acc,data) => {
      acc[data] = {}
      return acc
    },{})
    const size = secret.length
    for (let j = 0; j < size ; j++) {
      let count = 1
      while(j < size && secret[j] == secret[j+1]){
        count++;
        j++;
      }
      if (count >= 2) {
        let itr = count
        while (itr >= 2) {
          dict[secret[j]][itr] = (dict[secret[j]][itr] || 0) + Math.floor(count/itr)*(itr-1)
          itr--
        }
      }
    }
    const getOptimal = []
    for (let key in dict) {
      for (let count in dict[key]) {
        getOptimal.push([key+count,dict[key][count]])
      }
    }
    getOptimal.sort((a,b) => {
      return b[1] - a[1]
    })
    const reqZwc = getOptimal.filter((val) => val[0][1] == '2').slice(0,2).map(zwc => zwc[0][0])
    return reqZwc.sort()
  }


module.exports = { compress, decompress, findOptimal }
