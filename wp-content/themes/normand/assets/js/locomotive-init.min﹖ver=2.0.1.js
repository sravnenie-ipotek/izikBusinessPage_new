"use strict";

/* eslint-disable no-undef */

/**
 * File locomotive-init.js.
 *
 * Handles initializing locomotive scroll, proxying gsap scrollTrigger & all
 * animations using gsap scrollTrigger.
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initLocomotiveScrollController);
} else {
  // The DOM has already been loaded.
  initLocomotiveScrollController();
}

function initLocomotiveScrollController() {
  if (window.innerWidth > 768) {
    initLocomotiveScroll();
  } else {
    initMobileScroll();
  }
}

function initLocomotiveScroll() {
  var locoScroll = new LocomotiveScroll({
    el: document.querySelector('[data-scroll-container]'),
    smooth: true,
    reloadOnContextChange: true // tablet: { smooth: true },
    // smartphone: { smooth: true },
    // touchMultiplier: 4,

  });
  window.addEventListener('load', function () {
    locoScroll.update();
  });
  locoScroll.on('scroll', ScrollTrigger.update);
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.scrollerProxy('[data-scroll-container]', {
    scrollTop: function scrollTop(value) {
      return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect: function getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight
      };
    },
    pinType: document.querySelector('[data-scroll-container]').style.transform ? 'transform' : 'fixed'
  });
  ScrollTrigger.defaults({
    scroller: '[data-scroll-container]'
  });
  var $siteMain = document.querySelector('#primary');
  var $nav = document.querySelector('.nav--toggle-small');

  if (window.innerWidth >= 960) {
    var $menuBorder = $nav.querySelector('.menu-border');
    var $contactLink = $nav.querySelector('.menu-quick-contact-link');
    var navBorderTl = gsap.timeline({
      scrollTrigger: {
        trigger: $siteMain,
        start: 'bottom bottom',
        toggleActions: 'play none none reverse'
      }
    });
    navBorderTl.to($menuBorder, {
      height: '25px',
      y: -172,
      force3D: true
    }).to($contactLink, {
      autoAlpha: 1,
      duration: .25
    });
  }

  if (window.innerWidth < 960) {
    var $header = $nav.parentElement;
    var showAnim = gsap.from($header, {
      yPercent: -100,
      paused: true,
      duration: 1,
      ease: 'circ.inOut'
    }).progress(1);
    ScrollTrigger.create({
      start: 'top -55',
      end: 99999,
      onUpdate: function onUpdate(self) {
        // eslint-disable-next-line no-unused-expressions
        self.direction === -1 ? showAnim.play() : showAnim.reverse();
      }
    });
  }

  var $footer = document.querySelector('footer.site-footer');
  gsap.set($footer, {
    yPercent: 100
  });
  var footerTl = gsap.timeline({
    scrollTrigger: {
      trigger: $siteMain,
      start: 'bottom bottom',
      end: '+=10%',
      toggleActions: 'play none none reverse',
      scrub: 1.5
    }
  });
  footerTl.to($footer, {
    yPercent: 0,
    ease: 'circ.inOut'
  });

  function animateFrom(elem, direction) {
    // eslint-disable-next-line no-bitwise
    direction = direction | 1;
    var x = 0;
    var y = direction * 100;

    if (elem.classList.contains('normand-st-reveal-left')) {
      x = -100;
      y = 0;
    } else if (elem.classList.contains('normand-st-reveal-right')) {
      x = 100;
      y = 0;
    }

    gsap.fromTo(elem, {
      x: x,
      y: y,
      autoAlpha: 0
    }, {
      duration: 1.5,
      x: 0,
      y: 0,
      autoAlpha: 1,
      overwrite: 'auto',
      force3D: true
    });
  }

  function hide(elem) {
    gsap.killTweensOf(elem);
    gsap.set(elem, {
      autoAlpha: 0
    });
  }

  function hideKill(elem) {
    gsap.killTweensOf(elem);
    gsap.to(elem, {
      duration: 1.5,
      autoAlpha: 0,
      y: 100
    });
  } // start scroll trigger animations


  var $elemsToReveal = document.querySelectorAll('.normand-st-reveal');
  gsap.utils.toArray($elemsToReveal).forEach(function (elem) {
    hide(elem);
    ScrollTrigger.create({
      trigger: elem,
      onEnter: function onEnter() {
        return animateFrom(elem);
      },
      onEnterBack: function onEnterBack() {
        return animateFrom(elem, -1);
      },
      onLeave: function onLeave() {
        return hide(elem);
      },
      onLeaveBack: function onLeaveBack() {
        return hideKill(elem);
      }
    });
  });

  function animateImgFrom(imgWrap, img, direction) {
    // eslint-disable-next-line no-bitwise
    direction = direction | 1;
    var x = direction * 100;
    var imgFromTl = gsap.timeline();
    imgFromTl.fromTo(imgWrap, {
      xPercent: x
    }, {
      duration: 1.5,
      xPercent: 0,
      autoAlpha: 1,
      overwrite: 'auto',
      force3D: true
    }, 'start').fromTo(img, {
      xPercent: x * -1
    }, {
      duration: 1.5,
      xPercent: 0,
      overwrite: 'auto',
      force3D: true
    }, 'start');
  }

  function hideImg(imgWrap, img) {
    gsap.killTweensOf(imgWrap);
    gsap.killTweensOf(img);
    gsap.set(imgWrap, {
      autoAlpha: 0
    });
  }

  var $imgsToReveal = document.querySelectorAll('.normand-st-reveal-img');
  gsap.utils.toArray($imgsToReveal).forEach(function (imgWrap) {
    var img = imgWrap.firstElementChild;
    hideImg(imgWrap, img);
    ScrollTrigger.create({
      trigger: imgWrap,
      onEnter: function onEnter() {
        return animateImgFrom(imgWrap, img);
      },
      onEnterBack: function onEnterBack() {
        return animateImgFrom(imgWrap, img, -1);
      },
      onLeave: function onLeave() {
        return hideImg(imgWrap, img);
      },
      onLeaveBack: function onLeaveBack() {
        return hideImg(imgWrap, img);
      }
    });
  });
  ScrollTrigger.addEventListener('refresh', function () {
    return locoScroll.update();
  });
  ScrollTrigger.refresh(); // scroll indicator animations

  var scrollIndicator = document.querySelector('.scroll-indicator');

  if (scrollIndicator) {
    scrollIndicator.addEventListener('mouseenter', function (e) {
      var chevDown = e.target.lastElementChild; // eslint-disable-next-line no-unused-vars

      var sITlE = gsap.timeline().to(chevDown, {
        x: 5
      }, 'start').to(chevDown, {
        y: 5
      }).to(chevDown, {
        y: 0
      });
    });
    var servicesBlock = document.querySelector('.normand-services');
    scrollIndicator.addEventListener('click', function () {
      locoScroll.scrollTo(servicesBlock);
    });
  }
}

function initMobileScroll() {
  var $siteMain = document.querySelector('#primary');
  var $nav = document.querySelector('.nav--toggle-small');
  var $header = $nav.parentElement;
  var showAnim = gsap.from($header, {
    yPercent: -100,
    paused: true,
    duration: 1,
    ease: 'circ.inOut'
  }).progress(1);
  ScrollTrigger.create({
    start: 'top -55',
    end: 99999,
    onUpdate: function onUpdate(self) {
      // eslint-disable-next-line no-unused-expressions
      self.direction === -1 ? showAnim.play() : showAnim.reverse();
    }
  });
  var $footer = document.querySelector('footer.site-footer');
  gsap.set($footer, {
    yPercent: 100
  });
  var footerTl = gsap.timeline({
    scrollTrigger: {
      trigger: $siteMain,
      start: 'bottom bottom',
      toggleActions: 'play none none reverse'
    }
  });
  footerTl.to($footer, {
    yPercent: 0,
    ease: 'circ.inOut'
  });

  function animateFrom(elem, direction) {
    // eslint-disable-next-line no-bitwise
    direction = direction | 1;
    var x = 0;
    var y = direction * 100;

    if (elem.classList.contains('normand-st-reveal-left')) {
      x = -100;
      y = 0;
    } else if (elem.classList.contains('normand-st-reveal-right')) {
      x = 100;
      y = 0;
    }

    gsap.fromTo(elem, {
      x: x,
      y: y,
      autoAlpha: 0
    }, {
      duration: 1.5,
      x: 0,
      y: 0,
      autoAlpha: 1,
      overwrite: 'auto',
      force3D: true
    });
  }

  function hide(elem) {
    gsap.killTweensOf(elem);
    gsap.set(elem, {
      autoAlpha: 0
    });
  }

  function hideKill(elem) {
    gsap.killTweensOf(elem);
    gsap.to(elem, {
      duration: 1.5,
      autoAlpha: 0,
      y: 100
    });
  } // start scroll trigger animations


  var $elemsToReveal = document.querySelectorAll('.normand-st-reveal');
  gsap.utils.toArray($elemsToReveal).forEach(function (elem) {
    hide(elem);
    ScrollTrigger.create({
      trigger: elem,
      onEnter: function onEnter() {
        return animateFrom(elem);
      },
      onEnterBack: function onEnterBack() {
        return animateFrom(elem, -1);
      },
      onLeave: function onLeave() {
        return hide(elem);
      },
      onLeaveBack: function onLeaveBack() {
        return hideKill(elem);
      }
    });
  });

  function animateImgFrom(imgWrap, img, direction) {
    // eslint-disable-next-line no-bitwise
    direction = direction | 1;
    var x = direction * 100;
    var imgFromTl = gsap.timeline();
    imgFromTl.fromTo(imgWrap, {
      xPercent: x
    }, {
      duration: 1.5,
      xPercent: 0,
      autoAlpha: 1,
      overwrite: 'auto',
      force3D: true
    }, 'start').fromTo(img, {
      xPercent: x * -1
    }, {
      duration: 1.5,
      xPercent: 0,
      overwrite: 'auto',
      force3D: true
    }, 'start');
  }

  function hideImg(imgWrap, img) {
    gsap.killTweensOf(imgWrap);
    gsap.killTweensOf(img);
    gsap.set(imgWrap, {
      autoAlpha: 0
    });
  }

  var $imgsToReveal = document.querySelectorAll('.normand-st-reveal-img');
  gsap.utils.toArray($imgsToReveal).forEach(function (imgWrap) {
    var img = imgWrap.firstElementChild;
    hideImg(imgWrap, img);
    ScrollTrigger.create({
      trigger: imgWrap,
      onEnter: function onEnter() {
        return animateImgFrom(imgWrap, img);
      },
      onEnterBack: function onEnterBack() {
        return animateImgFrom(imgWrap, img, -1);
      },
      onLeave: function onLeave() {
        return hideImg(imgWrap, img);
      },
      onLeaveBack: function onLeaveBack() {
        return hideImg(imgWrap, img);
      }
    });
  }); // scroll indicator animations

  var scrollIndicator = document.querySelector('.scroll-indicator');

  if (scrollIndicator) {
    scrollIndicator.addEventListener('mouseenter', function (e) {
      var chevDown = e.target.lastElementChild; // eslint-disable-next-line no-unused-vars

      var sITlE = gsap.timeline().to(chevDown, {
        x: 5
      }, 'start').to(chevDown, {
        y: 5
      }).to(chevDown, {
        y: 0
      });
    });
    var servicesBlock = document.querySelector('.normand-services');
    scrollIndicator.addEventListener('click', function () {
      gsap.to(window, {
        duration: 1,
        scrollTo: servicesBlock
      });
    });
  }
}