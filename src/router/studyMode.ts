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
app.get('/start', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const studymode = await prisma.studyTime.findFirst({ where: { userId: res.locals.identity.uuid, time: 0 } }) // 진행중인 공부모드가 있는지 확인
  if (studymode) return res.status(400).send({ success: false, message: 'Already started' }) // 진행중인 공부모드가 있을시 중복처리
  try { // 데이터 베이스 에러 헨들링
    await prisma.studyTime.create({ // 공부모드를 생성
      data: {
        userId: res.locals.identity.uuid,
        time: 0,
        start: new Date(),
        end: new Date('1970-01-01T00:00:00.000Z') // end를 timestamp 0 로 취급하여 종료 여부를 검사
      }
    })
    res.status(200).send({ success: true, message: 'Starting study mode' }) // 공부모드 시작 반환
  } catch (err: any) { // 데이터베이스 에러 헨들링
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

app.get('/stop', async (req: Request, res: Response & { locals: { identity: User} }) => {
  const studymode = await prisma.studyTime.findFirst({ where: { userId: res.locals.identity.uuid, time: 0 } }) // 진행중인 공부모드 확인
  if (!studymode) return res.status(400).send({ success: false, message: 'No Studymode in progress' }) // 진행중인 모드가 없을경우 반환
  try { // 데이터베이스 에러 헨들링
    const studied = Date.now() - studymode.start.getTime() // 공부시간 측정
    await prisma.studyTime.update({
      data: {
        time: studied, // 공부시간
        end: new Date() // 현재시간
      },
      where: {
        id: studymode.id
      }
    })
    res.status(200).send({ success: true, message: 'Ended studymode' }) // 공부모드 종료 반환
  } catch (err: any) { // 데이터베이스 에러 헨들링
    Logger.error('Prisma').put(err.stack).out()
    return res.status(500).send({ success: false, message: 'Internal Server Error (database failed)' })
  }
})

export default app
