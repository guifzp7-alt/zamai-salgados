"use client";

import { useEffect, useState } from "react";
import { Lock, User } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { api, getToken, setToken } from "@/lib/api";

export default function Home() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password, remember })
      });
      setToken(response.token);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login.");
    }
  }

  if (authenticated) {
    return <AppShell onLogout={() => setAuthenticated(false)} />;
  }

  return (
    <main className="grid min-h-screen bg-slate-950 md:grid-cols-[1.1fr_0.9fr]">
      <section className="relative min-h-[36vh] overflow-hidden bg-[url('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="relative flex h-full min-h-[36vh] flex-col justify-end p-8 text-white md:min-h-screen md:p-12">
          <p className="text-sm font-bold uppercase tracking-wide text-red-100">PDV profissional</p>
          <h1 className="mt-2 max-w-xl text-4xl font-black md:text-6xl">Zamai Salgados</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-slate-100">Venda em segundos, controle estoque, acompanhe fiados e feche o caixa com clareza.</p>
        </div>
      </section>
      <section className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={login} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-black text-slate-950">Entrar</h2>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-bold text-slate-600">Usuario
              <span className="mt-1 flex h-12 items-center gap-3 rounded-md border border-slate-200 px-3 focus-within:border-brand-700">
                <User size={18} className="text-slate-400" />
                <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full outline-none" />
              </span>
            </label>
            <label className="block text-sm font-bold text-slate-600">Senha
              <span className="mt-1 flex h-12 items-center gap-3 rounded-md border border-slate-200 px-3 focus-within:border-brand-700">
                <Lock size={18} className="text-slate-400" />
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full outline-none" />
              </span>
            </label>
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="inline-flex items-center gap-2 font-bold text-slate-600">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                Permanecer conectado
              </label>
              <button type="button" className="font-bold text-brand-700">Recuperar senha</button>
            </div>
            {error && <p className="rounded-md bg-brand-50 p-3 text-sm font-bold text-brand-700">{error}</p>}
            <button className="h-12 w-full rounded-md bg-brand-700 font-black text-white">Acessar sistema</button>
          </div>
        </form>
      </section>
    </main>
  );
}
