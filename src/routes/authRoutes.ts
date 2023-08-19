import { Request, Response } from 'express'
import router from './router'

router.get('/auth', (req: Request, res: Response) => {
  res.json({
    generated: getGoogleOAuthURL(),
  })
})
