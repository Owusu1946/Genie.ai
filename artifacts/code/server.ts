import { z } from 'zod';
import { streamObject } from 'ai';
import { myProvider } from '@/lib/ai/providers';
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

// Helper function to strip markdown code block delimiters
const stripCodeBlockDelimiters = (code: string): string => {
  // Handle all common formats of markdown code blocks
  
  // First approach: If it clearly starts with ``` and ends with ```
  if (/^```[\w-]*[\s\n]/.test(code) && /```[\s\n]*$/.test(code)) {
    // Remove the opening delimiter line (```python, ```javascript, etc.)
    // This handles language specifiers with or without a newline
    let cleanedCode = code.replace(/^```[\w-]*[\s\n]+/, '');
    
    // Remove the closing delimiter (```) and any whitespace around it
    cleanedCode = cleanedCode.replace(/[\s\n]*```[\s\n]*$/, '');
    
    return cleanedCode.trim();
  }
  
  // Second approach: If the regex didn't catch it but it still has markdown delimiters
  // Use a more aggressive approach for incomplete or malformed code blocks
  if (code.includes('```')) {
    // Try to clean up any format of code block by removing all ``` instances and language specifiers
    let cleanedCode = code;
    
    // Remove opening delimiter if present (with language)
    cleanedCode = cleanedCode.replace(/```[\w-]*[\s\n]+/, '');
    
    // Remove closing delimiter if present
    cleanedCode = cleanedCode.replace(/[\s\n]*```[\s\n]*$/, '');
    
    // If we still have ``` in the code, it's probably a malformed block
    // Just remove all remaining ``` as a last resort
    cleanedCode = cleanedCode.replace(/```/g, '');
    
    return cleanedCode.trim();
  }
  
  // Already clean code - just return it
  return code.trim();
};

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: codePrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          // Strip markdown code block delimiters before sending to the editor
          const cleanCode = stripCodeBlockDelimiters(code);
          
          dataStream.writeData({
            type: 'code-delta',
            content: cleanCode,
          });

          draftContent = cleanCode;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          // Strip markdown code block delimiters before sending to the editor
          const cleanCode = stripCodeBlockDelimiters(code);
          
          dataStream.writeData({
            type: 'code-delta',
            content: cleanCode,
          });

          draftContent = cleanCode;
        }
      }
    }

    return draftContent;
  },
});
