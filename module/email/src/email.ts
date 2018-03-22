import * as nodemailer from 'nodemailer';
import * as Mustache from 'mustache';
import * as fs from 'fs';
import * as util from 'util';

import { TemplateMailOptions, TemplateContext } from './types';
import { Injectable } from '@travetto/di';
import { MailConfig } from './config';

const juice = require('juice');
const Inky = require('inky').Inky;

const readFilePromise = util.promisify(fs.readFile);

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  private partials: { [key: string]: string } = {};

  private wrappers: { [key: string]: string } = {};

  private cache: { [key: string]: { [key: string]: string } } = { base: {} };

  constructor(private config: MailConfig) { }

  async postConstruct() {
    let transport: nodemailer.Transport;
    if (!this.config.transport) {
      const mockTransport = require('nodemailer-mock-transport');
      transport = mockTransport();
    } else if (this.config.transport === 'sendmail') {
      const sendmailTransport = require('nodemailer-sendmail-transport');
      transport = sendmailTransport({ path: '/usr/sbin/sendmail' });
    } else {
      const smtpTransport = require('nodemailer-smtp-transport');
      transport = smtpTransport(this.config.transport);
    }

    this.transporter = nodemailer.createTransport(transport);

    await this.registerWrapperFile(require.resolve('../data/foundation.html'), 'base');
    await this.registerPartialFile(require.resolve('../data/foundationCss.html'));
  }

  async registerPartialFile(path: string, name?: string) {
    if (!name) {
      name = path.split('/').pop() as string;
    }
    const contents = await readFilePromise(path);
    this.registerPartial(name, contents.toString());
  }

  registerPartial(name: string, partial: string) {
    this.partials[name] = partial;
  }

  async registerWrapperFile(path: string, name?: string) {
    if (!name) {
      name = path.split('/').pop() as string;
    }
    const contents = await readFilePromise(path);
    this.registerWrapper(name, contents.toString());
  }

  registerWrapper(name: string, wrapper: string) {
    this.wrappers[name] = wrapper;
    this.cache[name] = {};
  }

  resolvePartials(template: string) {
    return template.replace(/\{\{>\s+(\S+)\s*\}\}/g, (all: string, name: string): any => {
      return this.resolvePartials(this.partials[name]);
    });
  }

  template(template: string, context: TemplateContext = {}) {

    const wrapperKey = context.wrapperName || 'base';

    if (!this.cache[wrapperKey][template]) {
      let html = this.wrappers[wrapperKey].replace('<!-- TEMPLATE -->', template);

      // Load templates
      html = this.resolvePartials(html);

      // The same plugin settings are passed in the constructor
      html = new Inky(this.config.inky).releaseTheKraken(html);

      // Extract CSS
      html = juice(html, { preserveImportant: true });

      // Collect remaining styles (should be media queries)
      const styles: string[] = [];
      html = html.replace(/<style[^>]*>[\s|\S]+<\/style>/g, function (style: string) {
        styles.push(style);
        return '';
      });

      // Move remaining styles into body
      html = html.replace('<!-- STYLES -->', styles.join('\n'));
      this.cache[wrapperKey][template] = html;
    }

    // Render final template
    return Mustache.render(this.cache[wrapperKey][template], context);
  }

  async sendEmail(contexts: TemplateMailOptions | TemplateMailOptions[], base?: TemplateMailOptions) {
    const arr = Array.isArray(contexts) ? contexts : [contexts];
    const promises = arr.map((ctx) => {
      if (base) {
        ctx = Object.assign({}, base, ctx);
        if (base.context) {
          ctx.context = Object.assign({}, base.context, ctx.context);
        }
      }

      if (ctx.body) {
        ctx.html = this.template(ctx.body, ctx.context);
        ctx.text = ctx.body.replace(/<[^>]+>/g, ' ');
      }

      if (ctx.subject) {
        ctx.subject = Mustache.render(ctx.subject, ctx.context);
      }

      return this.sendEmailRaw(ctx);
    });
    return Promise.all(promises);
  }

  async sendEmailRaw(options: nodemailer.SendMailOptions) {
    options = Object.assign({}, this.config.defaults, options);
    const tp = this.transporter;
    return (await util.promisify(tp.sendMail).call(tp, options)) as nodemailer.SentMessageInfo;
  }
}