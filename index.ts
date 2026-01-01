import { groqService } from "./services/groq"
import { cerebrasService } from "./services/cerebras"
import { openRouterService } from "./services/openrouter"
import type { AIService,ChatMessage } from "./types"

const services:AIService[] = [
    groqService,
    cerebrasService,
    openRouterService
]
let currentServiceIndex = 0

function getNextService(){
    const service = services[currentServiceIndex]
    currentServiceIndex = (currentServiceIndex + 1) % services.length
    return service
}

const server = Bun.serve({
    port:process.env.PORT ?? 3000,
    async fetch(req) {
        const {pathname} = new URL(req.url)
        const method = req.method
        
        if(method === "POST" && pathname === "/chat"){
            const {messages} = await req.json() as {messages:ChatMessage[]}
            const service = getNextService()
            console.log(`Using service: ${service?.name}`)
            const stream = await service?.chat(messages)

            return new Response(stream,{
                headers:{
                    "Content-Type":"text/event-stream",
                    "Cache-Control":"no-cache",
                    "Connection":"keep-alive",
                }
            })
        }
        
        return new Response("No sirve",{status:404})
    }
})

console.log("API corriendo correctamente!")