# easy-express-api
A biased express wrapper for building simple REST APIs (and attached services).


## Installation
``` bash
npm i debug https://github.com/dcousens/easy-express-api.git
```


## Examples

``` javascript
let debug = require('debug')
let easyApi = require('easy-express-api')

easyApi({
  debug: debug('myApi'), // optional
  port: process.env.PORT,
  routes: {
    '/auth': require('./routes/auth'),
    '/zmq': require('./routes/zmq')
  },
  services: {
    'loop': require('./services/loop')
  }
})
```

Where each `route` is a function, with a fresh `router = new Express.Router()`:
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


## License [ISC](LICENSE)
