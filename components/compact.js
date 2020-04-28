
const R=require('ramda');

const lzutf8 = require('lzutf8');



const compress = x => lzutf8.compress(x, {outputEncoding: "Buffer"});

// Curried decompress

const _lzutf8Decompress=R.curry(lzutf8.decompress)(R.__,{inputEncoding: "Buffer",outputEncoding: "String"});


// Decompress a buffer using LZ decompression
const decompress = R.pipe(Buffer.from,_lzutf8Decompress);


module.exports={compress,decompress}