const crypto = require('crypto');
const R = require('ramda');
const timeSafeCheck = require('timing-safe-equal');
const {
    buff,
    concat_buff,
    buff_slice
} = require('./util.js');


//Key generation from a password

const _genKey = (password, salt) => crypto.pbkdf2Sync(password, salt, 100000, 48, 'sha512');

// Aes stream cipher with random salt and iv -> encrypt an array -- input {password,data,integrity:bool} 

const encrypt = config => { //Impure function Side-effects!
    const salt = crypto.randomBytes(16);
    const {
        iv,
        key,
        secret
    } = _bootEncrypt(config, salt);
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const payload = concat_buff([cipher.update(secret, 'utf8'), cipher.final()])
    if (config.integrity) {
        const hmac = crypto.createHmac('sha256', key).update(secret).digest();
        return concat_buff([salt, hmac, payload]);
    }
    return concat_buff([salt, payload]);
}


const decrypt = (config) => {
    const {
        iv,
        key,
        secret,
        hmac_data
    } = _bootDecrypt(config, null);
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    const decrypted = concat_buff([decipher.update(secret, 'utf8'), decipher.final()]);
    if (config.integrity) {
        const v_hmac = crypto.createHmac('sha256', key).update(secret).digest();
        if (timeSafeCheck(hmac_data, v_hmac)) {
            return 'HMAC_assertion_failed';
        }
    }
    return decrypted;
}

//Extracting parameters for encrypt/decrypt from provided input

const _extract = (mode, config, salt) => {

    const data = buff(config.data);
    const output = {};

    if (mode === 'encrypt') {
        output.secret = data;
    } else if (mode === 'decrypt') {
        salt = buff_slice(data, 0, 16);
        if (config.integrity) {
            output.hmac_data = buff_slice(data, 16, 48);
            output.secret = buff_slice(data, 48);
        } else {
            output.secret = buff_slice(data, 16)
        }
    }

    const iv_key = _genKey(config.password, salt);
    output.iv = buff_slice(iv_key, 0, 16);
    output.key = buff_slice(iv_key, 16);
    return output;
}

//Encryption/Decryption curried functions

const _bootEncrypt = R.curry(_extract)('encrypt');


const _bootDecrypt = R.curry(_extract)('decrypt');


module.exports = {
    encrypt,
    decrypt
}