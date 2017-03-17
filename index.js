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

    // assign res.ws for easy websocket detection
    if (req.headers && /websocket/i.test(req.headers.upgrade)) {
      req.ws = res.socket
    }

    res.on('finish', () => res.socket.destroy())
    app(req, res)
  })

  parallel([
    (next) => {
      if (!services) return next()

      let serviceNames = Object.keys(services)
      if (serviceNames.length === 0) return next()
      if (debug) debug('Services', 'Initializing')

      parallel(serviceNames.map((serviceName) => {
        let module = services[serviceName]

        return (callback) => module((err) => {
          if (err) return callback(err)
          if (debug) debug('Services', `${serviceName} running`)
          callback(err)
        })
      }), (err) => {
        if (!err && debug) debug('Services', 'Initialized')
        next(err)
      })
    },
    (next) => {
      if (!routes) return next()

      let parent = new express.Router()
      let routePaths = Object.keys(routes)
      if (routePaths.length === 0) return next()

      // optional: debug logging
      if (debug) {
        parent.use(debugWare(debug))
        debug('Routes', 'Initializing')
      }

      parallel(routePaths.map((path) => {
        let module = routes[path]

        return (callback) => {
          module((err, router) => {
            if (err) return callback(err)
            if (debug) debug('Routes', `${path} ready`)

            callback(null, { path, router })
          })
        }
      }), (err, results) => {
        if (err) return next(err)

        results.forEach(({ path, router }) => {
          parent.use(path, router)
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
        if (debug) debug('Routes', 'Initialized (+ added)')

        next(null, parent)
      })
    }
  ], (err) => {
    if (err && debug) debug(err)
    if (err && done) return done(err)
    if (err) throw err

    server.listen(port || 8080)
    if (debug) debug('Listening')

    if (done) done(null, server)
  })
}

module.exports = build
