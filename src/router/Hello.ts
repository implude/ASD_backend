import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import { Logger } from '../utils/Logger'
// import DatabaseClient from '../classes/Database'
import express, { Request, Response, NextFunction } from 'express'

const app = express.Router()
// const knex = new DatabaseClient().db

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/world', async (req: Request, res: Response, next: NextFunction) => {
  Logger.success('Hello').put('World').out()
  return res.status(200).send({ code: 200, message: 'Hello, World!' })
})

export default app
