"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* eslint-disable no-undef */

/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */
if ('loading' === document.readyState) {
  // The DOM has not yet been loaded.
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  // The DOM has already been loaded.
  initNavigation();
} // Initiate the menus when the DOM loads.


function initNavigation() {
  initNavToggleSmall();
}
/**
 * Initiate the script to process all
 * navigation menus with small toggle enabled.
 */


function initNavToggleSmall() {
  /**
   * Class to process navigation toggle for a specific navigation menu.
   *
   */
  var NavToggler =
  /*#__PURE__*/
  function () {
    function NavToggler(el) {
      _classCallCheck(this, NavToggler);

      this.DOM = {
        el: el
      };
      this.DOM.menuToggle = el.firstElementChild;
      this.DOM.menuToggleInner = this.DOM.menuToggle.firstElementChild;
      this.DOM.menuToggleClose = this.DOM.el.querySelector('.menu-toggle-close');
      this.DOM.menuToggleCloseInner = this.DOM.menuToggleClose.firstElementChild;
      this.DOM.primaryMenuContainer = this.DOM.el.querySelector('.primary-menu-container');
      this.DOM.menuItems = this.DOM.el.querySelectorAll('#primary-menu a');
      this.DOM.socialItems = this.DOM.el.querySelectorAll('.social-menu a');
      this.DOM.contactItems = this.DOM.el.querySelectorAll('.contact-link');
      this.initEvents();
    }

    _createClass(NavToggler, [{
      key: "initEvents",
      value: function initEvents() {
        var _this = this;

        function debounce(func) {
          var wait = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
          var immediate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
          var timeout;
          return function () {
            var context = this,
                args = arguments;

            var later = function later() {
              timeout = null;

              if (!immediate) {
                func.apply(context, args);
              }
            };

            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) {
              func.apply(context, args);
            }
          };
        }

        this.showMenu = function () {
          _this.DOM.menuToggle.setAttribute('aria-expanded', 'true');

          gsap.killTweensOf(_this.DOM.primaryMenuContainer);
          gsap.killTweensOf(_this.DOM.menuItems);
          gsap.killTweensOf(_this.DOM.socialItems);
          gsap.killTweensOf(_this.DOM.contactItems);
          gsap.killTweensOf(_this.DOM.menuToggle);
          gsap.killTweensOf(_this.DOM.menuToggleClose);
          gsap.killTweensOf(_this.DOM.menuToggleInner);
          _this.tl = gsap.timeline({
            onStart: function onStart() {
              gsap.set(_this.DOM.primaryMenuContainer, {
                display: 'flex'
              });
              gsap.set(_this.DOM.menuToggle, {
                pointerEvents: 'none'
              });
              gsap.set(_this.DOM.menuToggleClose, {
                pointerEvents: 'all'
              });
            }
          }).to(_this.DOM.menuToggleInner, {
            autoAlpha: 0,
            yPercent: 100,
            rotationX: 90,
            force3D: true,
            duration: 1.5
          }, 'start').from(_this.DOM.primaryMenuContainer, {
            xPercent: -100,
            duration: 1,
            ease: 'slow(0.5, 2, false)',
            force3D: true
          }, 'start').from(_this.DOM.menuItems, {
            autoAlpha: 0,
            yPercent: -100,
            stagger: 0.2,
            duration: 1,
            force3D: true
          }, 'start-=0.7').from(_this.DOM.socialItems, {
            autoAlpha: 0,
            yPercent: -100,
            stagger: 0.2,
            duration: 1,
            force3D: true
          }, 'start+=1.7').from(_this.DOM.contactItems, {
            autoAlpha: 0,
            yPercent: -100,
            stagger: 0.2,
            duration: 1,
            force3D: true
          }, 'start+=2.7').to(_this.DOM.menuToggleClose, {
            duration: 1.5,
            autoAlpha: 1
          }, 'start+=2.7');
        };

        this.hideMenu = function () {
          _this.DOM.menuToggle.setAttribute('aria-expanded', 'false');

          gsap.killTweensOf(_this.DOM.primaryMenuContainer);
          gsap.killTweensOf(_this.DOM.menuItems);
          gsap.killTweensOf(_this.DOM.socialItems);
          gsap.killTweensOf(_this.DOM.contactItems);
          gsap.killTweensOf(_this.DOM.menuToggle);
          gsap.killTweensOf(_this.DOM.menuToggleClose);
          gsap.killTweensOf(_this.DOM.menuToggleInner);
          _this.tl = gsap.timeline({
            onComplete: function onComplete() {
              gsap.set(_this.DOM.primaryMenuContainer, {
                xPercent: 0
              });
              gsap.set(_this.DOM.menuItems, {
                autoAlpha: 1,
                yPercent: 0
              });
              gsap.set(_this.DOM.socialItems, {
                autoAlpha: 1,
                yPercent: 0
              });
              gsap.set(_this.DOM.contactItems, {
                autoAlpha: 1,
                yPercent: 0
              });
            }
          }).to(_this.DOM.menuToggleInner, {
            autoAlpha: 1,
            yPercent: 0,
            rotationX: 0,
            force3D: true,
            duration: 1.5
          }, 'start').to(_this.DOM.menuToggleClose, {
            autoAlpha: 0
          }, 'start').to(_this.DOM.menuItems, {
            autoAlpha: 0,
            yPercent: -100,
            duration: 0.7
          }, 'start').to(_this.DOM.socialItems, {
            autoAlpha: 0,
            yPercent: -100,
            duration: 0.7
          }, 'start').to(_this.DOM.contactItems, {
            autoAlpha: 0,
            yPercent: -100,
            duration: 0.7
          }, 'start').set(_this.DOM.primaryMenuContainer, {
            display: 'none'
          }).set(_this.DOM.menuToggle, {
            pointerEvents: 'all'
          }).set(_this.DOM.menuToggleClose, {
            pointerEvents: 'none'
          });

          if (window.innerWidth >= 960) {
            _this.tl.to(_this.DOM.primaryMenuContainer, {
              xPercent: -100,
              duration: 0.7,
              ease: 'slow(0.5, 2, false)',
              force3D: true
            }, 'start+=0.7');
          } else {
            _this.tl.to(_this.DOM.primaryMenuContainer, {
              xPercent: -100,
              duration: 0.7,
              ease: 'slow(0.5, 2, false)',
              force3D: true
            }, 'start');
          }
        }; // Add an initial values for the attribute.


        this.DOM.menuToggle.setAttribute('aria-expanded', 'false');
        this.DOM.menuToggle.addEventListener('click', debounce(this.showMenu), false);
        this.DOM.menuToggleClose.addEventListener('click', debounce(this.hideMenu), false);
      }
    }]);

    return NavToggler;
  }();

  var navTOGGLE = document.querySelectorAll('.nav--toggle-small'); // No point if no navs.

  if (!navTOGGLE.length) {
    return;
  }

  for (var i = 0; i < navTOGGLE.length; i++) {
    new NavToggler(navTOGGLE[i]);
  }
}