import React from 'react';
import '../styles/components/Button.css';

export default function Button({ 
  children, 
  onClick, 
  disabled = false, 
  className = '',
  type = 'button',
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${className} ${disabled ? 'disabled' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
