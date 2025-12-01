// Error boundary component (for React-like error handling in vanilla JS)
export class ErrorBoundary {
  constructor(element, fallbackMessage = 'Something went wrong') {
    this.element = element;
    this.fallbackMessage = fallbackMessage;
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });
  }

  handleError(error) {
    console.error('Error caught by boundary:', error);
    this.showError(error);
  }

  showError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
    errorDiv.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="font-bold mb-1">Error</h3>
          <p class="text-sm">${error.message || this.fallbackMessage}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentElement) {
        errorDiv.remove();
      }
    }, 5000);
  }
}

