/**
 * Routes for login
 *
 * @module login/index
 */

'use strict';

const router = require('express').Router(); // eslint-disable-line new-cap

const controller = require('./controller.js');

// login overview
router.get('/', controller.index);
router.post('/', controller.index);

router.get('/logout/', controller.logout);
router.get('/authcode', controller.callback);

router.get('/shipmentorder/', controller.execPostRequest);
router.post('/shipmentorder/', controller.execPostRequest);

router.get('/shipmentorderlabel/:shipmentOrderID?', controller.execPostRequest);
router.post('/shipmentorderlabel/', controller.execPostRequest);

router.get('/shipmentlabel/', controller.execPostRequest);
router.post('/shipmentlabel/', controller.execPostRequest);

router.get('/returnorder_v1/', controller.execPostRequest);
router.post('/returnorder_v1/', controller.execPostRequest);

router.get('/returnorderlabel_v1/', controller.execPostRequest);
router.post('/returnorderlabel_v1/', controller.execPostRequest);

router.get('/returnorder_v2/', controller.execPostRequest);
router.post('/returnorder_v2/', controller.execPostRequest);

router.get('/returnorderlabel_v2/:returnOrderID?', controller.execPostRequest);
router.post('/returnorderlabel_v2/', controller.execPostRequest);

router.get('/returnlabel_v2/', controller.execPostRequest);
router.post('/returnlabel_v2/', controller.execPostRequest);

router.get('/returnpickuporder/', controller.execPostRequest);
router.post('/returnpickuporder/', controller.execPostRequest);

router.get('/shipmentinfo/', controller.execGetRequest);
router.post('/shipmentinfo/', controller.execGetRequest);

router.get('/shipmentstatus/', controller.execGetRequest);
router.post('/shipmentstatus/', controller.execGetRequest);

router.get('/shipmenthistory/', controller.execGetRequest);
router.post('/shipmenthistory/', controller.execGetRequest);

router.get('/jsoninput/', controller.jsoninput);
router.post('/jsoninput/', controller.jsoninput);

module.exports = {
  router: router,
  useExpress: controller.useExpress
};
