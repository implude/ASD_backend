import { PrismaClient, User } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'
import { Logger } from '../utils/Logger'

const prisma = new PrismaClient()
export default class MiddleWare {
  public static async verify (req: Request, res: Response & { locals: { identity: User} }, next: NextFunction) {
    const { SN } = req.headers
    if (!SN) return res.status(401).send({ sucess: false, message: 'Auth failed (SN required)' })
    try {
      const speaker = await prisma.user.findUnique({ where: { serialNumber: String(SN) } })
      if (!speaker) return res.status(401).send({ sucess: false, message: 'SerialNumber not matched' })
      res.locals.identity = speaker
      next()
    } catch (err: any) {
      Logger.error('Prisma').put(err.stack).out()
      return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
    }
  }
}
