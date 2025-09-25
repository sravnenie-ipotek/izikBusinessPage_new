"use strict";

/* eslint-disable no-undef */

/**
 * normand-banner.js.
 *
 * Animations for the normand-banner and page banner custom block.
 *
 */
if ('loading' === document.readyState) {
  document.addEventListener('DOMContentLoaded', initNormandBannerAnimations);
} else {
  initNormandBannerAnimations();
}

function revealBanner() {
  var bannerImgReveal = document.querySelector('.banner-img-reveal');
  var bannerImg = document.querySelector('.banner-img');
  var bannerContactLink = document.querySelector('.normand-banner .contact-link');
  var bannerLogo = document.querySelector('.normand-logo_svg__normand-logo-svg');
  var bannerSubtitle = document.querySelector('.normand-banner .banner-subtitle');
  var bannerTitle = document.querySelector('.normand-banner .banner-title');
  var scrollIndicator = document.querySelector('.scroll-indicator'); // eslint-disable-next-line no-unused-vars

  var revealBannerTl = gsap.timeline({
    delay: 3.2,
    onStart: initTitleRotator
  }).from(bannerImgReveal, {
    xPercent: -100,
    autoAlpha: 0,
    duration: 1.5,
    force3D: true
  }, 'first').from(bannerImg, {
    xPercent: 100,
    scale: 1.3,
    duration: 1.5,
    force3D: true
  }, 'first').add(fadeUp(bannerContactLink, 1.5, 100), 'first').add(fadeUp(bannerLogo), 'first').add(fadeUp(bannerSubtitle, 0.7, 100), 'first+=.5').add(fadeUp(bannerTitle, 0.7), 'first+=1').add(fadeUp(scrollIndicator, 0.7, 100), 'first+=1.5');

  function fadeUp(element, time, yValue) {
    var fadeUpTl = gsap.timeline();
    fadeUpTl.from(element, {
      yPercent: yValue ? yValue : 50,
      autoAlpha: 0,
      duration: time ? time : 1.5
    });
    return fadeUpTl;
  }
}

function revealPageBanner() {
  var bannerImgReveal = document.querySelector('.banner-img-reveal');
  var bannerImg = document.querySelector('.banner-img');
  var bannerSubtitle = document.querySelector('.page-banner .banner-subtitle');
  var bannerTitle = document.querySelector('.page-banner .banner-title'); // eslint-disable-next-line no-unused-vars

  var revealBannerTl = gsap.timeline({
    delay: 1.7,
    onStart: initTitleRotator
  }).from(bannerImgReveal, {
    yPercent: 100,
    autoAlpha: 0,
    duration: 1.5,
    force3D: true
  }, 'first').from(bannerImg, {
    yPercent: -100,
    scale: 1.3,
    duration: 1.5,
    force3D: true
  }, 'first').add(fadeUp(bannerSubtitle, 0.7, 100), 'first').add(fadeUp(bannerTitle, 0.7), 'first+=0.5');

  function fadeUp(element, time, yValue) {
    var fadeUpTl = gsap.timeline();
    fadeUpTl.from(element, {
      yPercent: yValue ? yValue : 50,
      autoAlpha: 0,
      duration: time ? time : 1.5
    });
    return fadeUpTl;
  }
}

function initTitleRotator() {
  var words = document.querySelectorAll('.rotator > span');
  var rotatorTl = gsap.timeline({
    repeat: -1,
    repeatDelay: 4
  });

  for (var i = 0; i < words.length; i++) {
    var position = i - 1;
    var rotationTl = gsap.timeline();

    if (i !== 0) {
      rotatorTl.from(words[i], {
        duration: 1,
        yPercent: -25,
        autoAlpha: 0,
        force3D: true
      });
    } else {
      position += 1;
      gsap.set(words[0], {
        autoAlpha: 1,
        yPercent: 0
      });
    }

    if (i !== words.length - 1) {
      rotatorTl.to(words[i], {
        duration: 1,
        yPercent: 25,
        autoAlpha: 0,
        force3D: true
      });
    }

    rotationTl.add(rotatorTl, position);
  }
}

function initNormandBannerAnimations() {
  var normandBanner = document.querySelector('.normand-banner');
  var pageBanner = document.querySelector('.page-banner');

  if (normandBanner) {
    revealBanner();
  } else if (pageBanner) {
    revealPageBanner();
  }
}