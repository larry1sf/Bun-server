import { OpenRouter } from '@openrouter/sdk';
import type { ChatMessage } from '../types';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export const openRouterService = {
    name: 'openrouter',
    async chat(messages: ChatMessage[]) {
       const stream = await openRouter.chat.send({
        model: "google/gemma-3-4b-it:free",
        messages,
        stream: true
        })

        return (async function*() {
            for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) yield content
            }
        })()
    }
}

