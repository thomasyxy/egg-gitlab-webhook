import { Context } from 'egg';
import { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'events';

const assert = require('assert');
const crypto = require('crypto');
const bufferEq = require('buffer-equal-constant-time');
const parse = require('co-body');

interface CreateHandlerOptions {
  path: string;
  secret: string;
  events?: string | string[];
}

interface handler extends EventEmitter {
  (ctx: Context, next: () => Promise<any>);
}

function getEvents(options: CreateHandlerOptions): string[] | void {
  if (typeof options.events == 'string' && options.events != '*') {
    return [options.events];
  } else if (Array.isArray(options.events) && options.events.indexOf('*') == -1) {
    return options.events;
  }
}

async function bodyParser(req: IncomingMessage) {
  switch (req.headers['content-type']) {
    case 'application/json':
      return await parse.json(req);
    case 'application/x-www-form-urlencoded':
      return await parse.form(req);
    default:
      return await parse(req);
  }
}

function create(options: CreateHandlerOptions): handler {
  assert(typeof options === 'object', 'must provide an options object');
  assert(typeof options.path === 'string', "must provide a 'path' option");
  assert(typeof options.secret === 'string', "must provide a 'secret' option");

  const events = getEvents(options);

  const handler = async function (ctx: Context, next: () => Promise<any>) {
    const req: IncomingMessage = ctx.req;

    if (req.url.split('?').shift() !== options.path || req.method !== 'POST') {
      await next();
      return;
    }

    function hasError(msg) {
      ctx.status = 400;
      ctx.body = `{"error":"${msg}"}`;

      // const err = new Error(msg);

      // handler.emit('error', err, req);
    }

    const sig = req.headers['x-gitlab-token'],
      event = req.headers['x-gitlab-event'];

    if (!sig) {
      return hasError('No x-gitlab-token found on request');
    }

    if (!event) {
      return hasError('No x-gitlab-event found on request');
    }

    if (typeof event === 'string' && events && events.indexOf(event) == -1) {
      return hasError('x-gitlab-event is not acceptable');
    }

    const data = await bodyParser(req);

    if (sig !== options.secret) {
      return hasError('x-gitlab-token does not match blob signature');
    }

    ctx.status = 200;
    ctx.body = '{"ok":true}';

    if (typeof event === 'string') {
      const emitData = {
        event,
        payload: data,
        // @ts-ignore
        protocol: req.protocol,
        host: req.headers.host,
        url: req.url,
        ctx,
      };

      console.log('事件名：' + event);
      console.log(JSON.stringify(data));
      handler.emit(event, emitData);
      handler.emit('*', emitData);
    }
  };

  // make it an EventEmitter, sort of
  handler.__proto__ = EventEmitter.prototype;
  handler.emit = EventEmitter.prototype.emit;
  EventEmitter.call(handler);

  handler.sign = sign;

  function sign(data) {
    return (
      'sha1=' + crypto.createHmac('sha1', options.secret).update(JSON.stringify(data)).digest('hex')
    );
  }

  // @ts-ignore
  return handler;
}

module.exports = create;
