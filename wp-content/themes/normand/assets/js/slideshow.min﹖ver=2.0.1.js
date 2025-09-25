"use strict";

/* eslint-disable prefer-const */

/* eslint-disable no-undef */

/**
 * slideshow.js.
 *
 * Animations for the slideshow custom block.
 *
 */
if ('loading' === document.readyState) {
  document.addEventListener('DOMContentLoaded', initSlideshow);
} else {
  initSlideshow();
}

function initSlideshow() {
  var normandSlideshow = document.querySelector('.normand-slideshow');

  if (normandSlideshow) {
    var viewport = document.querySelector('.viewport');
    var wrapper = document.querySelector('.slideshow-wrap');
    var boxes = document.querySelector('.slideshow');
    var imgs = document.querySelectorAll('.slideshow img');
    var numBoxes = imgs.length;
    var boxWidth = 200;
    var boxHeight = 150;
    var viewWidth = innerWidth;
    var wrapWidth = numBoxes * boxWidth;
    gsap.utils.wrap(0, wrapWidth);
    gsap.set([wrapper, viewport], {
      height: boxHeight,
      xPercent: -50
    });
    gsap.set(boxes, {
      left: -boxWidth
    });
    var figures = document.querySelectorAll('.slideshow figure');
    figures.forEach(function (figure, index) {
      gsap.set(figure, {
        x: index * boxWidth,
        width: boxWidth,
        height: boxHeight
      });
    });
    gsap.to(figures, {
      repeat: -1,
      duration: 100,
      x: "+=".concat(wrapWidth),
      ease: 'none',
      paused: false,
      force3D: true,
      modifiers: {
        x: function x(_x, target) {
          _x = parseInt(_x) % wrapWidth;
          target.style.visibility = _x - boxWidth > viewWidth ? 'hidden' : 'visible';
          return "".concat(_x, "px");
        }
      }
    });
  }
}