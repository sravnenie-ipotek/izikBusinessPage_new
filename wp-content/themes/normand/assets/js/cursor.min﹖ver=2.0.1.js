"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint-disable no-undef */

/**
 * File cursor.js.
 *
 * Handles the custom svg cursor animations.
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initCursor);
} else {
  // The DOM has already been loaded.
  initCursor();
} // Linear interpolation
// eslint-disable-next-line no-mixed-operators


var lerp = function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}; // Gets the mouse position


var body = document.body;

var getMousePos = function getMousePos(e) {
  var posx = 0;
  var posy = 0;

  if (!e) {
    e = window.event;
  }

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
    posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
  }

  return {
    x: posx,
    y: posy
  };
}; // Track the mouse position


var mouse = {
  x: 0,
  y: 0
};
window.addEventListener('mousemove', function (ev) {
  return mouse = getMousePos(ev);
}); // initialize custom cursor

function initCursor() {
  var Cursor =
  /*#__PURE__*/
  function () {
    function Cursor(el) {
      var _this = this;

      _classCallCheck(this, Cursor);

      this.DOM = {
        el: el
      };
      this.DOM.el.style.opacity = 0;
      this.bounds = this.DOM.el.getBoundingClientRect();
      this.renderedStyles = {
        tx: {
          previous: 0,
          current: 0,
          amt: 0.2
        },
        ty: {
          previous: 0,
          current: 0,
          amt: 0.2
        }
      };

      this.onMouseMoveEv = function () {
        _this.renderedStyles.tx.previous = _this.renderedStyles.tx.current = mouse.x - _this.bounds.width / 2;
        _this.renderedStyles.ty.previous = _this.renderedStyles.ty.previous = mouse.y - _this.bounds.height / 2;
        gsap.to(_this.DOM.el, {
          duration: 0.9,
          ease: 'Power3.easeOut',
          opacity: 1
        });
        requestAnimationFrame(function () {
          return _this.render();
        });
        window.removeEventListener('mousemove', _this.onMouseMoveEv);
      };

      window.addEventListener('mousemove', this.onMouseMoveEv);
    }

    _createClass(Cursor, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        this.renderedStyles.tx.current = mouse.x - this.bounds.width / 2;
        this.renderedStyles.ty.current = mouse.y - this.bounds.height / 2; // eslint-disable-next-line no-unused-vars

        for (var key in this.renderedStyles) {
          this.renderedStyles[key].previous = lerp(this.renderedStyles[key].previous, this.renderedStyles[key].current, this.renderedStyles[key].amt);
        }

        this.DOM.el.style.transform = "translateX(".concat(this.renderedStyles.tx.previous, "px) translateY(").concat(this.renderedStyles.ty.previous, "px)");
        requestAnimationFrame(function () {
          return _this2.render();
        });
      }
    }]);

    return Cursor;
  }();

  var $cursor = document.querySelector('.cursor');
  var $cursorInner = $cursor.firstElementChild;
  var $cursorInnerSmall = $cursor.lastElementChild; // eslint-disable-next-line no-unused-vars

  var cursor = new Cursor($cursor);

  function handleMenuToggleBtnEnter(e) {
    var menuToggle = e.target;
    var svg = menuToggle.firstElementChild.lastElementChild;
    gsap.to($cursor, {
      mixBlendMode: 'difference'
    });
    gsap.to($cursorInner, {
      scale: 3.5,
      transformOrigin: 'center'
    });
    gsap.to(svg, {
      rotation: 180,
      marginLeft: 15
    });
  }

  function handleMenuToggleBtnLeave(e) {
    var menuToggle = e.target;
    var svg = menuToggle.firstElementChild.lastElementChild;
    gsap.to($cursor, {
      mixBlendMode: 'luminosity'
    });
    gsap.to($cursorInner, {
      scale: 1
    });
    gsap.to(svg, {
      rotation: 0,
      marginLeft: 3
    });
  }

  var menuToggleBtn = document.querySelector('button.menu-toggle, button.menu-toggle-close');

  if (menuToggleBtn) {
    menuToggleBtn.addEventListener('mouseenter', handleMenuToggleBtnEnter);
    menuToggleBtn.addEventListener('mouseleave', handleMenuToggleBtnLeave);
  }

  function handleMoreLinkEnter(e) {
    var link = e.target;
    var svg = link.firstElementChild; // eslint-disable-next-line no-unused-vars

    var moreLinkEnterTl = gsap.timeline().to(svg, {
      duration: 0.7,
      x: 15
    }, 'in');
  }

  function handleMoreLinkLeave(e) {
    var link = e.target;
    var svg = link.firstElementChild; // eslint-disable-next-line no-unused-vars

    var moreLinkLeaveTl = gsap.timeline().to(svg, {
      duration: 0.7,
      x: 0
    }, 'out');
  }

  var moreLinks = document.querySelectorAll('a.more-link');

  if (moreLinks.length) {
    moreLinks.forEach(function (link) {
      link.addEventListener('mouseenter', handleMoreLinkEnter);
      link.addEventListener('mouseleave', handleMoreLinkLeave);
    });
  }

  function handleContactLinkEnter() {
    gsap.to($cursor, {
      mixBlendMode: 'difference'
    });
    gsap.to($cursorInnerSmall, {
      scale: 0,
      transformOrigin: 'center'
    });
    gsap.to($cursorInner, {
      scale: 2,
      transformOrigin: 'center'
    });
  }

  function handleContactLinkLeave() {
    gsap.to($cursor, {
      mixBlendMode: 'luminosity'
    });
    gsap.to($cursorInnerSmall, {
      duration: 0.7,
      scale: 1
    });
    gsap.to($cursorInner, {
      duration: 0.7,
      scale: 1
    });
  }

  var contactLink = document.querySelector('.normand-banner .contact-link');

  if (contactLink) {
    contactLink.addEventListener('mouseenter', handleContactLinkEnter);
    contactLink.addEventListener('mouseleave', handleContactLinkLeave);
  }

  function handleQuickContactLinkEnter() {
    gsap.to($cursorInner, {
      scale: 0,
      transformOrigin: 'center'
    });
    gsap.to($cursorInnerSmall, {
      scale: 3.5,
      transformOrigin: 'center'
    });
  }

  function handleQuickContactLinkLeave() {
    gsap.to($cursorInner, {
      duration: 0.7,
      scale: 1
    });
    gsap.to($cursorInnerSmall, {
      duration: 0.7,
      scale: 1
    });
  }

  var quickContactLink = document.querySelector('.quick-contact-link');

  if (quickContactLink) {
    quickContactLink.addEventListener('mouseenter', handleQuickContactLinkEnter);
    quickContactLink.addEventListener('mouseleave', handleQuickContactLinkLeave);
  }

  function handleCaptchaEnter() {
    gsap.to($cursorInner, {
      scale: 0,
      transformOrigin: 'center'
    });
    gsap.to($cursorInnerSmall, {
      scale: 0,
      transformOrigin: 'center'
    });
  }

  function handleCaptchaLeave() {
    gsap.to($cursorInner, {
      duration: 0.7,
      scale: 1
    });
    gsap.to($cursorInnerSmall, {
      duration: 0.7,
      scale: 1
    });
  }

  var ginputRecaptcha = document.querySelector('.ginput_recaptcha');

  if (ginputRecaptcha) {
    ginputRecaptcha.addEventListener('mouseenter', handleCaptchaEnter);
    ginputRecaptcha.addEventListener('mouseleave', handleCaptchaLeave);
  }

  function handlePrevMouseEnter(e) {
    var svg = e.target.firstElementChild;
    gsap.to(svg, {
      x: 10
    });
  }

  function handlePrevMouseLeave(e) {
    var svg = e.target.firstElementChild;
    gsap.to(svg, {
      x: 0
    });
  }

  var prevLinks = document.querySelector('.nav-previous a');

  if (prevLinks) {
    prevLinks.addEventListener('mouseenter', handlePrevMouseEnter);
    prevLinks.addEventListener('mouseleave', handlePrevMouseLeave);
  }

  function handleNextMouseEnter(e) {
    var svg = e.target.lastElementChild;
    gsap.to(svg, {
      x: -10
    });
  }

  function handleNextMouseLeave(e) {
    var svg = e.target.lastElementChild;
    gsap.to(svg, {
      x: 0
    });
  }

  var nextLinks = document.querySelector('.nav-next a');

  if (nextLinks) {
    nextLinks.addEventListener('mouseenter', handleNextMouseEnter);
    nextLinks.addEventListener('mouseleave', handleNextMouseLeave);
  }
}