import axios, { AxiosResponse } from "axios";

import { PromisedDatabase } from './libs/promised-database'
import { IApiRequest, IConfig, IGraphData, IMessage, IObsStatsServers, IResStatsServer } from "../../interfaces";
import Bus from "../../bus";

// https://github.com/tguichaoua/promised-sqlite3/blob/master/src/PromisedDatabase.ts

const Actions = function (cfg: IConfig): any {

  const
    timeout    = 5_000,
    trim       = (sql: string) => sql.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60),
    capitalize = (s: string)   => s && s[0].toUpperCase() + s.slice(1)
  ;

  const endpoints = [
    { label: 'activity',              endpoint: '/api/v1/instance/activity' },
    { label: 'blocks',                endpoint: '/api/v1/instance/domain_blocks' },
    { label: 'descriptionHTML',       endpoint: '/api/v1/instance/extended_description' },
    { label: 'peers',                 endpoint: '/api/v1/instance/peers' },
    { label: 'rules',                 endpoint: '/api/v1/instance/rules' },
    { label: 'links',                 endpoint: '/api/v1/trends/links' },
    { label: 'statuses',              endpoint: '/api/v1/trends/statuses' },
    { label: 'tags',                  endpoint: '/api/v1/trends/tags' },
    { label: 'instance',              endpoint: '/api/v2/instance' },
  ];

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

      bus.on<IApiRequest>('request',                self.onRequest)
      bus.on('graphdata.set',          self.onGraphdataSet)
      bus.on<IGraphData>('graphdata.get',          self.onGraphdataGet)
      bus.on<IObsStatsServers>('observe.stats.servers',  self.onObserveStatsServers)

      return self;

    },

    // requests data from given endpoint
    async onGraphdataGet(msg: IMessage<IGraphData>) {

      const sql = `SELECT value FROM blobs WHERE key = 'graphdata' LIMIT 1;`

      try {

        const row = await DB.get(sql);

        if (row) {
          console.log('ACT.db.get', msg.topic, sql)
          bus.emit<IGraphData>({
            topic:    msg.topic,
            receiver: msg.sender,
            payload:  JSON.parse(row.value)
          })

        } else {
          console.warn('ACT.db.get.nodata', msg.topic, trim(sql), row);

        }


      } catch (err) {
        console.error('ACT.db.get.error', msg.topic, trim(sql), err);

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

      } catch (err) {
        console.error('ACT.db.run', msg.topic, trim(sql), err)

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
            bus.send('response', msg.sender, payload)

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

    onObserveStatsServers(msg: IMessage<IObsStatsServers>) {

      msg.payload.domains.map(async domain => {
        const stats = await self.getStatsServer(domain)
        bus.send<IResStatsServer>('stats.server', msg.sender, stats)
      });

    },

    async getStatsServer(domain: string): Promise<IResStatsServer> {

      const controller = new AbortController();
      const cancel     = setTimeout( controller.abort, timeout );
      const promises   = endpoints.map( async ({ label, endpoint }) => {

        const url = `https://${domain}${endpoint}`

        return axios({ url, timeout, signal: controller.signal })
          .then( res => {

            if (res.status === 200) {
              return { label, status: res.status, headers: res.headers, url: res.config.url, body: res.data }

            } else {
              console.log('AXIOS.failed', res.status, res.statusText, res.config.url)

            }

          })
          .catch(err => {

            const { status, code, name, message } = err;

            if (code === 'ERR_BAD_REQUEST') {
              return { label, status: 404, code, name, message, url }

            } else {
              console.log('stats.get.catch', domain, endpoint, message);
              return { label, status, code, name, message }

            }

          })
        ;

      })

      const stats = self.mapperStats(domain, (await Promise.all(promises)))

      clearTimeout(cancel)

      return { domain, stats }

    },

    // combines all requestst on server
    mapperStats (domain: string, results: any[]): any {

      return results.reduce( (accu, item) => {

        const mapper = self['mapper' + capitalize(item.label)]

        if (item.label === 'instance' && item.status === 200) {
          accu = { ...accu, ...mapper(item) }

        } else {
          accu[item.label] = (item.status === 200) && mapper
            ? mapper(item)
            : item

        }

        return accu

      }, { domain })

    },

    mapperDescriptionHTML: (item: any) => item.body.content,
    mapperStatuses:    (item: any) => item.body,
    mapperTags:        (item: any) => item.body,
    mapperBlocks:      (item: any) => item.body,
    mapperActivity:    (item: any) => item.body,
    mapperPeers:       (item: any) => item.body,
    mapperLinks:       (item: any) => item.body,
    mapperRules:       (item: any) => item.body.map( (d: any) => d.text ),
    mapperInstance:    (item: any) =>  {
      const b = item.body
      return {
        languages:      b.languages,
        thumbnail:      b.thumbnail.url,
        registrations:  b.registrations,
        description:    b.description,
        title:          b.title,
        activeUser:     b.usage.users.active_month
      }
    }

  };

}

export { Actions }
