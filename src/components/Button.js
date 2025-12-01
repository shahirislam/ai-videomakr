// Reusable button component
export function createButton(options = {}) {
  const {
    text = 'Button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick = null,
    icon = null,
    className = ''
  } = options;

  const button = document.createElement('button');
  
  // Base classes
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  button.className = baseClasses;

  // Variant classes
  const variantClasses = {
    primary: 'bg-[#5B7FFF] hover:bg-[#4A6BFF] text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border-2 border-[#5B7FFF] text-[#5B7FFF] hover:bg-[#5B7FFF] hover:text-white',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  button.className += ` ${variantClasses[variant] || variantClasses.primary}`;
  button.className += ` ${sizeClasses[size] || sizeClasses.md}`;
  button.className += ` ${className}`;

  if (disabled) {
    button.disabled = true;
    button.className += ' opacity-50 cursor-not-allowed';
  }

  // Add icon if provided
  if (icon) {
    const iconEl = document.createElement('span');
    iconEl.innerHTML = icon;
    button.appendChild(iconEl);
  }

  // Add text
  const textEl = document.createTextNode(text);
  button.appendChild(textEl);

  // Add click handler
  if (onClick && !disabled) {
    button.addEventListener('click', onClick);
  }

  return button;
}

