// Application entry point that mounts the React app and global providers.
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { Providers } from "./providers.tsx"

// Render the app with routing and shared providers.
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Providers>
      <App />
    </Providers>
  </BrowserRouter>,
)
