/**
 * scripts for login
 */

'use strict';

let handler = {};

/**
 * toggle login element by selection
 */
handler['toggle-login-field_client'] = {
  elements: document.querySelectorAll('input[type="radio"][name="loginDetails"][value="client"] + label'),
  event: 'click',
  func: () => { // jscs:ignore jsDoc
    document.querySelectorAll('.field_username, .field_password, .field_redirect_uri').forEach(el => el.classList.add('hidden'));
  }
};
handler['toggle-login-field_password'] = {
  elements: document.querySelectorAll('input[type="radio"][name="loginDetails"][value="password"] + label'),
  event: 'click',
  func: () => { // jscs:ignore jsDoc
    document.querySelectorAll('.field_redirect_uri').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.field_username, .field_password').forEach(el => el.classList.remove('hidden'));
  }
};
handler['toggle-login-field_authorization_code'] = {
  elements: document.querySelectorAll('input[type="radio"][name="loginDetails"][value="authorization_code"] + label'),
  event: 'click',
  func: () => { // jscs:ignore jsDoc
    document.querySelectorAll('.field_redirect_uri').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.field_username, .field_password').forEach(el => el.classList.add('hidden'));
  }
};

/**
 * attach event to elements
 *
 * @param {DOMelement} element - to attach event
 * @param {string} event - type
 * @param {function} handler - event handler
 */
function attachEventHandler(element, event, handler) {
  if (element.attachEvent) {
    element.attachEvent('on' + event, handler);
  } else if (element.addEventListener) {
    element.addEventListener(event, handler, false);
  } else {
    element.addEventListener(event, handler, false);
  }
}

/**
 * attach event handlers
 */
Object.values(handler).forEach((handler) => { // jscs:ignore jsDoc
  handler.elements.forEach((element) => { // jscs:ignore jsDoc
    attachEventHandler(element, handler.event, handler.func);
  });
  document.querySelectorAll('.field_username, .field_password, .field_redirect_uri').forEach(el => el.classList.add('hidden'));
});
