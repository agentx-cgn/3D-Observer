

export type TPayload = string | number | boolean | IConfig | IApiRequest | IApiResponse;

export type TSender  = 'electron' | 'express' | 'browser';
// export type TBusType = 'mainport' | 'process' | 'child' | 'clientport';
export type TTopic   = 'ping' | 'config' | 'ack' | 'request' | 'response';

export type TMsgFilter = ( msg: IMessage<TPayload> ) => boolean;

export type TReceiver = TSender;

export interface IMessage<T> {
  topic: TTopic;
  sender?: TSender;
  receiver: TReceiver;
  payload: T;
}

export interface IApiRequest {
  server: string
  endpoint: string
}

export interface IApiResponse {
  server: string
  endpoint: string
  data: any
}

export interface IConfig {

  version: string

  args: string[];
  serve: boolean;
  isDevelopment: boolean;
  isAsar: boolean;
  isDev: boolean;
  isPacked: boolean;

  userLanguages: string[]

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
  fileServers: string;
  fileExpress: string;
  fileDBSource: string
  fileDBTarget: string

  pathResources: string;
  pathApp: string;
  pathData: string
  pathUser: string

  existsFileDBTarget: boolean
  existsFileDBSource: boolean

  api?: {
    root: string;
    port: number;
    ip: string;
    protocol: string;
    family: string;
  }
}
