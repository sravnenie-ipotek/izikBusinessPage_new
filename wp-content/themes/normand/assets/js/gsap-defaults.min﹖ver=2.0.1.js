"use strict";

/* eslint-disable no-undef */

/**
 * gsap-defaults.js.
 *
 * GSAP defaults for uniform animation settings.
 *
 * Contains default settings for all gsap animations
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initGsapDefaults);
} else {
  // The DOM has already been loaded.
  initGsapDefaults();
}

function initGsapDefaults() {
  gsap.defaults({
    ease: 'circ.out',
    duration: 0.25
  });
}