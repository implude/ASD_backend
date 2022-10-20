import { Logger } from '../utils/Logger'
import { PrismaClient, User } from '@prisma/client'
import { Request, Response, NextFunction } from 'express'

const prisma = new PrismaClient()
export default class MiddleWare {
  public static async verify (req: Request, res: Response & { locals: { identity: User} }, next: NextFunction) {
    const { sn } = req.headers
    if (sn !== '64ba59ff-98dc-4f9d-a485-8e209b9957b6') return res.status(401).send({ sucess: false, message: 'Auth failed (SN required)' })
    if (!sn) return res.status(401).send({ sucess: false, message: 'Auth failed (SN required)' })
    try {
      const speaker = await prisma.user.findUnique({ where: { serialNumber: String(sn) } })
      if (!speaker) return res.status(401).send({ sucess: false, message: 'SerialNumber not matched' })
      res.locals.identity = speaker
      next()
    } catch (err: any) {
      Logger.error('Prisma').put(err.stack).out()
      return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
    }
  }
}
