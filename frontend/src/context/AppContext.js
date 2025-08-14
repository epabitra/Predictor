import React, { createContext, useContext, useReducer } from 'react';
import { toast } from 'react-hot-toast';

const AppContext = createContext();

const initialState = {
  isLoading: false,
  error: null,
  notifications: [],
  filters: {
    tournament: '',
    dateRange: null,
    status: 'all'
  },
  refreshTrigger: 0
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      };
    
    case 'REMOVE_NOTIFICATION':
      return { 
        ...state, 
        notifications: state.notifications.filter(n => n.id !== action.payload) 
      };
    
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    
    case 'TRIGGER_REFRESH':
      return { ...state, refreshTrigger: state.refreshTrigger + 1 };
    
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
    if (error) {
      toast.error(error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const addNotification = (notification) => {
    const id = Date.now();
    const newNotification = { id, ...notification };
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const triggerRefresh = () => {
    dispatch({ type: 'TRIGGER_REFRESH' });
  };

  const showSuccess = (message) => {
    toast.success(message);
  };

  const showError = (message) => {
    toast.error(message);
  };

  const showInfo = (message) => {
    toast(message, {
      icon: 'ℹ️',
    });
  };

  const showWarning = (message) => {
    toast(message, {
      icon: '⚠️',
    });
  };

  const value = {
    ...state,
    setLoading,
    setError,
    clearError,
    addNotification,
    removeNotification,
    setFilters,
    clearFilters,
    triggerRefresh,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Export utility functions directly for convenience
export const showSuccess = (message) => {
  toast.success(message);
};

export const showError = (message) => {
  toast.error(message);
};

export const showInfo = (message) => {
  toast(message, {
    icon: 'ℹ️',
  });
};

export const showWarning = (message) => {
  toast(message, {
    icon: '⚠️',
  });
};
