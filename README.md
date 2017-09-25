# easy-express-api
A biased express wrapper for building APIs (with attached services).


## Installation
``` bash
npm i debug https://github.com/dcousens/easy-express-api.git
```


## Examples

``` javascript
let debug = require('debug')
let easyApi = require('easy-express-api')
let fs = require('fs')

easyApi({
  debug: debug('myApi'), // optional
  https: process.env.HTTPS_CERT ? {
    ca: fs.readFileSync(process.env.HTTPS_CA),
    cert: fs.readFileSync(process.env.HTTPS_CERT),
    key: fs.readFileSync(process.env.HTTPS_KEY)
  } : null,
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

function (router, callback) {
	router.get('/', (req, res) => {
		res.status(200)
	})
	// ...

	callback(null || err)
}
```

And each `service` is a function:

``` js
function (callback) {
	// ... your service initialization here
	setInterval(() => {
		// ...
	}, 1000)

	callback()
}
```


## License [ISC](LICENSE)
