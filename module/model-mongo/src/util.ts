import * as mongo from 'mongodb';

import {
  WhereClause,
  ModelRegistry
} from '@travetto/model';

import { Class } from '@travetto/registry';
import { Util } from '@travetto/base';
import { BindUtil } from '@travetto/schema';

export class MongoUtil {

  static has$And = (o: any): o is ({ $and: WhereClause<any>[]; }) => '$and' in o;
  static has$Or = (o: any): o is ({ $or: WhereClause<any>[]; }) => '$or' in o;
  static has$Not = (o: any): o is ({ $not: WhereClause<any>; }) => '$not' in o;

  static extractTypedWhereClause<T>(cls: Class<T>, o: WhereClause<T>): { [key: string]: any } {
    const conf = ModelRegistry.get(cls);
    if (conf.subType) {
      o = { $and: [o, { type: conf.subType }] } as WhereClause<T>;
    }
    return this.extractWhereClause(o);
  }

  static extractWhereClause<T>(o: WhereClause<T>): { [key: string]: any } {
    if (this.has$And(o)) {
      return { $and: o.$and.map(x => this.extractWhereClause<T>(x)) };
    } else if (this.has$Or(o)) {
      return { $or: o.$or.map(x => this.extractWhereClause<T>(x)) };
    } else if (this.has$Not(o)) {
      return { $nor: [this.extractWhereClause<T>(o.$not)] };
    } else {
      return this.extractSimple(o);
    }
  }

  static replaceId<T>(v: T): T {
    if (typeof v === 'string') {
      return new mongo.ObjectId(v) as any as T;
    } else if (Array.isArray(v)) {
      return v.map(x => this.replaceId(x)) as any as T;
    } else if (Util.isPlainObject(v)) {
      const out: any = {};
      for (const k of Object.keys(v)) {
        out[k] = this.replaceId((v as any)[k]);
      }
      return out as T;
    } else {
      return v;
    }
  }

  static extractSimple<T>(o: T, path: string = ''): { [key: string]: any } {
    const out: { [key: string]: any } = {};
    const sub = o as { [key: string]: any };
    const keys = Object.keys(sub);
    for (const key of keys) {
      const subpath = `${path}${key}`;
      const v = sub[key];

      if (subpath === 'id') { // Handle ids directly
        out._id = this.replaceId(v);
      } else if ((Util.isPlainObject(v) && !Object.keys(v)[0].startsWith('$')) || (v && v.constructor && v.constructor.__id)) {
        Object.assign(out, this.extractSimple(v, `${subpath}.`));
      } else {
        if (v && Object.keys(v)[0] === '$regex') {
          v.$regex = BindUtil.extractRegex(v.$regex);
        }
        out[subpath] = v;
      }
    }
    return out;
  }
}