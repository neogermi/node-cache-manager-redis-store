import { createClient } from 'redis';

const redisStore = (...args) => {
  if (!args[0].client) {
    throw new Error('No Redis client found');
  }

  const redisCache = args[0].client;
  const storeArgs = { ...args[0], ...redisCache.options };

  return {
    name: 'redis',
    getClient: () => redisCache,
    set: function(key, value, options = {}) {
      const self = this;

      if (!self.isCacheableValue(value)) {
        return cb(new Error(`"${value}" is not a cacheable value`));
      }

      const ttl = (options.ttl || options.ttl === 0) ? options.ttl : storeArgs.ttl;
      const val = JSON.stringify(value) || '"undefined"';

      if (ttl) {
        return redisCache.setEx(key, ttl, val);
      } else {
        return redisCache.set(key, val);
      }
    },
    mset: function mset() {
      throw new Error('not supported, please contribute');
    },
    get: (key, options = {}) => {
      return redisCache.get(key).then(_parseResponse);
    },
    mget: (...args) => {
      throw new Error('not supported, please contribute');
    },
    del: (...args) => {
      return redisCache.del(...args);
    },
    reset: cb => {
      return redisCache.flushDb('SYNC');
    },
    keys: (pattern = '*') => {
      return redisCache.keys(pattern);
    },
    ttl: (key, cb) => {
      throw new Error('not supported, please contribute');
    },
    isCacheableValue: storeArgs.is_cacheable_value || (value => value !== undefined && value !== null),
  };
};

function _parseResponse(result) {
  const isMultiple = Array.isArray(result);
  result = isMultiple ? result : [result];

  result = result.map(JSON.parse);

  return isMultiple ? result : result[0];
}

const methods = {
  create: (...args) => redisStore(...args),
};

export default methods;
