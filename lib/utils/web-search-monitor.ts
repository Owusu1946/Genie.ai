/**
 * Web Search Network Monitor
 * Hooks into browser fetch to monitor for web search activity
 */

import { clientLog } from './client-logging';

// Store original fetch to restore it later if needed
let originalFetch: typeof fetch;

// Track which queries we're searching for
const activeSearchQueries = new Set<string>();

/**
 * Monitors outgoing network requests to detect and log web search activity
 */
export function initWebSearchNetworkMonitor() {
  if (typeof window === 'undefined') return; // Only run in browser
  
  // Save original fetch
  originalFetch = window.fetch;
  
  // Replace fetch with our monitored version
  window.fetch = async function monitoredFetch(input, init) {
    const url = input instanceof Request ? input.url : input.toString();
    
    // Check if this is a chat API request
    if (url.includes('/api/chat')) {
      try {
        // Clone the request body to inspect it without consuming it
        if (init?.body && typeof init.body === 'string') {
          try {
            const body = JSON.parse(init.body);
            
            // Check for web search requests in messages
            if (body.messages && Array.isArray(body.messages)) {
              const lastMessage = body.messages[body.messages.length - 1];
              
              if (lastMessage && lastMessage.role === 'user' && lastMessage.content) {
                if (typeof lastMessage.content === 'string' && lastMessage.content.startsWith('/web ')) {
                  const query = lastMessage.content.substring(5);
                  
                  if (!activeSearchQueries.has(query)) {
                    activeSearchQueries.add(query);
                    clientLog.webSearch.sending(query);
                  }
                }
              }
            }
          } catch (e) {
            // Silently fail if we can't parse the body
          }
        }
      } catch (e) {
        // Don't let monitoring errors affect app functionality
      }
    }
    
    // Regular fetch implementation
    const response = await originalFetch(input, init);
    
    // Process response only for chat API
    if (url.includes('/api/chat')) {
      // Clone the response so we can read it multiple times
      const responseClone = response.clone();
      
      // Process in background to not block
      setTimeout(async () => {
        try {
          // Try to read and parse the response
          const text = await responseClone.text();
          
          // Look for web search references
          if (text.includes('web search') || text.includes('webSearch')) {
            clientLog.webSearch.processing('Processing web search results in response');
            
            // Check for search result counts
            const resultMatch = text.match(/found (\d+) results/i);
            if (resultMatch && resultMatch[1]) {
              const count = parseInt(resultMatch[1], 10);
              
              // Find the query from our active set
              if (activeSearchQueries.size > 0) {
                const query = Array.from(activeSearchQueries)[0]; // Use the first query as an approximation
                clientLog.webSearch.results(query, count);
                activeSearchQueries.delete(query);
              }
            }
          }
        } catch (e) {
          // Silently fail if we can't process the response
        }
      }, 0);
    }
    
    return response;
  };
  
  // Log that monitoring is active
  console.log('%c🌐 Web Search Network Monitor', 'background: #4285f4; color: white; padding: 2px 4px; border-radius: 3px;', 'Initialized');
}

// Call this function to restore the original fetch
export function restoreOriginalFetch() {
  if (typeof window !== 'undefined' && originalFetch) {
    window.fetch = originalFetch;
  }
} 