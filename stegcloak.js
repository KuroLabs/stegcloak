'use strict'

const R = require('ramda')

const { encrypt, decrypt } = require('./components/encrypt')

const { compress, decompress } = require('./components/compact')

const { embed, detach, toConceal, toConcealHmac, concealToData, noCrypt } = require('./components/message')

const { byteToBin, compliment } = require('./components/util')

class StegCloak {
  constructor (_encrypt = true, _integrity = false) {
    this.encrypt = _encrypt
    this.integrity = _integrity
  };

  hide (message, password, cover = 'This is a confidential text') {
    if (cover.split(' ').length === 1) { throw new Error('Minimum two words required') };

    const integrity = this.integrity

    const crypt = this.encrypt

    const secret = R.pipe(compress, compliment)(message) // Compress and compliment to prepare the secret

    const payload = crypt ? encrypt({ password: password, data: secret, integrity }) : secret // Encrypt if needed or proxy secret

    const invisibleStream = R.pipe(byteToBin, integrity && crypt ? toConcealHmac : crypt ? toConceal : noCrypt)(payload) // Create an invisible stream of secret

    return embed(cover, invisibleStream) // Embed stream  with cover text
  }

  reveal (str, password) {
    // Detach invisible characters and convert back to visible characters and also returns analysis of if encryption or integrity check was done

    const { data, integrity, encrypt } = R.pipe(detach, concealToData)(str);

    console.log(data,integrity,encrypt);

    const decryptStream = encrypt ? decrypt({ password, data, integrity }) : data // Decrypt if needed or proxy secret

    return R.pipe(compliment, decompress)(decryptStream) // Receive the secret
  }
}

module.exports = StegCloak
