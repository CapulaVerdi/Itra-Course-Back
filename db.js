import pgPromise from 'pg-promise';

const pgp = pgPromise(/* options */);
const db = pgp('postgres://user:pass@host:port/database');