# easy-express-api
[![Version](https://img.shields.io/npm/v/easy-express-api.svg)](https://www.npmjs.org/package/easy-express-api)

A biased express.js wrapper for HTTP servers.

**WARNING:** `etag`s are default disabled; with an assumption of external cache control and configuration.


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
}).then((server) => {
  server.listen(80)
})
```

Where each `route` is an `async` function, internally provisioned with a fresh `router = new Express.Router()`:
``` js
// ...

module.exports = async function (router) {
  router.get('/', (req, res) => {
    res.status(200)
  })

  // ...
}
```

And each `service` is an `async` function:

``` js
module.exports = async function () {
  // ... your service initialization here
  setInterval(() => {
    // ...
  }, 1000)
}
```


## LICENSE [MIT](LICENSE)
