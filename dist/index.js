'use strict';

require('redis');

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

var redisStore = function redisStore() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!args[0].client) {
    throw new Error('No Redis client found');
  }

  var redisCache = args[0].client;

  var storeArgs = _objectSpread2({}, args[0], {}, redisCache.options);

  return {
    name: 'redis',
    getClient: function getClient() {
      return redisCache;
    },
    set: function set(key, value) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var self = this;

      if (!self.isCacheableValue(value)) {
        return cb(new Error("\"".concat(value, "\" is not a cacheable value")));
      }

      var ttl = options.ttl || options.ttl === 0 ? options.ttl : storeArgs.ttl;
      var val = JSON.stringify(value) || '"undefined"';

      if (ttl) {
        return redisCache.setEx(key, ttl, val);
      } else {
        return redisCache.set(key, val);
      }
    },
    mset: function mset() {
      throw new Error('not supported, please contribute');
    },
    get: function get(key) {
      return redisCache.get(key).then(_parseResponse);
    },
    mget: function mget() {
      throw new Error('not supported, please contribute');
    },
    del: function del() {
      return redisCache.del.apply(redisCache, arguments);
    },
    reset: function reset(cb) {
      return redisCache.flushDb();
    },
    keys: function keys() {
      var pattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';
      return redisCache.keys(pattern);
    },
    ttl: function ttl(key, cb) {
      throw new Error('not supported, please contribute');
    },
    isCacheableValue: storeArgs.is_cacheable_value || function (value) {
      return value !== undefined && value !== null;
    }
  };
};

function _parseResponse(result) {
  var isMultiple = Array.isArray(result);
  result = isMultiple ? result : [result];
  result = result.map(JSON.parse);
  return isMultiple ? result : result[0];
}

var methods = {
  create: function create() {
    return redisStore.apply(void 0, arguments);
  }
};

module.exports = methods;
