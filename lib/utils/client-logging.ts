/**
 * Client-side logging utility specifically for browser console
 * This is separate from server-side logging
 */

// Different log levels with colorful prefixes for better visibility
export const clientLog = {
  webSearch: {
    // Web search process logs
    init: (query: string) => {
      console.log(
        '%c🌐 Web Search Initialized %c',
        'background: #4285f4; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
        'color: inherit;',
        `Query: "${query}"`
      );
    },
    
    sending: (query: string) => {
      console.log(
        '%c🌐 Web Search Request %c',
        'background: #4285f4; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
        'color: inherit;',
        `Sending request to search for: "${query}"`
      );
      
      // Create a timer for this query to track response time
      if (typeof window !== 'undefined') {
        window.__webSearchTimers = window.__webSearchTimers || {};
        window.__webSearchTimers[query] = Date.now();
      }
    },
    
    processing: (message: string) => {
      console.log(
        '%c🌐 Web Search Processing %c',
        'background: #fbbc05; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
        'color: inherit;',
        message
      );
    },
    
    results: (query: string, resultsCount: number) => {
      // Calculate time elapsed if we have a timer
      let timeInfo = '';
      if (typeof window !== 'undefined' && window.__webSearchTimers && window.__webSearchTimers[query]) {
        const elapsed = Date.now() - window.__webSearchTimers[query];
        timeInfo = ` (${elapsed}ms)`;
        delete window.__webSearchTimers[query];
      }
      
      console.log(
        '%c🌐 Web Search Results %c',
        'background: #34a853; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
        'color: inherit;',
        `Found ${resultsCount} results for "${query}"${timeInfo}`
      );
    },
    
    error: (error: string) => {
      console.error(
        '%c🌐 Web Search Error %c',
        'background: #ea4335; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;',
        'color: inherit;',
        error
      );
    }
  }
};

// Add type definition for the global window object
declare global {
  interface Window {
    __webSearchTimers?: Record<string, number>;
  }
} 