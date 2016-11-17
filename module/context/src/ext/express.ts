import { Context, Storage } from '../lib/context';
import { Request, Response } from 'express';

export function requestContext(req: Request, res: Response, next?: Function) {
  Storage.bindEmitter(req);
  Storage.bindEmitter(res);
  Storage.run(() => {
    Context.set({ req, res });
    if (next) {
      next();
    }
  });
}