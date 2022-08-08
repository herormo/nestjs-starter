import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('test-env')
  async getTestEnv(): Promise<string> {
    return this.appService.getTestEnv();
  }

  @Get('my-util')
  getMyUtil() {
    return this.appService.getMyCustomUtil();
  }

  // ==================

  @Get('public')
  secretEndpoint(): string {
    return 'this is a public endpoint';
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  getProtected(): string {
    return 'this is a protected endpoint';
  }
}
