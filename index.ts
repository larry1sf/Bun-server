const server = Bun.serve({
    port:process.env.PORT ?? 3000,
    async fetch(req) {
        return new Response("Hola desde bun!");
    }
})

console.log("API corriendo correctamente!")