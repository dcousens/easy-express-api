# easy-express-api
A biased express wrapper for building APIs (with attached services).


## Examples

``` javascript
let debug = require('debug')
let easyApi = require('easy-api')
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

Where each `route` is a function:

``` js
// ...

function (debug, callback) {
	let router = new express.Router()

	// ...

	callback(null, router)
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
