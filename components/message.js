const R=require('ramda');
const {
    zeroPad,
    nTobin,
    binToByte
} = require('./util.js');

const zwc = ['‌', '​', '‍', '‎'] //00-200C, 01-200B, 10-200D, 11-200E Where the magic happens !


// Data to ZWC hidden string
const _dataToZWC = (integrity, str) => {
    let ZWCstr = integrity ? zwc[1] : zwc[0];
    for (let i = 0; i < str.length; i += 2) {
        ZWCstr += _binToZWC(str[i] + str[i + 1]) //Binary to zwc conversion
    }
    return ZWCstr;
}


// Map binary to ZWC 
const _binToZWC = str => zwc[parseInt(str, 2)];


// Map ZWC to binary
const _ZWCTobin = inp => zeroPad(nTobin(zwc.indexOf(inp)), 2);


//Check if HMAC was performed during encryption
const _isHmac = x => Boolean(zwc.indexOf(x[0]))


//Message curried functions

const toConcealHmac = R.curry(_dataToZWC)(true);

const toConceal = R.curry(_dataToZWC)(false);


//ZWC string to data 
const concealToData = (str) => {
    const integrity = _isHmac(str);
    return {
        integrity,
        data: binToByte(str.slice(1).split('').map(x => _ZWCTobin(x)).join(''))
    }
}


//Embed invisble stream to cover text

const embed = (cover, secret) => {
    let arr = cover.split(' ');
    return [arr[0]].concat([secret + arr[1]]).concat(arr.slice(2, arr.length)).join(' ');
}

//Detach invisble stream from cover text

const detach = (str) => {
    var output;
    str.split(' ')[1].split('').every((x, i) => {
        if (!(~zwc.indexOf(x))) {
            output = str.split(' ')[1].slice(0, i);
            return false;
        }
        return true;
    });
    return output;
}


module.exports = {
    embed,
    detach,
    concealToData,
    toConcealHmac,
    toConceal
}