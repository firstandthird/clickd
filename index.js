/* eslint-disable callback-return */
/* eslint-env browser */
/* global _gaq, ga, gtag */
import { on, find, ready, closest } from 'domassist';
import aug from 'aug';

// IE Polyfill-ish
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector;
}

const GATrack = {
  sendEvent(category, action, label, callback = null, timeout = 1000) {
    if (GATrack.prefix) {
      category = `${GATrack.prefix}-${category}`;
    }
    let onHit = () => {};
    GATrack.log(category, action, label);

    if (typeof window._gaq === 'undefined' && // eslint-disable-line no-underscore-dangle
      typeof window.ga === 'undefined' &&
      typeof window.gtag === 'undefined') {
      if (typeof callback === 'function') {
        callback();
      }

      return GATrack;
    }

    if (typeof callback === 'function') {
      let timeoutId;

      onHit = () => {
        if (!timeoutId) {
          return;
        }

        clearTimeout(timeoutId);
        timeoutId = null;
        callback();
      };

      timeoutId = setTimeout(onHit, timeout);
    }

    if (typeof window._gaq !== 'undefined') { // eslint-disable-line no-underscore-dangle
      _gaq.push(['_trackEvent', category, action, label, null, false]);
      _gaq.push(onHit);
    } else if (typeof window.gtag !== 'undefined') {
      // Gtag check needs to go before since gtag creates a ga variable
      const payload = {
        event_category: category,
        event_label: label,
        event_callback: onHit
      };

      gtag('event', action, payload);
    } else if (typeof window.ga !== 'undefined') {
      const options = {
        transport: 'beacon',
        hitCallback: onHit
      };

      ga('send', 'event', category, action, label, options);
    }
  },

  send() {
    if (typeof window.ga === 'undefined') { // eslint-disable-line no-underscore-dangle
      return GATrack;
    }

    // eslint-disable-next-line prefer-rest-params
    const args = Array.prototype.slice.call(arguments);
    args.unshift('send');
    ga.apply(null, args);
  },

  getData(element, options = {}) {
    const href = element.dataset.gaTrackHref || element.getAttribute('href');
    const category = element.dataset.gaTrack || options.category || 'ga-track';
    const label = element.dataset.gaTrackLabel || options.label || href;
    const action = element.dataset.gaTrackAction || options.action || element.textContent.trim();

    return { href, category, label, action };
  },

  track(element, options = {}) {
    if (Array.isArray(element)) {
      element.forEach(data => {
        find(data.element).forEach(el => {
          GATrack.track(el, data);
        });
      });

      return;
    }

    if (typeof element.dataset.gaTrackInitialised !== 'undefined') {
      return;
    }

    element.dataset.gaTrackInitialised = 'true';

    options = aug({}, GATrack.defaults, options);

    this.log('tracking', element, options);
    on(element, 'click', event => {
      GATrack.onTrackedClick(element, event, options);
    });
  },

  onTrackedClick(element, event, options) {
    const data = GATrack.getData(element, options);
    const target = element.getAttribute('target');
    let callback = null;

    if (element.dataset.gaTrackHref === 'false') {
      event.preventDefault();
    } else if (data.href && !event.metaKey && event.which === 1 && target !== '_blank') {
      event.preventDefault();
      callback = () => {
        window.location = data.href;
      };
    }

    GATrack.sendEvent(data.category, data.action, data.label, callback, options.timeout);
  },

  autotrack() {
    if (GATrack.autotracking === true) {
      return;
    }

    GATrack.autotracking = true;
    const selector = '[data-ga-track]';

    on(document.body, 'click', event => {
      let element = event.target;

      if (!element.matches(selector)) {
        element = closest(element, selector);
      }

      if (element) {
        GATrack.onTrackedClick(element, event, GATrack.defaults);
      }
    });
  },

  log(...args) {
    if (GATrack.debug) {
      console.log('GATRACK', ...args); //eslint-disable-line no-console
    }
  },

  debug: (typeof window.localStorage === 'object' && window.localStorage.getItem('GATrackDebug')),
  prefix: null,
  defaults: {
    timeout: 1000
  }
};

const outlineTracked = () => find('[data-ga-track-initialised], [data-ga-track]').map(el => {
  el.style.outline = 'red dotted 1px';
  return el;
});

GATrack.debug = window.localStorage.getItem('GATrackDebug');
const outline = window.localStorage.getItem('GATrackOutline');

window.GAOutlineTracked = outlineTracked;

ready(() => {
  GATrack.autotrack();

  if (outline) {
    outlineTracked();
  }
});

export default GATrack;
