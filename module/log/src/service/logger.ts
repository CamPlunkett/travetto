import * as log4js from 'log4js';
import * as path from 'path';
import * as fs from 'fs';
import * as util from 'util';

import { addLayout } from 'log4js/lib/layouts';
import { Injectable } from '@travetto/di';
import { LoggerConfig } from './config';
import { Layouts } from './layout';
import { isFileAppender } from '../types';
import { AppInfo } from '@travetto/base';

const exists = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);

@Injectable({
  autoCreate: { create: true, priority: 0 }
})
export class Logger {

  logger: log4js.Logger;

  constructor(private config: LoggerConfig) { }

  getLogger() {
    return this.logger;
  }

  async postConstruct() {

    for (const layout of Object.keys(Layouts)) {
      addLayout(layout, Layouts[layout]);
    }

    const [appenders, categories] = await Promise.all([
      this.buildAppenders(),
      this.buildCategories()
    ]);

    log4js.configure({
      appenders,
      categories
    });

    this.logger = log4js.getLogger();

    if (this.config.appenders.console) {
      this.bindToConsole();
    }
  }

  private async buildAppenders() {
    const appenders = {} as { [key: string]: log4js.Appender };

    for (const name of Object.keys(this.config.appenders)) {
      let conf = (this.config.appenders as any)[name];
      if (!conf.hasOwnProperty('enabled') || conf.enabled) {
        if (isFileAppender(conf)) {
          if (!conf.filename) {
            conf.filename = AppInfo.SIMPLE_NAME;
            if (conf.name) {
              conf.filename += `-${conf.name}`;
            }
            conf.filename += '.log';
          }
          if (!conf.filename!.startsWith('/')) {
            conf.filename = `${process.cwd()}/logs/${conf.filename}`;
            conf.absolute = true;
          }

          // Setup folder for logging
          const finalPth = path.dirname(path.resolve(conf.filename!));
          let start = finalPth.indexOf(path.sep, 3);
          while (start > 0) {
            const pth = finalPth.substring(0, start);
            if (!(await exists(pth))) {
              await mkdir(pth);
            }
            start = finalPth.indexOf(path.sep, start);
          }
        }

        if (conf.level) {
          appenders[`_${name} `] = conf;
          conf = {
            type: 'logLevelFilter',
            appender: `_${name} `,
            level: conf.level,
            maxLevel: conf.maxLevel || 'fatal'
          }
        }

        appenders[name] = conf!;
      }
    }

    return appenders;
  }

  private async buildCategories() {
    const out: { [key: string]: log4js.Category } = {};
    for (const name of Object.keys(this.config.categories)) {
      const cat = (this.config.categories as any)[name] as log4js.Category;
      if (typeof cat.appenders === 'string') {
        cat.appenders = (cat.appenders as string).split(',');
      }
      cat.appenders = cat.appenders
        .filter(x => this.config.appenders.hasOwnProperty(x) && (this.config.appenders as any)[x].enabled);
      if (cat.appenders.length) {
        out[name] = cat;
      }
    }

    return out;
  }

  private bindToConsole() {
    const override: boolean | null = this.config.appenders.console.replaceConsole;

    const logger = log4js.getLogger('console');
    if (override === null ? process.env.env !== 'test' : !!override) {
      if (logger) {
        for (const key of ['info', 'warn', 'error', 'debug']) {
          if (key in console && key in logger) {
            (console as any)[key] = (logger as any)[key].bind(logger);

          }
        }
        console.log = logger.info.bind(logger);
      }
    }
  }
}
