// Global providers used by the app (auth UI, routing helpers).
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@/lib/auth-client"
import { useNavigate, NavLink } from "react-router-dom"

export function Providers({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()

    return (
        <AuthUIProvider
            authClient={authClient}
            navigate={navigate}
            // Use React Router links inside the auth UI components.
            Link={(props)=> <NavLink {...props} to={props.href} />}
        >
            {children}
        </AuthUIProvider>
    )
}
