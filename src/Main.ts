import 'dotenv/config'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { Logger } from './utils/Logger'
import express, { Request, Response, NextFunction } from 'express'

// routers
import Voice from './router/voice'
import Studymode from './router/studyMode'
import RFID from './router/RFID'
import Me from './router/me'
import { PrismaClient, Gender } from '@prisma/client'
import MiddleWare from './classes/SerialCheck'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })
const prisma = new PrismaClient()

app.use(cors())
app.use(helmet())
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use('*', async (req: Request, res: Response, next: NextFunction) => {
  Logger.log(req.method).put(req.params?.['0']).next('user-agent').put(req.headers?.['user-agent']).out()
  next()
})

app.use('/voice', Voice)
app.use('/rfid', RFID)
app.use('/studymode', Studymode)
app.use('/@me', Me)

app.post('/send_user_info', async (req: Request, res: Response, next: NextFunction) => {
  const { name, age, gender, uuid, school } = req.body
  if (!name || !age || !gender || !uuid || !school) return res.status(400).send({ success: false, message: 'Bad Request' })
  try {
    await prisma.user.create({ data: { name: String(name), age: Number(age), gender: gender as Gender, uuid: String(uuid), school: String(school), serialNumber: String(uuid), email: String(Math.random()), createdAt: Date.now().toString(), RFID: String(Math.random()) } })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
  return res.status(200).send({ success: true, message: 'User created' })
})

app.use(MiddleWare.verify)
app.post('/sendledvalue', async (req: Request, res: Response, next: NextFunction) => {
  const { value, Hex } = req.body
  if (!value || !Hex) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.on('connection', async (socket) => {
    Logger.log('Socket').put('Connected').next('id').put(socket.id).out()
    socket.emit('LED_bright', value)
    socket.emit('LED_color', Hex)
  })
  return res.status(200).send({ success: true, message: 'OK' })
})

app.post('/sendsoundvalue', async (req: Request, res: Response, next: NextFunction) => {
  const { volume, index } = req.body
  if (!volume || !index) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.on('connection', async (socket) => {
    Logger.log('Socket').put('Connected').next('id').put(socket.id).out()
    socket.emit('speaker_volume', volume)
    socket.emit('white_noise', index)
  })
  return res.status(200).send({ success: true, message: 'OK' })
})

app.use('*', async (req: Request, res: Response, next: NextFunction) => {
  res.status(404).send({ code: 404, message: 'Not Found' })
})

io.on('connection', async (socket) => {
  Logger.log('Socket').put('Connected').next('id').put(socket.id).out()
})

server.listen(process.env.WEBSERVER_PORT, () => {
  Logger.success('Express').put('Server Ready').next('port').put(process.env.WEBSERVER_PORT).out()
  Logger.info('Environment').put(String(process.env.ENVIRONMENT)).out()
  switch (process.env.ENVIRONMENT) {
    case 'ci':
      Logger.warning('Environment').put('CI deteced process will be stop instanlty').out()
      process.exit(0)
  }
})

process.on('uncaughtException', e => {
  Logger.error('Unhandled Exception').put(e.stack).out()
})
process.on('unhandledRejection', e => {
  Logger.error('Unhandled Rejection').put(e instanceof Error ? e.stack : e).out()
})
