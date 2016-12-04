let _debug = require('debug')
let _http = require('http')
let _https = require('https')
let cors = require('cors')
let debugWare = require('debug-ware')
let express = require('express')
let series = require('run-series')

function build ({ name, https, port, routes, services }, done) {
  name = name || ''

  let debug = _debug(name)
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

  series([
    (callback) => {
      if (!services) return callback()

      let callbacks = Object.keys(services).map((name) => {
        let module = services[name]

        return (callback) => module(callback)
      })

      series(callbacks, (err) => {
        if (err) return callback(err)

        debug('Services initialized')
        callback()
      })
    },
    (next) => {
      if (!routes) return next()

      let parent = new express.Router()
      let debug = _debug(`${name}-routes`)

      // debug logging
      parent.use(debugWare(debug))

      let callbacks = Object.keys(routes).map((path) => {
        let module = routes[path]

        return (callback) => {
          module(debug, (err, router) => {
            callback(err, { path, router })
          })
        }
      })

      series(callbacks, (err, results) => {
        if (err) return next(err)

        results.forEach(({ path, router }) => {
          parent.use(path, router)
          debug(`${path} initialized`)
        })

        // last-ditch error-handling
        parent.use(function (err, req, res, next) {
          debug(err)

          if (process.env.NODE_ENV === 'development') {
            return res.status(400).json(err.message)
          }

          res.status(400).end()
        })

        app.use(parent)
        debug('Routes initialized')

        next(null, parent)
      })
    }
  ], (err) => {
    if (err) debug(err)
    if (err) return done && done(err)

    server.listen(port || 8080)
    debug('Listening')

    if (done) done(null, server)
  })
}

module.exports = build
