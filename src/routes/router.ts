import { Request, Response, Router } from 'express'

const router = Router()

router.get('/error/unauthorized', (req: Request, res: Response) => {
  res.send(
    `
  <div>
    <a href="/api/auth/refresh">Renew Session</a>
    <a href="/api/auth">Log in again</a>
  </div>
  `
  )
})

export default router
