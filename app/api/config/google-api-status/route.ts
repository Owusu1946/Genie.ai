import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

/**
 * API endpoint to check Google API credentials
 * GET /api/config/google-api-status
 */
export async function GET() {
  // Ensure user is authenticated
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check for required environment variables
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  const result = {
    isValid: false,
    apiKey: {
      value: apiKey ? '[REDACTED]' : null,
      exists: !!apiKey,
      isValid: false,
      error: null,
    },
    searchEngineId: {
      value: searchEngineId ? '[REDACTED]' : null, 
      exists: !!searchEngineId,
      isValid: false,
      error: null,
    },
    message: '',
  };
  
  // If any credential is missing, return early
  if (!apiKey || !searchEngineId) {
    result.message = 'Missing Google API credentials';
    return NextResponse.json(result);
  }

  // Validate API key and Search Engine ID by making a test request
  try {
    // Construct a test Google Custom Search API URL
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', searchEngineId);
    searchUrl.searchParams.append('q', 'test'); // Simple test query
    searchUrl.searchParams.append('num', '1'); // Just request 1 result
    
    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (response.ok) {
      // API key and Search Engine ID are valid
      result.isValid = true;
      result.apiKey.isValid = true;
      result.searchEngineId.isValid = true;
      result.message = 'Google API credentials are valid';
    } else {
      // Handle API-specific errors
      const data = await response.json();
      
      if (response.status === 403) {
        // API key is invalid or doesn't have permissions
        result.apiKey.isValid = false;
        result.apiKey.error = data.error?.message || 'Access denied';
        result.message = 'Invalid API key or insufficient permissions';
      } else if (response.status === 400 && data.error?.message?.includes('cx')) {
        // Search Engine ID is invalid
        result.searchEngineId.isValid = false;
        result.searchEngineId.error = data.error?.message || 'Invalid Search Engine ID';
        result.message = 'Invalid Search Engine ID';
      } else {
        // Other API error
        result.message = `API error: ${data.error?.message || response.status}`;
      }
    }
  } catch (error) {
    // Network or other errors
    result.message = `Error validating credentials: ${error instanceof Error ? error.message : String(error)}`;
  }
  
  return NextResponse.json(result);
} 