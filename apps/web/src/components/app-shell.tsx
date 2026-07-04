"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Boxes,
  CreditCard,
  FileDown,
  LayoutDashboard,
  LogOut,
  Moon,
  PackagePlus,
  Plus,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Users
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, clearToken, money } from "@/lib/api";
import type { Customer, Dashboard, Product, SaleItemInput } from "@/lib/types";

type Tab = "dashboard" | "pos" | "products" | "customers" | "cash" | "reports" | "settings";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Painel", icon: LayoutDashboard },
  { id: "pos", label: "Venda", icon: ShoppingCart },
  { id: "products", label: "Produtos", icon: Boxes },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "cash", label: "Caixa", icon: Receipt },
  { id: "reports", label: "Relatorios", icon: BarChart3 },
  { id: "settings", label: "Config", icon: Settings }
];

const categories = ["SALGADOS", "BEBIDAS", "DOCES", "OUTROS"] as const;

function numberValue(value: number | string) {
  return Number(value);
}

export function AppShell({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CASH" | "CARD" | "CREDIT">("PIX");
  const [customerId, setCustomerId] = useState("");
  const [receivedAmount, setReceivedAmount] = useState(0);

  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => api<Product[]>("/products") });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: () => api<Customer[]>("/customers") });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => api<any[]>("/sales") });
  const { data: report } = useQuery({ queryKey: ["reports"], queryFn: () => api<any>("/reports") });

  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const filteredProducts = products.filter((product) =>
    [product.name, product.internalCode, product.category].join(" ").toLowerCase().includes(search.toLowerCase())
  );
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const cartLines = Object.entries(cart).map(([productId, quantity]) => ({ product: productMap.get(productId)!, quantity })).filter((line) => line.product);
  const subtotal = cartLines.reduce((sum, line) => sum + numberValue(line.product.price) * line.quantity, 0);
  const total = Math.max(subtotal - discount, 0);

  const saleMutation = useMutation({
    mutationFn: () => api("/sales", {
      method: "POST",
      body: JSON.stringify({
        paymentMethod,
        customerId: paymentMethod === "CREDIT" ? customerId : undefined,
        discount,
        receivedAmount: paymentMethod === "CASH" ? receivedAmount : undefined,
        items: Object.entries(cart).filter(([, quantity]) => quantity > 0).map(([productId, quantity]): SaleItemInput => ({ productId, quantity }))
      })
    }),
    onSuccess: () => {
      setCart({});
      setDiscount(0);
      setReceivedAmount(0);
      queryClient.invalidateQueries();
      setTab("dashboard");
    }
  });

  function addProduct(product: Product) {
    if (!product.active || product.stockQuantity <= 0) return;
    setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
  }

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-soft backdrop-blur md:bottom-auto md:right-auto md:top-0 md:h-screen md:w-20 md:border-r md:border-t-0 md:px-3">
        <div className="hidden h-12 w-12 place-items-center rounded-md bg-brand-700 text-lg font-black text-white md:grid">ZS</div>
        <nav className="grid grid-cols-7 gap-1 md:mt-6 md:grid-cols-1">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => setTab(item.id)}
                className={`grid h-12 place-items-center rounded-md transition ${tab === item.id ? "bg-brand-700 text-white" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <Icon size={21} />
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="pb-24 md:ml-20 md:pb-0">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Zamai Salgados</p>
              <h1 className="text-xl font-black text-slate-950 md:text-2xl">{tabs.find((item) => item.id === tab)?.label}</h1>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <label className="relative hidden min-w-64 sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 outline-none focus:border-brand-700" placeholder="Pesquisar tudo" />
              </label>
              <button title="Tema escuro" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-600">
                <Moon size={18} />
              </button>
              <button title="Sair" onClick={logout} className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-7">
          {tab === "dashboard" && <DashboardView dashboard={dashboard} setTab={setTab} />}
          {tab === "pos" && (
            <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 flex-1 rounded-md border border-slate-200 px-4 outline-none focus:border-brand-700" placeholder="Buscar produto ou codigo" />
                  {categories.map((category) => <span key={category} className="rounded-md bg-white px-3 py-3 text-xs font-bold text-slate-600 shadow-sm">{category}</span>)}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <button key={product.id} onClick={() => addProduct(product)} className="min-h-36 rounded-md border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-700 hover:shadow-soft disabled:opacity-50" disabled={!product.active || product.stockQuantity <= 0}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">{product.category}</span>
                        <span className={`text-xs font-bold ${product.stockQuantity <= product.minimumStock ? "text-brand-700" : "text-slate-500"}`}>{product.stockQuantity} un.</span>
                      </div>
                      <h3 className="text-base font-black text-slate-950">{product.name}</h3>
                      <p className="mt-2 text-xl font-black text-brand-700">{money(product.price)}</p>
                    </button>
                  ))}
                </div>
              </div>
              <CartPanel
                cartLines={cartLines}
                setCart={setCart}
                subtotal={subtotal}
                discount={discount}
                setDiscount={setDiscount}
                total={total}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customers={customers}
                customerId={customerId}
                setCustomerId={setCustomerId}
                selectedCustomer={selectedCustomer}
                receivedAmount={receivedAmount}
                setReceivedAmount={setReceivedAmount}
                isLoading={saleMutation.isPending}
                onFinish={() => saleMutation.mutate()}
              />
            </section>
          )}
          {tab === "products" && <ProductsView products={products} />}
          {tab === "customers" && <CustomersView customers={customers} />}
          {tab === "cash" && <CashView dashboard={dashboard} sales={sales} />}
          {tab === "reports" && <ReportsView report={report} />}
          {tab === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

function DashboardView({ dashboard, setTab }: { dashboard?: Dashboard; setTab: (tab: Tab) => void }) {
  const cards = [
    ["Faturamento", money(dashboard?.revenue ?? 0)],
    ["Vendas", dashboard?.salesCount ?? 0],
    ["Recebido", money(dashboard?.received ?? 0)],
    ["Fiado", money(dashboard?.creditTotal ?? 0)],
    ["Clientes devendo", dashboard?.debtors ?? 0],
    ["Ticket medio", money(dashboard?.averageTicket ?? 0)]
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["Nova Venda", "pos"], ["Produtos", "products"], ["Clientes", "customers"], ["Estoque", "products"], ["Fiados", "customers"], ["Relatorios", "reports"], ["Configuracoes", "settings"]
        ].map(([label, id]) => <button key={label} onClick={() => setTab(id as Tab)} className="rounded-md bg-brand-700 px-4 py-3 text-sm font-bold text-white">{label}</button>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartBox title="Vendas por horario">
          <BarChart data={dashboard?.chart ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="vendas" fill="#7f1d1d" radius={[4, 4, 0, 0]} /></BarChart>
        </ChartBox>
        <ChartBox title="Faturamento por horario">
          <AreaChart data={dashboard?.chart ?? []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Area type="monotone" dataKey="faturamento" stroke="#111827" fill="#fee2e2" /></AreaChart>
        </ChartBox>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ListBox title="Produtos vendidos hoje" rows={(dashboard?.soldToday ?? []).map((item) => `${item.name} - ${item.quantity} un.`)} />
        <ListBox title="Estoque baixo" rows={(dashboard?.lowStock ?? []).map((item) => `${item.name} - ${item.stockQuantity} un.`)} />
      </div>
    </section>
  );
}

function CartPanel(props: any) {
  const change = Math.max((props.receivedAmount || 0) - props.total, 0);
  return (
    <aside className="rounded-md border border-slate-200 bg-white p-4 shadow-soft xl:sticky xl:top-24">
      <h2 className="text-lg font-black">Carrinho</h2>
      <div className="mt-4 space-y-2">
        {props.cartLines.map(({ product, quantity }: { product: Product; quantity: number }) => (
          <div key={product.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-slate-50 p-3">
            <div>
              <p className="font-bold">{product.name}</p>
              <p className="text-sm text-slate-500">{quantity} x {money(product.price)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => props.setCart((cart: Record<string, number>) => {
                const next = { ...cart };
                const quantityNext = Math.max((cart[product.id] ?? 1) - 1, 0);
                if (quantityNext === 0) delete next[product.id];
                else next[product.id] = quantityNext;
                return next;
              })} className="h-9 w-9 rounded-md border">-</button>
              <span className="w-7 text-center font-bold">{quantity}</span>
              <button onClick={() => props.setCart((cart: Record<string, number>) => ({ ...cart, [product.id]: (cart[product.id] ?? 0) + 1 }))} className="h-9 w-9 rounded-md border">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
        <MoneyRow label="Subtotal" value={props.subtotal} />
        <label className="block text-sm font-bold text-slate-600">Desconto
          <input type="number" value={props.discount} onChange={(event) => props.setDiscount(Number(event.target.value))} className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3" />
        </label>
        <MoneyRow label="Total" value={props.total} strong />
        <div className="grid grid-cols-4 gap-2">
          {["PIX", "CASH", "CARD", "CREDIT"].map((method) => <button key={method} onClick={() => props.setPaymentMethod(method)} className={`rounded-md border px-2 py-3 text-xs font-black ${props.paymentMethod === method ? "border-brand-700 bg-brand-700 text-white" : "border-slate-200"}`}>{method}</button>)}
        </div>
        {props.paymentMethod === "CREDIT" && (
          <>
            <select value={props.customerId} onChange={(event) => props.setCustomerId(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 px-3">
              <option value="">Selecionar cliente</option>
              {props.customers.map((customer: Customer) => <option key={customer.id} value={customer.id}>{customer.name} - {customer.sector}</option>)}
            </select>
            {props.selectedCustomer?.totalOpen > 0 && <p className="rounded-md bg-brand-50 p-3 text-sm font-bold text-brand-700">Cliente possui divida em aberto: {money(props.selectedCustomer.totalOpen)}</p>}
          </>
        )}
        {props.paymentMethod === "CASH" && (
          <>
            <input type="number" value={props.receivedAmount} onChange={(event) => props.setReceivedAmount(Number(event.target.value))} className="h-11 w-full rounded-md border border-slate-200 px-3" placeholder="Valor recebido" />
            <MoneyRow label="Troco" value={change} />
          </>
        )}
        <button disabled={!props.cartLines.length || props.isLoading || (props.paymentMethod === "CREDIT" && !props.customerId)} onClick={props.onFinish} className="h-13 w-full rounded-md bg-brand-700 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">Finalizar Venda</button>
      </div>
    </aside>
  );
}

function ProductsView({ products }: { products: Product[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", category: "SALGADOS", price: 0, stockQuantity: 0, minimumStock: 5, internalCode: "" });
  const create = useMutation({
    mutationFn: () => api("/products", { method: "POST", body: JSON.stringify({ ...form, active: true, favorite: false }) }),
    onSuccess: () => {
      setForm({ name: "", category: "SALGADOS", price: 0, stockQuantity: 0, minimumStock: 5, internalCode: "" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="inline-flex items-center gap-2 text-lg font-black"><PackagePlus size={20} /> Novo produto</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <input className="h-11 rounded-md border border-slate-200 px-3 md:col-span-2" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="h-11 rounded-md border border-slate-200 px-3" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Preco" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Estoque" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })} />
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Codigo" value={form.internalCode} onChange={(e) => setForm({ ...form, internalCode: e.target.value })} />
          <button onClick={() => create.mutate()} className="rounded-md bg-brand-700 px-4 py-3 font-bold text-white md:col-span-6">Salvar produto</button>
        </div>
      </div>
      <DataPanel title="Produtos" icon={PackagePlus} rows={products.map((p) => [p.name, p.category, money(p.price), `${p.stockQuantity} un.`, p.active ? "Ativo" : "Inativo"])} headers={["Nome", "Categoria", "Preco", "Estoque", "Status"]} />
    </section>
  );
}

function CustomersView({ customers }: { customers: Customer[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", sector: "", phone: "", notes: "" });
  const create = useMutation({
    mutationFn: () => api("/customers", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      setForm({ name: "", sector: "", phone: "", notes: "" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  });

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="inline-flex items-center gap-2 text-lg font-black"><Users size={20} /> Novo cliente</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Planta/Setor" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="h-11 rounded-md border border-slate-200 px-3" placeholder="Observacoes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button onClick={() => create.mutate()} className="rounded-md bg-brand-700 px-4 py-3 font-bold text-white md:col-span-4">Salvar cliente</button>
        </div>
      </div>
      <DataPanel title="Clientes e fiados" icon={Users} rows={customers.map((c) => [c.name, c.sector, c.phone || "-", money(c.totalOpen ?? 0), `${c.purchases ?? 0}`])} headers={["Nome", "Setor", "Telefone", "Aberto", "Compras"]} />
    </section>
  );
}

function CashView({ dashboard, sales }: { dashboard?: Dashboard; sales: any[] }) {
  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pix" value={money(sales.filter((s) => s.paymentMethod === "PIX").reduce((a, s) => a + Number(s.total), 0))} />
        <Stat label="Dinheiro" value={money(sales.filter((s) => s.paymentMethod === "CASH").reduce((a, s) => a + Number(s.total), 0))} />
        <Stat label="Cartao" value={money(sales.filter((s) => s.paymentMethod === "CARD").reduce((a, s) => a + Number(s.total), 0))} />
        <Stat label="Fiado" value={money(dashboard?.creditTotal ?? 0)} />
      </div>
      <button className="rounded-md bg-slate-950 px-4 py-3 font-bold text-white">Fechar caixa diario</button>
      <DataPanel title="Vendas do dia" icon={Receipt} rows={sales.map((s) => [new Date(s.createdAt).toLocaleString("pt-BR"), s.paymentMethod, s.status, money(s.total)])} headers={["Data", "Forma", "Status", "Total"]} />
    </section>
  );
}

function ReportsView({ report }: { report: any }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {["Dia", "Semana", "Mes", "Ano", "Personalizado"].map((item) => <button key={item} className="rounded-md border border-slate-200 bg-white px-4 py-3 font-bold">{item}</button>)}
        <button className="ml-auto inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-3 font-bold text-white"><FileDown size={18} /> Exportar</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Faturamento" value={money(report?.revenue ?? 0)} />
        <Stat label="Lucro estimado" value={money(report?.estimatedProfit ?? 0)} />
        <Stat label="Total vendido" value={money(report?.totalSold ?? 0)} />
        <Stat label="Fiado" value={money(report?.credit ?? 0)} />
      </div>
      <DataPanel title="Produtos mais vendidos" icon={BarChart3} rows={(report?.topProducts ?? []).map((p: any) => [p.name, `${p.quantity} un.`, money(p.total)])} headers={["Produto", "Quantidade", "Total"]} />
    </section>
  );
}

function SettingsView() {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      {["Dados da empresa", "Mercado Pago", "Tema", "Usuarios", "Backup", "Notificacoes"].map((title) => (
        <div key={title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">{title}</h2>
          <div className="mt-4 grid gap-3">
            <input className="h-11 rounded-md border border-slate-200 px-3" placeholder={title} />
            <button className="justify-self-start rounded-md bg-slate-950 px-4 py-3 font-bold text-white">Salvar</button>
          </div>
        </div>
      ))}
    </section>
  );
}

function DataPanel({ title, icon: Icon, headers, rows }: { title: string; icon: React.ElementType; headers: string[]; rows: (string | number)[][] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="inline-flex items-center gap-2 text-lg font-black"><Icon size={20} /> {title}</h2>
        <button className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2 font-bold text-white"><Plus size={18} /> Novo</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => <tr key={index} className="border-t border-slate-100">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 font-medium">{cell}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChartBox({ title, children }: { title: string; children: React.ReactElement }) {
  return <div className="h-80 rounded-md border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-4 font-black">{title}</h2><ResponsiveContainer width="100%" height="85%">{children}</ResponsiveContainer></div>;
}

function ListBox({ title, rows }: { title: string; rows: string[] }) {
  return <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-black">{title}</h2><div className="mt-3 space-y-2">{rows.length ? rows.map((row) => <p key={row} className="rounded-md bg-slate-50 p-3 text-sm font-bold">{row}</p>) : <p className="text-sm text-slate-500">Nenhum registro.</p>}</div></div>;
}

function MoneyRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return <div className={`flex items-center justify-between ${strong ? "text-xl font-black text-brand-700" : "font-bold"}`}><span>{label}</span><span>{money(value)}</span></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
