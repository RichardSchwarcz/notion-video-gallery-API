import { Request, Response } from 'express'
import router from './router'
import { getGoogleOAuthURL } from '../googleOAuthURL'

router.get('/auth', (req: Request, res: Response) => {
  res.json({
    generated: getGoogleOAuthURL(),
  })
})
