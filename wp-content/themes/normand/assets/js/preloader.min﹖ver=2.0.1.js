"use strict";

/* eslint-disable no-undef */

/**
 * File preloader.js.
 *
 * Handles preloader and asset loading.
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initPreloader);
} else {
  // The DOM has already been loaded.
  initPreloader();
}

function initPreloader() {
  var body = document.body;
  var preloader = document.querySelector('#preloader');
  var images = document.querySelectorAll('img');
  var loadPercentText = document.querySelector('.load-percent');
  var loaderSvg = document.querySelectorAll('.normand-loader-svg');
  var loaderSvgPaths = document.querySelectorAll('.normand-loader-svg path');
  var preloaderTl = gsap.timeline({
    repeat: -1
  }).from(loaderSvgPaths, {
    autoAlpha: 0,
    scaleX: 0,
    stagger: 0.08,
    ease: 'slow(0.5, 2, false)',
    force3D: true
  }).add('full').to(loaderSvgPaths, {
    scaleX: 0,
    autoAlpha: 0,
    stagger: 0.08,
    transformOrigin: 'right',
    ease: 'slow(0.5, 2, false)',
    force3D: true
  });

  if (body.classList.contains('home')) {
    imagesLoaded(images, startCounter);
  } else {
    imagesLoaded(images, removePreloader);
  }

  function startCounter() {
    var loadPercent = {
      val: 0
    };
    var newVal = 100;
    gsap.to(loadPercent, {
      val: newVal,
      roundProps: 'val',
      onUpdate: function onUpdate() {
        loadPercentText.innerHTML = "".concat(loadPercent.val, "<span>%</span>");
      },
      duration: 1.5,
      ease: 'slow(0.5, 1, false)',
      onComplete: removePreloader
    });
  }

  function removePreloader() {
    preloaderTl.tweenTo(preloaderTl.nextLabel(), {
      duration: 1.2
    }); // eslint-disable-next-line no-unused-vars

    var rmPreloaderTl = gsap.timeline().to(loadPercentText, {
      autoAlpha: 0
    }, 'start').to(loaderSvg, {
      scale: 0.7,
      rotation: -10,
      duration: 1.5,
      ease: 'circ.in',
      force3D: true
    }, 'start').to(preloader, {
      yPercent: 100,
      duration: 1.7,
      ease: 'circ.in',
      force3D: true
    }, 'start');
  }
}