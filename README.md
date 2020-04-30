<h1 align="center">
  <br>
  <img src="assets/stegCloakIcon.svg" alt="stegcloak" width="100">
  <br>
  <br>
  <span>StegCloak</span>
  <br>
  <br>
</h1>

<h4 align="center">The Cloak of Invisibility for your texts</h4>

StegCloak is a pure JavaScript steganography module designed in functional programming style, to hide text in plain sight - with key features like encryption and top-notch text compression. It can be used in social media or for any other covert communication.


## Features

- Cryptographically secure by encrypting the invisible secret
- Compression to reduce the payload
- Completely invisble, uses Zero Width Characters instead of white spaces or tabs
- Additional HMAC integrity
- Usage - Available as an API module, a CLI and also a <a href='https://stegcloak.surge.sh'>Web interface</a>. Works everywhere!
- Written in pure functional style

## Installing

Using npm,

```bash
$ npm install -g stegcloak
```
Using npm (to use it locally in your program),

```bash
$ npm install stegcloak
```

## How it works

<img src='assets/Flow.PNG'>

## CLI Usage

### Hide

```bash
stegcloak hide <secret> <password> -c <covertext>
```
Options:

```
  -c, --cover <covertext>  Text that you want to hide your secret within
  -n, --nocrypt            If you don't need encryption (default: false)
  -i, --integrity          If additional security of preventing tampering is needed (default: false)
  -h, --help               display help for command
```


### Reveal

```bash
stegcloak reveal <password> -cp
```
Options:

```
  -cp, --clip        Copy Data directly from clipboard
  -d, --data <data>  Data to be decrypted
  -h, --help         display help for command
```

## API Usage

```javascript
const StegCloak = require('stegcloak'); // require 

const stegcloak = new StegCloak();
```

### Hide
```javascript
const magic = stegcloak.hide(
  {message: "Voldemort is back", key: "mischief managed", cover: "The WiFi's not working here!"},
  false, true);
```

### Reveal
```javascript
stegcloak.reveal(magic, "mischief managed");
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
