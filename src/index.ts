import express from 'express'
import usersRouter from './routes/users.router'
import databaseService from './services/database.services'
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
//sau đó sẽ chạy 2 cái hàm trong usersRouter.use và log ra time tương ứng
//localhost:3000 k chay qua middleware nao het
app.listen(PORT, () => {
  console.log(`server đang chạy trên port ${PORT}`)
})
