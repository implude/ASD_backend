import 'dotenv/config'
import cors from 'cors'
import http from 'http'
import helmet from 'helmet'
import { Server } from 'socket.io'
import { Logger } from './utils/Logger'
import express, { Request, Response, NextFunction } from 'express'

// routers
import Voice from './router/voice'
import RFID from './router/RFID'
import Me from './router/me'
import { PrismaClient, Gender, User} from '@prisma/client'
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
  Logger.log(req.method).put(req.params?.['0']).next('user-agent').put(req.headers?.['user-agent']).next('body').put(JSON.stringify(req.body)).out()
  next()
})

app.use('/voice', Voice)
app.use('/rfid', RFID)
app.use('/@me', Me)

app.post('/send_user_info', async (req: Request, res: Response, next: NextFunction) => {
  const { name, age, gender, uuid, school } = req.body
  if (!name || !age || !gender || !uuid || !school) return res.status(400).send({ success: false, message: 'Bad Request' })
  try {
    // uuid 같은거 검증
    const check = await prisma.user.findUnique({ where: { uuid } })
    const gen = gender === 'male' ? 'Male' : 'Female'
    if (check) {
      await prisma.user.update({ data: { name: String(name), age: Number(age), gender: gen as Gender }, where: { uuid } })
    }
    await prisma.user.create({ data: { name: String(name), age: Number(age), gender: gen as Gender, uuid: String(uuid), school: String(school), serialNumber: String(uuid), email: String(Math.random()), RFID: String(Math.random()) } })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
  return res.status(200).send({ success: true, message: 'User created' })
})

app.use(MiddleWare.verify)
app.post('/sendledvalue', async (req: Request, res: Response, next: NextFunction) => {
  const { value } = req.body
  if (!value) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.emit('LED_bright', value)
  return res.status(200).send({ success: true, message: 'OK' })
})

app.post('/sendsoundvalue', async (req: Request, res: Response, next: NextFunction) => {
  const { value } = req.body
  if (!value) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.emit('speaker_volume', value)
  return res.status(200).send({ success: true, message: 'OK' })
})

app.post('/sendledhex', async (req: Request, res: Response, next: NextFunction) => {
  const { Hex } = req.body
  if (!Hex) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.emit('LED_color', Hex)
  return res.status(200).send({ success: true, message: 'OK' })
})

app.post('/sendsoundindex', async (req: Request, res: Response, next: NextFunction) => {
  const { index } = req.body
  if (!index) return res.status(400).send({ success: false, message: 'Bad Request' })
  io.emit('white_noise', index)
  return res.status(200).send({ success: true, message: 'OK' })
})

app.get('/studymode/start', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const studymode = await prisma.studyTime.findFirst({ where: { userId: res.locals.identity.uuid, time: 0 } })
  if (studymode) return res.status(400).send({ success: false, message: 'Already started' })
  try {
    await prisma.studyTime.create({
      data: {
        userId: res.locals.identity.uuid,
        time: 0,
        start: new Date(),
        end: new Date('1970-01-01T00:00:00.000Z')
      }
    })
    io.emit('nfc_on', true)
    res.status(200).send({ success: true, message: 'Starting stucy mode' })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/studymode/stop', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const studymode = await prisma.studyTime.findFirst({ where: { userId: res.locals.identity.uuid, time: 0 } })
  if (!studymode) return res.status(400).send({ success: false, message: 'Already started' })
  try {
    const studied = Date.now() - studymode.start.getTime()
    await prisma.studyTime.update({
      data: {
        time: studied,
        end: new Date()
      },
      where: {
        id: studymode.id
      }
    })
    io.emit('nfc_off', studied)
    res.status(200).send({ success: true, message: 'Ended studymode' })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
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
