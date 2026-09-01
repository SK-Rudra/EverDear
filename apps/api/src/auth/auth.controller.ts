import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type {
  Request,
  Response,
} from 'express';
import { AuthCookieService } from './auth-cookie.service.js';
import { AuthService } from './auth.service.js';
import type {
  AuthenticatedUser,
  AuthenticationResponse,
} from './auth.types.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { getSessionMetadata } from './request-context.js';
import { SessionAuthGuard } from './session-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: AuthCookieService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticationResponse> {
    const result = await this.authService.register(
      registerDto,
      getSessionMetadata(request),
    );

    this.cookieService.setSessionCookie(
      response,
      result.session,
    );

    return {
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthenticationResponse> {
    const result = await this.authService.login(
      loginDto,
      getSessionMetadata(request),
    );

    this.cookieService.setSessionCookie(
      response,
      result.session,
    );

    return {
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token =
      this.cookieService.getSessionToken(request);

    await this.authService.logout(token);

    this.cookieService.clearSessionCookie(response);
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @Header('Cache-Control', 'no-store')
  getCurrentUser(
    @CurrentUser() user: AuthenticatedUser,
  ): AuthenticationResponse {
    return {
      user,
    };
  }
}