/* eslint-disable new-cap */
if (Element && !Element.prototype.matches) {
  const proto = Element.prototype;
  proto.matches = proto.matchesSelector ||
    proto.mozMatchesSelector || proto.msMatchesSelector ||
    proto.oMatchesSelector || proto.webkitMatchesSelector;
}

import GATrack from '../index';
import test from 'tape-rollup';

// GA Stub
let gaData = [];
window._gaq = { // eslint-disable-line no-underscore-dangle
  data: null,
  clear: assert => {
    gaData = [];
  },
  push(arr) {
    if (Array.isArray(arr)) {
      gaData.push(arr); // eslint-disable-line no-underscore-dangle
    }
  }
};

window.ga = function(...args) {
  gaData = args;
};

const init = () => {
  const container = document.createElement('div');
  container.id = 'fixture';
  document.body.appendChild(container);
};

const setup = () => {
  const container = document.getElementById('fixture');
  container.innerHTML = `
    <a class="custom" id="link1" href="#test">Click Me</a>
    <a class="custom" id="link1a" href="#test">Click Me</a>
    <a id="link2" data-ga-track href="#test">Click Me</a>
    <a id="link3" data-ga-track="category" href="#test">Click Me</a>
    <a id="link4" data-ga-track data-ga-track-label="label" href="#test">Click Me</a>
    <a id="link5" data-ga-track data-ga-track-action="action" href="#test">Click Me</a>
    <a id="link6" data-ga-track data-ga-track-action="action" href="#test">Click Me</a>
    <a id="link7" data-ga-track data-ga-track-action="action" href="#testclick" data-ga-track-href="false">Click Me</a>
    <a id="link8" data-ga-track="category" data-ga-track-action="action" data-ga-track-label="label" href="#test7">Click Me</a>
  `;

  GATrack.autotrack();
  window._gaq.clear(); // eslint-disable-line no-underscore-dangle
};

init();

test('GATrack plugin exists', assert => {
  assert.equal(typeof GATrack, 'object', 'object is defined');
  assert.equal(typeof GATrack.sendEvent, 'function', 'sendEvent is defined');
  assert.equal(typeof GATrack.track, 'function', 'track is defined');
  assert.equal(typeof GATrack.autotrack, 'function', 'autotrack is defined');
  assert.equal(typeof window.GAOutlineTracked, 'function', 'outline track is defined');
  assert.end();
});

test('Track an element', assert => {
  setup();
  const el = document.getElementById('link1');
  GATrack.track(el);
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'ga-track', 'category matches');
  assert.equal(gaData[0][2], 'Click Me', 'action matches');
  assert.equal(gaData[0][3], '#test', 'label matches');
  assert.end();
});

test('Does not track twice an element', assert => {
  setup();
  const el = document.getElementById('link1');
  GATrack.track(el);
  GATrack.track(el);
  el.click();

  assert.equal(gaData.length, 1, 'only one event registered');
  assert.end();
});


test('Track an element with options', assert => {
  setup();
  const el = document.getElementById('link1a');
  GATrack.track(el, { category: 'category', label: 'label', action: 'action' });
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'category', 'category matches');
  assert.equal(gaData[0][2], 'action', 'action matches');
  assert.equal(gaData[0][3], 'label', 'label matches');
  assert.end();
});

test('Track with array of selectors', assert => {
  setup();
  const link1 = document.getElementById('link1');
  const link1a = document.getElementById('link1a');
  GATrack.track([{ element: '.custom', category: 'category', label: 'label', action: 'action' }]);
  link1.click();
  link1a.click();

  assert.equal(gaData.length, 2, 'two events tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'category', 'category matches');
  assert.equal(gaData[0][2], 'action', 'action matches');
  assert.equal(gaData[0][3], 'label', 'label matches');
  assert.equal(gaData[1][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[1][1], 'category', 'category matches');
  assert.equal(gaData[1][2], 'action', 'action matches');
  assert.equal(gaData[1][3], 'label', 'label matches');
  assert.end();
});

test('Track an element with data and defaults', assert => {
  setup();
  const el = document.getElementById('link2');
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'ga-track', 'category matches');
  assert.equal(gaData[0][2], 'Click Me', 'action matches');
  assert.equal(gaData[0][3], '#test', 'label matches');
  assert.end();
});

test('data-api override category', assert => {
  setup();
  const el = document.getElementById('link3');
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'category', 'category matches');
  assert.equal(gaData[0][2], 'Click Me', 'action matches');
  assert.equal(gaData[0][3], '#test', 'label matches');
  assert.end();
});

test('data-api override action', assert => {
  setup();
  const el = document.getElementById('link5');
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'ga-track', 'category matches');
  assert.equal(gaData[0][2], 'action', 'action matches');
  assert.equal(gaData[0][3], '#test', 'label matches');
  assert.end();
});

test('data-api override label', assert => {
  setup();
  const el = document.getElementById('link4');
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'ga-track', 'category matches');
  assert.equal(gaData[0][2], 'Click Me', 'action matches');
  assert.equal(gaData[0][3], 'label', 'label matches');
  assert.end();
});

test('cancel clicks', assert => {
  setup();
  const el = document.getElementById('link7');
  el.click();

  setTimeout(() => {
    assert.notEqual(window.location.hash, '#testclick', 'does not navigate');
    assert.end();
  }, 600);
});


test('GATrack.prefix for categories', assert => {
  GATrack.prefix = 'prefix';
  setup();
  const el = document.getElementById('link8');
  el.click();

  assert.equal(gaData.length, 1, 'one event tracked');
  assert.equal(gaData[0][0], '_trackEvent', 'tracks event');
  assert.equal(gaData[0][1], 'prefix-category', 'category matches');
  assert.equal(gaData[0][2], 'action', 'action matches');
  assert.equal(gaData[0][3], 'label', 'label matches');
  assert.end();

  GATrack.prefix = null;
});

test('Outline for tracked elements', assert => {
  setup();
  const el = document.getElementById('link2');

  assert.equal(el.style.outline, '', 'No outline is set');

  window.GAOutlineTracked();

  assert.equal(el.style.outline, 'red dotted 1px', 'Outline is set');
  assert.end();
});

test('Can send arbitrary events to GA', assert => {
  setup();

  GATrack.send('some', 'random', 'stuff');
  assert.equal(gaData[0], 'send', 'first parameter is send');
  assert.equal(gaData[1], 'some', 'second parameter is correct');
  assert.equal(gaData[2], 'random', 'third parameter is correct');
  assert.equal(gaData[3], 'stuff', 'fourth parameter is correct');

  assert.end();
});

test('Can send arbitrary data to GA', assert => {
  setup();

  GATrack.set('some', 'random', 'stuff');
  assert.equal(gaData[0], 'some', 'first parameter is correct');
  assert.equal(gaData[1], 'random', 'second parameter is correct');
  assert.equal(gaData[2], 'stuff', 'third parameter is correct');

  assert.end();
});

test('Can use GTag too', assert => {
  setup();

  const ga = window.ga;
  // eslint-disable-next-line no-underscore-dangle
  const _gaq = window._gaq;

  window.ga = undefined;
  // eslint-disable-next-line no-underscore-dangle
  window._gaq = undefined;

  window.gtag = function(...args) {
    assert.equal(args[0], 'event', 'first parameter is event');
    assert.equal(args[1], 'action', 'second parameter is correct');
    assert.equal(args[2].event_category, 'category', 'third parameter is correct');
    assert.equal(args[2].event_label, 'label', 'third parameter is correct');
    assert.end();
  };

  GATrack.sendEvent('category', 'action', 'label');

  window.gtag = undefined;
  window.ga = ga;
  // eslint-disable-next-line no-underscore-dangle
  window._gaq = _gaq;
});
