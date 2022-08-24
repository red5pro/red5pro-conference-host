const http = require('http')
const https = require('https')
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
let port = process.env.PORT || 8001
const fs = require('fs')

let cert
let key

// TODO add cert and set to true to enable SSL
const useSSL = process.env.SSL === 'true' || false
if (useSSL) {
  console.log('Using SSL.')
  cert = fs.readFileSync('./cert/certificate.crt')
  key = fs.readFileSync('./cert/privateKey.key')
  port = 443
}

app.use(bodyParser.json())
app.use(cors())
app.options('*', cors())

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.post('/', (req, res) => {
  res('Hello')
})

let server
if (useSSL){
  let options = {
    cert: cert,
    key: key 
  }
  server = https.createServer(options, (req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end("<h1>HTTPS server running</h1>")
  })
} else {
  server = http.createServer(app)
}
server.listen(port)

const roomMap = {} // roomName(str):[<ws>(websocket connection)]
const getParams = params => {
  const map = {}
  params.split('&').forEach(item => {
    const string = item.split('=')
    map[string[0]] = string[1]
  })
  return map
}

const saveWSConnectionAndShareStreams = ws => {
  const {
    room
  } = ws
  if (!roomMap.hasOwnProperty(room)) {
    roomMap[room] = []
  }
  roomMap[room].push(ws)

  const listing = roomMap[room]
  const streams = listing.map(w => w.streamName)
  listing.forEach(l => {
    l.send(JSON.stringify({
      room,
      streams
    }))
  })
}

const clearWSData = ws => {
  const {
    room,
    streamName
  } = ws
  const listing = roomMap[room]
  const streams = listing.map(w => w.streamName)
  const index = streams.indexOf(streamName)
  if (index > -1) {
    roomMap[room].splice(index, 1)
    streams.splice(index, 1)
    console.log(`send new list on clear: ${streams.join(',')}.`)
    roomMap[room].forEach(l => {
      l.send(JSON.stringify({
        room,
        streams
      }))
    })
  }
}

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({ server })
console.log('Mock Socket Server running on ' + port + '.')

wss.on('connection', (ws, req) => {
  console.log('websocket connection open')
  const params = getParams(req.url.split('?')[1])
  console.log(params)

  if (!params.room && !params.streamName) {
    ws.send('The following query parameters are required: room, streamName')
    ws.close()
  }

  ws.room = params['room']
  ws.streamName = params['streamName']
  saveWSConnectionAndShareStreams(ws, params)

  ws.on('message', message => {
    console.log('webSocket message received')
    let json = message
    if (typeof message === 'string') {
      json = JSON.parse(message)
    } 
    console.log('Received: ' + JSON.stringify(json, null, 2))
  })
  ws.on('close', () => {
    console.log(`websocket connection close: room(${ws.room}), name(${ws.streamName}).`)
    clearWSData(ws)
  })
})


