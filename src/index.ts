
import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routers'
import databaseService from './services/database.services'
import { defaultErrorHandle } from './middlewares/error.middlewares'
import User from './models/schemas/User.schema'
import { tokenPayload } from './models/requests/User.requests'
const app = express()
app.use(express.json())
const PORT = 3000
databaseService.connect()
//route localhost: 3000/
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/users', usersRouter)
//localhost:3000/users/ giúp truy cập vào usersRouter
//localhost:3000 k chay qua middleware nao het
app.use(defaultErrorHandle)
app.listen(PORT, () => {
  console.log(`server đang chạy trên port ${PORT}`)
})
