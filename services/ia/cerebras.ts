import Cerebras from '@cerebras/cerebras_cloud_sdk';
import type { cerebrasMessage, cerebrasChunk } from '../../types';

const cerebras = new Cerebras();

export const cerebrasService = {
    name: "Cerebras",
    async chat(messages: cerebrasMessage[]) {
        const chatCompletion = await cerebras.chat.completions.create({
            messages,
            model: 'qwen-3-235b-a22b-instruct-2507',
            stream: true,
            max_completion_tokens: 20000,
            temperature: 0.7,
            top_p: 0.8
        });

        return (async function* () {
            for await (const chunk of chatCompletion) {
                yield (chunk.choices as cerebrasChunk)[0]?.delta?.content || '';
            }
        })();
    }
};