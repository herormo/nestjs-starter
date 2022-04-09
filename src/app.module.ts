import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@tresdoce-nestjs-toolkit/health';
import { HttpClientModule } from '@tresdoce/nestjs-httpclient';
import { ArchetypeModule } from '@tresdoce/nestjs-archetype';

import { UtilsModule } from './utils/utils.module';
import { UsersModule } from './users/users.module';
import { CharactersModule } from './characters/characters.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { config, environments, validationSchema } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[`${process.env.NODE_ENV}`],
      ignoreEnvFile: process.env.NODE_ENV === 'production' || false,
      load: [config],
      isGlobal: true,
      validationSchema,
    }),
    ArchetypeModule,
    HealthModule,
    HttpClientModule,
    UtilsModule,
    CharactersModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
