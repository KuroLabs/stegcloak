const R = require('ramda')

const { encrypt, decrypt } = require('./components/encrypt')

const { embed, detach, toConceal, toConcealHmac, concealToData, noCrypt } = require('./components/message')

const { compress, decompress } = require('./components/compact')

const { byteToBin, compliment } = require('./components/util')

class StegCloak {
  hide (data, integrity, crypt) {
    const { message, key, cover } = data

    const secret = R.pipe(compress, compliment)(message) // Compress and compliment to prepare the secret

    const payload = crypt ? encrypt({ password: key, data: secret, integrity }) : secret // Encrypt if needed or proxy secret

    const invisibleStream = R.pipe(byteToBin, integrity ? toConcealHmac : crypt ? toConceal : noCrypt)(payload) // Create an invisible stream of secret

    return embed(cover, invisibleStream) // Embed stream  with cover text
  }

  reveal (str, key) {
    // Detach invisible characters and convert back to visible characters and also returns analysis of if encryption or integrity check was done

    const { data, integrity, encrypt } = R.pipe(detach, concealToData)(str)

    const decryptStream = encrypt ? decrypt({ password: key, data, integrity }) : data // Decrypt if needed or proxy secret

    return R.pipe(compliment, decompress)(decryptStream) // Receive the secret
  }
}

module.exports = StegCloak
