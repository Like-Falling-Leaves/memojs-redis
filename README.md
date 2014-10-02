# memojs-redis

This is a simple REDIS plugin for the [memojs](https://github.com/like-falling-leaves/memojs) library.
[![NPM info](https://nodei.co/npm/memojs-redis.png?downloads=true)](https://npmjs.org/package/memojs-redis)


## Install

    npm install memojs
    npm install memojs-redis


## Usage -- Own REDIS Client 

```javascript
   var redis = require('redis');
   var redisClient = redis.createClient( ... your args ..);

   var memojs = require('memojs');
   var store = require('memojs-redis')(null, {redisClient: yourRedisClient});
   memjos.configure({store: store};
}
```

## Usage -- using redis parameters

```javascript
   var memojs = require('memojs');
   var store = require('memojs-redis')(null, {redisArgs: [port, host, {auth_pass: password}]});
   memjos.configure({store: store};
}
```

## Usage -- specifying TTL for cache keys

```javascript
   var memojs = require('memojs');
   var store = require('memojs-redis')(null, {redisArgs: [port, host, {auth_pass: password}]});
   memjos.configure({store: store, maxAge: 24 * 60 * 60};
}
```

