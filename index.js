#!/usr/bin/env node
var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors');
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
var http = require('http')
var https = require('https')
var SocketServer = require('ws').Server
var fs = require('fs')
var chokidar = require('chokidar')
var child = require('child_process')
var Path = require('path')

var defaults = { port: 3989, dir: './', ignore: 'hs-ignore-dir' }
var args = require('minimist')(process.argv.slice(2))
var { port, dir, ignore, cert, consoleclear, codereload } = Object.assign(defaults, args)
if (codereload != null) {
  codereload = codereload.split(",").map(s => { return Path.resolve(s) + '/' })
} else {
  codereload = []
}

const reloadType = function (path) {
  if (codereload.filter(p => path.startsWith(p)).length > 0) {
    return 'codereload'
  } else {
    return 'reload'
  }
}
dir = Path.resolve(dir) + '/'
var watched = [dir]
for (const d of codereload) {
  watched.push(d)
}

// set up express static server with a websocket
var app = express()
  .use(bodyParser.json())
  .get('*', injectHTML)
  .post("/", function (req, res) {
    var type = 'codereload'
    var msg = { type, data: req.body }
    wss.clients.forEach(d => d.send(JSON.stringify(msg)))
    res.send("ok")
  })
  .use(serveStatic(dir))
  .use('/', serveIndex(dir))

// append websocket/injecter script to all html pages served
var wsInject = fs.readFileSync(__dirname + '/ws-inject.html', 'utf8')
if (consoleclear) wsInject = wsInject.replace('// console.clear()', 'console.clear()')

function injectHTML(req, res, next) {
  try {
    var path = req.params[0].slice(1)
    if (path.slice(-1) == '/') path = path + '/index.html'
    if (path == '') path = 'index.html'
    if (path.slice(-5) != '.html') return next()

    res.send(fs.readFileSync(dir + path, 'utf-8') + wsInject)
  } catch (e) { next() }
}

// use https server if a cert file is passed in
var server = http.createServer(app)
if (cert) {
  var credentials = { cert: fs.readFileSync(cert), key: fs.readFileSync(cert.replace('.pem', '-key.pem')) }
  server = https.createServer(credentials, app)
}

server.listen(port).on('listening', () => {
  var url = `http${cert ? 's' : ''}://localhost:${port}`
  child.exec(`open ${url}`)
  console.log(`hypermedia-hot-server ${url}`, codereload)
})

//inc port if in use
process.on('uncaughtException', err => {
  console.log(err)
  [err.errno, err.code].includes('EADDRINUSE') ? server.listen(++port) : 0
})

// if a .js or .css files changes, load and send to client via websocket
var wss = new SocketServer({ server })
var ignored = new RegExp(`${ignore}|` + /node_modules|\.git|[\/\\]\./.source)
chokidar
  .watch(watched, { ignored })
  .on('change', path => {

    var str = fs.readFileSync(path, 'utf8')
    var type = reloadType(path)
    console.log(path + " " + type + "!")

    if (path.includes('.js')) type = 'jsInject'
    if (path.includes('.css')) type = 'cssInject'
    if (path.includes('.hs')) type = 'hyperscriptInject'

    var msg = { path, type, str }
    wss.clients.forEach(d => d.send(JSON.stringify(msg)))
  })
