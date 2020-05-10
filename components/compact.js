'use strict'

const R = require('ramda')

const lzutf8 = require('lzutf8')

const compress = x => lzutf8.compress(x, { outputEncoding: 'Buffer' })

// Curried decompress

const _lzutf8Decompress = R.curry(lzutf8.decompress)(R.__, { inputEncoding: 'Buffer', outputEncoding: 'String' })

// Decompress a buffer using LZ decompression
const decompress = R.pipe(Buffer.from, _lzutf8Decompress)

// returns optimal zwcs for 2nd level compression
const findOptimal = (secret,zwc) => {
    let rep = {}
    zwc.forEach((ele) => {
      rep[ele] = {}
    })
    console.log("Secret len",secret.length)
    let size = secret.length
    for (let j = 0; j<size ; j++) {
      let count = 1
      while(j<size && secret[j] == secret[j+1]){
        count ++;
        j++;
      }
      if (count >= 2) {
        let itr = count
        while (itr >= 2) {
          let points = Math.floor(count/itr)*(itr-1)
          if (rep[secret[j]][itr]) {
            rep[secret[j]][itr] += points
          } else {
            rep[secret[j]][itr] = points
          }
          itr--
        }
      }
    }
    let getMax = []
    for (let key in rep) {
      for (let reps in rep[key]) {
        getMax.push([key+reps,rep[key][reps]])
      }
    }
    getMax.sort((a,b) => {
      return b[1] - a[1]
    })
    console.log('reduce secret len:',getMax)
    let res = []
    for (let val of getMax) {   
      if (val[0][1] == '2') {
        res.push(val[0][0])
        if (res.length == 2)
          break
      }   
    }
    res.sort()
    return res
  }


module.exports = { compress, decompress, findOptimal }
