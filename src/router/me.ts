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
app.use(express.json({ limit: '100mb' }))
app.use(express.urlencoded({ extended: true, limit: '100mb' }))

app.use(MiddleWare.verify) // 시리얼넘버 인증 미들웨어
app.get('/', async (req: Request, res: Response & { locals: { identity: User} }) => { // 사용자 정보 엔드포인트
  try {
    const studytimes = await prisma.studyTime.findMany({ where: { userId: res.locals.identity.uuid } }) // 모든 공부모드 기록 불러오기
    const total = studytimes.reduce((acc, cur) => acc + cur.time, 0) // 총 공부시간 계산

    res.status(200).send({ success: true, message: 'OK', identity: res.locals.identity, total }) // middleware가 처리된 사용자 정보를 res.locals.identity에 보관하고 있음
  } catch (err: any) { // 데이터베이스 에러 헨들링
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/studyinfo', async (req: Request, res: Response & { locals: { identity: User} }) => {
  try {
    const studytimes = await prisma.studyTime.findMany({ where: { userId: res.locals.identity.uuid } }) // 모든 공부모드 기록 불러오기
    const total = studytimes.reduce((acc, cur) => acc + cur.time, 0) // 총 공부시간 계산

    // 이번달 공부시간 가져오기
    const thisMonth = new Date().getMonth() + 1
    const thisMonthStudyTimes = studytimes.filter((studytime) => {
      const studytimeMonth = new Date(studytime.start).getMonth() + 1
      return studytimeMonth === thisMonth
    })

    res.status(200).send({ success: true, message: 'OK', result: studytimes, total, thisMonth: thisMonthStudyTimes })
  } catch (err: any) { // 데이터베이스 에러 헨들링
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

export default app
