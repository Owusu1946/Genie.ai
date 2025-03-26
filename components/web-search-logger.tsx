'use client';

import { useEffect } from 'react';
import { initWebSearchNetworkMonitor } from '@/lib/utils/web-search-monitor';

/**
 * Client component that initializes web search logging
 * Use this component at the root of your application
 */
export function WebSearchLogger() {
  useEffect(() => {
    // Initialize network monitoring for web search
    initWebSearchNetworkMonitor();
    
    // Log that the logger component is initialized
    console.log('%c🌐 Web Search Logger', 'background: #34a853; color: white; padding: 2px 4px; border-radius: 3px;', 'Initialized and ready to track web search activity');
    
    // Return cleanup function
    return () => {
      // Clean up if component unmounts (though this is unlikely for root component)
      if (typeof window !== 'undefined') {
        console.log('%c🌐 Web Search Logger', 'background: #ea4335; color: white; padding: 2px 4px; border-radius: 3px;', 'Shutting down');
      }
    };
  }, []);
  
  // This component doesn't render anything
  return null;
} 