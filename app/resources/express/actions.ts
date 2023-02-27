import Bus from "../../bus";
import { IApiRequest, IApiStatsRequest, IConfig, IGraphData, IMessage } from "../../interfaces";
import axios, { AxiosResponse } from "axios";
import { Database, OPEN_READWRITE, RunResult } from 'sqlite3';
import { PromisedDatabase } from './libs/promised-database'
import { timeout } from "rxjs";

// https://github.com/tguichaoua/promised-sqlite3/blob/master/src/PromisedDatabase.ts

const Actions = function (cfg: IConfig): any {

  const
    timeout = 5_000,
    trim = (sql: string) => sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
  ;

  let
    self: any,
    bus:  Bus,
    DB:   PromisedDatabase
  ;

  return self = {

    listen: async function (busInstance: Bus) {

      bus = busInstance

      DB = new PromisedDatabase()
      await DB.open(cfg.fileDBTarget)

      bus.on('request',       self.onRequest)
      bus.on('graphdata.set', self.onGraphdataSet)
      bus.on('graphdata.get', self.onGraphdataGet)
      bus.on('stats.get',     self.onStatsGet)

      return self;

    },

    // requests data from given endpoint
    async onGraphdataGet(msg: IMessage<IGraphData>) {

      const sql = `SELECT value FROM blobs WHERE key = 'graphdata' LIMIT 1;`

      try {

        const row = await DB.get(sql);

        if (row) {
          console.log('ACT.db.get', msg.topic, sql)
          bus.emit({
            topic:    msg.topic,
            receiver: msg.sender,
            payload:  JSON.parse(row.value)
          })

        } else {
          console.warn('ACT.db.get.nodata', msg.topic, trim(sql), row);

        }


      } catch (err) {
        console.error('ACT.db.get.error', msg.topic, trim(sql));

      }

    },

    async onGraphdataSet(msg: IMessage<IGraphData>) {

      const sql = `
        REPLACE INTO blobs (key, value)
        VALUES('graphdata', '${JSON.stringify(msg.payload)}');
      `;

      try {
        await DB.run(sql)
        console.log('ACT.db.success', msg.topic, trim(sql))

      } catch (e) {
        console.error('ACT.db.run', msg.topic, trim(sql))

      }

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

    },

    async onStatsGet(msg: IMessage<IApiStatsRequest>) {

      const controller = new AbortController();
      const cancel     = setTimeout( () => controller.abort(), timeout );
      // const mapData    = responses => responses.map( res => {
      //   if (res.status === 200) {
      //     return { status: res.status, headers: res.headers, url: res.config.url, body: res.data }
      //   } else if (res.status === 404) {
      //     return { status: res.status, statusText: res.statusText, url: res.config.url }
      //   } else {
      //     console.log('AXIOS.failed', res.status, res.statusText, res.config.url)
      //   }
      // })

      const endpoints = [
        '/api/v1/instance/activity',
        '/api/v1/instance/domain_blocks',
        '/api/v1/instance/extended_description',
        '/api/v1/instance/peers',
        '/api/v1/instance/rules',
        '/api/v1/trends/links',
        '/api/v1/trends/statuses',
        '/api/v1/trends/tags',
        '/api/v2/instance',
      ];

      const promises = endpoints.map( async endpoint => {

        const url = `https://${msg.payload.domain}${endpoint}`

        return axios({ url, timeout, signal: controller.signal })
          .then( res => {

            if (res.status === 200) {
              return { status: res.status, headers: res.headers, url: res.config.url, body: res.data }

            } else if (res.status === 404) {
              return { status: res.status, statusText: res.statusText, url: res.config.url }

            } else {
              console.log('AXIOS.failed', res.status, res.statusText, res.config.url)

            }

          })
          .catch(err => {
            const { status, code, name, message } = err;
            console.log('stats.get.catch', msg.payload.domain, endpoint, message);
            return { status, code, name, message }
          })
        ;


        // } catch (err) {
        //   console.error('stats.get.catch', err)
        //   return { status: err.status, statusText: err.statusText, url: err.config.url }
        //   // return { error: JSON.parse(JSON.stringify(err)) }
        // }

      })

      const data = await Promise.all(promises)

      //   // .then(mapData)
      //   .catch(err => console.error('stats.get.catch', err))
      //   .finally ( () => clearTimeout(cancel))
      // ;

      clearTimeout(cancel)

      bus.emit({
        topic:     msg.topic,
        receiver:  msg.sender,
        payload: { domain: msg.payload.domain, data }
      })

    }

  };

}

export { Actions }
