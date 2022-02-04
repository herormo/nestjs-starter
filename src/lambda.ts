import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import express from 'express';
import { ConfigService } from '@nestjs/config';
import { controllersExcludes } from '@tresdoce/nestjs-health';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this
// is likely due to a compressed response (e.g. gzip) which has not
// been handled correctly by aws-serverless-express and/or API
// Gateway. Add the necessary MIME types to binaryMimeTypes below
const binaryMimeTypes: string[] = [];

let cachedServer: Server;

// Create the Nest.js server and convert it into an Express.js server
async function bootstrapServer(): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
    const { server, swagger, project } =
      app.get<ConfigService>(ConfigService)['internalConfig']['config'];
    const port = parseInt(server.port, 10) || 8080;

    app.use(eventContext());

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
    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  }
  return cachedServer;
}

// Export the handler : the entry point of the Lambda function
export const handler: Handler = async (event: any, context: Context) => {
  cachedServer = await bootstrapServer();
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
