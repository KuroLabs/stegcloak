"use strict";

const { pipe, curry, sort, difference, __ } = require("ramda");

const { recursiveReplace } = require("./util");

const lzutf8 = require("lzutf8");

const compress = (x) =>
  lzutf8.compress(x, {
    outputEncoding: "Buffer",
  });

// Curried decompress

const _lzutf8Decompress = curry(lzutf8.decompress)(__, {
  inputEncoding: "Buffer",
  outputEncoding: "String",
});

// Decompress a buffer using LZ decompression
const decompress = pipe(Buffer.from, _lzutf8Decompress);

// Builds a ranking table and filters the two characters that can be compressed that yield good results

const findOptimal = (secret, characters) => {
  const dict = characters.reduce((acc, data) => {
    acc[data] = {};
    return acc;
  }, {});
  const size = secret.length;
  for (let j = 0; j < size; j++) {
    let count = 1;
    while (j < size && secret[j] === secret[j + 1]) {
      count++;
      j++;
    }
    if (count >= 2) {
      let itr = count;
      while (itr >= 2) {
        dict[secret[j]][itr] =
          (dict[secret[j]][itr] || 0) + Math.floor(count / itr) * (itr - 1);
        itr--;
      }
    }
  }
  const getOptimal = [];
  for (const key in dict) {
    for (const count in dict[key]) {
      getOptimal.push([key + count, dict[key][count]]);
    }
  }
  const rankedTable = sort((a, b) => b[1] - a[1], getOptimal);

  let reqZwc = rankedTable
    .filter((val) => val[0][1] === "2")
    .slice(0, 3)
    .map((chars) => chars[0][0]);

  if (reqZwc.length !== 3) {
    reqZwc = reqZwc.concat(
      difference(characters, reqZwc).slice(0, 3 - reqZwc.length)
    );
  }

  return reqZwc.slice().sort();
};

const zwcHuffMan = (zwc) => {
  const tableMap = [
    zwc[0] + zwc[1] + zwc[2],
    zwc[0] + zwc[1] + zwc[3],
    zwc[0] + zwc[2] + zwc[3],
    zwc[1] + zwc[2] + zwc[3],
  ];

  const _getCompressFlag = (zwc1, zwc2, zwc3) =>
    zwc[tableMap.indexOf(zwc1 + zwc2 + zwc3)]; // zwA,zwB,zwcC => zwD

  const _extractCompressFlag = (zwc1) => tableMap[zwc.indexOf(zwc1)].split(""); // zwcD => zwA,zwcB,zwcC

  const shrink = (secret) => {
    const repeatChars = findOptimal(secret, zwc.slice(0, 4));
    return (
      _getCompressFlag(...repeatChars) +
      recursiveReplace(
        secret,
        repeatChars.map((x) => x + x),
        [zwc[4], zwc[5], zwc[6]]
      )
    );
  };

  const expand = (secret) => {
    const flag = secret[0];
    const invisibleStream = secret.slice(1);
    const repeatChars = _extractCompressFlag(flag);
    return recursiveReplace(
      invisibleStream,
      [zwc[4], zwc[5], zwc[6]],
      repeatChars.map((x) => x + x)
    );
  };

  return {
    shrink,
    expand,
  };
};

module.exports = {
  compress,
  decompress,
  zwcHuffMan,
};
