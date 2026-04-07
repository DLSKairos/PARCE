import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  })

  app.use(helmet())
  app.use(cookieParser())

  // Raw body para webhooks de pagos
  app.use('/api/v1/payments/webhook', (req: any, res: any, next: any) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => { data += chunk })
    req.on('end', () => {
      req.rawBody = data
      try {
        req.body = JSON.parse(data)
      } catch {
        req.body = {}
      }
      next()
    })
  })

  // JSON para el resto
  app.use((req: any, res: any, next: any) => {
    if (!req.rawBody) {
      require('express').json()(req, res, next)
    } else {
      next()
    }
  })

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.enableCors({
    origin: [
      process.env.FRONTEND_OWNER_URL || 'http://localhost:5273',
      /\.parce\.app$/,
      /localhost:\d+$/,
    ],
    credentials: true,
  })

  const port = process.env.PORT || 3100
  await app.listen(port)
  console.log(`Parce API corriendo en http://localhost:${port}/api/v1`)
}
bootstrap()
