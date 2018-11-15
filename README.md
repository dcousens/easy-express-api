# easy-express-api
[![Version](https://img.shields.io/npm/v/easy-express-api.svg)](https://www.npmjs.org/package/easy-express-api)

A biased express.js wrapper for HTTP servers.


## Installation
``` bash
npm i easy-express-api
```


## Examples
``` javascript
const debug = require('debug')
const debugWare = require('debug-ware')
const cors = require('cors')
const easy = require('easy-express-api')

easy({
  middleware: [
    cors(),
    debugWare(debug('Foo'))
  ],
  routes: {
    '/v3': require('./routes/v3'),
  },
  services: [
    require('./services/bar')
  ]
}, (err, server) => {
  if (err) throw err
  server.listen(80)
})
```

Where each `route` is a function, internally provisioned with a fresh `router = new Express.Router()`:
``` js
// ...

module.exports = function (router, callback) {
  router.get('/', (req, res) => {
    res.status(200)
  })
  // ...

  callback(null || err)
}
```

And each `service` is a function:

``` js
module.exports = function (callback) {
  // ... your service initialization here
  setInterval(() => {
    // ...
  }, 1000)

  callback()
}
```


## LICENSE [MIT](LICENSE)
