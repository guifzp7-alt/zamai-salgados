const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("zamai_token");
}

export function setToken(token: string) {
  window.localStorage.setItem("zamai_token", token);
}

export function clearToken() {
  window.localStorage.removeItem("zamai_token");
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro de comunicacao." }));
    throw new Error(error.message ?? "Erro de comunicacao.");
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function money(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
