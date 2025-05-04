import { z } from "zod"

export const authSchema = z.object({
  username: z.string()
    .min(1, "用戶名不能為空")
    .max(20, "用戶名不能超過20個字符")
    .regex(/^[a-zA-Z0-9_-]+$/, "用戶名只能包含字母、數字、下劃線和橫槓")
    .refine(val => !val.includes('@'), "用戶名不能是郵箱格式"),
  password: z.string()
    .min(8, "密碼長度必須大於等於8位")
})

export type AuthSchema = z.infer<typeof authSchema>
