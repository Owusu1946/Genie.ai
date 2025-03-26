import { z } from 'zod';

// Simple in-memory rate limiting
const rateLimiter = {
  lastResetTime: Date.now(),
  // Reset counter every day (24 hours)
  resetInterval: 24 * 60 * 60 * 1000,
  // Free tier allows 100 queries per day
  maxQueries: 100,
  currentQueries: 0,
  
  // Check if we're within the rate limit
  canMakeRequest() {
    const now = Date.now();
    // Reset counter if reset interval has passed
    if (now - this.lastResetTime > this.resetInterval) {
      this.lastResetTime = now;
      this.currentQueries = 0;
    }
    return this.currentQueries < this.maxQueries;
  },
  
  // Increment the counter
  incrementCounter() {
    this.currentQueries++;
  }
};

const searchResultSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string().optional(),
  htmlSnippet: z.string().optional(),
  displayLink: z.string().optional(),
  formattedUrl: z.string().optional(),
});

const searchResponseSchema = z.object({
  items: z.array(searchResultSchema).optional(),
  searchInformation: z.object({
    totalResults: z.string().optional(),
    formattedSearchTime: z.string().optional(),
  }).optional(),
  error: z.object({
    code: z.number().optional(),
    message: z.string().optional(),
  }).optional(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

// Before calling the API, always pass this object through the reasoning chain
export const webSearchInitialReasoning = {
  reasoning: "I need to search the web for current information. Let me do that now...",
};

// After getting results, pass this through the reasoning chain
export const webSearchResultsReasoning = (count: number, query: string) => ({
  reasoning: `I found ${count} results from the web about "${query}". Let me analyze this information...`,
});

export const webSearch = {
  description: 'Search the web for current information',
  parameters: z.object({
    query: z.string().describe('The search query to run on the web'),
  }),
  handler: async ({ query }: { query: string }) => {
    console.log(`🔍 Web Search: Starting search for query: "${query}"`);
    
    try {
      // Check for required environment variables
      const apiKey = process.env.GOOGLE_API_KEY;
      const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

      if (!apiKey || !searchEngineId) {
        console.error('❌ Web Search: Missing Google API credentials');
        return [
          {
            title: 'Search Configuration Error',
            link: '#',
            snippet: 'The search functionality is not properly configured. Please set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables.',
          },
          {
            title: 'API Keys Status',
            link: '#',
            snippet: `API Key: ${apiKey ? 'Set (but may be invalid)' : 'Missing'}, Search Engine ID: ${searchEngineId ? 'Set (but may be invalid)' : 'Missing'}. Check README-SEARCH.md for setup instructions.`,
          },
          {
            title: 'How to Fix',
            link: 'https://programmablesearchengine.google.com/',
            snippet: 'To fix this issue, you need to create a Google Custom Search Engine and API key. Visit the Google Programmable Search Engine page to set up your search engine.',
          },
        ];
      }

      // Check rate limiting
      if (!rateLimiter.canMakeRequest()) {
        console.error(`❌ Web Search: Rate limit exceeded. Current count: ${rateLimiter.currentQueries}/${rateLimiter.maxQueries}`);
        return [
          {
            title: 'Search Rate Limit Exceeded',
            link: '#',
            snippet: 'The daily quota for web searches has been reached. Please try again tomorrow.',
          },
        ];
      }

      // Construct the Google Custom Search API URL
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.append('key', apiKey);
      searchUrl.searchParams.append('cx', searchEngineId);
      searchUrl.searchParams.append('q', query);
      // Request extra information and more results
      searchUrl.searchParams.append('num', '5');
      
      console.log(`🔍 Web Search: Requesting results from Google API for query: "${query}"`);

      // Make the API request
      const response = await fetch(searchUrl.toString(), {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      });
      
      // Increment rate limiter counter regardless of success/failure
      rateLimiter.incrementCounter();
      console.log(`🔍 Web Search: Rate limit counter incremented to ${rateLimiter.currentQueries}/${rateLimiter.maxQueries}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Web Search: Google API error [${response.status}]: ${errorText}`);
        
        // Handle specific error codes
        if (response.status === 429) {
          return [
            {
              title: 'Search Rate Limit Exceeded',
              link: '#',
              snippet: 'The Google Search API quota has been exceeded. Please try again tomorrow.',
            },
            {
              title: 'Quota Information',
              link: 'https://developers.google.com/custom-search/v1/overview',
              snippet: 'The free tier of Google Custom Search allows 100 search queries per day. Consider upgrading to a paid plan if you need more searches.',
            },
          ];
        } else if (response.status === 403) {
          return [
            {
              title: 'Search API Access Denied',
              link: '#',
              snippet: 'Access to the Google Search API was denied. Please check your API credentials.',
            },
            {
              title: 'Troubleshooting Steps',
              link: 'https://console.cloud.google.com/',
              snippet: 'Verify that your API key is correct, the Custom Search API is enabled in your Google Cloud project, and billing is properly set up if required.',
            },
          ];
        }
        
        // Generic error with helpful information
        return [
          {
            title: `Search API Error (${response.status})`,
            link: '#',
            snippet: `The Google Search API returned an error with status code ${response.status}.`,
          },
          {
            title: 'Error Details',
            link: '#',
            snippet: errorText.substring(0, 300) + (errorText.length > 300 ? '...' : ''),
          },
          {
            title: 'Troubleshooting Help',
            link: 'https://developers.google.com/custom-search/v1/reference/errors',
            snippet: 'For help resolving this issue, check the Google API error documentation or try running diagnostics with Alt+Click on the web search icon.',
          },
        ];
      }

      const data = await response.json();
      console.log(`✅ Web Search: Received response from Google API`, {
        searchTime: data.searchInformation?.formattedSearchTime,
        totalResults: data.searchInformation?.totalResults,
        resultCount: data.items?.length || 0
      });
      
      const validatedData = searchResponseSchema.parse(data);

      // Check for API-level errors
      if (validatedData.error) {
        console.error(`❌ Web Search: API error: ${validatedData.error.message}`);
        return [
          {
            title: 'Search API Error',
            link: '#',
            snippet: `Error ${validatedData.error.code}: ${validatedData.error.message}`,
          },
        ];
      }

      // If no results are found
      if (!validatedData.items || validatedData.items.length === 0) {
        console.log(`ℹ️ Web Search: No results found for query: "${query}"`);
        return [
          {
            title: 'No results found',
            link: '#',
            snippet: `No search results found for query: "${query}"`,
          },
        ];
      }

      // Transform and return Google search results with formatted snippets
      const results = validatedData.items.map(item => ({
        title: item.title,
        link: item.link,
        // Use the snippet or htmlSnippet field, falling back to a default message
        snippet: item.snippet || 
                (item.htmlSnippet ? item.htmlSnippet.replace(/<\/?[^>]+(>|$)/g, "") : 'No description available'),
      })).slice(0, 5); // Limit to top 5 results
      
      console.log(`✅ Web Search: Returning ${results.length} results for query: "${query}"`, results);
      return results;
    } catch (error) {
      console.error('❌ Web Search error:', error);
      
      // Provide a more helpful error message
      return [
        {
          title: 'Search Error',
          link: '#',
          snippet: error instanceof Error 
            ? `Error searching the web: ${error.message}`
            : 'An error occurred while searching the web. The search API may be unavailable.',
        },
        {
          title: `Search query was: ${query}`,
          link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          snippet: 'You can try searching manually using this link.',
        },
      ];
    }
  },
}; 