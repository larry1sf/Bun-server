import { groqService } from "./services/ia/groq"
import { cerebrasService } from "./services/ia/cerebras"
import { openRouterService } from "./services/ia/openrouter"
import { googleService } from "./services/ia/google"
import { getCookie } from "./utilities/jwt"
import type { AIService, ChatMessage } from "./types"
import jwt from "jsonwebtoken";
import { getUser } from "./services/db/users"

const SECRET = "CLAVE_SUPER_SECRETA_CAMBIALA";

// Middleware JWT
function requireAuth(req: Request) {
    const token = getCookie(req, "token");
    if (!token) return null;

    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
}

const services: AIService[] = [
    googleService,
    groqService,
    cerebrasService,
    openRouterService
]
let currentServiceIndex = 0

function getNextService() {
    const service = services[currentServiceIndex]
    currentServiceIndex = (currentServiceIndex + 1) % services.length
    return service
}

const server = Bun.serve({
    port: process.env.PORT ?? 3000,
    async fetch(req) {
        const { pathname } = new URL(req.url)
        const method = req.method

        if (method === "POST" && pathname === "/login") {
            const { email, password } = await req.json() as { email: string, password: string }
            const user = await getUser(email, password)

            if (!user) return new Response("Usuario no encontrado", { status: 401 })

            const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" })
            return new Response("Login correcto", {
                headers: {
                    "Set-Cookie": `
                    token=${token};
                    HttpOnly;
                    Secure;
                    SameSite=Strict;
                    Path=/
                    `
                }
            });
        }

        if (pathname === "dashboard") {
            const auth = requireAuth(req)

            if (!auth) return new Response("No autorizado", { status: 401 })
            return new Response("Te encuentras en el Dashboard")
        }

        if (method === "POST" && pathname === "/chat") {
            const { messages } = await req.json() as { messages: ChatMessage[] }
            const service = getNextService()
            console.log(`Using service: ${service?.name}`)
            const stream = await service?.chat(messages)

            return new Response(stream, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            })
        }

        return new Response("No sirve", { status: 404 })
    }
})

console.log("API corriendo correctamente!")