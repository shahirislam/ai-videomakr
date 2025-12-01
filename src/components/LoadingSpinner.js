// Loading spinner component
export function createLoadingSpinner(size = 'md', color = 'primary') {
  const spinner = document.createElement('div');
  spinner.className = `inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  spinner.className += ` ${sizeClasses[size] || sizeClasses.md}`;
  
  if (color === 'primary') {
    spinner.className += ' text-[#5B7FFF]';
  } else if (color === 'white') {
    spinner.className += ' text-white';
  }
  
  return spinner;
}

export function createLoadingOverlay(message = 'Loading...') {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center';
  
  const content = document.createElement('div');
  content.className = 'bg-white dark:bg-gray-900 rounded-xl p-6 flex flex-col items-center gap-4';
  
  const spinner = createLoadingSpinner('lg', 'primary');
  content.appendChild(spinner);
  
  const text = document.createElement('p');
  text.className = 'text-gray-900 dark:text-white font-medium';
  text.textContent = message;
  content.appendChild(text);
  
  overlay.appendChild(content);
  return overlay;
}

