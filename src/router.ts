import { Request, Response, Router } from 'express'

const router = Router()

router.get('/something', (req: Request, res: Response) => {
  res.json({
    message: 'something',
  })
})

export default router
