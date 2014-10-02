var redis = require('redis');
var clients = {};

module.exports = function createRedisStoreForMemoJS(previousStore, opts) {
  function getClient(options, dontRecurse) {
    options = options || {};
    if (options.redisClient) return options.redisClient;
    if (options.redisArgs) {
      var key = JSON.stringify(options.redisArgs);
      if (clients[key]) return clients[key];
      clients[key] = redis.createClient.apply(redis, options.redisArgs);
      return clients[key];
    }
    if (dontRecurse) return redis.createClient();
    return getClient(opts, true);
  }

  function getKey(options, key, done) {
    var client = getClient(options);
    client.multi().get(key).ttl(key).exec(function (err, replies) {
      if (err) return done(err);
      if (replies === null || replies[0] === null) return done('Not Found');
      var entry = {value: replies[0], expires: new Date().getTime()};
      var ttl = replies[1];
      if (ttl > 0) entry.expires += ttl * 1000; else expires += 365 * 24 * 3600 * 1000;
      return done(null, options.deserialize(entry.value), entry);
    });
  }

  function setKey(options, key, entry, done) {
    var client = getClient(options);
    var value = entry && options.serialize(entry.value);
    if (!entry || value === undefined || value === null) {
      client.del(key, function (err) { return done(err); });
      return;
    }

    var multi = client.multi().set(key, value);
    if (entry.expires) multi.expire(key, Math.floor((entry.expires - new Date().getTime()) / 1000));
    multi.exec(function (err, replies) {
      if (err || !replies || replies[0] != 'OK') return done && done (err || 'An internal error occured in REDIS');
      return done && done(null, value, {value: value, expires: entry.expires});
    });
    return {value: value, expires: entry.expires};
  }

  function setter(key, options, value) {
    if (value === undefined || options.maxAge === 0) {
      setKey(options, key);
      return;
    }
    var expires = (options.maxAge < 0) ? 0 : (new Date().getTime() + options.maxAge * 1000);
    var entry = {expires: expires, value: value};
    return setKey(options, key, entry);
  }

  function chainedSetter(key, options, value) {
    if (previousStore) previousStore.set(key, options, value);
    return setter(key, options, value);
  }

  function getter(key, options, done) {
    getKey(options, key, function (err, val, entry) {
      if (err) return done('Not Found');
      return done(null, val, entry);
    });
  }

  function chainedGetter(key, options, done) {
    getter(key, options, function (err, val, ret) {
      if (!err || !previousStore) return done(err, val, ret);
      return previousStore.get(key, options, onReadThrough);
    });

    function onReadThrough(err, value, entry) {
      if (err) return done(err, value, entry);
      var now = new Date().getTime();
      if (entry && entry.expires < now) return done(err, value, entry);
      
      var newOptions = Object.create(options);
      newOptions.maxAge = Math.floor((entry.expires - now) / 1000);
      return done(err, value, setter(key, newOptions, value));
    }
  }

  return {set: chainedSetter, get: chainedGetter};
}
