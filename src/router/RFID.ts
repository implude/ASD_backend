import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import MiddleWare from '../classes/SerialCheck'
import express, { Request, Response, NextFunction } from 'express'
import { User } from '@prisma/client'

const app = express.Router()

app.use(cors())
app.use(helmet())
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use(MiddleWare.verify)
app.get('/check', async (req: Request, res: Response & { locals: { identity: User} }, next: NextFunction) => {
  const { RFID } = req.query
  if (!RFID) return res.status(400).send({ success: false, message: 'No RFID' })
  if (RFID === res.locals.identity.RFID) return res.status(200).send({ success: true, message: 'OK', result: true })
  else return res.status(200).send({ success: true, message: 'OK', result: false })
})

export default app
