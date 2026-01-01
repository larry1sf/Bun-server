// Utilidad para leer cookies
export function getCookie(req: Request, name: string) {
    const cookie = req.headers.get("cookie");
    if (!cookie) return null;

    return cookie
        .split("; ")
        .find(c => c.startsWith(name + "="))
        ?.split("=")[1] ?? null;
}

