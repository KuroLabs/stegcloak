"use strict";

const {
  pipe,
  intersection,
  indexOf,
  curry,
  __,
  slice,
  split,
  join,
  map,
} = require("ramda");

const { zeroPad, nTobin, stepMap, binToByte } = require("./util.js");

const zwcOperations = (zwc) => {
  // Map binary to ZWC

  const _binToZWC = (str) => zwc[parseInt(str, 2)];

  // Map ZWC to binary
  const _ZWCTobin = pipe(indexOf(__, zwc), nTobin, zeroPad(2));

  // Data to ZWC hidden string

  const _dataToZWC = (integrity, crypt, str) => {
    const flag = integrity && crypt ? zwc[0] : crypt ? zwc[1] : zwc[2];
    return (
      flag +
      stepMap((x, i) => _binToZWC(str[i] + str[i + 1]))(
        2,
        new Array(str.length).fill()
      ).join("")
    ); // Binary to zwc conversion)
  };

  // Check if encryption or hmac integrity check was performed during encryption

  const flagDetector = (x) => {
    const i = zwc.indexOf(x[0]);
    if (i === 0) {
      return {
        encrypt: true,
        integrity: true,
      };
    } else if (i === 1) {
      return {
        encrypt: true,
        integrity: false,
      };
    } else if (i === 2) {
      return {
        encrypt: false,
        integrity: false,
      };
    }
  };

  // Message curried functions

  const toConcealHmac = curry(_dataToZWC)(true)(true);

  const toConceal = curry(_dataToZWC)(false)(true);

  const noCrypt = curry(_dataToZWC)(false)(false);

  // ZWC string to data
  const concealToData = (str) => {
    const { encrypt, integrity } = flagDetector(str);
    return {
      encrypt,
      integrity,
      data: pipe(
        slice(1, Infinity),
        split(""),
        map(_ZWCTobin),
        join(""),
        binToByte
      )(str),
    };
  };

  const detach = (str) => {
    const payload = str.split(" ")[1];
    const zwcBound = payload.split("");
    const intersected = intersection(zwc, zwcBound);
    if (intersected.length === 0) {
      throw new Error(
        "Invisible stream not detected ! Please copy paste the stegcloak text sent by the sender"
      );
    }
    const limit = zwcBound.findIndex((x, i) => !~zwc.indexOf(x));
    return payload.slice(0, limit);
  };

  return {
    detach,
    concealToData,
    toConcealHmac,
    toConceal,
    noCrypt,
  };
};

// Embed invisble stream to cover text

const embed = (cover, secret) => {
  const arr = cover.split(" ");
  return [arr[0]]
    .concat([secret + arr[1]])
    .concat(arr.slice(2, arr.length))
    .join(" ");
};

module.exports = {
  zwcOperations,
  embed,
};
