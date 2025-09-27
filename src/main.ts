import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ✅ CORS configured correctly
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.2.245:3000',
      'http://192.168.2.174:3000',
      'http://192.168.3.58:3000',
      'http://110.39.23.107:3000',
      // 'https://vsf0wgkw-3000.asse.devtunnels.ms',
      'https://z0x4xwtp-3000.inc1.devtunnels.ms ',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowedDevOrigins: true,
  });

  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();
