BEGIN;

CREATE TABLE blobs (
    prim_key INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
  , "key" TEXT NOT NULL
  , value BLOB NOT NULL
  , UNIQUE(prim_key)
    UNIQUE("key")
);

CREATE TABLE domains (
    prim_key INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
  , domain TEXT NOT NULL
  , UNIQUE(prim_key)
    UNIQUE(domain)
);

CREATE TABLE "observations" (
    prim_key INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
  , domain INTEGER NOT NULL
  , UNIQUE(prim_key ASC)
);


COMMIT;