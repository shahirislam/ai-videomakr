// Reusable modal component
export function createModal(options = {}) {
  const {
    title = '',
    content = '',
    footer = '',
    size = 'md',
    onClose = null,
    closeOnOverlayClick = true
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 transition-opacity duration-300';
  overlay.id = 'modal-overlay';

  const modal = document.createElement('div');
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };
  
  modal.className = `bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full ${sizeClasses[size] || sizeClasses.md} max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300`;

  // Header
  if (title) {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700';
    
    const titleEl = document.createElement('h2');
    titleEl.className = 'text-xl font-bold text-gray-900 dark:text-white';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-2xl text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors leading-none';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => closeModal();
    header.appendChild(closeBtn);

    modal.appendChild(header);
  }

  // Content
  const contentEl = document.createElement('div');
  contentEl.className = 'flex-1 overflow-y-auto p-6';
  if (typeof content === 'string') {
    contentEl.innerHTML = content;
  } else {
    contentEl.appendChild(content);
  }
  modal.appendChild(contentEl);

  // Footer
  if (footer) {
    const footerEl = document.createElement('div');
    footerEl.className = 'border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800';
    if (typeof footer === 'string') {
      footerEl.innerHTML = footer;
    } else {
      footerEl.appendChild(footer);
    }
    modal.appendChild(footerEl);
  }

  overlay.appendChild(modal);

  function closeModal() {
    overlay.classList.add('opacity-0');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 300);
  }

  if (closeOnOverlayClick) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
  }

  // Add to DOM
  document.body.appendChild(overlay);
  
  // Animate in
  requestAnimationFrame(() => {
    overlay.classList.add('opacity-100');
  });

  return {
    element: modal,
    close: closeModal,
    updateContent: (newContent) => {
      if (typeof newContent === 'string') {
        contentEl.innerHTML = newContent;
      } else {
        contentEl.innerHTML = '';
        contentEl.appendChild(newContent);
      }
    }
  };
}

