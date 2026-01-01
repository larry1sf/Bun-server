import { tursoClient } from "../../db/conecction";
import type { User } from "../../types";

export const getUser = async (email: string, password: string) => {
    const { rows } = await tursoClient.execute({
        sql: "SELECT * FROM users WHERE email = $1 AND password = $2",
        args: [email, password],
    })
    const data = rows.map((row) => {
        const { id, email, password, date } = row
        return { id, email, password, date } as User
    })
    return data.length > 0
}
