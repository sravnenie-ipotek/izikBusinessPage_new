// Form Handler for Vercel Serverless Function
// Add this script to all pages with forms

document.addEventListener('DOMContentLoaded', function() {
  // Find all Gravity Forms and convert them
  const forms = document.querySelectorAll('.gform_wrapper form, form.contact-form, form#contactForm');

  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(form);
      const data = {};

      // Convert FormData to JSON
      for (let [key, value] of formData.entries()) {
        // Map Gravity Forms field names to our API
        if (key.includes('input_1') || key.includes('name')) {
          data.name = value;
        } else if (key.includes('input_2') || key.includes('email')) {
          data.email = value;
        } else if (key.includes('input_3') || key.includes('phone')) {
          data.phone = value;
        } else if (key.includes('input_4') || key.includes('message')) {
          data.message = value;
        } else if (key.includes('subject')) {
          data.subject = value;
        }
      }

      // Add form type based on page
      data.formType = window.location.pathname.includes('contact') ? 'Contact' : 'Inquiry';

      // Get submit button and show loading state
      const submitBtn = form.querySelector('[type="submit"], .gform_button');
      const originalText = submitBtn ? submitBtn.textContent : 'Submit';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        // Send to our Vercel function
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
          // Success - show message
          showMessage(form, 'success', 'Thank you! Your message has been sent successfully. We will get back to you soon.');
          form.reset();
        } else {
          // Error from API
          showMessage(form, 'error', result.error || 'There was an error submitting your form. Please try again.');
        }

      } catch (error) {
        // Network or other error
        console.error('Form submission error:', error);
        showMessage(form, 'error', 'There was an error submitting your form. Please check your connection and try again.');
      } finally {
        // Reset button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  });
});

// Helper function to show messages
function showMessage(form, type, message) {
  // Remove any existing messages
  const existingMsg = form.querySelector('.form-message');
  if (existingMsg) {
    existingMsg.remove();
  }

  // Create message element
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message form-message-${type}`;
  messageDiv.style.cssText = `
    padding: 15px;
    margin: 20px 0;
    border-radius: 5px;
    font-weight: 500;
    ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
  `;
  messageDiv.textContent = message;

  // Insert after form
  form.parentNode.insertBefore(messageDiv, form.nextSibling);

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      messageDiv.style.transition = 'opacity 0.5s';
      setTimeout(() => messageDiv.remove(), 500);
    }, 5000);
  }
}

// Fallback for forms that might be loaded dynamically
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.querySelector && node.querySelector('form')) {
            // Re-run form handler for new forms
            document.dispatchEvent(new Event('DOMContentLoaded'));
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}