'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Redis = _interopDefault(require('redis'));

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

  var redisCache = args[0].client ? args[0].client : Redis.createClient.apply(Redis, args);

  var storeArgs = _objectSpread2({}, args[0], {}, redisCache.options);

  return {
    name: 'redis',
    getClient: function getClient() {
      return redisCache;
    },
    set: function set(key, value, options, cb) {
      var self = this;
      return new Promise(function (resolve, reject) {
        if (typeof options === 'function') {
          cb = options;
          options = {};
        }

        options = options || {};

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        if (!self.isCacheableValue(value)) {
          return cb(new Error("\"".concat(value, "\" is not a cacheable value")));
        }

        var ttl = options.ttl || options.ttl === 0 ? options.ttl : storeArgs.ttl;
        var val = JSON.stringify(value) || '"undefined"';

        if (ttl) {
          redisCache.setex(key, ttl, val, handleResponse(cb));
        } else {
          redisCache.set(key, val, handleResponse(cb));
        }
      });
    },
    mset: function mset() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var self = this;
      return new Promise(function (resolve, reject) {
        var cb;
        var options = {};

        if (typeof args[args.length - 1] === 'function') {
          cb = args.pop();
        }

        if (args[args.length - 1] instanceof Object && args[args.length - 1].constructor === Object) {
          options = args.pop();
        }

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        var ttl = options.ttl || options.ttl === 0 ? options.ttl : storeArgs.ttl;
        var multi;

        if (ttl) {
          multi = redisCache.multi();
        }

        var key;
        var value;
        var parsed = [];

        for (var i = 0; i < args.length; i += 2) {
          key = args[i];
          value = args[i + 1];
          /**
           * Make sure the value is cacheable
           */

          if (!self.isCacheableValue(value)) {
            return cb(new Error("\"".concat(value, "\" is not a cacheable value")));
          }

          value = JSON.stringify(value) || '"undefined"';
          parsed.push.apply(parsed, [key, value]);

          if (ttl) {
            multi.setex(key, ttl, value);
          }
        }

        if (ttl) {
          multi.exec(handleResponse(cb));
        } else {
          redisCache.mset.apply(redisCache, [].concat(parsed, [handleResponse(cb)]));
        }
      });
    },
    get: function get(key, options, cb) {
      return new Promise(function (resolve, reject) {
        if (typeof options === 'function') {
          cb = options;
        }

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        redisCache.get(key, handleResponse(cb, {
          parse: true
        }));
      });
    },
    mget: function mget() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return new Promise(function (resolve, reject) {
        var cb;
        var options = {};

        if (typeof args[args.length - 1] === 'function') {
          cb = args.pop();
        }

        if (args[args.length - 1] instanceof Object && args[args.length - 1].constructor === Object) {
          options = args.pop();
        }

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        redisCache.mget.apply(redisCache, [].concat(args, [handleResponse(cb, {
          parse: true
        })]));
      });
    },
    del: function del() {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return new Promise(function (resolve, reject) {
        var cb;
        var options = {};

        if (typeof args[args.length - 1] === 'function') {
          cb = args.pop();
        }

        if (args[args.length - 1] instanceof Object && args[args.length - 1].constructor === Object) {
          options = args.pop();
        }

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        redisCache.del.apply(redisCache, [].concat(args, [handleResponse(cb)]));
      });
    },
    reset: function reset(cb) {
      return redisCache.flushDb();
    },
    keys: function keys() {
      var pattern = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '*';
      var cb = arguments.length > 1 ? arguments[1] : undefined;
      return new Promise(function (resolve, reject) {
        if (typeof pattern === 'function') {
          cb = pattern;
          pattern = '*';
        }

        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        redisCache.keys(pattern, handleResponse(cb));
      });
    },
    ttl: function ttl(key, cb) {
      return new Promise(function (resolve, reject) {
        if (!cb) {
          cb = function cb(err, result) {
            return err ? reject(err) : resolve(result);
          };
        }

        redisCache.ttl(key, handleResponse(cb));
      });
    },
    isCacheableValue: storeArgs.is_cacheable_value || function (value) {
      return value !== undefined && value !== null;
    }
  };
};

function handleResponse(cb) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function (err, result) {
    if (err) {
      return cb && cb(err);
    }

    if (opts.parse) {
      var isMultiple = Array.isArray(result);

      if (!isMultiple) {
        result = [result];
      }

      result = result.map(function (_result) {
        try {
          _result = JSON.parse(_result);
        } catch (e) {
          return cb && cb(e);
        }

        return _result;
      });
      result = isMultiple ? result : result[0];
    }

    return cb && cb(null, result);
  };
}

var methods = {
  create: function create() {
    return redisStore.apply(void 0, arguments);
  }
};

module.exports = methods;
