const Buffer = require('safe-buffer').Buffer;

// Compliment an array
const _not = x => x.map(y => ~y);


//Slice a buffer
const buff_slice = (x, y, z = x.length) => buff(byarr(x).slice(y, z));

// Convert to byte array and apply complement
const compliment = x=> _not(byarr(x));

//Concatenate buffers
const concat_buff = x => Buffer.concat(x);

// convert byte array to buffer
const buff = x => Buffer.from(x);

// convert buffer to byte array
const byarr = x => Uint8Array.from(x);

// Number to Binary String conversion
const nTobin = x => x.toString(2);

// Byte array to Binary String conversion
const byteToBin = x => Array.from(x).map(y => zeroPad(nTobin(y), 8)).join('');

//Binary String to Byte Array conversion
const binToByte = str => {
    var arr = [];
    for (let i = 0; i < str.length; i +=8) {
        arr.push(str.slice(i, i + 8));
    }
    return new Uint8Array(arr.map(x => parseInt(x, 2)))
}

//Pad with zeroes to get required length
const zeroPad = (num, x) => {
    var zero = '';
    for (let i = 0; i < x; i++) {
        zero += '0'
    }
    return zero.slice(String(num).length) + num;
}


module.exports = {
    buff,
    byarr,
    compliment,
    byteToBin,
    nTobin,
    zeroPad,
    binToByte,concat_buff,buff_slice
}