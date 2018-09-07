# easy-express-api
A biased express wrapper for building an express HTTP API server using Node.js.


## Installation
``` bash
npm i debug debug-ware easy-express-api
```


## Examples
`.listen()` is not called until each `route` and `service` is ready.

``` javascript
let debug = require('debug')
let easyApi = require('easy-express-api')

easyApi({
  debug: debug('myApi'), // optional
  port: 80, // required
  routes: {
    '/v3': require('./routes/v3'),
  },
  services: {
    'myservice': require('./services/loop')
  }
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


## LICENSE [ISC](LICENSE)
