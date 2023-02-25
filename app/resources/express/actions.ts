import Bus from "../../bus";
import { IApiRequest, IConfig, IGraphData, IMessage } from "../../interfaces";
import axios, { AxiosResponse } from "axios";
// import sqlite3 from 'sqlite3';
import { Database, OPEN_READWRITE, RunResult } from 'sqlite3';

const Actions = function (cfg: IConfig): any {

  let
    self: any,
    bus:  Bus,
    DB:   Database
  ;

  return self = {

    init: function () {},
    listen: function (busInstance: Bus) {

      bus = busInstance

      DB = new Database(cfg.fileDBTarget, OPEN_READWRITE, (err) => {
        if (err) {
          console.error('EX.DB.error', err.message);
        } else {
          console.log('EXP.DB.success');
        }
      });

      bus.on('request',   self.onRequest);
      bus.on('graphdata.set', self.onGraphdataSet);
      bus.on('graphdata.get', self.onGraphdataGet);

      return self;

    },


    // requests data from given endpoint
    async onGraphdataGet(msg: IMessage<IGraphData>) {

      const sql = `SELECT value FROM blobs WHERE key = 'graphdata' LIMIT 1;`

      DB.get(sql, function(err, data) {
        if (err) {
          console.error('ACT.db.get', msg.topic, sql.slice(0, 30));
        } else {
          if (data) {
            console.log('ACT.db.get', msg.topic, sql);
            bus.emit({
              topic:    msg.topic,
              receiver: msg.sender,
              payload:  JSON.parse(data.value)
            })
          } else {
            console.warn('ACT.db.get.nodata', msg.topic, sql, data);

          }
        }
       });

    },

    async onGraphdataSet(msg: IMessage<IGraphData>) {

      const sql = `
        REPLACE INTO blobs (key, value)
        VALUES('graphdata', '${JSON.stringify(msg.payload)}');
      `;

      DB.run(sql, (result: RunResult, err: Error) => {
        if (err) {
          console.error('ACT.db.run', msg.topic, sql.slice(0, 30));
        } else {
          console.log('ACT.db.success', msg.topic, sql.trim().slice(0, 60));
        }
      });

    },

      // requests json from given endpoint and sends reponse
    async onRequest(msg: IMessage<IApiRequest>) {

      const url = `https://${msg.payload.domain}${msg.payload.endpoint}`

      console.log('ACT.request', msg.topic, url);

      return axios.get<Promise<AxiosResponse<any, any>>>(url) //('https://berlin.social/api/v1/instance/peers')
        .then( (res) => {

          if ( res.status === 200 ) {

            const payload = { status: res.status, headers: res.headers, body: res.data, ...msg.payload }

            bus.emit({
              topic:    'response',
              receiver:  msg.sender,
              payload,
            })

          } else {
            console.log('AXIOS.failed', res.status, res.statusText, url)

          }

        })

        .catch(function (error) {
          // handle error
          console.log('AXIOS', error, url);
          return { error };
        })

        .finally(function () { })
      ;

    }


  };





}

export { Actions }
