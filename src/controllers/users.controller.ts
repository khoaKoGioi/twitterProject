//nơi lưu các controllers liên quan đến users
import { Request, Response } from 'express'
import databaseService from '../services/database.services'
import User from '../models/schemas/User.schema'
import usersService from '../services/users.services'
import {ParamsDictionary} from 'express-serve-static-core'
import { RegisterRequestBody } from '../models/requests/User.requests'
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    return res.json({
      message: 'Login successfully',
      result: [
        { name: 'Khoa', yob: 2004 },
        { name: 'Long', yob: 2002 },
        { name: 'Bang', yob: 2001 }
      ]
    })
  }
  res.status(400).json({
    //nếu mà k khớp với email và pass như ở trên thì sẽ chạy else
    message: 'Login failed',
    result: []
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    return res.json({
      message: 'Register succesfully',
      result
    })
  } catch (error) {
    res.status(400).json({
      message: 'Register failed',
      error
    })
  }
}
