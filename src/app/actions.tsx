'use server';

import { createStreamableValue } from 'ai/rsc';
import { CoreMessage, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Weather } from '@/components/weather';
import { generateText } from 'ai';
import { createStreamableUI } from 'ai/rsc';
import { ReactNode } from 'react';
import { z } from 'zod';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  display?: ReactNode;
}


// Streaming Chat 
export async function continueTextConversation(messages: CoreMessage[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'HTTP-Referer': 'https://github.com',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4-turbo-preview',
      messages,
      stream: true
    })
  });

  const stream = createStreamableValue(response.body);
  return stream.value;
}

// Gen UIs 
export async function continueConversation(history: Message[]) {
  const stream = createStreamableUI();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'HTTP-Referer': 'https://github.com',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a friendly weather assistant!' },
        ...history
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'showWeather',
          description: 'Show the weather for a given location.',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string', description: 'The city to show the weather for.' },
              unit: { type: 'string', enum: ['F'], description: 'The unit to display the temperature in' }
            },
            required: ['city', 'unit']
          }
        }
      }]
    })
  });

        const completion = await response.json();
        const text = completion.choices[0]?.message?.content;
        const toolResults = completion.choices[0]?.message?.tool_calls || [];

        if (toolResults.length > 0) {
          await Promise.all(toolResults.map(async (toolCall) => {
            if (toolCall.function.name === 'showWeather') {
              const { city, unit } = JSON.parse(toolCall.function.arguments);
              stream.done(<Weather city={city} unit={unit} />);
            }
          }));
        }

        return {
          messages: [
            ...history,
            {
              role: 'assistant' as const,
              content: text || '',
              display: stream.value,
            },
          ],
        };
      }
// Utils
export async function checkAIAvailability() {
  const envVarExists = !!process.env.OPENROUTER_API_KEY;
  return envVarExists;
}