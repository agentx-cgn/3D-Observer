require('dotenv').config();
const path = require('path');

!process.env.DATABASE_STORAGE && console.warn('EX.env.missing');
 process.env.DATABASE_STORAGE && console.log('EXP.storage', process.env.DATABASE_STORAGE);

const databaseConfig = {
  database:  process.env.DATABASE_NAME ?? '',
  username:  process.env.DATABASE_USER ?? '',
  password:  process.env.DATABASE_PASSWORD ?? '',
  params: {
    dialect: process.env.DATABASE_ENGINE ?? '',
    storage: path.join(__dirname, process.env.DATABASE_STORAGE ?? ''),

    // dialectModulePath: '@journeyapps/sqlcipher',
    // define: {
    //   underscore: process.env.DATABASE_FUNCTION_DEFINE
    // },
    // operatorAliases: process.env.OPERATOR_ALIASES
  }
}

module.exports = databaseConfig;
