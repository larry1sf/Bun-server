import { GoogleGenAI } from "@google/genai"
import type { ChatMessage } from "../../types"

const ai = new GoogleGenAI({})

export const googleService = {
  name: "google",
  async chat(messages: ChatMessage[]) {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: messages.map(m => m.content).join("\n"),
    });
    return (async function* () {
      for await (const chunk of stream)
        if (chunk.text) yield chunk.text
    })()
  }
}