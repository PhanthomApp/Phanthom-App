import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "phanthom-public-admin-v1";

const defaultServices = [
  {
    id: "svc-1",
    name: "Custom T-Shirt Printing",
    category: "Apparel",
    price: 750,
    description: "Streetwear-focused heat-press shirts for single and bulk orders.",
  },
  {
    id: "svc-2",
    name: "Sticker / Label Printing",
    category: "Print",
    price: 15,
    description: "Custom vinyl labels for bottles, packaging, branding and promo drops.",
  },
  {
    id: "svc-3",
    name: "Branding Design",
    category: "Design",
    price: 1500,
    description: "Logo cleanup, graphics, promo visuals and packaging support.",
  },
  {
    id: "svc-4",
    name: "Bulk Merchandise Orders",
    category: "Bulk",
    price: 0,
    description: "Custom quotes for events, teams, resellers and large streetwear batches.",
  },
];

const defaultTestimonials = [
  {
    id: 1,
    name: "Aaliyah R.",
    role: "Customer",
    text: "Fast service, clean prints, and the shirts actually feel premium.",
  },
  {
    id: 2,
    name: "Jerome T.",
    role: "Brand Client",
    text: "PHANTHOM helped us with design and print. The final result looked serious.",
  },
  {
    id: 3,
    name: "Neshal P.",
    role: "Bulk Order Client",
    text: "Good communication, solid turnaround time, and the order came out exactly right.",
  },
];

const defaultState = {
  business: {
    name: "PHANTHOM Official",
    slogan: "The Authorized Crew.",
    address: "14 Vulcanusstraat, Paramaribo",
    phone: "+597",
    whatsapp: "5970000000",
    currency: "SRD",
    heroTitle: "Streetwear Printing, Branding & Order Management",
    heroText:
      "Custom apparel, labels, branding visuals and a cleaner order experience for PHANTHOM customers.",
  },
  services: defaultServices,
  testimonials: defaultTestimonials,
  orders: [],
  counters: { order: 1, invoice: 1, receipt: 1 },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function createLine() {
  return {
    id: `line-${Math.random().toString(36).slice(2, 9)}`,
    item: "",
    qty: 1,
    price: 0,
  };
}

function formatMoney(value) {
  const num = Number(value || 0);
  return `SRD ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function calcTotals(order) {
  const subtotal = (order.items || []).reduce(
    (sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0),
    0
  );
  const paid = Number(order.amountPaid || 0);
  const balance = Math.max(subtotal - paid, 0);

  let status = "Draft";
  if (subtotal > 0 && paid === 0) status = "Unpaid";
  if (subtotal > 0 && paid > 0 && balance > 0) status = "Partial";
  if (subtotal > 0 && balance === 0) status = "Paid";

  return { subtotal, paid, balance, status };
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function makeNumber(prefix, n) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

function App() {
  const [mode, setMode] = useState("public");
  const [adminTab, setAdminTab] = useState("dashboard");
  const [state, setState] = useState(defaultState);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [errors, setErrors] = useState([]);
  const [lead, setLead] = useState({ name: "", phone: "", service: "", note: "" });

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    date: todayISO(),
    paymentMethod: "Cash",
    notes: "",
    amountPaid: 0,
    items: [createLine()],
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error(err);
    }
  }, [state]);

  const selectedOrder = useMemo(
    () => state.orders.find((order) => order.id === selectedOrderId) || null,
    [state.orders, selectedOrderId]
  );

  const formTotals = useMemo(() => calcTotals(form), [form]);

  const stats = useMemo(() => {
    return state.orders.reduce(
      (acc, order) => {
        const totals = calcTotals(order);
        acc.totalOrders += 1;
        acc.revenue += totals.paid;
        acc.outstanding += totals.balance;
        if (totals.status === "Paid") acc.paid += 1;
        if (totals.status === "Partial") acc.partial += 1;
        if (totals.status === "Unpaid") acc.unpaid += 1;
        return acc;
      },
      { totalOrders: 0, revenue: 0, outstanding: 0, paid: 0, partial: 0, unpaid: 0 }
    );
  }, [state.orders]);

  function updateLine(id, field, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) =>
        line.id === id ? { ...line, [field]: field === "item" ? value : Number(value) } : line
      ),
    }));
  }

  function addLine() {
    setForm((prev) => ({ ...prev, items: [...prev.items, createLine()] }));
  }

  function removeLine(id) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((line) => line.id !== id),
    }));
  }

  function applyService(service) {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `line-${Math.random().toString(36).slice(2, 9)}`, item: service.name, qty: 1, price: Number(service.price || 0) },
      ],
    }));
  }

  function resetForm() {
    setForm({
      customerName: "",
      phone: "",
      date: todayISO(),
      paymentMethod: "Cash",
      notes: "",
      amountPaid: 0,
      items: [createLine()],
    });
    setErrors([]);
  }

  function validateOrder(order) {
    const nextErrors = [];
    if (!order.customerName.trim()) nextErrors.push("Customer name is required.");
    order.items.forEach((line, i) => {
      if (!line.item.trim()) nextErrors.push(`Line ${i + 1}: item name is required.`);
      if (Number(line.qty) <= 0) nextErrors.push(`Line ${i + 1}: quantity must be greater than 0.`);
      if (Number(line.price) < 0) nextErrors.push(`Line ${i + 1}: price cannot be negative.`);
    });
    if (Number(order.amountPaid || 0) > calcTotals(order).subtotal) {
      nextErrors.push("Amount paid cannot be more than the order total.");
    }
    return nextErrors;
  }

  function saveOrder() {
    const order = {
      id: `order-${Date.now()}`,
      orderNumber: makeNumber("PH-O", state.counters.order),
      invoiceNumber: makeNumber("PH-I", state.counters.invoice),
      receiptNumber: makeNumber("PH-R", state.counters.receipt),
      customerName: form.customerName,
      phone: form.phone,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      amountPaid: Number(form.amountPaid || 0),
      items: form.items,
    };

    const nextErrors = validateOrder(order);
    setErrors(nextErrors);
    if (nextErrors.length) return;

    setState((prev) => ({
      ...prev,
      orders: [order, ...prev.orders],
      counters: {
        order: prev.counters.order + 1,
        invoice: prev.counters.invoice + 1,
        receipt: prev.counters.receipt + 1,
      },
    }));
    setSelectedOrderId(order.id);
    resetForm();
    setAdminTab("orders");
  }

  function deleteOrder(id) {
    setState((prev) => ({ ...prev, orders: prev.orders.filter((order) => order.id !== id) }));
    if (selectedOrderId === id) setSelectedOrderId(null);
  }

  function copyOrderText(order) {
    const totals = calcTotals(order);
    const lines = order.items
      .map((line) => `${line.item} | Qty: ${line.qty} | Unit: ${formatMoney(line.price)} | Total: ${formatMoney(line.qty * line.price)}`)
      .join("\n");

    const text = `${state.business.name}\n${state.business.slogan}\n${state.business.address}\n\nINVOICE: ${order.invoiceNumber}\nRECEIPT: ${order.receiptNumber}\nORDER: ${order.orderNumber}\n\nCustomer: ${order.customerName}\nPhone: ${order.phone || "N/A"}\nDate: ${order.date}\nPayment Method: ${order.paymentMethod}\n\n${lines}\n\nOrder Total: ${formatMoney(totals.subtotal)}\nAmount Paid: ${formatMoney(totals.paid)}\nRemaining Balance: ${formatMoney(totals.balance)}\nStatus: ${totals.status}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function whatsappLink(order) {
    const totals = calcTotals(order);
    const lines = order.items.map((line) => `- ${line.item} x${line.qty} @ ${formatMoney(line.price)}`).join("\n");
    const text = `Hello ${order.customerName},\n\nInvoice: ${order.invoiceNumber}\nReceipt: ${order.receiptNumber}\nOrder: ${order.orderNumber}\n\nItems:\n${lines}\n\nTotal: ${formatMoney(totals.subtotal)}\nPaid: ${formatMoney(totals.paid)}\nBalance: ${formatMoney(totals.balance)}\nStatus: ${totals.status}\n\n- ${state.business.name}`;
    return `https://wa.me/${sanitizePhone(order.phone || state.business.whatsapp)}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff" }}>
      <style>{`
        *{box-sizing:border-box} body{margin:0;font-family:Inter,Arial,sans-serif;background:#050505} a{text-decoration:none}
        .shell{max-width:1320px;margin:0 auto;padding:24px}
        .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px}
        .brand{font-weight:900;letter-spacing:.04em;font-size:1.1rem}
        .modeRow,.navRow,.btnRow,.pillRow{display:flex;flex-wrap:wrap;gap:10px}
        .modeBtn,.tabBtn,.pill,.btn,.ghostBtn{border:1px solid #2b2b2b;border-radius:12px;padding:12px 16px;font-weight:700;cursor:pointer;transition:.25s ease}
        .modeBtn,.tabBtn,.ghostBtn,.pill{background:#111;color:#fff}
        .modeBtn.active,.tabBtn.active,.btn{background:#fff;color:#000}
        .btn.danger{background:#df5b5b;color:#fff;border-color:#df5b5b}
        .btn.dark{background:#171717;color:#fff;border-color:#2b2b2b}
        .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:20px;padding:28px;border:1px solid #202020;border-radius:28px;background:radial-gradient(circle at top right,#151515 0%,#090909 55%,#050505 100%);overflow:hidden;position:relative}
        .hero:before{content:"";position:absolute;inset:-20% auto auto -10%;width:260px;height:260px;background:rgba(255,255,255,.07);filter:blur(60px);border-radius:999px;animation:float 7s ease-in-out infinite}
        .heroTag{display:inline-block;padding:8px 12px;border:1px solid #2a2a2a;border-radius:999px;background:#101010;margin-bottom:16px;color:#cfcfcf}
        .hero h1{font-size:3rem;line-height:1.02;margin:0 0 14px;max-width:700px}
        .muted{color:#b7b7b7}.small{font-size:.85rem}
        .grid2{display:grid;grid-template-columns:1.15fr .85fr;gap:20px}
        .card{background:#0d0d0d;border:1px solid #202020;border-radius:24px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.25)}
        .statGrid{display:grid;grid-template-columns:1fr;gap:14px}
        .statMini,.serviceCard,.testimonial,.preview,.lineCard,.orderCard,.totalsBox{background:#121212;border:1px solid #242424;border-radius:18px;padding:16px}
        .statNum{font-size:1.5rem;font-weight:800}
        .sectionTitle{font-size:2rem;margin:0 0 14px}
        .serviceGrid,.testimonialGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .testimonial{position:relative;animation:rise .7s ease both}.testimonial:nth-child(2){animation-delay:.08s}.testimonial:nth-child(3){animation-delay:.16s}
        .serviceCard{transition:transform .25s ease,border-color .25s ease}.serviceCard:hover{transform:translateY(-4px);border-color:#444}
        .cta{margin-top:20px;padding:22px;border:1px solid #202020;border-radius:24px;background:linear-gradient(135deg,#101010,#070707)}
        .formGrid,.lineGrid{display:grid;gap:14px}.formGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.lineGrid{grid-template-columns:2fr .7fr 1fr 110px;align-items:end}
        input,select,textarea{width:100%;margin-top:8px;background:#080808;color:#fff;border:1px solid #2a2a2a;border-radius:12px;padding:12px} textarea{min-height:110px;resize:vertical}
        table{width:100%;border-collapse:collapse;margin:18px 0} th,td{border:1px solid #2a2a2a;padding:12px;text-align:left} th{background:#151515}
        .rowBetween{display:flex;justify-content:space-between;align-items:center;gap:12px}.badge{padding:7px 10px;border:1px solid #2a2a2a;border-radius:999px;background:#1b1b1b;font-size:.8rem}
        .stack{display:grid;gap:14px}.errorBox{background:rgba(223,91,91,.12);border:1px solid rgba(223,91,91,.4);padding:14px;border-radius:14px;color:#ffc9c9}
        .publicSection{margin-top:20px}.split{display:grid;grid-template-columns:1fr 1fr;gap:20px}.fadeIn{animation:fade .55s ease}.leadForm{display:grid;gap:12px}
        @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
        @media (max-width:980px){.hero,.grid2,.split,.formGrid,.lineGrid,.serviceGrid,.testimonialGrid{grid-template-columns:1fr}.hero h1{font-size:2.2rem}}
      `}</style>

      <div className="shell fadeIn">
        <div className="topbar">
          <div className="brand">PHANTHOM Official</div>
          <div className="modeRow">
            <button className={mode === "public" ? "modeBtn active" : "modeBtn"} onClick={() => setMode("public")}>Public View</button>
            <button className={mode === "admin" ? "modeBtn active" : "modeBtn"} onClick={() => setMode("admin")}>Admin View</button>
          </div>
        </div>

        {mode === "public" && (
          <div className="stack fadeIn">
            <section className="hero">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="heroTag">THE AUTHORIZED CREW</div>
                <h1>{state.business.heroTitle}</h1>
                <p className="muted" style={{ maxWidth: 650, fontSize: "1.05rem", lineHeight: 1.65 }}>
                  {state.business.heroText}
                </p>
                <div className="btnRow" style={{ marginTop: 18 }}>
                  <button className="btn" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explore Services</button>
                  <a className="ghostBtn" href={`https://wa.me/${sanitizePhone(state.business.whatsapp)}`} target="_blank" rel="noreferrer">Order on WhatsApp</a>
                </div>
              </div>
              <div className="statGrid" style={{ position: "relative", zIndex: 1 }}>
                <div className="statMini"><div className="muted">Orders Completed</div><div className="statNum">{state.orders.length}</div></div>
                <div className="statMini"><div className="muted">Core Services</div><div className="statNum">{state.services.length}</div></div>
                <div className="statMini"><div className="muted">Location</div><div className="statNum" style={{ fontSize: "1.05rem" }}>Paramaribo, Suriname</div></div>
              </div>
            </section>

            <section id="services" className="publicSection card">
              <div className="rowBetween"><h2 className="sectionTitle">Services</h2><span className="badge">Customer View</span></div>
              <div className="serviceGrid">
                {state.services.map((service) => (
                  <div key={service.id} className="serviceCard">
                    <div className="rowBetween">
                      <div>
                        <strong style={{ fontSize: "1.05rem" }}>{service.name}</strong>
                        <div className="muted small">{service.category}</div>
                      </div>
                      <span className="badge">{service.price > 0 ? formatMoney(service.price) : "Quote"}</span>
                    </div>
                    <p className="muted" style={{ lineHeight: 1.6 }}>{service.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="split">
              <div className="card">
                <h2 className="sectionTitle">Testimonials</h2>
                <div className="testimonialGrid">
                  {state.testimonials.map((item) => (
                    <div key={item.id} className="testimonial">
                      <p style={{ lineHeight: 1.6, marginTop: 0 }}>
                        “{item.text}”
                      </p>
                      <strong>{item.name}</strong>
                      <div className="muted small">{item.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="sectionTitle">Quick Order Lead</h2>
                <div className="leadForm">
                  <div>
                    <label>Name</label>
                    <input value={lead.name} onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label>Phone</label>
                    <input value={lead.phone} onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label>Service Needed</label>
                    <select value={lead.service} onChange={(e) => setLead((p) => ({ ...p, service: e.target.value }))}>
                      <option value="">Select a service</option>
                      {state.services.map((service) => <option key={service.id}>{service.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Notes</label>
                    <textarea value={lead.note} onChange={(e) => setLead((p) => ({ ...p, note: e.target.value }))} />
                  </div>
                  <a
                    className="btn"
                    href={`https://wa.me/${sanitizePhone(state.business.whatsapp)}?text=${encodeURIComponent(
                      `Hello PHANTHOM, my name is ${lead.name || ""}. My phone is ${lead.phone || ""}. I need ${lead.service || "a service"}. Notes: ${lead.note || "none"}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Send Inquiry
                  </a>
                </div>
              </div>
            </section>

            <section className="cta">
              <div className="rowBetween" style={{ alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ margin: 0 }}>Ready to place your order?</h2>
                  <p className="muted" style={{ marginTop: 10 }}>Fast response, branded presentation, and a cleaner order experience.</p>
                </div>
                <a className="btn" href={`https://wa.me/${sanitizePhone(state.business.whatsapp)}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              </div>
            </section>
          </div>
        )}

        {mode === "admin" && (
          <div className="stack fadeIn">
            <div className="navRow">
              {[
                ["dashboard", "Dashboard"],
                ["services", "Services"],
                ["orders", "Orders"],
                ["settings", "Settings"],
              ].map(([key, label]) => (
                <button key={key} className={adminTab === key ? "tabBtn active" : "tabBtn"} onClick={() => setAdminTab(key)}>
                  {label}
                </button>
              ))}
            </div>

            {adminTab === "dashboard" && (
              <div className="grid2">
                <div className="card">
                  <h2 className="sectionTitle">Create Order / Invoice / Receipt</h2>
                  {errors.length > 0 && <div className="errorBox">{errors.map((e) => <div key={e}>{e}</div>)}</div>}

                  <div className="formGrid">
                    <div><label>Customer Name</label><input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} /></div>
                    <div><label>Phone</label><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></div>
                    <div><label>Payment Method</label><select value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}><option>Cash</option><option>Transfer</option><option>Mixed</option></select></div>
                  </div>

                  <div className="pillRow" style={{ marginTop: 16 }}>
                    {state.services.map((service) => <button key={service.id} className="pill" onClick={() => applyService(service)}>+ {service.name}</button>)}
                  </div>

                  <div className="stack" style={{ marginTop: 16 }}>
                    {form.items.map((line, index) => (
                      <div key={line.id} className="lineCard">
                        <div className="lineGrid">
                          <div><label>Item {index + 1}</label><input value={line.item} onChange={(e) => updateLine(line.id, "item", e.target.value)} /></div>
                          <div><label>Qty</label><input type="number" min="1" value={line.qty} onChange={(e) => updateLine(line.id, "qty", e.target.value)} /></div>
                          <div><label>Unit Price</label><input type="number" min="0" value={line.price} onChange={(e) => updateLine(line.id, "price", e.target.value)} /></div>
                          <div><button className="btn danger" onClick={() => removeLine(line.id)}>Delete</button></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="btnRow" style={{ marginTop: 16 }}><button className="btn dark" onClick={addLine}>Add Line</button></div>

                  <div className="formGrid" style={{ marginTop: 16 }}>
                    <div><label>Amount Paid</label><input type="number" min="0" value={form.amountPaid} onChange={(e) => setForm((p) => ({ ...p, amountPaid: Number(e.target.value) }))} /></div>
                    <div><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  </div>

                  <div className="totalsBox" style={{ marginTop: 16 }}>
                    <div className="rowBetween"><span>Total</span><strong>{formatMoney(formTotals.subtotal)}</strong></div>
                    <div className="rowBetween"><span>Paid</span><strong>{formatMoney(formTotals.paid)}</strong></div>
                    <div className="rowBetween"><span>Balance</span><strong>{formatMoney(formTotals.balance)}</strong></div>
                    <div className="rowBetween"><span>Status</span><strong>{formTotals.status}</strong></div>
                  </div>

                  <div className="btnRow" style={{ marginTop: 16 }}>
                    <button className="btn" onClick={saveOrder}>Save Order</button>
                    <button className="btn dark" onClick={resetForm}>Reset</button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="sectionTitle">Quick Stats</h2>
                  <div className="stack">
                    <div className="rowBetween statMini"><span>Orders</span><strong>{stats.totalOrders}</strong></div>
                    <div className="rowBetween statMini"><span>Revenue</span><strong>{formatMoney(stats.revenue)}</strong></div>
                    <div className="rowBetween statMini"><span>Outstanding</span><strong>{formatMoney(stats.outstanding)}</strong></div>
                    <div className="rowBetween statMini"><span>Services</span><strong>{state.services.length}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === "services" && (
              <div className="card">
                <h2 className="sectionTitle">Admin Services View</h2>
                <div className="serviceGrid">
                  {state.services.map((service) => (
                    <div key={service.id} className="serviceCard">
                      <div className="rowBetween">
                        <div>
                          <strong>{service.name}</strong>
                          <div className="muted small">{service.category}</div>
                        </div>
                        <span className="badge">{service.price > 0 ? formatMoney(service.price) : "Quote"}</span>
                      </div>
                      <p className="muted">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === "orders" && (
              <div className="grid2">
                <div className="card">
                  <h2 className="sectionTitle">All Orders</h2>
                  <div className="stack">
                    {state.orders.length === 0 && <p className="muted">No orders yet.</p>}
                    {state.orders.map((order) => {
                      const totals = calcTotals(order);
                      return (
                        <div key={order.id} className="orderCard">
                          <div className="rowBetween">
                            <div>
                              <strong>{order.customerName}</strong>
                              <div className="muted small">{order.invoiceNumber} • {order.receiptNumber}</div>
                            </div>
                            <span className="badge">{totals.status}</span>
                          </div>
                          <p className="muted">{formatMoney(totals.subtotal)}</p>
                          <div className="btnRow">
                            <button className="btn dark" onClick={() => setSelectedOrderId(order.id)}>Open</button>
                            <button className="btn danger" onClick={() => deleteOrder(order.id)}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card">
                  <h2 className="sectionTitle">Invoice / Receipt Preview</h2>
                  {!selectedOrder && <p className="muted">Choose an order to preview it.</p>}
                  {selectedOrder && (
                    <div className="preview">
                      <div className="rowBetween" style={{ alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ marginTop: 0 }}>{state.business.name}</h3>
                          <p className="muted">{state.business.slogan}</p>
                          <p className="muted">{state.business.address}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div><strong>Invoice:</strong> {selectedOrder.invoiceNumber}</div>
                          <div><strong>Receipt:</strong> {selectedOrder.receiptNumber}</div>
                          <div><strong>Order:</strong> {selectedOrder.orderNumber}</div>
                          <div><strong>Date:</strong> {selectedOrder.date}</div>
                        </div>
                      </div>

                      <table>
                        <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                        <tbody>
                          {selectedOrder.items.map((line) => (
                            <tr key={line.id}><td>{line.item}</td><td>{line.qty}</td><td>{formatMoney(line.price)}</td><td>{formatMoney(line.qty * line.price)}</td></tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="totalsBox">
                        <div className="rowBetween"><span>Total</span><strong>{formatMoney(calcTotals(selectedOrder).subtotal)}</strong></div>
                        <div className="rowBetween"><span>Paid</span><strong>{formatMoney(calcTotals(selectedOrder).paid)}</strong></div>
                        <div className="rowBetween"><span>Balance</span><strong>{formatMoney(calcTotals(selectedOrder).balance)}</strong></div>
                      </div>

                      <div className="btnRow" style={{ marginTop: 16 }}>
                        <button className="btn" onClick={() => copyOrderText(selectedOrder)}>Copy Invoice Text</button>
                        <a className="ghostBtn" href={whatsappLink(selectedOrder)} target="_blank" rel="noreferrer">Send via WhatsApp</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === "settings" && (
              <div className="card">
                <h2 className="sectionTitle">Settings</h2>
                <p className="muted">This mode is the admin dashboard. Customers should mostly use the Public View section.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
