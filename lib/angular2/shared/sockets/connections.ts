/* tslint:disable */
import { Injectable, Inject } from '@angular/core';
import { SocketDriver } from './socket.driver';
import { AccessToken } from '../models';
/**
* @author Jonathan Casarrubias <twitter:@johncasarrubias> <github:@johncasarrubias>
* @module SocketConnections
* @license MIT
* @description
* This module handle socket connections and return singleton instances for each
* connection, it will use the SDK Socket Driver Available currently supporting
* Angular 2 for web and NativeScript 2.
**/
@Injectable()
export class SocketConnections {
  private _connections: any = {};
  private _socketReconnectTimeout: any;

  constructor(@Inject(SocketDriver) private driver: SocketDriver) {
  }

  getHandler(url: string, token: AccessToken) {
    if (!this._connections[url]) {
      let config: any = {log: false, secure: false, forceWebsockets: true, reconnection: false, forceNew: true};

      this._connections[url] = this.driver.connect(url, config);
      let socket: any/*SocketIOClient.Socket*/ = this._connections[url];
      socket.on('connect_error', this._handlerErrorAndReconnect("connect_error", socket));
      socket.on('connect_timeout', this._handlerErrorAndReconnect("connect_timeout", socket));
      socket.on('reconnect_error', this._handlerErrorAndReconnect("reconnect_error", socket));
      socket.on('reconnect_failed', this._handlerErrorAndReconnect("reconnect_failed", socket));
      socket.on('disconnect', this._handlerErrorAndReconnect("disconnect", socket));
      socket.on('connect', () => {
        console.log("Socket connected");
        if (token.id) {
          console.log("Socket emit authentication");
          socket.emit('authentication', token);
        }
      });
      socket.on('unauthorized', (res: any) => console.error('Unauthenticated', res));
      setInterval(() => {
        if (socket.connected) {
          socket.emit('lb-ping');
        }
      }, 15000);
      socket.on('lb-pong', (data: any) => console.info('Heartbeat: ', data));
    }

    return this._connections[url];
  }

  private _handlerErrorAndReconnect(name, socket) {
    return (error?) => {
      console.log(`Socket ${name}`, error);
      this._socketReconnect(socket);
    };
  }

  private _socketReconnect(socket) {
    if (this._socketReconnectTimeout != null) {
      clearTimeout(this._socketReconnectTimeout);
      this._socketReconnectTimeout = null;
    }
    this._socketReconnectTimeout = setTimeout(() => {
      socket.connect();
    }, 4000);
  }
}
