import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

export type JsonValue = string | number | boolean;

export interface JsonObject {
  [k: string]: JsonValue | JsonValue[] | JsonObject;
}

export interface JwtPayload extends JsonObject {
  /** Issuer (who created and signed this token) */
  iss?: string;
  /** Subject (whom the token refers to) */
  sub?: string;
  /** Audience (who or what the token is intended for) */
  aud?: string[];
  /** Issued at (seconds since Unix epoch) */
  iat?: number;
  /** Expiration time (seconds since Unix epoch) */
  exp?: number;
  /** Authorization party (the party to which this token was issued) */
  azp?: string;
  /** Token scope (what the token has access to) */
  scope?: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
        handleSigningKeyError: (err) => console.error(err), // do it better in real app!
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: `${process.env.AUTH0_AUDIENCE}`,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    console.log(payload);
    /*const minimumScope = ['openid', 'profile', 'email'];

    if (
      payload?.scope?.split(' ').filter((scope) => minimumScope.indexOf(scope) > -1).length !== 3
    ) {
      throw new UnauthorizedException(
        'JWT does not possess the required scope (`openid profile email`).',
      );
    }*/

    return payload;
  }
}
