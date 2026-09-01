import { Injectable } from '@nestjs/common';
import {
  hash,
  verify,
  type Options,
} from '@node-rs/argon2';

const PASSWORD_HASH_OPTIONS: Options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

@Injectable()
export class PasswordService {
  hashPassword(password: string): Promise<string> {
    return hash(password, PASSWORD_HASH_OPTIONS);
  }

  async verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }
}