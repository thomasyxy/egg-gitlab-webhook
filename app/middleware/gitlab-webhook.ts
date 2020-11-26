/*
 * @Author: thomasyxy
 * @Date: 2020-11-20 15:24:46
 * @LastEditTime: 2020-11-23 20:36:44
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
'use strict';

import { resolve } from 'path';
const createHandler = require('../../lib/gitlab-webhook-handler');

interface IEvent {
  [eventName: string]: () => void;
}

interface IOption {
  path: string;
  secret: string;
  event?: IEvent;
}

module.exports = (option: IOption) => {
  const { path, secret, event } = option;
  const handler = createHandler({ path, secret });

  if (event) {
    (Object.keys(event) as string[]).forEach((e: any) => {
      if (typeof event[e] === 'function') {
        handler.on(e, event[e]);
      } else if (typeof event[e] === 'string') {
        handler.on(e, require(resolve(e)));
      }
    });
  }

  return handler;
};
