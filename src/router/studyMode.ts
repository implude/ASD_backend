import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import { Logger } from '../utils/Logger'
import MiddleWare from '../classes/SerialCheck'
import { PrismaClient, User } from '@prisma/client'
import express, { Request, Response } from 'express'

const app = express.Router()
const prisma = new PrismaClient()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(MiddleWare.verify)
app.get('/start', async (req: Request, res: Response & { locals: { identity: User} }) => {
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
    res.status(200).send({ success: true, message: 'Starting stucy mode' })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/stop', async (req: Request, res: Response & { locals: { identity: User} }) => {
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
    res.status(200).send({ success: true, message: 'Ended studymode' })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

export default app
