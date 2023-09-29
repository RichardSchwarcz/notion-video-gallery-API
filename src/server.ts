import express, { Request, Response } from 'express'
import router from './router'

const app = express()

app.get('/', (req: Request, res: Response) => {
  res.json({
    Auth: 'http://localhost:8000/api/youtube/auth',
  })
})

app.use('/api', router)

export default app
