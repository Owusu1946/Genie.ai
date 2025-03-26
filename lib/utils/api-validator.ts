/**
 * API Validation Utility
 * Provides functions to verify API credentials and configuration
 */

/**
 * Validate Google API credentials
 * @returns Object with validation status and detailed info
 */
export async function validateGoogleApiCredentials() {
  if (typeof window === 'undefined') return null; // Server-side only
  
  try {
    // Get environment variables for API credentials
    const response = await fetch('/api/config/google-api-status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to check API status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      isValid: data.isValid,
      apiKey: data.apiKey ? {
        exists: !!data.apiKey.value,
        isValid: data.apiKey.isValid,
        error: data.apiKey.error,
      } : null,
      searchEngineId: data.searchEngineId ? {
        exists: !!data.searchEngineId.value,
        isValid: data.searchEngineId.isValid,
        error: data.searchEngineId.error,
      } : null,
      message: data.message || 'Unknown validation status',
    };
  } catch (error) {
    console.error('Error validating Google API credentials:', error);
    return {
      isValid: false,
      apiKey: null,
      searchEngineId: null,
      message: error instanceof Error ? error.message : 'Unknown error occurred during validation',
    };
  }
}

/**
 * Get a user-friendly error message based on API validation results
 */
export function getGoogleApiErrorMessage(validationResult: any): string {
  if (!validationResult) {
    return 'Unable to validate API credentials';
  }
  
  if (validationResult.isValid) {
    return 'Google API credentials are valid';
  }
  
  // API key issues
  if (!validationResult.apiKey?.exists) {
    return 'Google API key is missing. Please set GOOGLE_API_KEY in your environment variables.';
  }
  
  if (validationResult.apiKey?.exists && !validationResult.apiKey?.isValid) {
    return `Google API key is invalid: ${validationResult.apiKey.error || 'Unknown error'}`;
  }
  
  // Search Engine ID issues
  if (!validationResult.searchEngineId?.exists) {
    return 'Google Search Engine ID is missing. Please set GOOGLE_SEARCH_ENGINE_ID in your environment variables.';
  }
  
  if (validationResult.searchEngineId?.exists && !validationResult.searchEngineId?.isValid) {
    return `Google Search Engine ID is invalid: ${validationResult.searchEngineId.error || 'Unknown error'}`;
  }
  
  // Fallback
  return validationResult.message || 'Unknown error with Google API configuration';
} 