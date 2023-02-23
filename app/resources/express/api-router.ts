// import express from 'express'
// import initServers from '../data/init-servers.json' assert {type: 'json'}
// import package_json from '../../package.json' assert {type: 'json'}

import * as express from "express";
import init_servers from './data/init-servers.json'
import package_json from '../../package.json'

// const express      = require(' express');
// const initServers  = require('./data/init-servers.json');
// const package_json = require('../../package.json')

const template = {
  'messages': [
    {
      'text':             '',
      'severity':         '',
      'code':             ''
    }
  ],
  'meta': {
    'language':          'en',
    'version':           package_json.version,
    'response_time':     0
  },
  'paging': {
    'pages':             0,
    'page':              1,   // 1 - based
    'length':            10,
    'total':             0,
    'sort':              ''
  },
  'data':                []
}

class Controller {

  async InitServer (req, res, next) {

    const t1 = Date.now();
    const container = { ...template }

    try {
      container.meta.language = req.query.lang ?? 'xx';
      container.data = init_servers;

      container.meta.response_time = Date.now() - t1
      return res.json(container);

    } catch (e) {

      console.error(e)

      const error = String(e)

      container.meta.response_time = Date.now() - t1
      container.messages = [
        { text: error, severity: 'error', code: '' }
      ]

      res.status(500).send(res.json(container))

    }

  }

}

const apiRouter  = express.Router()
const controller = new Controller()

apiRouter.get('/init-servers',      controller.InitServer)

// export default router
// module.exports = router;

export default apiRouter
