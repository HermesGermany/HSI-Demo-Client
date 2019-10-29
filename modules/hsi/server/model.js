/**
 * ## Model for hsi oauth
 *
 * @module hsi/model
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  storage = path.join(__dirname, 'modeldata.json');

let data = { model: 'oauth data' };

if (fs.existsSync(storage)) {
  data = require(path.join('.', storage));
}

module.exports = {
  /**
   * get data
   *
   * @returns {object} model data
   */
  getData: () => {
    return data;
  },
  /**
   * put dataset
   *
   * @param {string} name - of dataset
   * @param {object} dataset - to store
   * @returns {object} model data
   */
  put: (name, dataset) => {
    data[name] = dataset;
  },
  /**
   * save dataset
   *
   * @param {string} name - of dataset
   * @param {object} dataset - to store
   * @returns {object} model data
   */
  save: async () => {
    const saveData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(storage, saveData);
    return data;
  }
};
