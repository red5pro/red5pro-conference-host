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

app.get('/', (req, res) => {
  console.log('hello')
  count = 1
  pats = [pat, getPat(++count)]
  res.send('Hello')
})

let count = 1

const pat =  {
          participantId: 1,
          streamGuid: 'live/mystream',
          conferenceId: 1,
          displayName: 'LynardMaffeus3',
          role: 'PARTICIPANT',
          muteState: {
            audio: true,
            video: true,
            chat: true,
          },
}

const getPat = (n) => {
  return  {...pat, ...{
    participantId: n,
    streamGuid: `live/stream${n}`,
    displayName: `${pat.displayName}_${n}`
}}
}
let pats = [pat, getPat(++count)]
const maxPats = 8

app.get('/vip', (req, res) => {
console.log('vip')
  Object.keys(map).forEach(k => {
    const ws = map[k]
    ws.send(JSON.stringify({
      messageType: 'ConferenceStateEvent',
      state: {
      conferenceId: 1,
      displayName: 'My Conference',
      maxParticipants: 10,
      focusParticipantId: 0,
      joinToken: 'kXQu9dEH',
      joinLocked: false,
      vipOkay: true,
      startTime: 1659632463712,
        participants: [...pats,         
          {
          participantId: 100,
          conferenceId: 1,
          streamGuid: 'live/stream1',
          displayName: 'mr. vip',
          role: 'VIP',
          muteState: {
            audio: true,
            video: true,
            chat: true,
          },
          },
        ]
      }        
  }))

  })
  res.send('vip')
})

app.get('/add', (req, res) => {
  console.log('add')
  if (pats.length < maxPats) {
    pats = [...pats, getPat(++count)]
  }

  Object.keys(map).forEach(k => {
    const ws = map[k]
      ws.send(JSON.stringify({
      messageType: 'ConferenceStateEvent',
        state: {
          conferenceId: 1,
      displayName: 'My Conference',
      maxParticipants: 10,
      focusParticipantId: 0,
      joinToken: 'kXQu9dEH',
      joinLocked: false,
      vipOkay: true,
      startTime: 1659632463712,
          participants: pats
        }
  }))

  })
  res.send('add')
})

app.get('/remove', (req, res) => {
  console.log('remove')
  if (count > 1) {
    count = count - 1
    pats.pop()
  }
  Object.keys(map).forEach(k => {
    const ws = map[k]
      ws.send(JSON.stringify({
      messageType: 'ConferenceStateEvent',
        state: {
          conferenceId: 1,
      displayName: 'My Conference',
      maxParticipants: 10,
      focusParticipantId: 0,
      joinToken: 'kXQu9dEH',
      joinLocked: false,
      vipOkay: true,
      startTime: 1659632463712,
          participants: pats
        }
  }))

  })
  res.send('remove')
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

const getParams = params => {
  const map = {}
  params.split('&').forEach(item => {
    const string = item.split('=')
    map[string[0]] = string[1]
  })
  return map
}

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({ server })
console.log('Mock Socket Server running on ' + port + '.')

let map = {}
wss.on('connection', (ws, req) => {
  console.log('websocket connection open')

  ws.on('close', () => { console.log('closed') })

  ws.onmessage = ((event) => {

    const json = JSON.parse(event.data)
    const joinToken = json.joinToken
    map[joinToken] = ws

  ws.send(JSON.stringify({
    messageType: 'JoinConferenceResponse',
    role: "ORGANIZER",
    participantId: 1
  }))
  ws.send(JSON.stringify({
          messageType: 'ConferenceStateEvent',
      state: {
      conferenceId: 1,
      displayName: 'My Conference',
      maxParticipants: 10,
      focusParticipantId: 0,
      joinToken: 'kXQu9dEH',
      joinLocked: false,
      vipOkay: true,
      startTime: 1659632463712,
      participants: pats
      }
  }))
  })
    
})
