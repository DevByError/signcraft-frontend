import axios from 'axios';

// 1. Create a simple Event Emitter class for the browser
class AuthEventEmitter {
    private events: { [key: string]: Function[] } = {};

    on(event: string, listener: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listenerToRemove: Function) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }

    emit(event: string, ...args: any[]) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(...args));
    }
}

// 2. Export a single instance to be used across the app
export const authEvents = new AuthEventEmitter();

// 3. Configure Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Sends cookies automatically
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response Interceptor: Catch 401 Errors Globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If we get a 401 (Unauthorized) from the backend
        if (error.response && error.response.status === 401) {
            console.warn('[API] 401 Session Expired detected. Emitting event...');
            authEvents.emit('sessionExpired');
        } else if (error.response.status === 403) {
            authEvents.emit('accessDenied'); // <--- NEW EVENT
        }
        return Promise.reject(error);
    }
);

export default api;