

export type TPayload = string | number | boolean | IConfig;

export type TSender = 'electron' | 'express' | 'browser';
export type TBusType = 'mainport' | 'process' | 'child' | 'clientport';

type TTopic = 'ping' | 'config' | 'ack';
type TReceivers = TSender;

export interface IMessage<T> {
  topic: TTopic;
  sender?: TSender;
  receiver: TReceivers;
  payload: T;
}

export interface IConfig {

  args: string[];
  serve: boolean;
  isDevelopment: boolean;
  isAsar: boolean;
  isDev: boolean;
  isPacked: boolean;

  screen?: {
    workAreaSize: {
      width: number,
      height: number
    },
    rotation: number,
    scaleFactor: number
  }

  thisYear: number;

  filePreload: string;
  fileServers?: string;
  fileExpress: string;
  fileDB?: string

  pathResources: string;
  pathApp?: string;
  pathData?: string

  api?: {
    root: string;
    port: number;
    ip: string;
    protocol: string;
    family: string;
  }
}
