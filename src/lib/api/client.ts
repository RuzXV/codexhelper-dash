const API_BASE = import.meta.env.VITE_API_BASE || 'https://codexhelper.com';

async function doFetch(url: string, options: RequestInit): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : endpoint;

    let response = await doFetch(url, options);

    // Retry once on 503 (transient/service unavailable) or 403 on GET (possible auth race condition)
    if (response.status === 503 || (response.status === 403 && (!options.method || options.method === 'GET'))) {
        await new Promise((r) => setTimeout(r, 1000));
        response = await doFetch(url, options);
    }

    if (!response.ok) {
        if (response.status === 401) {
            // Session expired — trigger logout
            document.dispatchEvent(new CustomEvent('auth:sessionExpired'));
            throw new Error('Session expired');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `API request failed with status ${response.status}`);
    }

    return response.json().catch(() => ({}));
}

export function getApiBase(): string {
    return API_BASE;
}
