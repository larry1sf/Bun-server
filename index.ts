import { groqService } from "./services/ia/groq"
import { cerebrasService } from "./services/ia/cerebras"
import { openRouterService } from "./services/ia/openrouter"
import { googleService } from "./services/ia/google"
import { getCookie } from "./utilities/jwt"
import type { AIService, ChatMessage } from "./types"
import jwt from "jsonwebtoken";
import { getUser } from "./services/db/users"

const SECRET = process.env.JWT_SECRET || 'CLAVE_SUPER_SECRETA';
const isProd = process.env.NODE_ENV === "production";
const CORS_HEADERS = {
    "Access-Control-Allow-Origin": process.env.ORIGIN || "http://localhost:3000",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true"
}
const COOKIE_SETTINGS = isProd
    ? "HttpOnly; Secure; SameSite=None; Path=/"
    : "HttpOnly; SameSite=Lax; Path=/";
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

const OPCIONES_METHODOS = {
    "GET": (req: Request) => {
        const auth = requireAuth(req)

        if (!auth) return new Response("No autorizado", { status: 401, headers: CORS_HEADERS })

        return new Response(JSON.stringify({
            message: "Te encuentras en el login pero con sesion iniciada",
            status: 200
        }), { headers: CORS_HEADERS })
    },
    "POST": async (req: Request) => {
        const { email, password } = await req.json() as { email: string, password: string }
        const user = await getUser(email, password)

        if (!user) return new Response("Usuario no encontrado", { status: 401, headers: CORS_HEADERS })
        const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" })

        return new Response(JSON.stringify({ message: "Login correcto", status: 200 }), {
            headers: {
                ...CORS_HEADERS,
                "Set-Cookie": `token=${token}; ${COOKIE_SETTINGS}`
            }
        });
    },
    "OPTIONS": () => { return new Response(null, { headers: CORS_HEADERS }); },
}

const server = Bun.serve({
    port: process.env.PORT ?? 8080,
    async fetch(req) {
        const { pathname } = new URL(req.url)
        const method = req.method as keyof typeof OPCIONES_METHODOS

        if (method === "OPTIONS")
            return OPCIONES_METHODOS[method]()

        if (pathname === "/login") {
            const handler = OPCIONES_METHODOS[method]
            if (handler)
                return (handler as (req: Request) => Response)(req)
        }

        if (pathname === "/dashboard") {
            const auth = requireAuth(req)

            if (!auth) return new Response("No autorizado", { status: 401, headers: CORS_HEADERS })

            return new Response(JSON.stringify({
                message: "Te encuentras en el Dashboard",
                status: 200
            }), { headers: CORS_HEADERS })
        }

        if (method === "GET" && pathname === "/logout") {

            return new Response(JSON.stringify({ message: "Sesión cerrada", status: 200 }), {
                headers: {
                    ...CORS_HEADERS,
                    "Set-Cookie": `token=;HttpOnly;Path=/;Max-Age=0;Expires=0`
                }
            });
        }

        if (method === "POST" && pathname === "/chat") {
            const auth = requireAuth(req)
            if (!auth) return new Response("No autorizado", { status: 401, headers: CORS_HEADERS })

            const { messages } = await req.json() as { messages: ChatMessage[] }
            const service = getNextService()
            console.log(`Using service: ${service?.name}`)
            const stream = await service?.chat(messages)

            return new Response(stream, {
                headers: {
                    ...CORS_HEADERS,
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            })
        }

        return new Response("No sirve", { status: 404, headers: CORS_HEADERS })
    }
})

console.log("API corriendo correctamente!")