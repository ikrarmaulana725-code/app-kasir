import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, CreditCard, Home, LogOut, PackageSearch, ReceiptText, Search, ShoppingCart } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { api, API_BASE_URL, clearToken, rupiah, setToken } from "./api";
import type { Bootstrap, CartItem, PaymentMethod, Product, Transaction } from "./types";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "pos", label: "Kasir", icon: ShoppingCart },
  { id: "products", label: "Produk", icon: PackageSearch },
  { id: "transactions", label: "Riwayat", icon: ReceiptText },
  { id: "stock", label: "Stok", icon: Boxes }
] as const;

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer",
  QRIS: "QRIS",
  EWALLET: "E-wallet",
  RECEIVABLE: "Piutang"
};

export default function App() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("home");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [toast, setToast] = useState("");
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const [login, setLogin] = useState({ username: "owner", password: "123456" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const body = await api<Bootstrap>("/api/bootstrap");
      setData(body);
      setCustomerId((current) => current || body.customers[0]?.id || "");
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const safeDiscount = Math.min(discount, subtotal);
    const tax = Math.round((subtotal - safeDiscount) * ((data?.settings.taxRate || 0) / 100));
    const total = subtotal - safeDiscount + tax;
    return { subtotal, discount: safeDiscount, tax, total, change: Math.max(0, paid - total) };
  }, [cart, data?.settings.taxRate, discount, paid]);

  useEffect(() => {
    setPaid(totals.total);
  }, [totals.total]);

  function show(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const body = await api<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(login)
      });
      setToken(body.token);
      show("Login berhasil.");
      await load();
    } catch (error) {
      show(error instanceof Error ? error.message : "Login gagal.");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    clearToken();
    setData(null);
    setCart([]);
  }

  function addProduct(product: Product) {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    setCart((current) => {
      const item = current.find((entry) => entry.productId === product.id);
      if (item) {
        if (item.quantity >= product.stock) {
          show("Stok produk tidak cukup.");
          return current;
        }
        return current.map((entry) => (entry.productId === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry));
      }
      return [...current, { productId: product.id, name: product.name, price: product.sellingPrice, quantity: 1 }];
    });
  }

  async function checkout() {
    if (!cart.length) return show("Keranjang masih kosong.");
    try {
      const tx = await api<Transaction>("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          customerId: customerId || null,
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          discount,
          paidAmount: paid,
          paymentMethod
        })
      });
      setCart([]);
      setDiscount(0);
      setReceipt(tx);
      show("Transaksi berhasil.");
      await load();
    } catch (error) {
      show(error instanceof Error ? error.message : "Checkout gagal.");
    }
  }

  async function refund(id: string) {
    try {
      await api(`/api/transactions/${id}/refund`, { method: "POST" });
      show("Refund berhasil.");
      await load();
    } catch (error) {
      show(error instanceof Error ? error.message : "Refund gagal.");
    }
  }

  if (loading) {
    return <div className="splash">Qasir Modern</div>;
  }

  if (!data) {
    return (
      <main className="login">
        <section className="login-card">
          <div>
            <p className="eyebrow">Qasir Modern Android</p>
            <h1>Masuk kasir</h1>
            <p className="muted">Server: {API_BASE_URL}</p>
          </div>
          <form className="stack" onSubmit={submitLogin}>
            <label>
              Username
              <input value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} />
            </label>
            <label>
              Password
              <input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
            </label>
            <button className="primary">Masuk</button>
          </form>
        </section>
        {toast ? <div className="toast">{toast}</div> : null}
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const success = data.transactions.filter((tx) => tx.status === "SUCCESS");
  const todayTx = success.filter((tx) => tx.createdAt.slice(0, 10) === today);
  const todayRevenue = todayTx.reduce((sum, tx) => sum + tx.total, 0);
  const products = data.products.filter((product) => {
    const text = `${product.name} ${product.sku} ${product.barcode || ""} ${product.category.name}`.toLowerCase();
    return product.active && text.includes(query.toLowerCase());
  });

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">{data.settings.storeName}</p>
          <h1>{tabs.find((item) => item.id === tab)?.label}</h1>
        </div>
        <button className="icon-button" onClick={logout} aria-label="Keluar">
          <LogOut size={20} />
        </button>
      </header>

      <main className="content">
        {tab === "home" ? (
          <section className="stack">
            <div className="hero-card">
              <div>
                <p className="muted">Login sebagai</p>
                <h2>{data.user.name}</h2>
              </div>
              <span>{data.user.role}</span>
            </div>
            <div className="stats">
              <Stat label="Omzet hari ini" value={rupiah(todayRevenue)} />
              <Stat label="Transaksi" value={String(todayTx.length)} />
              <Stat label="Produk aktif" value={String(data.products.filter((product) => product.active).length)} />
              <Stat label="Stok menipis" value={String(data.products.filter((product) => product.stock <= 10).length)} />
            </div>
            <Panel title="Transaksi terbaru">
              {data.transactions.slice(0, 5).map((tx) => (
                <button key={tx.id} className="list-row" onClick={() => setReceipt(tx)}>
                  <span>{tx.invoiceNumber}</span>
                  <strong>{rupiah(tx.total)}</strong>
                </button>
              ))}
            </Panel>
          </section>
        ) : null}

        {tab === "pos" ? (
          <section className="pos">
            <div className="search">
              <Search size={18} />
              <input placeholder="Cari produk atau barcode" value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <div className="product-list">
              {products.map((product) => (
                <button key={product.id} className="product-card" onClick={() => addProduct(product)}>
                  <div className="thumb">{product.imageUrl ? <img src={product.imageUrl} alt="" /> : product.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.category.name} - stok {product.stock}</span>
                  </div>
                  <b>{rupiah(product.sellingPrice)}</b>
                </button>
              ))}
            </div>
            <section className="cart">
              <div className="cart-handle" />
              <h2>Keranjang</h2>
              {cart.length ? (
                cart.map((item) => (
                  <div className="cart-row" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{rupiah(item.price * item.quantity)}</span>
                    </div>
                    <div className="stepper">
                      <button onClick={() => setCart((current) => current.map((entry) => (entry.productId === item.productId ? { ...entry, quantity: Math.max(1, entry.quantity - 1) } : entry)))}>-</button>
                      <b>{item.quantity}</b>
                      <button onClick={() => setCart((current) => current.map((entry) => (entry.productId === item.productId ? { ...entry, quantity: entry.quantity + 1 } : entry)))}>+</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Belum ada item.</p>
              )}
              <div className="form-grid">
                <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  {data.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}>
                  {Object.entries(paymentLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input type="number" value={discount} onChange={(event) => setDiscount(Number(event.target.value))} placeholder="Diskon" />
                <input type="number" value={paid} onChange={(event) => setPaid(Number(event.target.value))} placeholder="Bayar" />
              </div>
              <div className="total-box">
                <Row label="Subtotal" value={rupiah(totals.subtotal)} />
                <Row label="Diskon" value={rupiah(totals.discount)} />
                <Row label="Pajak" value={rupiah(totals.tax)} />
                <Row label="Total" value={rupiah(totals.total)} strong />
                <Row label="Kembali" value={rupiah(totals.change)} />
              </div>
              <button className="primary" onClick={checkout}>Bayar</button>
            </section>
          </section>
        ) : null}

        {tab === "products" ? (
          <Panel title="Produk">
            {data.products.map((product) => (
              <div className="list-row" key={product.id}>
                <span>{product.name}<small>{product.category.name}</small></span>
                <strong>{product.stock} {product.unit}</strong>
              </div>
            ))}
          </Panel>
        ) : null}

        {tab === "transactions" ? (
          <Panel title="Riwayat transaksi">
            {data.transactions.map((tx) => (
              <div className="tx-card" key={tx.id}>
                <button className="list-row" onClick={() => setReceipt(tx)}>
                  <span>{tx.invoiceNumber}<small>{new Date(tx.createdAt).toLocaleString("id-ID")}</small></span>
                  <strong>{rupiah(tx.total)}</strong>
                </button>
                <div className="tx-actions">
                  <span className={`badge ${tx.status !== "SUCCESS" ? "danger" : ""}`}>{tx.status}</span>
                  {tx.status === "SUCCESS" && ["OWNER", "ADMIN"].includes(data.user.role) ? (
                    <button className="danger-button" onClick={() => refund(tx.id)}>Refund</button>
                  ) : null}
                </div>
              </div>
            ))}
          </Panel>
        ) : null}

        {tab === "stock" ? (
          <Panel title="Stok">
            {data.products.map((product) => (
              <div className="list-row" key={product.id}>
                <span>{product.name}<small>{product.sku}</small></span>
                <strong>{product.stock} {product.unit}</strong>
              </div>
            ))}
          </Panel>
        ) : null}
      </main>

      <nav className="bottom-nav">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {receipt ? <ReceiptSheet tx={receipt} storeName={data.settings.storeName} footer={data.settings.receiptFooter} onClose={() => setReceipt(null)} /> : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <section className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <BarChart3 size={18} />
        <h2>{title}</h2>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "row strong" : "row"}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ReceiptSheet({ tx, storeName, footer, onClose }: { tx: Transaction; storeName: string; footer: string; onClose: () => void }) {
  return (
    <div className="sheet-backdrop">
      <section className="sheet">
        <div className="cart-handle" />
        <h2>{storeName}</h2>
        <p className="muted">{tx.invoiceNumber}</p>
        <div className="receipt-lines">
          {tx.items.map((item) => (
            <Row key={item.id} label={`${item.quantity}x ${item.productName}`} value={rupiah(item.subtotal)} />
          ))}
        </div>
        <div className="total-box">
          <Row label="Total" value={rupiah(tx.total)} strong />
          <Row label="Bayar" value={rupiah(tx.paidAmount)} />
          <Row label="Kembali" value={rupiah(tx.changeAmount)} />
          <Row label="Metode" value={paymentLabels[tx.paymentMethod]} />
        </div>
        <p className="center">{footer}</p>
        <button className="primary" onClick={onClose}>Tutup</button>
      </section>
    </div>
  );
}
