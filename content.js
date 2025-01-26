// content.js
console.log('CNL content script loaded');

// Listen for CNL related events/elements
function checkForCNLElements() {
    // Log any forms or iframes that might be CNL-related
    const forms = document.querySelectorAll('form');
    const iframes = document.querySelectorAll('iframe');
    
    console.log('Found forms:', forms.length);
    console.log('Found iframes:', iframes.length);

    // Send this info to the background script
    chrome.runtime.sendMessage({
        type: 'DEBUG_INFO',
        data: {
            url: window.location.href,
            forms: forms.length,
            iframes: iframes.length
        }
    });
}

// Run check when page loads
checkForCNLElements();

// Monitor for dynamic content
const observer = new MutationObserver(() => {
    checkForCNLElements();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Intercept XHR/Fetch requests to catch CNL requests
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    
    xhr.open = function() {
        console.log('XHR Request:', arguments);
        return originalOpen.apply(this, arguments);
    };
    
    return xhr;
};

const originalFetch = window.fetch;
window.fetch = function() {
    console.log('Fetch Request:', arguments);
    return originalFetch.apply(this, arguments);
};