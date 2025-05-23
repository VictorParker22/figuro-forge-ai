
/**
 * Clean up all Supabase auth-related state from storage
 * This helps prevent "limbo" states when switching accounts or sessions
 */
export const cleanupAuthState = () => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Also clean sessionStorage if in use
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

/**
 * Parse authentication errors and return user-friendly messages
 */
export const getAuthErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.error_description || String(error);
  
  // Handle common auth error scenarios
  if (errorMessage.includes('Email not confirmed')) {
    return 'Please verify your email before signing in. Check your inbox for the verification link.';
  }
  
  if (errorMessage.includes('Invalid login')) {
    return 'Invalid email or password. Please try again.';
  }

  if (errorMessage.includes('Email already registered')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (errorMessage.includes('Password should be')) {
    return 'Password should be at least 6 characters long.';
  }
  
  // Return the original error if no specific handling
  return errorMessage;
};
