/*
 * @Author: thomasyxy
 * @Date: 2020-11-20 15:24:46
 * @LastEditTime: 2020-11-20 16:22:01
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 */
'use strict';

import { resolve } from 'path';
import * as createHandler from 'node-gitlab-webhook';
import isPlainObject from 'lodash/isPlainObject';
import forEach from 'lodash/forEach';

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

  if (isPlainObject(event)) {
    forEach(event, (e, eventName) => {
      if (typeof e === 'function') {
        handler.on(eventName, e);
      } else if (typeof e === 'string') {
        handler.on(eventName, require(resolve(e)));
      }
    });
  }

  return handler;
};
