// Google Analytics 4 Configuration
// Replace GA_TRACKING_ID with your actual Google Analytics 4 Measurement ID

const GA_TRACKING_ID = process.env.GA_TRACKING_ID || 'G-XXXXXXXXXX';

// Initialize Google Analytics
function initializeGA() {
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true, // Privacy compliance
    allow_google_signals: false, // Disable advertising features for privacy
  });
}

// Track page views
function trackPageView(page_title, page_location) {
  if (typeof gtag !== 'undefined') {
    gtag('config', GA_TRACKING_ID, {
      page_title: page_title,
      page_location: page_location,
    });
  }
}

// Track custom events
function trackEvent(action, category = 'engagement', label = '', value = 0) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track form submissions
function trackFormSubmission(form_name, form_destination = '') {
  trackEvent('form_submit', 'forms', form_name);

  if (typeof gtag !== 'undefined') {
    gtag('event', 'generate_lead', {
      currency: 'USD',
      value: 1,
      form_name: form_name,
      form_destination: form_destination
    });
  }
}

// Track contact interactions
function trackContact(method) {
  trackEvent('contact', 'engagement', method);
}

// Track case study views
function trackCaseStudyView(case_name) {
  trackEvent('case_study_view', 'content', case_name);
}

// Privacy-compliant initialization
function initializeAnalytics() {
  // Check for consent (you can integrate with a cookie consent solution)
  const hasConsent = localStorage.getItem('analytics_consent') === 'true' ||
                     !window.location.hostname.includes('localhost');

  if (hasConsent) {
    initializeGA();

    // Track initial page load
    trackPageView(document.title, window.location.href);

    // Set up automatic form tracking
    setupFormTracking();

    // Set up contact link tracking
    setupContactTracking();
  }
}

// Automatic form tracking setup
function setupFormTracking() {
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form.tagName === 'FORM') {
      const formName = form.id || form.className || 'unknown_form';
      trackFormSubmission(formName, form.action);
    }
  });
}

// Automatic contact tracking setup
function setupContactTracking() {
  // Track phone number clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href.startsWith('tel:')) {
      trackContact('phone');
    }
    if (link && link.href.startsWith('mailto:')) {
      trackContact('email');
    }
  });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeAnalytics,
    trackPageView,
    trackEvent,
    trackFormSubmission,
    trackContact,
    trackCaseStudyView
  };
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAnalytics);
  } else {
    initializeAnalytics();
  }
}