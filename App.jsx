import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "phanthom-business-app-v1";

const defaultServices = [
  {
    id: "svc-1",
    name: "Custom T-Shirt Printing",
    category: "Apparel",
    price: 750,
    description: "Heat-press shirts for single and bulk orders.",
  },
  {
    id: "svc-2",
    name: "Sticker / Label Printing",
    category: "Print",
    price: 15,
    description: "Custom vinyl and promo labels for products and branding.",
  },
  {
    id: "svc-3",
    name: "Branding Design",
    category: "Design",
    price: 1500,
    description: "Logos, promo graphics, packaging visuals and design support.",
  },
  {
    id: "svc-4",
    name: "Bulk Merchandise Orders",
    category: "Bulk",
    price: 0,
    description: "Custom quotes for events, resellers and big orders.",
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
  },
  services: defaultServices,
  orders: [],
  counters: {
    order: 1,
    invoice: 1,
    receipt: 1,
  },
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
  const subtotal = (order.items || []).reduce((sum, line) => {
    return sum + Number(line.qty || 0) * Number(line.price || 0);
  }, 0);

  const paid = Number(order.amountPaid || 0);
  const balance = Math.max(subtotal - paid, 0);

  let status = "Draft";
  if (subtotal > 0 && paid === 0) status = "Unpaid";
  if (subtotal > 0 && paid > 0 && balance > 0) status = "Partial";
  if (subtotal > 0 && balance === 0) status = "Paid";

  return { subtotal, paid, balance, status };
}

function makeNumber(prefix, n) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

function sanitizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function App() {
  const [state, setState] = useState(defaultState);
  const [tab, setTab] = useState("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [errors, setErrors] = useState([]);

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    date: todayISO(),
    paymentMethod: "Cash",
    notes: "",
    amountPaid: 0,
    items: [createLine()],
  });

  const [serviceDraft, setServiceDraft] = useState({
    name: "",
    category: "General",
    price: 0,
    description: "",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setState({ ...defaultState, ...parsed });
      }
    } catch (err) {
      console.error("Load failed", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Save failed", err);
    }
  }, [state]);

  const formTotals = useMemo(() => calcTotals(form), [form]);

  const selectedOrder = useMemo(() => {
    return state.orders.find((o) => o.id === selectedOrderId) || null;
  }, [state.orders, selectedOrderId]);

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
      {
        totalOrders: 0,
        revenue: 0,
        outstanding: 0,
        paid: 0,
        partial: 0,
        unpaid: 0,
      }
    );
  }, [state.orders]);

  function updateBusiness(field, value) {
    setState((prev) => ({
      ...prev,
      business: { ...prev.business, [field]: value },
    }));
  }

  function updateLine(id, field, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: field === "item" ? value : Number(value),
            }
          : line
      ),
    }));
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createLine()],
    }));
  }

  function removeLine(id) {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : prev.items.filter((line) => line.id !== id),
    }));
  }

  function applyService(service) {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `line-${Math.random().toString(36).slice(2, 9)}`,
          item: service.name,
          qty: 1,
          price: Number(service.price || 0),
        },
      ],
    }));
  }

  function validateOrder(order) {
    const nextErrors = [];
    if (!order.customerName.trim()) nextErrors.push("Customer name is required.");
    if (!order.items.length) nextErrors.push("At least one item is required.");

    order.items.forEach((line, i) => {
      if (!line.item.trim()) nextErrors.push(`Line ${i + 1}: item name is required.`);
      if (Number(line.qty) <= 0) nextErrors.push(`Line ${i + 1}: quantity must be greater than 0.`);
      if (Number(line.price) < 0) nextErrors.push(`Line ${i + 1}: price cannot be negative.`);
    });

    const totals = calcTotals(order);
    if (Number(order.amountPaid || 0) > totals.subtotal) {
      nextErrors.push("Amount paid cannot be more than the order total.");
    }

    return nextErrors;
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
      createdAt: new Date().toISOString(),
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
    setTab("orders");
  }

  function deleteOrder(id) {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== id),
    }));
    if (selectedOrderId === id) setSelectedOrderId(null);
  }

  function addService() {
    if (!serviceDraft.name.trim()) return;

    setState((prev) => ({
      ...prev,
      services: [
        {
          id: `svc-${Date.now()}`,
          name: serviceDraft.name.trim(),
          category: serviceDraft.category.trim() || "General",
          price: Number(serviceDraft.price || 0),
          description: serviceDraft.description.trim(),
        },
        ...prev.services,
      ],
    }));

    setServiceDraft({
      name: "",
      category: "General",
      price: 0,
      description: "",
    });
  }

  function removeService(id) {
    setState((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  }

  function copyText(order) {
    const totals = calcTotals(order);
    const lines = order.items
      .map(
        (line) =>
          `${line.item} | Qty: ${line.qty} | Unit: ${formatMoney(line.price)} | Total: ${formatMoney(
            Number(line.qty) * Number(line.price)
          )}`
      )
      .join("\n");

    const text = `${state.business.name}
${state.business.slogan}
${state.business.address}

INVOICE: ${order.invoiceNumber}
RECEIPT: ${order.receiptNumber}
ORDER: ${order.orderNumber}

Customer: ${order.customerName}
Phone: ${order.phone || "N/A"}
Date: ${order.date}
Payment Method: ${order.paymentMethod}

${lines}

Order Total: ${formatMoney(totals.subtotal)}
Amount Paid: ${formatMoney(totals.paid)}
Remaining Balance: ${formatMoney(totals.balance)}
Status: ${totals.status}

Notes: ${order.notes || "None"}`;

    navigator.clipboard.writeText(text).catch(() => {});
  }

  function whatsappLink(order) {
    const totals = calcTotals(order);
    const lines = order.items
      .map((line) => `- ${line.item} x${line.qty} @ ${formatMoney(line.price)}`)
      .join("\n");

    const text = `Hello ${order.customerName},

Invoice: ${order.invoiceNumber}
Receipt: ${order.receiptNumber}
Order: ${order.orderNumber}

Items:
${lines}

Total: ${formatMoney(totals.subtotal)}
Paid: ${formatMoney(totals.paid)}
Balance: ${formatMoney(totals.balance)}
Status: ${totals.status}

- ${state.business.name}`;

    return `https://wa.me/${sanitizePhone(order.phone || state.business.whatsapp)}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div className="app-shell">
      <div className="hero card">
        <div>
          <h1>{state.business.name}</h1>
          <p className="muted">{state.business.slogan}</p>
          <p className="muted">{state.business.address}</p>
        </div>
        <div className="stats-grid">
          <div className="mini-stat">
            <span className="muted">Orders</span>
            <strong>{stats.totalOrders}</strong>
          </div>
          <div className="mini-stat">
            <span className="muted">Revenue</span>
            <strong>{formatMoney(stats.revenue)}</strong>
          </div>
          <div className="mini-stat">
            <span className="muted">Outstanding</span>
            <strong>{formatMoney(stats.outstanding)}</strong>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={tab === "dashboard" ? "tab active" : "tab"} onClick={() => setTab("dashboard")}>
          Dashboard
        </button>
        <button className={tab === "services" ? "tab active" : "tab"} onClick={() => setTab("services")}>
          Services
        </button>
        <button className={tab === "orders" ? "tab active" : "tab"} onClick={() => setTab("orders")}>
          Orders
        </button>
        <button className={tab === "settings" ? "tab active" : "tab"} onClick={() => setTab("settings")}>
          Settings
        </button>
      </div>

      {tab === "dashboard" && (
        <div className="grid-2">
          <div className="card">
            <h2>Create Order / Invoice / Receipt</h2>

            {errors.length > 0 && (
              <div className="error-box">
                {errors.map((err) => (
                  <div key={err}>{err}</div>
                ))}
              </div>
            )}

            <div className="grid-2">
              <div>
                <label>Customer Name</label>
                <input
                  value={form.customerName}
                  onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                />
              </div>
              <div>
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <label>Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  <option>Cash</option>
                  <option>Transfer</option>
                  <option>Mixed</option>
                </select>
              </div>
            </div>

            <div className="service-pills">
              {state.services.map((service) => (
                <button key={service.id} className="pill" onClick={() => applyService(service)}>
                  + {service.name}
                </button>
              ))}
            </div>

            <div className="stack">
              {form.items.map((line, index) => (
                <div key={line.id} className="line-card">
                  <div className="grid-line">
                    <div>
                      <label>Item {index + 1}</label>
                      <input value={line.item} onChange={(e) => updateLine(line.id, "item", e.target.value)} />
                    </div>
                    <div>
                      <label>Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, "qty", e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Unit Price</label>
                      <input
                        type="number"
                        min="0"
                        value={line.price}
                        onChange={(e) => updateLine(line.id, "price", e.target.value)}
                      />
                    </div>
                    <div className="delete-wrap">
                      <button className="danger" onClick={() => removeLine(line.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="button-row">
              <button onClick={addLine}>Add Line</button>
            </div>

            <div className="grid-2">
              <div>
                <label>Amount Paid</label>
                <input
                  type="number"
                  min="0"
                  value={form.amountPaid}
                  onChange={(e) => setForm((p) => ({ ...p, amountPaid: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <div className="totals">
              <div><span>Total</span><strong>{formatMoney(formTotals.subtotal)}</strong></div>
              <div><span>Paid</span><strong>{formatMoney(formTotals.paid)}</strong></div>
              <div><span>Balance</span><strong>{formatMoney(formTotals.balance)}</strong></div>
              <div><span>Status</span><strong>{formTotals.status}</strong></div>
            </div>

            <div className="button-row">
              <button onClick={saveOrder}>Save Order</button>
              <button className="secondary" onClick={resetForm}>Reset</button>
            </div>
          </div>

          <div className="card">
            <h2>Quick Stats</h2>
            <div className="stats-list">
              <div><span>Paid Orders</span><strong>{stats.paid}</strong></div>
              <div><span>Partial Orders</span><strong>{stats.partial}</strong></div>
              <div><span>Unpaid Orders</span><strong>{stats.unpaid}</strong></div>
              <div><span>Services</span><strong>{state.services.length}</strong></div>
            </div>

            <h2 style={{ marginTop: 24 }}>Recent Orders</h2>
            <div className="stack">
              {state.orders.length === 0 && <p className="muted">No orders yet.</p>}
              {state.orders.slice(0, 6).map((order) => {
                const totals = calcTotals(order);
                return (
                  <button
                    key={order.id}
                    className="order-card"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setTab("orders");
                    }}
                  >
                    <div className="row-between">
                      <div>
                        <strong>{order.customerName}</strong>
                        <div className="muted small">{order.orderNumber}</div>
                      </div>
                      <span className="badge">{totals.status}</span>
                    </div>
                    <div className="muted">{formatMoney(totals.subtotal)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "services" && (
        <div className="grid-2">
          <div className="card">
            <h2>Services Display</h2>
            <div className="stack">
              {state.services.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="row-between">
                    <div>
                      <strong>{service.name}</strong>
                      <div className="muted small">{service.category}</div>
                    </div>
                    <span className="badge">
                      {service.price > 0 ? formatMoney(service.price) : "Quote"}
                    </span>
                  </div>
                  <p className="muted">{service.description}</p>
                  <div className="button-row">
                    <button className="danger" onClick={() => removeService(service.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Add New Service</h2>
            <div className="stack">
              <div>
                <label>Service Name</label>
                <input
                  value={serviceDraft.name}
                  onChange={(e) => setServiceDraft((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label>Category</label>
                <input
                  value={serviceDraft.category}
                  onChange={(e) => setServiceDraft((p) => ({ ...p, category: e.target.value }))}
                />
              </div>
              <div>
                <label>Base Price</label>
                <input
                  type="number"
                  min="0"
                  value={serviceDraft.price}
                  onChange={(e) => setServiceDraft((p) => ({ ...p, price: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label>Description</label>
                <textarea
                  value={serviceDraft.description}
                  onChange={(e) => setServiceDraft((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <button onClick={addService}>Add Service</button>
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="grid-2">
          <div className="card">
            <h2>All Orders</h2>
            <div className="stack">
              {state.orders.length === 0 && <p className="muted">No orders yet.</p>}
              {state.orders.map((order) => {
                const totals = calcTotals(order);
                return (
                  <div key={order.id} className="service-card">
                    <div className="row-between">
                      <div>
                        <strong>{order.customerName}</strong>
                        <div className="muted small">
                          {order.invoiceNumber} • {order.receiptNumber}
                        </div>
                      </div>
                      <span className="badge">{totals.status}</span>
                    </div>
                    <p className="muted">{formatMoney(totals.subtotal)}</p>
                    <div className="button-row">
                      <button onClick={() => setSelectedOrderId(order.id)}>Open</button>
                      <button className="danger" onClick={() => deleteOrder(order.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2>Invoice / Receipt Preview</h2>
            {!selectedOrder && <p className="muted">Choose an order to preview it.</p>}

            {selectedOrder && (
              <div className="preview">
                <div className="row-between">
                  <div>
                    <h3>{state.business.name}</h3>
                    <p className="muted">{state.business.slogan}</p>
                    <p className="muted">{state.business.address}</p>
                  </div>
                  <div className="right-info">
                    <div><strong>Invoice:</strong> {selectedOrder.invoiceNumber}</div>
                    <div><strong>Receipt:</strong> {selectedOrder.receiptNumber}</div>
                    <div><strong>Order:</strong> {selectedOrder.orderNumber}</div>
                    <div><strong>Date:</strong> {selectedOrder.date}</div>
                  </div>
                </div>

                <hr />

                <div className="grid-2">
                  <div>
                    <div className="muted small">Customer</div>
                    <strong>{selectedOrder.customerName}</strong>
                    <div>{selectedOrder.phone || "No phone added"}</div>
                  </div>
                  <div>
                    <div className="muted small">Payment</div>
                    <div>{selectedOrder.paymentMethod}</div>
                    <div>Status: {calcTotals(selectedOrder).status}</div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((line) => (
                      <tr key={line.id}>
                        <td>{line.item}</td>
                        <td>{line.qty}</td>
                        <td>{formatMoney(line.price)}</td>
                        <td>{formatMoney(Number(line.qty) * Number(line.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="totals">
                  <div><span>Total</span><strong>{formatMoney(calcTotals(selectedOrder).subtotal)}</strong></div>
                  <div><span>Paid</span><strong>{formatMoney(calcTotals(selectedOrder).paid)}</strong></div>
                  <div><span>Balance</span><strong>{formatMoney(calcTotals(selectedOrder).balance)}</strong></div>
                </div>

                <p><strong>Notes:</strong> {selectedOrder.notes || "None"}</p>

                <div className="button-row">
                  <button onClick={() => copyText(selectedOrder)}>Copy Invoice Text</button>
                  <a className="button-link" href={whatsappLink(selectedOrder)} target="_blank" rel="noreferrer">
                    Send via WhatsApp
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="grid-2">
          <div className="card">
            <h2>Business Settings</h2>
            <div className="stack">
              <div>
                <label>Business Name</label>
                <input value={state.business.name} onChange={(e) => updateBusiness("name", e.target.value)} />
              </div>
              <div>
                <label>Slogan</label>
                <input value={state.business.slogan} onChange={(e) => updateBusiness("slogan", e.target.value)} />
              </div>
              <div>
                <label>Address</label>
                <input value={state.business.address} onChange={(e) => updateBusiness("address", e.target.value)} />
              </div>
              <div>
                <label>Phone</label>
                <input value={state.business.phone} onChange={(e) => updateBusiness("phone", e.target.value)} />
              </div>
              <div>
                <label>Default WhatsApp Number</label>
                <input value={state.business.whatsapp} onChange={(e) => updateBusiness("whatsapp", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <h2>App Notes</h2>
            <div className="stack">
              <p className="muted">This version works as a front-end MVP with browser local storage.</p>
              <p className="muted">Orders, counters, services and business settings stay saved in the same browser.</p>
              <p className="muted">Next upgrade: real backend, login, database sync, and PDF receipts.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
