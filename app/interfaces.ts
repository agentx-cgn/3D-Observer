
import * as THREE  from 'three';

// export type TPayload =
//   string |
//   null |
//   // number |
//   // boolean |
//   IConfig |
//   IApiRequest |
//   IApiResponse |
//   IApiStatsResponse |
//   IObsStatsServers | IResStatsServer |
//   IGraphData
// ;

// export type TTopic =
//   'ping' |
//   'ack' |
//   'config' |
//   'request' |
//   'response' |
//   'stats.get' |
//   'observe.stats.servers' |
//   'stats.server' |
//   'graphdata.set' |
//   'graphdata.get' |
//   'content-tab-1' |
//   'content-tab-2' |
//   'last'
// ;

// export type TSender   = 'electron' | 'express' | 'browser';
// export type TReceiver = TSender;
// export type TMsgFilter1 = ( msg: IMessage<TPayload> ) => boolean;
export type TMsgFilter = ( msg: TMessage ) => boolean;


export type TMessenger = 'electron' | 'express' | 'browser';

interface IMsg {
  sender?: TMessenger;
  receiver: TMessenger;
}

export interface IMReqServerStats extends IMsg {
  topic: 'req:server:stats'
  payload: {
    domains: string[]
  }
}

export interface IMResServerStats extends IMsg {
  topic: 'res:server:stats'
  payload: {
    domain: string
    stats: any
  }
}

export interface IMConfig extends IMsg {
  topic: 'config'
  payload: IConfig
}

export interface IMGraphData extends IMsg {
  topic: 'set:graphdata' | 'get:graphdata'
  payload: IGraphData | null
}

export interface IMAck extends IMsg {
  topic: 'ack'
  payload: null
}

export interface IMSetTab extends IMsg {
  topic: 'set:tab:1' | 'set:tab:2'
  payload: any
}


export type TMessage =
    IMReqServerStats
  | IMResServerStats
  | IMConfig
  | IMGraphData
  | IMAck
  | IMSetTab





// export interface IMessage<T> {
//   topic: TTopic;
//   sender?: TSender;
//   receiver: TReceiver;
//   payload: T;
// }

// export interface IObsStatsServers {
//   domains: string[]
// }

// export interface IResStatsServer {
//   domain: string,
//   stats: any
// }

// export interface IApiStatsResponse {
//   domain: string
//   data: any[]
// }

// export interface IApiRequest {
//   domain: string
//   endpoint: string
// }

// export interface IApiResponse {
//   domain: string
//   endpoint: string
//   status?: number
//   headers?: Record<string, string>
//   body?: any
//   error?: any
// }

export interface IGraphData {
  nodes: INode[]
  links: ILink[]
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

  api: {
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
  index?: number
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
