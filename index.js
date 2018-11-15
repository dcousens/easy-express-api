const express = require('express')
const http = require('http')
const parallel = require('run-parallel')

function minimalSend (res, body) {
  if (typeof body === 'string') res.send(body)
  else if (Buffer.isBuffer(body)) res.send(body)
  else res.json(body)
}

module.exports = function build ({ middleware, routes, services }, done) {
  const app = express()
  app.disable('etag')
  app.disable('x-powered-by')
  // app.disable('query parser')
  app.enable('case sensitive routing')
  app.enable('strict routing')

  if (middleware) {
    app.use(middleware)
  }

  const server = http.createServer(app)

  // accept upgrade requests (for WebSockets)
  server.on('upgrade', (req, socket) => {
    const res = new http.ServerResponse(req)
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

      parallel(Object.values(services), next)
    },
    (next) => {
      if (!routes) return next()

      const parent = new express.Router()
      const routePaths = Object.keys(routes)
      if (routePaths.length === 0) return next()

      parent.use((req, res, next) => {
        res.easy = function easy (err, body) {
          if (err) {
            res.status(typeof err === 'number' ? err : 400)
          } else {
            res.status(200)
          }

          if (body !== undefined) minimalSend(res, body)
          res.end()
        }

        next()
      })

      parallel(routePaths.map((path) => {
        const module = routes[path]

        return (callback) => {
          const router = new express.Router()

          module(router, (err) => {
            if (err) return callback(err)

            parent.use(path, router)
            callback()
          })
        }
      }), (err, results) => {
        if (err) return next(err)

        app.use(parent)
        next()
      })
    }
  ], (err) => {
    if (err) return done(err)

    // last-ditch error-handling
    app.use((err, req, res, _) => {
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json(err.toString())
      }

      res.status(400).end()
    })

    done(null, server)
  })
}
