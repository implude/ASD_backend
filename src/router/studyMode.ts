import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import { Logger } from '../utils/Logger'
import MiddleWare from '../classes/SerialCheck'
import DatabaseClient from '../classes/Database'
import express, { Request, Response, NextFunction } from 'express'

const app = express.Router()
const knex = new DatabaseClient().db

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(MiddleWare.verify)
app.get('/start', async (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.identity.studymode !== 0) return res.status(400).send({ sucess: false, message: 'Already started' })
  try {
    await knex('users').update({ studymode: Date.now() }).where({ SerialNumber: res.locals.identity.SerialNumber })
    res.status(200).send({ sucess: true, message: 'Starting stucy mode' })
  } catch (err: any) {
    Logger.error('knex').put(err.stack).out()
    return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/stop', async (req: Request, res: Response, next: NextFunction) => {
  if (res.locals.identity.studymode === 0) return res.status(400).send({ sucess: false, message: 'No studymode in progress' })
  try {
    const studied = Date.now() - res.locals.identity.studymode
    await knex('users').update({ studymode: 0, totalStudyTime: res.locals.speaker.totalStudyTime + studied }).where({ SerialNumber: res.locals.identity.SerialNumber })
    res.status(200).send({ sucess: true, message: 'Ended studymode' })
  } catch (err: any) {
    Logger.error('knex').put(err.stack).out()
    return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
  }
})

export default app
