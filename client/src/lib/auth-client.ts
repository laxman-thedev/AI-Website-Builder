// Auth client setup and hooks for the UI.
import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: import.meta.env.VITE_BASE_URL,
    fetchOptions: {
        credentials: "include",
    },
})

// Convenience exports for auth actions and session state.
export const { signIn, signUp, useSession } = authClient;
