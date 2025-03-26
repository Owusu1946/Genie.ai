'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, SearchIcon, AlertTriangleIcon, InfoIcon } from 'lucide-react';

/**
 * WebSearchStatus component displays a visual indicator of web search status
 * It monitors network traffic for web search requests and displays feedback to users
 */
export function WebSearchStatus() {
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'searching' | 'complete' | 'error'
  >('idle');
  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to detect web search in messages
    const checkForWebSearch = (message: any) => {
      if (
        message?.role === 'user' && 
        typeof message.content === 'string' && 
        message.content.startsWith('/web ')
      ) {
        const searchQuery = message.content.substring(5).trim();
        setQuery(searchQuery);
        setSearchStatus('searching');
        
        // Show toast to user
        toast.info(`Searching the web for: ${searchQuery}`, {
          description: "This may take a few moments...",
          duration: 4000,
        });
        
        return true;
      }
      return false;
    };
    
    // Function to detect search errors in responses
    const checkForSearchErrors = (text: string) => {
      if (text.includes('Search Configuration Error') || 
          text.includes('API Keys Status') ||
          text.includes('Search Rate Limit Exceeded') ||
          text.includes('Access Denied') ||
          text.includes('API error')) {
        
        setSearchStatus('error');
        
        // Extract error message from the response
        let errorMsg = "Failed to search the web. Check API configuration.";
        
        if (text.includes('Set (but may be invalid)')) {
          errorMsg = "API keys may be invalid. Check Google API configuration.";
        } else if (text.includes('Rate Limit Exceeded')) {
          errorMsg = "Search quota exceeded. Try again tomorrow.";
        } else if (text.includes('Search API Access Denied')) {
          errorMsg = "Google API access denied. Check API credentials.";
        }
        
        setError(errorMsg);
        
        toast.error("Web search failed", {
          description: errorMsg,
          duration: 5000,
        });
        
        return true;
      }
      return false;
    };
    
    // Function to detect search completion
    const checkForSearchCompletion = (text: string) => {
      if (searchStatus === 'searching' && 
          (text.includes('Source:') || 
           text.includes('found') && text.includes('results'))) {
        
        setSearchStatus('complete');
        toast.success("Web search complete", {
          description: "Results displayed below",
          duration: 3000,
        });
        
        return true;
      }
      return false;
    };
    
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to monitor requests and responses
    window.fetch = async function(input, init) {
      const url = input instanceof Request ? input.url : input.toString();
      
      // Check outgoing chat requests for web search
      if (url.includes('/api/chat') && init?.body && typeof init.body === 'string') {
        try {
          const data = JSON.parse(init.body);
          
          if (data.messages && Array.isArray(data.messages)) {
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage) {
              checkForWebSearch(lastMessage);
            }
          }
        } catch (e) {
          // Silently fail
        }
      }
      
      // Make the actual fetch request
      const response = await originalFetch(input, init);
      
      // Check responses from chat API
      if (url.includes('/api/chat') && searchStatus === 'searching') {
        const responseClone = response.clone();
        
        // Process in background without blocking
        setTimeout(async () => {
          try {
            // Get the response text to look for errors or completion
            const text = await responseClone.text();
            
            if (!checkForSearchErrors(text)) {
              checkForSearchCompletion(text);
            }
          } catch (e) {
            // Silently fail
          }
        }, 0);
      }
      
      return response;
    };
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [searchStatus]);
  
  // Don't render anything if not searching
  if (searchStatus === 'idle') return null;
  
  return (
    <div className="absolute top-20 right-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-md" 
         style={{ 
           backgroundColor: searchStatus === 'error' ? 'rgba(220, 38, 38, 0.1)' : 
                          searchStatus === 'complete' ? 'rgba(34, 197, 94, 0.1)' : 
                          'rgba(59, 130, 246, 0.1)',
           borderLeft: `4px solid ${
             searchStatus === 'error' ? 'rgb(220, 38, 38)' : 
             searchStatus === 'complete' ? 'rgb(34, 197, 94)' : 
             'rgb(59, 130, 246)'
           }`,
           maxWidth: '400px',
           transition: 'all 0.3s ease'
         }}>
      {searchStatus === 'searching' && (
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      )}
      {searchStatus === 'error' && (
        <AlertTriangleIcon className="h-4 w-4 text-red-500" />
      )}
      {searchStatus === 'complete' && (
        <SearchIcon className="h-4 w-4 text-green-500" />
      )}
      
      <div className="flex flex-col">
        <span className="font-medium">
          {searchStatus === 'searching' ? 'Searching the web...' : 
           searchStatus === 'error' ? 'Search failed' : 
           'Search complete'}
        </span>
        <span className="text-xs opacity-80 truncate">
          {searchStatus === 'error' ? error : `Query: "${query}"`}
        </span>
      </div>
      
      {(searchStatus === 'error' || searchStatus === 'complete') && (
        <button 
          onClick={() => setSearchStatus('idle')}
          className="ml-2 text-xs underline opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
} 