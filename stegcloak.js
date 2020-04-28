const R=require('ramda');

const {encrypt,decrypt}=require("./components/encrypt");

const {embed,detach,toConceal,toConcealHmac,concealToData}=require("./components/message");

const {compress,decompress}=require("./components/compact");

const {byteToBin,compliment} = require('./components/util');



function hide(message, key, cover,integrity) {

    const secret=R.pipe(compress,compliment)(message);

    const encryptStream = encrypt({password:key,data:secret,integrity});
    
    const invisibleStream = R.pipe(byteToBin,integrity?toConcealHmac:toConceal)(encryptStream);

    return embed(cover,invisibleStream);
}



function reveal(str,key){    

    const encryptStream=R.pipe(detach,concealToData)(str);

    let decryptStream = decrypt({password:key,data:encryptStream.data,integrity:encryptStream.integrity});

    return R.pipe(compliment,decompress)(decryptStream);

}


module.exports={hide,reveal}
