export const ENV = {
  API_BASE_URL: process.env.API_BASE_URL!,   // ej: https://tu-web.vercel.app/api
  AUTH_LOGIN_PATH: process.env.AUTH_LOGIN_PATH ?? "/app-auth/login",
  AUTH_ME_PATH: process.env.AUTH_ME_PATH ?? "/app-auth/me",
};
if (!ENV.API_BASE_URL) throw new Error("Falta API_BASE_URL en .env.local");
