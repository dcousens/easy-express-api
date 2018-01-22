let cors = require('cors')
let debugWare
try {
  debugWare = require('debug-ware')
} catch (e) {}

let express = require('express')
let http = require('http')
let parallel = require('run-parallel')

function minimalSend (res, body) {
  if (typeof body === 'string') res.send(body)
  else if (Buffer.isBuffer(body)) res.send(body)
  else res.json(body)
}

module.exports = function build ({ debug, port, routes, services }, done) {
  let app = express()
  app.disable('etag')
  app.disable('x-powered-by')
  app.enable('case sensitive routing')
  app.enable('strict routing')
  app.use(cors())

  let server = http.createServer(app)

  // accept upgrade requests (for WebSockets)
  server.on('upgrade', (req, socket) => {
    let res = new http.ServerResponse(req)
    res.assignSocket(socket)

    // assign res.ws for easy websocket detection
    if (req.headers && /websocket/i.test(req.headers.upgrade)) {
      req.ws = true
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
      if (debug) debug('Routes', 'Initializing')

      // (optional) debug logging
      if (debug && debugWare) {
        parent.use(debugWare(debug))
      }

      parent.use((req, res, next) => {
        res.easy = function easy (err, body) {
          if (err) {
            res.status(typeof err === 'number' ? err : 400)
            if (debug) debug(req.path, err)
          } else {
            res.status(200)
          }

          if (body !== undefined) minimalSend(res, body)
          res.end()
        }

        next()
      })

      parallel(routePaths.map((path) => {
        let module = routes[path]

        return (callback) => {
          let router = new express.Router()

          module(router, (err) => {
            if (err) return callback(err)
            if (debug) debug('Routes', `${path} ready`)

            parent.use(path, router)
            callback()
          })
        }
      }), (err, results) => {
        if (err) return next(err)

        // last-ditch error-handling
        parent.use((err, req, res, _) => {
          if (debug) debug(err)

          if (process.env.NODE_ENV === 'development') {
            return res.status(400).json(err.message)
          }

          res.status(400).end()
        })

        app.use(parent)
        if (debug) debug('Routes', 'Initialized (+ added)')
        next()
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
