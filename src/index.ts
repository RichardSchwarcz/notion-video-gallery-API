import app from './server'
import 'dotenv/config'

const PORT = process.env.PORT

try {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
  })
} catch (error) {
  console.log(error)
}
