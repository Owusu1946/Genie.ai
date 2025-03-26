# Setting Up Google Search for Genie.ai

This document provides instructions on how to set up the Google Custom Search API for the web search feature in Genie.ai.

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Access to [Programmable Search Engine](https://programmablesearchengine.google.com/)

## Steps to Set Up

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click on "New Project"
4. Enter a name for your project and click "Create"
5. Make sure your new project is selected in the project dropdown

### 2. Enable the Custom Search API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Custom Search API"
3. Click on "Custom Search API" in the results
4. Click "Enable"

### 3. Create API Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" and select "API key"
3. Your new API key will be displayed. Copy this key.
4. (Optional but recommended) Restrict the key to only the Custom Search API

### 4. Create a Programmable Search Engine

1. Go to the [Programmable Search Engine](https://programmablesearchengine.google.com/) page
2. Click "Add" to create a new search engine
3. Choose the sites you want to search:
   - For a general web search, select "Search the entire web"
   - For specific sites, enter the URLs you want to include
4. Give your search engine a name and click "Create"
5. On the next page, click "Control Panel" for your new search engine
6. Copy the "Search engine ID" (cx)

### 5. Update Environment Variables

1. Open your `.env` and `.env.local` files
2. Replace the placeholders with your actual API key and search engine ID:

```
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

3. Restart your application for the changes to take effect

## Usage

Once configured, you can use the web search feature in Genie.ai by:

1. Clicking the globe icon in the chat input field, or
2. Typing `/web` followed by your search query

## Limitations

- The Google Custom Search API has a limit of 100 free queries per day
- For production use, you may need to set up billing in your Google Cloud Console
- Search results are limited to the top 5 most relevant results to avoid overwhelming the AI

## Troubleshooting

If you encounter issues with the search functionality:

- Verify that your API key and search engine ID are correctly set in the environment variables
- Check the application logs for error messages
- Ensure that the Custom Search API is enabled in your Google Cloud project
- Verify that your billing information is up to date (if applicable)

For more detailed information, refer to:
- [Google Custom Search API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine Help](https://support.google.com/programmable-search/) 