import express, { Request, Response } from 'express'
import router from './router'

const app = express()

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome!')
})

app.use('/api', router)

export default app
