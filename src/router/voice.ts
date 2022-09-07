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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(MiddleWare.verify)
app.post('/stt', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const { content } = req.body
  if (!content) return res.status(400).send({ sucess: false, message: 'No content' })
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 48000,
    languageCode: 'ko-KR'
  }
  const audio = { content }
  const payload = { config, audio }
  const [response] = await client.recognize(payload as any)
  Logger.log('STT').next('content').put(res.locals.identity.serialNumber).put(response.results?.[0].alternatives).next('S/N').out()
  return res.status(200).send({ sucess: true, message: 'OK', result: response.results?.[0].alternatives })
})

export default app
