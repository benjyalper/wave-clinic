const { execSync } = require('child_process')
const { createServer } = require('http')
const { parse } = require('url')

// Run prisma migrations
try {
  console.log('Running database migrations...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
  console.log('Migrations complete.')
} catch (e) {
  console.error('Migration error (continuing):', e.message)
}

// Support both CommonJS default export styles
let createNextApp
try {
  createNextApp = require('next')
  if (typeof createNextApp !== 'function') {
    createNextApp = createNextApp.default
  }
} catch (e) {
  console.error('Failed to require next:', e)
  process.exit(1)
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

console.log(`Starting Next.js on ${hostname}:${port} (dev=${dev})`)

const app = createNextApp({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error handling request:', err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('Server listen error:', err)
        process.exit(1)
      }
      const addr = server.address()
      console.log(`> Ready on http://${addr.address}:${addr.port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to start Next.js:', err)
    process.exit(1)
  })
