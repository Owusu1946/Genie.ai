import {
  UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { webSearch, webSearchInitialReasoning, webSearchResultsReasoning } from '@/lib/ai/tools/web-search';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages: initialMessages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    let messages = [...initialMessages];

    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Check if this is a web search request
    let isWebSearch = false;
    let webSearchQuery = '';
    
    // Check if the first part is a text part and starts with /web
    const firstPart = userMessage.parts[0];
    if (firstPart && 
        'text' in firstPart && 
        typeof firstPart.text === 'string' && 
        firstPart.text.startsWith('/web ')) {
      isWebSearch = true;
      // Remove the /web prefix for processing
      webSearchQuery = firstPart.text.substring(5).trim();
      
      // Create updated message parts with the modified text
      const updatedParts = [
        {
          ...firstPart,
          text: webSearchQuery
        },
        ...(userMessage.parts.slice(1) || [])
      ];
      
      // Create an updated user message
      const updatedUserMessage = {
        ...userMessage,
        parts: updatedParts
      };
      
      // Update messages array with the updated user message
      messages = messages.map(msg => 
        msg.id === userMessage.id ? updatedUserMessage : msg
      );
      
      // Also update the original userMessage for later use
      userMessage.parts = updatedParts;
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    // Prepare the system prompt with additional context for web search
    const enhancedSystemPrompt = isWebSearch
      ? systemPrompt({ selectedChatModel }) + 
        '\n\nThe user has requested web search information. Use the webSearch tool to find current information on the web. IMPORTANT INSTRUCTIONS:\n\n' +
        '1. ALWAYS begin your response by showing what you searched for: "I searched the web for: [query]"\n' +
        '2. If the search returns an error or configuration issue, you MUST display the exact error message to the user. Do not hide errors.\n' +
        '3. Display all search results in a structured format, including titles, snippets, and URLs.\n' +
        '4. Format each result like this:\n' +
        '   ## [Title]\n' +
        '   [Snippet]\n' +
        '   Source: [URL]\n\n' +
        '5. After showing all results, provide a summary of the information found.\n' +
        '6. Always cite your sources by including the URLs from the search results.\n' +
        '7. Do not make up information that is not in the search results.'
      : systemPrompt({ selectedChatModel });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: enhancedSystemPrompt,
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                  'webSearch',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
            webSearch: {
              description: webSearch.description,
              parameters: webSearch.parameters,
              handler: async (params: { query: string }) => {
                console.log(`🔍 Web Search Status: Searching for "${params.query}"...`);
                
                // Call the actual web search function
                const results = await webSearch.handler(params);
                
                console.log(`✅ Web Search Status: Found ${results.length} results for "${params.query}"`);
                
                return results;
              }
            }
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
