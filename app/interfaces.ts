

export type TPayload = string | number | boolean | IConfig;

export type TSender = 'electron' | 'express' | 'browser';
// type TSenders = TSender | TSender[];
type TTopic = 'ping' | 'config';
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

  thisYear: number;

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
