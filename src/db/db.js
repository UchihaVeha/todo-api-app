import knex from 'knex';
import Client from 'knex/lib/dialects/postgres';
import Formatter from 'knex/lib/formatter';
import { getDbConfig } from '../config';

Client.prototype.wrapIdentifier = value => {
  if (value === '*') return value;
  const matched = value.match(/(.*?)(\[[0-9]\])/);
  if (matched)
    return (
      Client.prototype.wrapIdentifier.wrapIdentifier(matched[1]) + matched[2]
    );
  return `"${value
    .replace(/([A-Z])/g, (_, s) => `_${s.toLowerCase()}`)
    .replace(/"/g, '""')}"`;
};

Formatter.prototype.wrapAsIdentifier = value =>
  `"${(value || '').replace(/"/g, '""')}"`;
const db = knex(getDbConfig());
/*
if (isDev || isTest) {
  db.on('query', queryData => {
    console.log('sql: ', queryData);
  });
 }
*/

export default db;
