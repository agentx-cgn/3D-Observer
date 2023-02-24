
import * as THREE  from 'three';

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
  status?: number
  headers?: Record<string, string>
  body?: any
  error?: any
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

export type Coords = { x: number; y: number; z: number; };
export type TNodeType = 'server' | 'peers' | 'activities' | 'rules' | 'info';

export interface INode {
  id: string
  domain: string
  size: number
  type: TNodeType
  value: number
  x?: number
  y?: number
  z?: number
  __threeObj?: THREE.Object3D
}

export interface ILink {
  target: string
  source: string
  value: number
  width: number
}
