import { createClass } from 'asteroid';
import moment from 'moment';
import sha512 from 'crypto-js/sha512';

class Comet {
  Asteroid = createClass();

  _asteroid = null;

  _host = 'localhost:3000';
  _ssl = false;
  _instance = '0';
  _showLogs = true;
  _logPrefix = 'app ->';
  _logTimestamp = true;

  _loginMethod = 'user.login';
  _resumeMethod = 'user.resume';
  _logoutMethod = 'user.logout';
  _logged = false;
  _token = '';
  _tokenKey = '';

  constructor() {
    if (!this.Asteroid.utils) {
      this.Asteroid.utils = {
        isEmail: string => string.indexOf('@') !== -1,
        must: {
          _toString: thing => {
            return Object.prototype.toString.call(thing).slice(8, -1);
          },

          beString: function(s) {
            var type = this._toString(s);
            if (type !== 'String') {
              throw new Error(
                'Assertion failed: expected String, instead got ' + type
              );
            }
          },

          beArray: function(o) {
            var type = this._toString(o);
            if (type !== 'Array') {
              throw new Error(
                'Assertion failed: expected Array, instead got ' + type
              );
            }
          },

          beObject: function(o) {
            var type = this._toString(o);
            if (type !== 'Object') {
              throw new Error(
                'Assertion failed: expected Object, instead got ' + type
              );
            }
          }
        }
      };
    }

    // this._token = localStorage.getItem(this._getTokenKey());
  }

  init = config => {
    config = config || {};
    const { ssl, host, log, logPrefix, loginMethod, instance } = config;

    this._host = host || this._host;
    this._ssl = ssl === 'true';
    this._instance = instance || this._instance;
    this._loginMethod = loginMethod || this._loginMethod;
    this._resumeMethod = loginMethod || this._resumeMethod;
    this._logoutMethod = loginMethod || this._logoutMethod;
    this._showLogs = log === undefined ? this._showLogs : log;
    this._logPrefix = logPrefix || this._logPrefix;

    if (!this._asteroid) {
      try {
        this._asteroid = new this.Asteroid({
          endpoint: `${this._ssl ? 'wss' : 'ws'}://${this._host}/websocket`
        });

        const _log = this._log;

        this._asteroid.on('connected', () => {
          _log(this._asteroid);
          _log('connected');
        });

        this._asteroid.on('disconnected', () => {
          _log(this._asteroid);
          _log('disconnected');
        });

        this._asteroid.on('reconnected', function() {
          _log('reconnected');
        });

        this._asteroid.on('login', function(idUser) {
          _log('login', idUser);
        });

        this._asteroid.on('logout', function() {
          _log('logout');
          // if (vbaConfig.stopSubscriptionsOnLogout) {
          //   self.stopSubscriptions();
          // }
        });

        this._asteroid.on('loginError', function(err) {
          console.log('loginError', err);
        });

        this._tokenKey = `${this._host}__${this._instance}__login_token__`;

        if (config.tokenKey) {
          this._tokenKey = config.tokenKey;
        }

        return this._asteroid;
      } catch (error) {
        return error;
      }
    }
  };

  _getTokenKey = () => this._tokenKey;

  _getExtraData = extra => {
    const key = this._getTokenKey();
    let token;
    if (extra === true) {
      token = localStorage.getItem(key);
    }

    return token;
  };

  _log = (method, type) => {
    if (this._showLogs) {
      type = type || 'info';
      let prefix = `${this._logPrefix}`;
      if (this._logTimestamp)
        prefix = `${moment().format('hh:mm:ss A')}. ${prefix}`;

      console[type](prefix, method);
    }
  };

  login = async (data, options = {}) => {
    if (options.encrypt) {
      data.password = sha512(data.password).toString();
    }
    const params = {
      password: data.password,
      user: {
        username: this.Asteroid.utils.isEmail(data.usernameOrEmail)
          ? undefined
          : data.usernameOrEmail,
        email: this.Asteroid.utils.isEmail(data.usernameOrEmail)
          ? data.usernameOrEmail
          : undefined
      }
    };
    try {
      return await this._asteroid
        .call(this._loginMethod, params)
        .then(response => {
          this._log({ method: this._loginMethod, response });
          const key = this._getTokenKey();
          localStorage.setItem(key, response.token);
          this._logged = true;
          this._token = response.token;
          return response;
        });
    } catch (err) {
      this._log(err, 'error');
      // throw err
      return { success: false, message: err.message, _err: err };
    }
  };

  resume = async () => {
    const key = this._getTokenKey();
    const token = localStorage.getItem(key);
    if (!token) {
      return Promise.reject('No login token');
    }

    try {
      const params = {
        resume: token
      };
      return await this._asteroid
        .call(this._resumeMethod, params)
        .then(response => {
          if (!response) {
            return Promise.reject('No server session');
          }
          this._log({ method: this._resumeMethod, response });
          this._token = response.token;
          return response;
        });
    } catch (err) {
      this._log(err, 'error');
      return Promise.reject({ code: 403, success: false, message: err });
    }
  };

  logout = async data => {
    data = data || {};
    const key = this._getTokenKey();
    data.token = localStorage.getItem(key);

    if (!data.token) {
      return Promise.reject('No session registered');
    }

    try {
      return await this._asteroid
        .call(this._logoutMethod, data)
        .then(response => {
          this._log({ method: this._logoutMethod, response });
          // this._asteroid._emit('logout');
          localStorage.removeItem(key);
          this._logged = false;
          this._token = '';
          return response;
        });
    } catch (err) {
      this._log(err, 'error');
      // throw err
      return { success: false, message: err.message, _err: err };
    }
  };

  call = async (method, data, config) => {
    config = config || {};
    data = data || {};

    data.extraData = this._getExtraData(true);

    try {
      return await this._asteroid.call(method, data).then(response => {
        this._log({ method, response });
        return response;
      });
    } catch (err) {
      this._log(err, 'error');
      // throw err
      return { success: false, message: err.message, _err: err };
    }
  };
}

export default new Comet();