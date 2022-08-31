import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import { Logger } from './utils/Logger'
import express, { Request, Response, NextFunction } from 'express'

// routers
import Voice from './router/voice'
import Studymode from './router/studyMode'

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('*', async (req: Request, res: Response, next: NextFunction) => {
  Logger.log(req.method).put(req.params?.['0']).next('user-agent').put(req.headers?.['user-agent']).next('query').put(JSON.stringify(req.query)).next('body').put(JSON.stringify(req.body)).out()
  next()
})

app.use('/voice', Voice)
app.use('/studymode', Studymode)

app.use('*', async (req: Request, res: Response, next: NextFunction) => {
  res.status(404).send({ code: 404, message: 'Not Found' })
})

app.listen(process.env.WEBSERVER_PORT, () => {
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
