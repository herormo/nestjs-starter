import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { controllersExcludes } from '@tresdoce/nestjs-health';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { server, swagger, project } =
    app.get<ConfigService>(ConfigService)['internalConfig']['config'];
  const port = parseInt(server.port, 10) || 8080;

  app.setGlobalPrefix(`${server.context}`, {
    exclude: [...controllersExcludes],
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      validatorPackage: require('@nestjs/class-validator'),
      transformerPackage: require('class-transformer'),
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (swagger.enabled) {
    const config = new DocumentBuilder()
      .setTitle(`${project.name}`)
      .setVersion(`${project.version}`)
      .setDescription(`Swagger - ${project.description}`)
      .setExternalDoc('Documentation', project.homepage)
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${swagger.path}`, app, document);
  }

  if (server.corsEnabled) {
    app.enableCors({
      origin: server.origins,
      allowedHeaders: `${server.allowedHeaders}`,
      methods: `${server.allowedMethods}`,
      credentials: server.corsCredentials,
    });
  }

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
