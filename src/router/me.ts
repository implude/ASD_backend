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
app.get('/', async (req: Request, res: Response & { locals: { identity: User} }) => {
  try {
    const studytimes = await prisma.studyTime.findMany({ where: { userId: res.locals.identity.uuid } })
    const total = studytimes.reduce((acc, cur) => acc + cur.time, 0)
    res.status(200).send({ sucess: true, message: 'OK', identity: res.locals.identity, total })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/studyinfo', async (req: Request, res: Response & { locals: { identity: User} }) => {
  try {
    const studytimes = await prisma.studyTime.findMany({ where: { userId: res.locals.identity.uuid } })
    const total = studytimes.reduce((acc, cur) => acc + cur.time, 0)
    res.status(200).send({ sucess: true, message: 'OK', result: studytimes, total })
  } catch (err: any) {
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
  }
})

export default app
