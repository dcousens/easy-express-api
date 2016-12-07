let _http = require('http')
let _https = require('https')
let cors = require('cors')
let debugWare = require('debug-ware')
let express = require('express')
let parallel = require('run-parallel')

function build ({ debug, https, port, routes, services }, done) {
  let app = express()
  app.disable('etag')
  app.disable('x-powered-by')
  app.enable('case sensitive routing')
  app.enable('strict routing')
  app.use(cors())

  let server
  if (https) {
    server = _https.createServer(https, app)
  } else {
    server = _http.createServer(app)
  }

  // accept upgrade requests (for WebSockets)
  server.on('upgrade', (req, socket) => {
    let res = new _http.ServerResponse(req)
    res.assignSocket(socket)

    res.on('finish', () => res.socket.destroy())
    app(req, res)
  })

  parallel([
    (next) => {
      if (!services) return next()

      let callbacks = Object.keys(services).map((serviceName) => {
        let module = services[serviceName]

        return (callback) => module(callback)
      })

      if (debug) debug('Services... initializing')

      parallel(callbacks, (err) => {
        if (err) return next(err)

        if (debug) debug('Services... initialized')
        next()
      })
    },
    (next) => {
      if (!routes) return next()

      let parent = new express.Router()

      // optional: debug logging
      if (debug) parent.use(debugWare(debug))

      let callbacks = Object.keys(routes).map((path) => {
        let module = routes[path]

        return (callback) => {
          module(debug, (err, router) => {
            callback(err, { path, router })
          })
        }
      })

      if (debug) debug(`Routes... initializing`)

      parallel(callbacks, (err, results) => {
        if (err) return next(err)

        results.forEach(({ path, router }) => {
          parent.use(path, router)
          if (debug) debug(`Routes... ${path} initialized`)
        })

        // last-ditch error-handling
        parent.use(function (err, req, res, _) {
          if (debug) debug(err)

          if (process.env.NODE_ENV === 'development') {
            return res.status(400).json(err.message)
          }

          res.status(400).end()
        })

        app.use(parent)
        if (debug) debug('Routes... initialized')

        next(null, parent)
      })
    }
  ], (err) => {
    if (err && debug) debug(err)
    if (err) return done && done(err)

    server.listen(port || 8080)
    if (debug) debug('Listening')

    if (done) done(null, server)
  })
}

module.exports = build
