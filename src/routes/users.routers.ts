import { Router } from 'express'
import { loginValidator, registerValidator } from '../middlewares/users.middlewares'
import { loginController, registerController } from '../controllers/users.controller'
import { wrapAsync } from '../utils/handlers'
const usersRouter = Router()

//controller
usersRouter.get('/login', loginValidator, wrapAsync(loginController))
//đầu tiên khi mà truy cập vào login
//thì sẽ đi qua loginValidator, sẽ kiểm tra email, pass xem có tồn tại hay k
//oke rồi thì sẽ next qua tầng tiếp theo là loginController
usersRouter.post('/register', registerValidator, wrapAsync(registerController))


export default usersRouter
