"use strict";

/* eslint-disable no-undef */

/**
 * File page-header.js.
 *
 * Animations for page header and singular header.
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initPageHeaderAnimations);
} else {
  // The DOM has already been loaded.
  initPageHeaderAnimations();
}

function revealPageHeader() {
  var pageTitle = document.querySelector('.page-title'); // eslint-disable-next-line no-unused-vars

  var pageHeaderTl = gsap.timeline({
    delay: 1.7
  }).from(pageTitle, {
    yPercent: 50,
    autoAlpha: 0,
    duration: 1.5,
    force3D: true
  });
}

function revealSingularHeader() {
  var postThumbnail = document.querySelector('.post-thumbnail');
  var postThumbnailImg = document.querySelector('.post-thumbnail img');
  var singularTitle = document.querySelector('.entry-title-singular');
  var singularHeaderTl = gsap.timeline({
    delay: 1.7
  });

  if (postThumbnail) {
    singularHeaderTl.from(postThumbnail, {
      autoAlpha: 0,
      yPercent: 100,
      duration: 1.5,
      force3D: true
    }, 'first');
    singularHeaderTl.from(postThumbnailImg, {
      yPercent: -100,
      scale: 1.3,
      duration: 1.5,
      force3D: true
    }, 'first');
  }

  singularHeaderTl.from(singularTitle, {
    yPercent: 50,
    autoAlpha: 0,
    duration: 1.5,
    force3D: true
  }, 'first');
}

function initPageHeaderAnimations() {
  var singularHeader = document.querySelector('.singular-header');
  var pageHeader = document.querySelector('.page-header');

  if (pageHeader) {
    revealPageHeader();
  }

  if (singularHeader) {
    revealSingularHeader();
  }
}