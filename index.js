const express = require('express')
const http = require('http')

function easySend (res, err, body) {
  if (err) {
    res.status(typeof err === 'number' ? err : 400)
  } else {
    res.status(200)
  }

  if (body !== undefined) {
    if (typeof body === 'string') res.send(body)
    else if (Buffer.isBuffer(body)) res.send(body)
    else res.json(body)
  }

  res.end()
}

module.exports = async function build ({ middleware, routes, services }, done) {
  const app = express()
  app.disable('etag')
  // app.disable('query parser')
  app.disable('x-powered-by')
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

  if (services) {
    for (const i in services) {
      const service = services[i]
      await service()
    }
  }

  // inject utility function
  app.use((req, res, next) => {
    res.easy = easySend.bind(null, res)
    next()
  })

  if (routes) {
    for (const path in routes) {
      const module = routes[path]
      const router = new express.Router()
      await module(router)
      app.use(path, router)
    }
  }

  // last-ditch error-handling
  app.use((err, req, res, _) => {
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json(err.toString())
    }

    res.status(400).end()
  })

  return server
}
