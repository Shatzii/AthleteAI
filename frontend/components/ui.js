// UI Components for AthleteAI Eligibility Dashboard
// Reusable components for the eligibility and AI coach interface

import React from 'react';
import './ui.css';

// Card Component
export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

// Progress Bar Component
export const Progress = ({
  value,
  max = 100,
  className = '',
  color = 'primary',
  showValue = true,
  ...props
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`progress-container ${className}`} {...props}>
      <div
        className={`progress-bar progress-${color}`}
        style={{ width: `${percentage}%` }}
      >
        {showValue && (
          <span className="progress-value">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
};

// Alert Component
export const Alert = ({
  type = 'info',
  title,
  children,
  className = '',
  dismissible = false,
  onDismiss,
  ...props
}) => (
  <div className={`alert alert-${type} ${className}`} {...props}>
    {title && <h4 className="alert-title">{title}</h4>}
    <div className="alert-content">{children}</div>
    {dismissible && (
      <button
        className="alert-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss alert"
      >
        ×
      </button>
    )}
  </div>
);

// Badge Component
export const Badge = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => (
  <span className={`badge badge-${variant} ${className}`} {...props}>
    {children}
  </span>
);

// Button Component
export const Button = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  children,
  className = '',
  ...props
}) => (
  <button
    className={`btn btn-${variant} btn-${size} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <span className="btn-spinner"></span>}
    {children}
  </button>
);

// Loading Spinner Component
export const Spinner = ({
  size = 'medium',
  className = '',
  ...props
}) => (
  <div
    className={`spinner spinner-${size} ${className}`}
    {...props}
  >
    <div className="spinner-inner"></div>
  </div>
);

// Modal Component
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  ...props
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {title && (
          <div className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

// Tabs Component
export const Tabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ...props
}) => (
  <div className={`tabs ${className}`} {...props}>
    <div className="tabs-header">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
    <div className="tabs-content">
      {tabs.find((tab) => tab.id === activeTab)?.content}
    </div>
  </div>
);

// Form Components
export const FormGroup = ({
  label,
  error,
  required = false,
  children,
  className = '',
  ...props
}) => (
  <div className={`form-group ${className}`} {...props}>
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
    )}
    {children}
    {error && <span className="form-error">{error}</span>}
  </div>
);

export const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  ...props
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`form-input ${className}`}
    {...props}
  />
);

export const Select = ({
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  className = '',
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    disabled={disabled}
    className={`form-select ${className}`}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const Textarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  className = '',
  ...props
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    className={`form-textarea ${className}`}
    {...props}
  />
);

// Table Component
export const Table = ({
  headers,
  data,
  className = '',
  ...props
}) => (
  <div className={`table-container ${className}`} {...props}>
    <table className="table">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="table-header">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="table-row">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="table-cell">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Loading States
export const LoadingCard = ({ message = 'Loading...' }) => (
  <Card className="loading-card">
    <div className="loading-content">
      <Spinner />
      <p>{message}</p>
    </div>
  </Card>
);

export const Skeleton = ({
  width = '100%',
  height = '20px',
  className = '',
  ...props
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height }}
    {...props}
  />
);

// Error States
export const ErrorCard = ({
  title = 'Error',
  message,
  onRetry,
  className = ''
}) => (
  <Card className="error-card">
    <div className="error-content">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          Try Again
        </Button>
      )}
    </div>
  </Card>
);

// Empty States
export const EmptyState = ({
  title = 'No Data',
  message,
  action,
  className = ''
}) => (
  <div className={`empty-state ${className}`}>
    <div className="empty-content">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  </div>
);

// Export all components
export default {
  Card,
  Progress,
  Alert,
  Badge,
  Button,
  Spinner,
  Modal,
  Tabs,
  FormGroup,
  Input,
  Select,
  Textarea,
  Table,
  LoadingCard,
  Skeleton,
  ErrorCard,
  EmptyState
};
