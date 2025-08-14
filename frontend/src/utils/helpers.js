import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Utility function to merge Tailwind classes
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    if (isToday(dateObj)) {
      return 'Today';
    } else if (isYesterday(dateObj)) {
      return 'Yesterday';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
}

// Format date and time
export function formatDateTime(date, formatStr = 'MMM dd, yyyy HH:mm') {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return format(dateObj, formatStr);
  } catch (error) {
    return 'Invalid Date';
  }
}

// Format relative time
export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid Date';
  }
}

// Format time only
export function formatTime(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return format(dateObj, 'HH:mm');
  } catch (error) {
    return 'Invalid Date';
  }
}

// Check if date is in the past
export function isPast(date) {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return false;
    
    return dateObj < new Date();
  } catch (error) {
    return false;
  }
}

// Check if date is in the future
export function isFuture(date) {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return false;
    
    return dateObj > new Date();
  } catch (error) {
    return false;
  }
}

// Check if date is within 1 hour
export function isWithinOneHour(date) {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return false;
    
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    return dateObj > now && dateObj <= oneHourFromNow;
  } catch (error) {
    return false;
  }
}

// Get match status badge
export function getMatchStatusBadge(status) {
  switch (status) {
    case 'scheduled':
      return { text: 'Scheduled', className: 'badge-info' };
    case 'in_progress':
      return { text: 'In Progress', className: 'badge-warning' };
    case 'completed':
      return { text: 'Completed', className: 'badge-success' };
    case 'cancelled':
      return { text: 'Cancelled', className: 'badge-danger' };
    default:
      return { text: 'Unknown', className: 'badge-info' };
  }
}

// Get prediction result badge
export function getPredictionResultBadge(resultStatus) {
  if (resultStatus?.includes('✅')) {
    return { text: 'Correct', className: 'badge-success' };
  } else if (resultStatus?.includes('❌')) {
    return { text: 'Wrong', className: 'badge-danger' };
  } else if (resultStatus?.includes('⏳')) {
    return { text: 'Pending', className: 'badge-warning' };
  } else {
    return { text: 'Not Predicted', className: 'badge-info' };
  }
}

// Format percentage
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(decimals)}%`;
}

// Format number with commas
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Truncate text
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Generate random ID
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate URL
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Sort array by multiple criteria
export function sortByMultiple(array, ...criteria) {
  return array.sort((a, b) => {
    for (const { key, order = 'asc' } of criteria) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// Filter array by search term
export function filterBySearch(array, searchTerm, fields = []) {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    if (fields.length === 0) {
      // Search in all string fields
      return Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(term)
      );
    }
    
    // Search in specified fields
    return fields.some(field => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(term);
    });
  });
}

// Group array by key
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

// Calculate average
export function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

// Calculate median
export function calculateMedian(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

// Get status badge for matches
export function getStatusBadge(status) {
  const statusConfig = {
    scheduled: { label: 'Scheduled', className: 'badge-warning' },
    live: { label: 'Live', className: 'badge-success' },
    completed: { label: 'Completed', className: 'badge-secondary' },
    cancelled: { label: 'Cancelled', className: 'badge-danger' }
  };
  
  const config = statusConfig[status] || { label: status, className: 'badge-secondary' };
  return <span className={config.className}>{config.label}</span>;
}

// Get result badge for team predictions
export function getResultBadge(result) {
  const resultConfig = {
    teamA: { label: 'Team A', className: 'badge-primary' },
    teamB: { label: 'Team B', className: 'badge-primary' }
  };
  
  const config = resultConfig[result] || { label: result, className: 'badge-secondary' };
  return <span className={config.className}>{config.label}</span>;
}

// Get result status badge for predictions
export function getResultStatusBadge(resultStatus) {
  const statusConfig = {
    'Correct': { label: '✅ Correct', className: 'badge-success' },
    'Wrong': { label: '❌ Wrong', className: 'badge-danger' },
    'Not Predicted': { label: '⏳ Not Predicted', className: 'badge-warning' }
  };
  
  const config = statusConfig[resultStatus] || { label: resultStatus, className: 'badge-secondary' };
  return <span className={config.className}>{config.label}</span>;
}

/**
 * Display '--' for empty values, otherwise return the original value
 * @param {*} value - The value to check
 * @param {string} fallback - Custom fallback text (defaults to '--')
 * @returns {string} The original value or fallback text
 */
export const displayValue = (value, fallback = '--') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
};

/**
 * Display '--' for empty values, with optional formatting
 * @param {*} value - The value to check
 * @param {Function} formatter - Optional formatter function
 * @param {string} fallback - Custom fallback text (defaults to '--')
 * @returns {string} The formatted value or fallback text
 */
export const displayFormattedValue = (value, formatter = null, fallback = '--') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  if (formatter && typeof formatter === 'function') {
    try {
      return formatter(value);
    } catch (error) {
      return fallback;
    }
  }
  
  return value;
};
