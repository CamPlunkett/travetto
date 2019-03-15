import * as crypto from 'crypto';
import * as util from 'util';

import { AppError } from '@travetto/base';

const pbkdf2 = util.promisify(crypto.pbkdf2);
const randomBytes = util.promisify(crypto.randomBytes);
const toHex = (val: Buffer) => val.toString('hex');

type Checker = ReturnType<(typeof AuthUtil)['permissionChecker']>;

export class AuthUtil {

  private static CHECK_CACHE = new Map<string, [Checker, Checker]>();

  static generateHash(password: string, salt: string, iterations = 25000, keylen = 256, digest = 'sha256') {
    return pbkdf2(password, salt, iterations, keylen, digest).then(toHex);
  }

  static generateSalt(len: number = 32) {
    return randomBytes(len).then(toHex);
  }

  static async generatePassword(password: string, saltLen = 32, validator?: (password: string) => boolean | Promise<boolean>) {
    if (!password) {
      throw new AppError('Password is required', 'data');
    }

    if (validator !== undefined) {
      if (!(await validator(password))) {
        throw new AppError('Password is invalid', 'data');
      }
    }

    const salt = await this.generateSalt(saltLen);
    const hash = await this.generateHash(password, salt);

    return { salt, hash };
  }

  static permissionChecker(perms: string[] | Set<string>, matchAll = true, defaultIfEmpty = true) {
    const permArr = [...perms].map(x => x.toLowerCase());
    const permSet = new Set(permArr);
    if (permArr.length === 0) {
      return () => defaultIfEmpty;
    }
    return matchAll ?
      (uPerms: Set<string>) => !permArr.find(x => !uPerms.has(x)) :
      (uPerms: Set<string>) => !!permArr.find(x => uPerms.has(x));
  }

  static permissionSetChecker(include: string[] | Set<string>, exclude: string[] | Set<string>, matchAll = true) {
    const incKey = Array.from(include).sort().join(',');
    const excKey = Array.from(include).sort().join(',');

    if (!this.CHECK_CACHE.has(incKey)) {
      this.CHECK_CACHE.set(incKey, [AuthUtil.permissionChecker(include, true, true), AuthUtil.permissionChecker(include, false, true)]);
    }
    if (!this.CHECK_CACHE.has(excKey)) {
      this.CHECK_CACHE.set(excKey, [AuthUtil.permissionChecker(exclude, true, false), AuthUtil.permissionChecker(exclude, false, false)]);
    }

    const includes = this.CHECK_CACHE.get(incKey)![matchAll ? 1 : 0];
    const excludes = this.CHECK_CACHE.get(excKey)![matchAll ? 1 : 0];

    return (perms: Set<string>) => includes(perms) && !excludes(perms);
  }
}