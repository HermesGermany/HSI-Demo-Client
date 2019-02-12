/**
 * ## Controller for HSI
 *
 * @module hsi/controller
 */

'use strict';

const hsiRequest = require('axios-https-proxy-fix'),
  fs = require('fs'),
  fsPromises = require('fs').promises,
  path = require('path'),
  config = require('../../../lib/config'),
  model = require('./model.js');

const viewBase = path.join(path.dirname(__dirname), 'views');

const moduleConfig = config.modules.hsi;
const hsiConfig = moduleConfig.HSI;

let authData;
if (fs.existsSync('auth.json')) {
  authData = require(path.join(__dirname, '..', '..', '..', 'auth.json'));
}

/**
 * ### index page including login
 *
 * render the index page
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const index = async (req, res) => {
  let templateData = getServerData(req);
  let statusCode = 200;
  if (req.method === 'POST' && req.body && req.body.username) {
    templateData.post = {
      username: req.body.username,
      targetEnv: req.body.targetEnv
    };
    try {
      templateData.request = { };
      const authData = {
        username: req.body.username,
        password: req.body.password,
        client_id: req.body.username,
        client_secret: req.body.password,
        grant_type: 'password',
        realm: '/'
      };
      const uri = `${hsiConfig.authURL[req.body.targetEnv]}?${json2url(authData)}`;
      console.log(uri);
      const response = await hsiRequest({
        method: 'post',
        url: uri,
        headers: { accept: 'application/json', 'accept-language': req.getLocale() },
        data: { },
        proxy: moduleConfig.proxy
      });
      templateData.uri = uri;
      templateData.response = Object.assign({}, response.data);
      req.session.authData = response.data;
      req.session.username = req.body.username;
      req.session.authData.client_id = req.body.username;
      req.session.authData.client_secret = req.body.password;
      req.session.authData.targetEnv = req.body.targetEnv;
      req.session.authData.timestamp = new Date().getTime();
      // TODO: this should be stored in a database and connected with the specific user
      const saveData = JSON.stringify(req.session.authData, null, 2);
      await fsPromises.writeFile('auth.json', saveData);
    } catch (error) {
      req.session.authData = {};
      req.session.username = undefined;
      templateData.error = error;
      if (error.response && error.response.status) {
        statusCode = error.response.status;
      } else {
        statusCode = 500;
      }
    }
  }
  res.status(statusCode).render(path.join(viewBase, 'index.pug'), templateData);
};

/**
 * ### exec post request with data in request body
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const execPostRequest = async (req, res) => {
  let templateData = getServerData(req); // base data for template, more added below
  let statusCode = 200;
  let reqPath = req.path.replace(/^\/([^\/]+)\/.*/, '$1');
  if (req.method === 'POST' && req.body) {
    const hsiPath = hsiConfig[reqPath + 'Path'];
    templateData.post = req.body; // if required values are missing refill the form
    templateData.uri = `${hsiConfig.baseURL[req.session.authData.targetEnv]}${hsiPath}`; // hsi request uri
    templateData.uri = templateData.uri.replace(/:([^\/]+):/, (match, key) => req.body[key]); // replace link variable
    templateData.request = { // prepare request to HSI server
      method: 'post',
      url: templateData.uri,
      data: form2json(req.body) // collect data for request body from html form input
    };
    const result = await request(templateData.request, req); // process request
    if (result.response) {
      await processResponse(templateData, result.response);
    }
    if (result.error) {
      statusCode = processError(templateData, result);
    }
  }
  res.status(statusCode).render(path.join(viewBase, reqPath + '.pug'), templateData);
};

/**
 * ### exec get request with data in request params
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const execGetRequest = async (req, res) => {
  let templateData = getServerData(req);
  let statusCode = 200;
  let reqPath = req.path.replace(/^\/([^\/]+)\/.*/, '$1');
  if (req.method === 'POST' && req.body) {
    const hsiPath = hsiConfig[reqPath + 'Path'];
    templateData.post = req.body; // if required values are missing refill the form
    templateData.uri = `${hsiConfig.baseURL[req.session.authData.targetEnv]}${hsiPath}?${json2url(req.body)}`; // request uri
    templateData.request = { // prepare request to HSI server
      method: 'get',
      url: templateData.uri
    };
    const result = await request(templateData.request, req); // process request
    if (result.response) {
      await processResponse(templateData, result.response);
    }
    if (result.error) {
      statusCode = processError(templateData, result);
    }
  }
  res.status(statusCode).render(path.join(viewBase, reqPath + '.pug'), templateData);
};

/**
 * ### build a request from json data
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const jsoninput = async (req, res) => {
  let templateData = getServerData(req);
  let statusCode = 200;
  let reqPath = req.path.replace(/^\/([^\/]+)\/.*/, '$1');
  if (req.method === 'POST' && req.body) {
    templateData.post = req.body;
    try {
      const parsedJson = JSON.parse(req.body.jsonRequest);
      templateData.post = json2form(parsedJson.data);
      reqPath = req.body.route;
    } catch (error) {
      templateData.error = error;
      statusCode = 500;
    }
  }
  res.status(statusCode).render(path.join(viewBase, reqPath + '.pug'), templateData);
};

/**
 * ### logout user
 *
 * remove credentials and render the index page
 *
 * @param {object} req - request
 * @param {object} res - result
 */
const logout = async (req, res) => {
  await fsPromises.writeFile('auth.json', '{}');
  req.session.username = undefined;
  req.session.authData = {};
  res.redirect('/hsi/');
};

module.exports = {
  index: index,
  execPostRequest: execPostRequest,
  execGetRequest: execGetRequest,
  jsoninput: jsoninput,
  logout: logout
};

/**
 * Try to request data,
 * if '401 Unauthorized' try to refresh access token,
 * if success try again
 * else user has to login again
 *
 * @param {object} request - for HSI server request
 * @param {object} req - from browser with user session data
 */
async function request(request, req) {
  let result = { };
  const requestHeaders = request.data ? request.data.headers : {};
  request.headers = Object.assign({
    'Content-Type': 'application/json',
    'Authorization': req.session.authData.token_type + ' ' + req.session.authData.access_token,
    'Accept-Language': req.getLocale().toUpperCase()
  }, requestHeaders);
  if (request.data) {
    delete request.data.headers; // moved to request.headers - used for output type selection
  }
  if (moduleConfig.proxy) {
    request.proxy = moduleConfig.proxy;
  }
  try {
    result.response = await hsiRequest(request); // fire request - might fail if unautorized or other reason
  } catch (error) {
    result.error = error;
    if (error.response && error.response.status) {
      result.statusCode = error.response.status;
    } else {
      result.statusCode = 500;
    }
  }
  // refresh access token if 401 and refresh token available
  if (result.statusCode === 401 && authData.refresh_token) {
    delete result.error;
    result.statusCode = 200;
    try {
      const refreshData = {
        client_id: authData.client_id,
        client_secret: authData.client_secret,
        grant_type: 'refresh_token',
        refresh_token: authData.refresh_token,
        realm: '/'
      };
      const uri = `${hsiConfig.authURL[req.session.authData.targetEnv]}?${json2url(refreshData)}`;
      const response = await hsiRequest({
        method: 'post',
        url: uri,
        headers: { accept: 'application/json', 'accept-language': req.getLocale() },
        data: { },
        proxy: moduleConfig.proxy
      });
      console.log('Access Token refreshed');
      req.session.authData.access_token = response.data.access_token;
      req.session.authData.refresh_token = response.data.refresh_token;
      req.session.authData.timestamp = new Date().getTime();
      const saveData = JSON.stringify(req.session.authData, null, 2);
      await fsPromises.writeFile('auth.json', saveData);
      // retry request with the new access token
      request.headers.Authorization = req.session.authData.token_type + ' ' + req.session.authData.access_token;
      result.response = await hsiRequest(request);
    } catch (error) {
      result.error = error;
      if (error.response && error.response.status) {
        result.statusCode = error.response.status;
      } else {
        result.statusCode = 500;
      }
    }
  }
  delete request.proxy;
  return new Promise(resolve => resolve(result));
}

/**
 * save the response data to file system, copy information to template data
 *
 * @private
 * @param {object} data - for templates
 * @param {object} response - from HSI server request
 */
async function processResponse(templateData, response) {
  templateData.response = Object.assign({}, response.data); // use copy for labelImage ellipsize
  if (templateData.response.labelImage) { // shipment
    templateData.response.labelImage = templateData.response.labelImage.substr(0, 40) + '...';
    templateData.pdfFilename = path.join('shipments', templateData.response.shipmentID + '.pdf');
    await fsPromises.writeFile(
      path.join('public', templateData.pdfFilename),
      Buffer.from(response.data.labelImage, 'base64')
    );
  } else if (templateData.response.shippinglabel) { // return
    templateData.response.shippinglabel = templateData.response.shippinglabel.substr(0, 40) + '...';
    templateData.pdfFilename = path.join('shipments', templateData.response.shipmentID + '.pdf');
    await fsPromises.writeFile(
      path.join('public', templateData.pdfFilename),
      Buffer.from(response.data.shippinglabel, 'base64')
    );
  } else if (templateData.response.qrcode) { // return
    templateData.response.qrcode = templateData.response.qrcode.substr(0, 40) + '...';
    templateData.pngFilename = path.join('shipments', templateData.response.shipmentID + '.png');
    await fsPromises.writeFile(
      path.join('public', templateData.pngFilename),
      Buffer.from(response.data.qrcode, 'base64')
    );
  } else {
    templateData.jsonFilename = path.join('shipments', templateData.response.shipmentID + '.json');
    await fsPromises.writeFile(
      path.join('public', templateData.jsonFilename),
      JSON.stringify({ shipmentLabelData: response.data.shipmentLabelData }, null, 2)
    );
  }
}

/**
 * Get the information from error response
 *
 * @private
 * @param {object} templateData - for templates
 * @param {object} result - from HSI server request
 */
function processError(templateData, result) {
  templateData.error = result.error;
  if (result.error.response) {
    if (typeof result.error.response.data === 'string' && result.error.response.data.indexOf('<h1>') > 0) {
      templateData.error = result.error.response.data.replace(/[\s\S]+<h1>([^<]+)<\/h1>[\s\S]+/, '$1');
    }
    if (result.error.response.status) {
      return result.error.response.status;
    } else {
      return 500;
    }
  } else {
    return 500;
  }
}

/**
 * Get the basic data for the response
 *
 * @private
 * @param {object} req - request
 */
function getServerData(req) {
  let livereloadPort = config.server.livereloadPort || process.env.LIVERELOAD_PORT;
  const host = req.get('Host');
  if (host.indexOf(':') > 0) {
    livereloadPort = parseInt(host.split(':')[1], 10) + 1;
  }
  if (authData && Object.keys(authData).length > 0 && (req.session.authData === undefined || req.session.authData.length === 0)) {
    req.session.authData = authData;
    req.session.username = authData.client_id;
  }
  return Object.assign({
    environment: process.env.NODE_ENV,
    hostname: req.hostname,
    livereloadPort: livereloadPort,
    moduleName: 'hsi',
    module: moduleConfig,
    session: req.session,
    data: false,
    model: model.getData(),
    post: { }
  },
  req.params);
}

/**
 * Convert JSON to url param string
 *
 * @private
 * @param {object} obj - to convert
 */
function json2url(obj) {
  return Object
    .keys(obj)
    .map(key => {
      if (obj[key] instanceof Array) {
        return obj[key].map(item => {
          if (item) {
            return `&${encodeURIComponent(key)}=${encodeURIComponent(item)}`;
          } else {
            return '';
          }
        })
          .join('');
      } else {
        if (obj[key]) {
          return `&${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
        } else {
          return '';
        }
      }
    })
    .join('').replace(/^&/, '');
}

/**
 * collect form data and convert them to JSON structure
 *
 * @private
 * @param {object} data - to convert
 */
function form2json(data) {
  let result = { };
  for (const [name, value] of Object.entries(data)) {
    setValue(result, name.split(/\./), value);
  }
  return result;
}

/**
 * set a value to object with multilevel key (form element named 'main.sub.subsub.item')
 *
 * @private
 * @param {object} obj - to convert
 * @param {String} keys - array of keys
 * @param {String} value - to set
 */
function setValue(obj, keys, value) {
  if (value === '') {
    return obj;
  }
  const key = keys.shift();
  if (!obj.hasOwnProperty(key)) {
    if (keys.length > 0) {
      obj[key] = { };
      setValue(obj[key], keys, value);
    } else {
      if (value === 'true') {
        obj[key] = true;
      } else {
        obj[key] = value;
      }
    }
  } else {
    setValue(obj[key], keys, value);
  }
  return obj;
}

/**
 * Convert JSON to form data (dot notation)
 *
 * @private
 * @param {object} obj - to convert
 */
function json2form(obj) {
  let result = {};
  (function recurse(obj, current) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var value = obj[key];
        var newKey = (current ? current + '.' + key : key); // joined key with dot
        if (value && typeof value === 'object') {
          recurse(value, newKey); // it's a nested object, so do it again
        } else {
          result[newKey] = (value === true ? 'true' : value); // it's not an object, so set the property
        }
      }
    }
  }(obj));
  return result;
}
