import DatabaseClient from '../classes/Database'
import { Request, Response, NextFunction } from 'express'
import { Logger } from '../utils/Logger'

const knex = new DatabaseClient().db
export default class MiddleWare {
  public static async veeify (req: Request, res: Response, next: NextFunction) {
    const { SN } = req.headers
    if (!SN) return res.status(401).send({ sucess: false, message: 'Auth failed (SN required)' })
    try {
      const [speaker] = await knex('users').where({ SerialNumber: SN })
      if (!speaker) return res.status(401).send({ sucess: false, message: 'SerialNumber not matched' })
      res.locals.identity = speaker
      next()
    } catch (err:any) {
      Logger.error('knex').put(err.stack).out()
      return res.status(500).send({ sucess: false, message: 'Internal Server Error (database failed)' })
    }
  }
}
