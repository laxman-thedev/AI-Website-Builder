// Shared Axios instance for API requests.
import axios from 'axios';

// Base URL points to the backend API and sends cookies for auth.
const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3000',
    withCredentials: true,
});

export default api;
