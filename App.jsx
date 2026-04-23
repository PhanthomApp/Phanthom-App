import { useEffect, useMemo, useState } from "react";
import logo from "./logo.png";

const STORAGE_KEY = "phanthom-public-admin-v3";
const WHATSAPP_NUMBER = "5978363552";
const BASE_COMPLETED_ORDERS = 38;

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
    description: "Logo cleanup, social visuals, promo graphics and packaging support.",
  },
  {
    id: "svc-4",
    name: "Bulk Merchandise Orders",
    category: "Bulk",
    price: 0,
    description: "Custom quotes for events, teams, resellers and large streetwear batches.",
  },
  {
    id: "svc-5",
    name: "Tumblers",
    category: "Drinkware",
    price: 300,
    description: "Custom tumblers for branding, gifts and business orders.",
  },
  {
    id: "svc-6",
    name: "Clothing Sets",
    category: "Apparel",
    price: 1500,
    description: "Matching tops and bottoms for styled drops and coordinated sets.",
  },
  {
    id: "svc-7",
    name: "Business Cards",
    category: "Print",
    price: 250,
    description: "Clean branded business cards for businesses, creators and promos.",
  },
];

const defaultProducts = [
  {
    id: "prd-1",
    name: "PHANTHOM Signature Tee",
    price: 750,
    tag: "Best Seller",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prd-2",
    name: "Oversized Street Drop",
    price: 850,
    tag: "Oversized",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prd-3",
    name: "Back Print Statement Tee",
    price: 800,
    tag: "New Drop",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prd-4",
    name: "Custom Tumbler",
    price: 300,
    tag: "Popular",
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prd-5",
    name: "Streetwear Set",
    price: 1500,
    tag: "Set",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "prd-6",
    name: "Business Card Pack",
    price: 250,
    tag: "Business",
    image:
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1200&q=80",
  },
];

const defaultGallery = [
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
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
    phone: "+597 8363552",
    whatsapp: WHATSAPP_NUMBER,
    currency: "SRD",
    heroTitle: "Streetwear Storefront, Printing & Branding That Looks Serious.",
    heroText:
      "Premium apparel presentation, fast ordering, bold visuals, and a cleaner PHANTHOM customer experience.",
  },
  services: defaultServices,
  testimonials: defaultTestimonials,
  gallery: defaultGallery,
  products: defaultProducts,
  orders: [],
  returnReceipts: [],
  counters: { order: 1, invoice: 1, receipt: 1, returnReceipt: 1 },
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
  const [serviceDraft, setServiceDraft] = useState({ name: "", category: "General", price: 0, description: "" });
  const [returnForm, setReturnForm] = useState({ orderId: "", customerName: "", reason: "", refundAmount: 0, date: todayISO() });

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

  const selectedReturnOrder = useMemo(
    () => state.orders.find((order) => order.id === returnForm.orderId) || null,
    [state.orders, returnForm.orderId]
  );

  function updateLine(id, field, value) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) =>
        line.id === id ? { ...line, [field]: field === "item" ? value : Number(value) } : line
      ),
    }));
  }

  function updateService(id, field, value) {
    setState((prev) => ({
      ...prev,
      services: prev.services.map((service) =>
        service.id === id
          ? { ...service, [field]: field === "price" ? Number(value) : value }
          : service
      ),
    }));
  }

  function addService() {
    if (!serviceDraft.name.trim()) return;
    setState((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          id: `svc-${Date.now()}`,
          name: serviceDraft.name,
          category: serviceDraft.category,
          price: Number(serviceDraft.price || 0),
          description: serviceDraft.description,
        },
      ],
    }));
    setServiceDraft({ name: "", category: "General", price: 0, description: "" });
  }

  function removeService(id) {
    setState((prev) => ({
      ...prev,
      services: prev.services.filter((service) => service.id !== id),
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

  function applyProduct(product) {
    setMode("admin");
    setAdminTab("dashboard");
    applyService({ name: product.name, price: product.price });
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
        ...prev.counters,
        order: prev.counters.order + 1,
        invoice: prev.counters.invoice + 1,
        receipt: prev.counters.receipt + 1,
      },
    }));
    setSelectedOrderId(order.id);
    resetForm();
    setAdminTab("orders");
  }

  function createReturnReceipt() {
    if (!returnForm.customerName.trim() || !returnForm.orderId) return;

    const receipt = {
      id: `return-${Date.now()}`,
      receiptNumber: makeNumber("PH-RET", state.counters.returnReceipt),
      orderId: returnForm.orderId,
      customerName: returnForm.customerName,
      reason: returnForm.reason,
      refundAmount: Number(returnForm.refundAmount || 0),
      date: returnForm.date,
    };

    setState((prev) => ({
      ...prev,
      returnReceipts: [receipt, ...prev.returnReceipts],
      counters: { ...prev.counters, returnReceipt: prev.counters.returnReceipt + 1 },
    }));
    setReturnForm({ orderId: "", customerName: "", reason: "", refundAmount: 0, date: todayISO() });
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
Status: ${totals.status}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function copyReturnReceipt(receipt) {
    const text = `${state.business.name}
CUSTOMER RETURN RECEIPT
${receipt.receiptNumber}

Customer: ${receipt.customerName}
Date: ${receipt.date}
Order Ref: ${receipt.orderId}
Refund Amount: ${formatMoney(receipt.refundAmount)}
Reason: ${receipt.reason || "Not specified"}

Address: ${state.business.address}
WhatsApp: wa.me/${WHATSAPP_NUMBER}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function whatsappLink(order) {
    const totals = calcTotals(order);
    const lines = order.items.map((line) => `- ${line.item} x${line.qty} @ ${formatMoney(line.price)}`).join("\n");
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

  function leadWhatsappLink() {
    const hasData = lead.name || lead.phone || lead.service || lead.note;
    if (!hasData) return `https://wa.me/${sanitizePhone(state.business.whatsapp)}`;
    const text = `Hello PHANTHOM, my name is ${lead.name || "not provided"}. My phone is ${lead.phone || "not provided"}. I need ${lead.service || "a service"}. Notes: ${lead.note || "none"}.`;
    return `https://wa.me/${sanitizePhone(state.business.whatsapp)}?text=${encodeURIComponent(text)}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#fff" }}>
      <style>{`
        *{box-sizing:border-box} body{margin:0;font-family:Inter,Arial,sans-serif;background:#050505;color:#fff}
        a{text-decoration:none;color:inherit} button,input,select,textarea{font:inherit}
        .shell{max-width:1400px;margin:0 auto;padding:24px}
        .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;position:sticky;top:0;z-index:20;background:rgba(5,5,5,.82);backdrop-filter:blur(14px);padding:12px 0}
        .brandWrap{display:flex;align-items:center;gap:14px}
        .brandLogo{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 0 18px rgba(255,212,0,.18))}
        .brandText{display:grid;gap:2px}.brandTitle{font-weight:900;letter-spacing:.04em;font-size:1.25rem}.brandSub{color:#d0d0d0;font-size:.9rem}
        .modeRow,.navRow,.btnRow,.pillRow{display:flex;flex-wrap:wrap;gap:10px}
        .modeBtn,.tabBtn,.pill,.btn,.ghostBtn{border:1px solid #3a3200;border-radius:14px;padding:12px 16px;font-weight:800;cursor:pointer;transition:.28s ease}
        .modeBtn,.tabBtn,.ghostBtn,.pill{background:#111;color:#fff}
        .modeBtn:hover,.tabBtn:hover,.ghostBtn:hover,.pill:hover{transform:translateY(-2px);border-color:#ffd400;box-shadow:0 10px 30px rgba(255,212,0,.09)}
        .modeBtn.active,.tabBtn.active,.btn{background:linear-gradient(135deg,#ffe15c,#ffd400 45%,#f2bc00);color:#000;border-color:#ffd400}
        .btn.danger{background:#df5b5b;color:#fff;border-color:#df5b5b}.btn.dark{background:#171717;color:#fff;border-color:#2b2b2b}
        .hero{display:grid;grid-template-columns:1.15fr .85fr;gap:22px;padding:34px;border:1px solid #282200;border-radius:30px;background:radial-gradient(circle at top right,rgba(255,212,0,.2) 0%,rgba(20,20,20,.92) 32%,#050505 70%);overflow:hidden;position:relative}
        .hero:before,.hero:after{content:"";position:absolute;border-radius:999px;filter:blur(70px);opacity:.45;pointer-events:none}.hero:before{width:260px;height:260px;left:-40px;top:-20px;background:#ffd400;animation:float 7s ease-in-out infinite}.hero:after{width:240px;height:240px;right:-20px;bottom:-60px;background:#fff3a0;animation:float 9s ease-in-out infinite reverse}
        .heroTag{display:inline-block;padding:8px 14px;border:1px solid #4a3e00;border-radius:999px;background:rgba(255,212,0,.08);margin-bottom:16px;color:#ffe47f}
        .hero h1{font-size:3.5rem;line-height:.98;margin:0 0 14px;max-width:760px}.hero p{max-width:680px}
        .muted{color:#c5c5c5}.small{font-size:.84rem}
        .grid2{display:grid;grid-template-columns:1.05fr .95fr;gap:20px}.split{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .card{background:linear-gradient(180deg,#0d0d0d,#090909);border:1px solid #252525;border-radius:26px;padding:24px;box-shadow:0 18px 60px rgba(0,0,0,.28)}
        .statGrid{display:grid;grid-template-columns:1fr;gap:14px}.statMini,.serviceCard,.testimonial,.preview,.lineCard,.orderCard,.totalsBox,.productCard,.galleryCard{background:linear-gradient(180deg,#121212,#0d0d0d);border:1px solid #272727;border-radius:20px;padding:16px}
        .statNum{font-size:1.6rem;font-weight:900}.sectionTitle{font-size:2rem;margin:0 0 14px}
        .serviceGrid,.testimonialGrid,.productGrid,.galleryGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.productGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.galleryGrid{grid-template-columns:repeat(4,minmax(0,1fr))}
        .serviceCard,.productCard,.galleryCard,.testimonial{transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease}.serviceCard:hover,.productCard:hover,.galleryCard:hover,.testimonial:hover{transform:translateY(-6px);border-color:#ffd400;box-shadow:0 16px 50px rgba(255,212,0,.08)}
        .productImage,.galleryImage{width:100%;object-fit:cover;border-radius:16px}.productImage{height:300px}.galleryImage{height:180px}
        .tag{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:rgba(255,212,0,.1);color:#ffe36f;border:1px solid #5a4b00;font-size:.8rem;font-weight:700}
        .testimonial{position:relative;animation:rise .8s ease both}.testimonial:nth-child(2){animation-delay:.1s}.testimonial:nth-child(3){animation-delay:.2s}
        .cta{margin-top:20px;padding:26px;border:1px solid #352c00;border-radius:26px;background:linear-gradient(135deg,rgba(255,212,0,.12),#090909 52%,#050505);position:relative;overflow:hidden}
        .cta:before{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:999px;background:rgba(255,212,0,.14);filter:blur(40px)}
        .formGrid,.lineGrid{display:grid;gap:14px}.formGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.lineGrid{grid-template-columns:2fr .7fr 1fr 110px;align-items:end}
        input,select,textarea{width:100%;margin-top:8px;background:#080808;color:#fff;border:1px solid #2a2a2a;border-radius:14px;padding:12px} textarea{min-height:110px;resize:vertical}
        input:focus,select:focus,textarea:focus{outline:none;border-color:#ffd400;box-shadow:0 0 0 3px rgba(255,212,0,.12)}
        table{width:100%;border-collapse:collapse;margin:18px 0} th,td{border:1px solid #2a2a2a;padding:12px;text-align:left} th{background:#151515}
        .rowBetween{display:flex;justify-content:space-between;align-items:center;gap:12px}.badge{padding:7px 10px;border:1px solid #4e4100;border-radius:999px;background:rgba(255,212,0,.08);color:#ffe36f;font-size:.8rem}
        .stack{display:grid;gap:14px}.errorBox{background:rgba(223,91,91,.12);border:1px solid rgba(223,91,91,.4);padding:14px;border-radius:14px;color:#ffc9c9}
        .fadeIn{animation:fade .55s ease}.leadForm{display:grid;gap:12px}.adminBanner{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.settingsGrid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .quickContact{display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:18px;border:1px solid #4d4000;background:rgba(255,212,0,.08)}
        .photoNote{margin-top:8px;color:#d0d0d0;font-size:.9rem}
        @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(18px)}}
        @media (max-width:1100px){.hero,.grid2,.split,.formGrid,.lineGrid,.serviceGrid,.testimonialGrid,.productGrid,.galleryGrid,.adminBanner,.settingsGrid{grid-template-columns:1fr}.hero h1{font-size:2.4rem}}
      `}</style>

      <div className="shell fadeIn">
        <div className="topbar">
          <div className="brandWrap">
            <img src={logo} alt="PHANTHOM logo" className="brandLogo" />
            <div className="brandText">
              <div className="brandTitle">PHANTHOM Official</div>
              <div className="brandSub">The Authorized Crew.</div>
            </div>
          </div>

          <div className="modeRow">
            <a className="ghostBtn" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">wa.me/{WHATSAPP_NUMBER}</a>
            <button className={mode === "public" ? "modeBtn active" : "modeBtn"} onClick={() => setMode("public")}>Public View</button>
            <button className={mode === "admin" ? "modeBtn active" : "modeBtn"} onClick={() => setMode("admin")}>Admin View</button>
          </div>
        </div>

        {mode === "public" && (
          <div className="stack fadeIn">
            <section className="hero">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="heroTag">BLACK • YELLOW • WHITE</div>
                <h1>{state.business.heroTitle}</h1>
                <p className="muted" style={{ fontSize: "1.05rem", lineHeight: 1.65 }}>{state.business.heroText}</p>
                <div className="btnRow" style={{ marginTop: 18 }}>
                  <button className="btn" onClick={() => document.getElementById("store")?.scrollIntoView({ behavior: "smooth" })}>Shop The Store</button>
                  <button className="ghostBtn" onClick={() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })}>View Photo Section</button>
                </div>
              </div>

              <div className="statGrid" style={{ position: "relative", zIndex: 1 }}>
                <div className="statMini"><div className="muted">Completed Orders</div><div className="statNum">{BASE_COMPLETED_ORDERS + state.orders.length}</div></div>
                <div className="statMini"><div className="muted">Core Services</div><div className="statNum">{state.services.length}</div></div>
                <div className="statMini"><div className="muted">WhatsApp Orders</div><div className="statNum">+597 8363552</div></div>
                <div className="quickContact">
                  <img src={logo} alt="PHANTHOM logo" className="brandLogo" style={{ width: 46, height: 46 }} />
                  <div>
                    <strong>Quick Order Contact</strong>
                    <div className="muted small">wa.me/{WHATSAPP_NUMBER}</div>
                  </div>
                </div>
              </div>
            </section>

            <section id="store" className="card">
              <div className="rowBetween"><h2 className="sectionTitle">Store</h2><span className="tag">T-Shirts • Tumblers • Sets • Cards</span></div>
              <div className="productGrid">
                {state.products.map((product) => (
                  <div key={product.id} className="productCard">
                    <img className="productImage" src={product.image} alt={product.name} />
                    <div style={{ marginTop: 14 }} className="rowBetween">
                      <strong>{product.name}</strong>
                      <span className="tag">{product.tag}</span>
                    </div>
                    <p className="muted" style={{ margin: "10px 0" }}>{formatMoney(product.price)}</p>
                    <div className="btnRow">
                      <button className="btn" onClick={() => applyProduct(product)}>Add To Order</button>
                      <a className="ghostBtn" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello PHANTHOM, I want to order ${product.name}.`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="services" className="card">
              <div className="rowBetween"><h2 className="sectionTitle">Services</h2><span className="tag">Customer View</span></div>
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

            <section id="gallery" className="card">
              <div className="rowBetween"><h2 className="sectionTitle">Photo Section</h2><span className="tag">Visual Showcase</span></div>
              <div className="galleryGrid">
                {state.gallery.map((src, index) => (
                  <div key={src} className="galleryCard">
                    <img className="galleryImage" src={src} alt={`Gallery ${index + 1}`} />
                  </div>
                ))}
              </div>
              <div className="photoNote">Replace these sample photos with your real PHANTHOM shirt, tumbler, set, and business card photos.</div>
            </section>

            <section className="split">
              <div className="card">
                <h2 className="sectionTitle">Testimonials</h2>
                <div className="testimonialGrid">
                  {state.testimonials.map((item) => (
                    <div key={item.id} className="testimonial">
                      <p style={{ lineHeight: 1.6, marginTop: 0 }}>“{item.text}”</p>
                      <strong>{item.name}</strong>
                      <div className="muted small">{item.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="sectionTitle">Quick Order Lead</h2>
                <div className="leadForm">
                  <div><label>Name</label><input value={lead.name} onChange={(e) => setLead((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div><label>Phone</label><input value={lead.phone} onChange={(e) => setLead((p) => ({ ...p, phone: e.target.value }))} /></div>
                  <div>
                    <label>Service Needed</label>
                    <select value={lead.service} onChange={(e) => setLead((p) => ({ ...p, service: e.target.value }))}>
                      <option value="">Select a service</option>
                      {state.services.map((service) => <option key={service.id}>{service.name}</option>)}
                    </select>
                  </div>
                  <div><label>Notes</label><textarea value={lead.note} onChange={(e) => setLead((p) => ({ ...p, note: e.target.value }))} /></div>
                  <a className="btn" href={leadWhatsappLink()} target="_blank" rel="noreferrer">Send Inquiry</a>
                </div>
              </div>
            </section>
          </div>
        )}

        {mode === "admin" && (
          <div className="stack fadeIn">
            <div className="adminBanner">
              <div className="statMini"><div className="muted">Completed Orders</div><div className="statNum">{BASE_COMPLETED_ORDERS + state.orders.length}</div></div>
              <div className="statMini"><div className="muted">Revenue</div><div className="statNum">{formatMoney(stats.revenue)}</div></div>
              <div className="statMini"><div className="muted">Outstanding</div><div className="statNum">{formatMoney(stats.outstanding)}</div></div>
              <div className="statMini"><div className="muted">Contact</div><div className="statNum" style={{ fontSize: "1rem" }}>+597 8363552</div></div>
            </div>

            <div className="navRow">
              {[
                ["dashboard", "Dashboard"],
                ["services", "Services & Prices"],
                ["orders", "Orders"],
                ["settings", "Settings & Returns"],
              ].map(([key, label]) => (
                <button key={key} className={adminTab === key ? "tabBtn active" : "tabBtn"} onClick={() => setAdminTab(key)}>{label}</button>
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
                  <div className="pillRow" style={{ marginTop: 16 }}>{state.services.map((service) => <button key={service.id} className="pill" onClick={() => applyService(service)}>+ {service.name}</button>)}</div>
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
              <div className="settingsGrid">
                <div className="card">
                  <h2 className="sectionTitle">Edit Services & Prices</h2>
                  <div className="stack">
                    {state.services.map((service) => (
                      <div key={service.id} className="serviceCard">
                        <div className="formGrid">
                          <div><label>Name</label><input value={service.name} onChange={(e) => updateService(service.id, "name", e.target.value)} /></div>
                          <div><label>Category</label><input value={service.category} onChange={(e) => updateService(service.id, "category", e.target.value)} /></div>
                          <div><label>Price</label><input type="number" value={service.price} onChange={(e) => updateService(service.id, "price", e.target.value)} /></div>
                          <div><label>Description</label><textarea value={service.description} onChange={(e) => updateService(service.id, "description", e.target.value)} /></div>
                        </div>
                        <div className="btnRow"><button className="btn danger" onClick={() => removeService(service.id)}>Remove</button></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h2 className="sectionTitle">Add New Service</h2>
                  <div className="stack">
                    <div><label>Name</label><input value={serviceDraft.name} onChange={(e) => setServiceDraft((p) => ({ ...p, name: e.target.value }))} /></div>
                    <div><label>Category</label><input value={serviceDraft.category} onChange={(e) => setServiceDraft((p) => ({ ...p, category: e.target.value }))} /></div>
                    <div><label>Price</label><input type="number" value={serviceDraft.price} onChange={(e) => setServiceDraft((p) => ({ ...p, price: Number(e.target.value) }))} /></div>
                    <div><label>Description</label><textarea value={serviceDraft.description} onChange={(e) => setServiceDraft((p) => ({ ...p, description: e.target.value }))} /></div>
                    <button className="btn" onClick={addService}>Add Service</button>
                  </div>
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
                        <div className="brandWrap">
                          <img src={logo} alt="PHANTHOM logo" className="brandLogo" style={{ width: 52, height: 52 }} />
                          <div>
                            <h3 style={{ margin: 0 }}>{state.business.name}</h3>
                            <p className="muted">{state.business.slogan}</p>
                            <p className="muted">{state.business.address}</p>
                          </div>
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
              <div className="settingsGrid">
                <div className="card">
                  <h2 className="sectionTitle">Customer Return Receipt</h2>
                  <div className="stack">
                    <div>
                      <label>Original Order</label>
                      <select value={returnForm.orderId} onChange={(e) => setReturnForm((p) => ({ ...p, orderId: e.target.value }))}>
                        <option value="">Select order</option>
                        {state.orders.map((order) => (
                          <option key={order.id} value={order.id}>{order.orderNumber} - {order.customerName}</option>
                        ))}
                      </select>
                    </div>
                    <div><label>Customer Name</label><input value={returnForm.customerName} onChange={(e) => setReturnForm((p) => ({ ...p, customerName: e.target.value }))} /></div>
                    <div><label>Date</label><input type="date" value={returnForm.date} onChange={(e) => setReturnForm((p) => ({ ...p, date: e.target.value }))} /></div>
                    <div><label>Refund Amount</label><input type="number" value={returnForm.refundAmount} onChange={(e) => setReturnForm((p) => ({ ...p, refundAmount: Number(e.target.value) }))} /></div>
                    <div><label>Reason</label><textarea value={returnForm.reason} onChange={(e) => setReturnForm((p) => ({ ...p, reason: e.target.value }))} /></div>
                    <button className="btn" onClick={createReturnReceipt}>Create Return Receipt</button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="sectionTitle">Return Receipt Preview</h2>
                  {selectedReturnOrder && (
                    <div className="preview">
                      <div className="brandWrap">
                        <img src={logo} alt="PHANTHOM logo" className="brandLogo" style={{ width: 52, height: 52 }} />
                        <div>
                          <h3 style={{ margin: 0 }}>{state.business.name}</h3>
                          <p className="muted">Customer Return Receipt</p>
                          <p className="muted">{state.business.address}</p>
                        </div>
                      </div>
                      <div className="stack" style={{ marginTop: 16 }}>
                        <div className="rowBetween"><span>Customer</span><strong>{returnForm.customerName || selectedReturnOrder.customerName}</strong></div>
                        <div className="rowBetween"><span>Original Order</span><strong>{selectedReturnOrder.orderNumber}</strong></div>
                        <div className="rowBetween"><span>Refund Amount</span><strong>{formatMoney(returnForm.refundAmount)}</strong></div>
                        <div className="rowBetween"><span>Date</span><strong>{returnForm.date}</strong></div>
                        <div><strong>Reason:</strong> <span className="muted">{returnForm.reason || "Not specified"}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="stack" style={{ marginTop: 16 }}>
                    {state.returnReceipts.map((receipt) => (
                      <div key={receipt.id} className="serviceCard">
                        <div className="rowBetween">
                          <strong>{receipt.receiptNumber}</strong>
                          <span className="badge">{formatMoney(receipt.refundAmount)}</span>
                        </div>
                        <div className="muted small">{receipt.customerName} • {receipt.date}</div>
                        <div className="btnRow"><button className="btn dark" onClick={() => copyReturnReceipt(receipt)}>Copy Return Receipt</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
