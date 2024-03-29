import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import { Logger } from '../utils/Logger'
import MiddleWare from '../classes/SerialCheck'
import { SpeechClient } from '@google-cloud/speech'
import express, { Request, Response } from 'express'
import { User } from '@prisma/client'

const app = express.Router()
const client = new SpeechClient()

app.use(cors())
app.use(helmet())
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use(MiddleWare.verify)
app.post('/stt', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const { content } = req.body
  if (!content) return res.status(400).send({ success: false, message: 'No content' })
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'ko-KR'
  }
  const audio = { content }
  const payload = { config, audio }
  const [response] = await client.recognize(payload as any)
  Logger.log('STT').next('S/N').put(res.locals.identity.serialNumber).next('content').put(response.results?.[0].alternatives?.[0].transcript).out()
  try {
    return res.status(200).send({ success: true, message: 'OK', result: response.results?.[0].alternatives })
  } catch {
    return res.status(200).send({ success: false, message: 'Internal Server Error (STT failed)' })
  }
})

export default app
