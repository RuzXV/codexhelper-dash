const API_BASE = import.meta.env.VITE_API_BASE || 'https://codexhelper.com';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : endpoint;

    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            // Session expired — trigger logout
            document.dispatchEvent(new CustomEvent('auth:sessionExpired'));
            throw new Error('Session expired');
        }
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return response.json().catch(() => ({}));
}

export function getApiBase(): string {
    return API_BASE;
}
