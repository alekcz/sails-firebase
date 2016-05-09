![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png) 

# sails-firebase
[![Build Status](https://travis-ci.org/alekcz/sails-firebase.png?branch=master)](https://travis-ci.org/alekcz/sails-firebase) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/badge/license-MIT-blue.svg)

A [Waterline](https://github.com/balderdashy/waterline) adapter for Firebase. May be used in a [Sails](https://github.com/balderdashy/sails) app or anything using Waterline for the ORM.

## Status
THIS IS A WORK IN PROGRESS

- sails-firebase is currently a `semantic` only adapter
- Create is mostly functional
- Find is rudimentary
- Update and Destroy are not yet implemented


## Installation
NOT YET ON NPM

Install from NPM.

```bash
$ npm install sails-firebase --save
```

## Sails Configuration

### Using with Sails v0.11.x

Add the following config to the `config/connections.js` file:

```javascript
module.exports.connections = {

  someFirebaseRef: {
    adapter: 'sails-firebase',
    url: 'https://mediocreappname.firebaseio.com', // Required. The full URL is used to allow for paid for firebase instances
    secret: "thisissupersuperdupersecret", // Required. The secret is used to generate an authentication token for the connection.
    database: 'default' // This is used to allow multiple 'databases' in the same firebase app
  }
};
```


## License

### The MIT License (MIT)

Copyright © 2016 Alexander Oloo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
