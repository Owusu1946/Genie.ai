/**
 * Web Search Diagnostics Helper
 * Provides utilities to diagnose and troubleshoot web search issues
 */

import { clientLog } from './client-logging';

/**
 * Run diagnostics on web search functionality
 * Checks configuration, network connectivity, etc.
 */
export async function runWebSearchDiagnostics() {
  clientLog.webSearch.processing('Running web search diagnostics...');
  
  const diagnostics: Array<{
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
  }> = [];
  
  // Check if we're running in the browser environment
  if (typeof window === 'undefined') {
    clientLog.webSearch.error('Cannot run diagnostics outside browser environment');
    return;
  }
  
  // 1. Check network connectivity
  try {
    const networkResponse = await fetch('https://www.google.com', { 
      method: 'HEAD',
      // Very short timeout to check connectivity quickly
      signal: AbortSignal.timeout(3000) 
    });
    
    if (networkResponse.ok) {
      diagnostics.push({
        name: 'Network Connectivity',
        status: 'ok',
        message: 'Internet connection is working'
      });
    } else {
      diagnostics.push({
        name: 'Network Connectivity',
        status: 'warning',
        message: `Internet connection may have issues. Status: ${networkResponse.status}`
      });
    }
  } catch (e) {
    diagnostics.push({
      name: 'Network Connectivity',
      status: 'error',
      message: `Failed to connect to internet: ${e instanceof Error ? e.message : String(e)}`
    });
  }
  
  // 2. Check if API endpoint is reachable
  try {
    const apiResponse = await fetch('/api/diagnostics/ping', { 
      method: 'HEAD',
      // Short timeout
      signal: AbortSignal.timeout(3000) 
    });
    
    if (apiResponse.ok) {
      diagnostics.push({
        name: 'API Endpoint',
        status: 'ok',
        message: 'API endpoint is reachable'
      });
    } else {
      diagnostics.push({
        name: 'API Endpoint',
        status: 'warning',
        message: `API endpoint returned status ${apiResponse.status}`
      });
    }
  } catch (e) {
    diagnostics.push({
      name: 'API Endpoint',
      status: 'error',
      message: `Failed to reach API endpoint: ${e instanceof Error ? e.message : String(e)}`
    });
  }
  
  // 3. Check local storage for any saved errors
  try {
    const webSearchErrors = localStorage.getItem('webSearchErrors');
    if (webSearchErrors) {
      const errors = JSON.parse(webSearchErrors);
      if (Array.isArray(errors) && errors.length > 0) {
        diagnostics.push({
          name: 'Previous Errors',
          status: 'warning',
          message: `Found ${errors.length} previous web search errors`
        });
      } else {
        diagnostics.push({
          name: 'Previous Errors',
          status: 'ok',
          message: 'No previous web search errors found'
        });
      }
    } else {
      diagnostics.push({
        name: 'Previous Errors',
        status: 'ok',
        message: 'No previous web search errors found'
      });
    }
  } catch (e) {
    // Non-critical, just log it
    diagnostics.push({
      name: 'Previous Errors Check',
      status: 'warning',
      message: `Could not check previous errors: ${e instanceof Error ? e.message : String(e)}`
    });
  }
  
  // Log the results
  console.group('%c🌐 Web Search Diagnostics Results', 'font-weight: bold; color: #4285f4;');
  diagnostics.forEach(result => {
    const style = result.status === 'ok' 
      ? 'color: #34a853; font-weight: bold;' 
      : result.status === 'warning'
        ? 'color: #fbbc05; font-weight: bold;'
        : 'color: #ea4335; font-weight: bold;';
        
    console.log(`%c[${result.status.toUpperCase()}] ${result.name}: %c${result.message}`, style, 'color: inherit;');
  });
  console.groupEnd();
  
  return diagnostics;
}

/**
 * Record a web search error for later diagnostics
 */
export function recordWebSearchError(query: string, error: string) {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing errors
    const storedErrors = localStorage.getItem('webSearchErrors');
    const errors = storedErrors ? JSON.parse(storedErrors) : [];
    
    // Add new error with timestamp
    errors.push({
      timestamp: new Date().toISOString(),
      query,
      error
    });
    
    // Keep only last 10 errors
    const trimmedErrors = errors.slice(-10);
    
    // Save back to localStorage
    localStorage.setItem('webSearchErrors', JSON.stringify(trimmedErrors));
  } catch (e) {
    // Silent failure
  }
}

/**
 * Get a troubleshooting message for specific error types
 */
export function getWebSearchTroubleshootingMessage(errorCode?: string | number): string {
  switch (errorCode) {
    case 403:
      return 'API access denied. This usually means your Google API key is invalid or has insufficient permissions.';
    case 429:
      return 'Rate limit exceeded. You have reached the maximum number of requests allowed for your API key.';
    case 'MISSING_CREDENTIALS':
      return 'Google API credentials are missing. Check that GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID are set in your .env file.';
    case 'NETWORK_ERROR':
      return 'Network error. Check your internet connection and try again.';
    default:
      return 'An error occurred with web search. Check API keys and network connection.';
  }
} 