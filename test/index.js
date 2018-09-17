const easy = require('../')
const tape = require('tape')

tape('initializes without error (returning server)', function (t) {
  t.plan(5)

  easy({
    middleware: [
      function (req, res, next) {
        t.fail()
      }
    ],
    routes: {
      '/3': function (router, callback) {
        t.pass()
        setTimeout(callback, 100)
      }
    },
    services: {
      'foobar': function (callback) {
        t.pass()
        setTimeout(callback, 100)
      }
    }
  }, (err, server) => {
    t.error(err)
    t.ok(server)
    t.pass()
  })
})

tape('handles error in routes initialization', function (t) {
  t.plan(2)

  easy({
    routes: {
      '/3': function (router, callback) {
        setTimeout(() => callback(new Error('oops')), 100)
      }
    },
    services: {
      'foobar': function (callback) {
        callback()
      }
    }
  }, (err) => {
    t.ok(err)
    t.throws(() => {
      throw err
    }, /oops/)
  })
})

tape('handles error in services initialization', function (t) {
  t.plan(2)

  easy({
    routes: {
      '/3': function (router, callback) {
        callback()
      }
    },
    services: {
      'foobar': function (callback) {
        setTimeout(() => callback(new Error('oops')), 100)
      }
    }
  }, (err) => {
    t.ok(err)
    t.throws(() => {
      throw err
    }, /oops/)
  })
})
