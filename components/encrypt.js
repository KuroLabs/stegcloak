"use strict";

const aes = require("browserify-cipher");
const { createCipheriv, createDecipheriv } = aes;
const randomBytes = require("randombytes");
const pbkdf2Sync = require("pbkdf2").pbkdf2Sync;
const createHmac = require("create-hmac");
const { curry } = require("ramda");
const timeSafeCheck = require("timing-safe-equal");
const { toBuffer, concatBuff, buffSlice } = require("./util.js");

// Key generation from a password

const _genKey = (password, salt) =>
  pbkdf2Sync(password, salt, 10000, 48, "sha512");

// Aes stream cipher with random salt and iv -> encrypt an array -- input {password,data,integrity:bool}

const encrypt = (config) => {
  // Impure function Side-effects!
  const salt = randomBytes(8);
  const { iv, key, secret } = _bootEncrypt(config, salt);
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  const payload = concatBuff([cipher.update(secret, "utf8"), cipher.final()]);
  if (config.integrity) {
    const hmac = createHmac("sha256", key).update(secret).digest();
    return concatBuff([salt, hmac, payload]);
  }
  return concatBuff([salt, payload]);
};

const decrypt = (config) => {
  const { iv, key, secret, hmacData } = _bootDecrypt(config, null);
  const decipher = createDecipheriv("aes-256-ctr", key, iv);
  const decrypted = concatBuff([
    decipher.update(secret, "utf8"),
    decipher.final(),
  ]);
  if (config.integrity) {
    const vHmac = createHmac("sha256", key).update(decrypted).digest();
    if (!timeSafeCheck(hmacData, vHmac)) {
      throw new Error(
        "Wrong password or Wrong payload (Hmac Integrity failure) "
      );
    }
  }
  return decrypted;
};

// Extracting parameters for encrypt/decrypt from provided input

const _extract = (mode, config, salt) => {
  const data = toBuffer(config.data);
  const output = {};
  if (mode === "encrypt") {
    output.secret = data;
  } else if (mode === "decrypt") {
    salt = buffSlice(data, 0, 8);
    if (config.integrity) {
      output.hmacData = buffSlice(data, 8, 40);
      output.secret = buffSlice(data, 40);
    } else {
      output.secret = buffSlice(data, 8);
    }
  }

  const ivKey = _genKey(config.password, salt);
  output.iv = buffSlice(ivKey, 0, 16);
  output.key = buffSlice(ivKey, 16);
  return output;
};

// Encryption/Decryption curried functions

const _bootEncrypt = curry(_extract)("encrypt");

const _bootDecrypt = curry(_extract)("decrypt");

module.exports = {
  encrypt,
  decrypt,
};
