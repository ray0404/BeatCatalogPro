import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20 focus:ring-accent-500",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 focus:ring-gray-500",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white focus:ring-gray-500",
    icon: "p-2 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-full"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const sizeClass = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
