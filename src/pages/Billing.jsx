import { useState, useEffect, useRef, useCallback } from 'react';
import { saveBill, getProducts, getNextBillNo } from '../lib/api';
import { useApp } from '../context/AppContext';

// Map item numbers to product names from DB (cached)
let productCache = {};

const CATS = ['All', 'Vegetables', 'Fruits', 'Herbs', 'Other'];

export default function Billing() {
  const { scaleConnected, scaleData, printBill, addToast } = useApp();

  // Products
  const [products, setProducts]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('All');

  // Current bill
  const [billItems, setBillItems] = useState([]);
  const [billNo, setBillNo]       = useState('...');

  // Weight modal
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [weightInput, setWeightInput]         = useState('');
  const weightRef = useRef(null);

  // Live scale display (from WebSocket)
  const [liveWeight, setLiveWeight] = useState(null);
  const [liveItem, setLiveItem]     = useState(null);

  // Print preview
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastBill, setLastBill]                 = useState(null);

  // ── Load products + next bill number ──────────────────────────────────────
  useEffect(() => {
    getProducts(true).then(setProducts);
    getNextBillNo().then(setBillNo);
  }, []);

  // ── Filter products ────────────────────────────────────────────────────────
  useEffect(() => {
    let list = products;
    if (category !== 'All') list = list.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.nameHindi.includes(q) ||
        String(p.itemNo).includes(q)
      );
    }
    setFiltered(list);
  }, [products, search, category]);

  // ── React to scale WebSocket data ─────────────────────────────────────────
  useEffect(() => {
    if (!scaleData) return;

    // ── CASE A: Complete bill received (scale PRINT pressed) ───────────────
    if (scaleData.type === 'SCALE_BILL') {
      const { items, total } = scaleData;
      if (!items || items.length === 0) return;

      // Map item numbers to Hindi names from our product DB
      const billItems = items.map(it => {
        const prod = products.find(p => p.itemNo === it.itemNo);
        return {
          id:         Date.now() + Math.random(),
          itemNo:     it.itemNo,
          itemName:   prod ? prod.nameHindi : `Item #${it.itemNo}`,
          itemNameEn: prod ? prod.name      : `Item ${it.itemNo}`,
          weight:     it.weight,
          pricePerKg: it.rate,
          amount:     it.amount,
        };
      });

      // Auto-save the complete bill
      saveBill(billItems, total).then(({ billNo }) => {
        setBillNo(prev => prev + 1);
        addToast(`🖨️ Bill #${billNo} auto-saved! ₹${total}`, 'success');
        // Flash the items briefly on screen
        setBillItems(billItems);
        setTimeout(() => setBillItems([]), 4000);
      });
      return;
    }

    // ── CASE B: Live weight reading (individual item on scale) ─────────────
    const { itemNo, weight } = scaleData;
    if (!itemNo) return;

    const prod = products.find(p => p.itemNo === itemNo);
    if (!prod) {
      addToast(`⚠️ Item #${itemNo} नहीं मिला`, 'error');
      return;
    }

    setLiveItem(prod);
    setLiveWeight(weight);

    // If weight > 0, add to current manual bill
    if (weight > 0) {
      const amount = parseFloat((weight * prod.price).toFixed(2));
      addItemToBill({
        itemNo:     prod.itemNo,
        itemName:   prod.nameHindi,
        itemNameEn: prod.name,
        weight,
        pricePerKg: prod.price,
        amount,
      });
      addToast(`✅ ${prod.nameHindi} ${weight}kg — ₹${amount}`, 'success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaleData]);

  // ── Add item to bill ──────────────────────────────────────────────────────
  const addItemToBill = useCallback((item) => {
    setBillItems(prev => [...prev, { ...item, id: Date.now() }]);
  }, []);

  // ── Click a product button (manual mode) ──────────────────────────────────
  function handleProductClick(prod) {
    if (scaleConnected) {
      // Scale is connected — just show which item is selected, weight comes from scale
      addToast(`⚖️ ${prod.nameHindi} चुना — तराजू पर रखें`, 'info');
      setLiveItem(prod);
      return;
    }
    // Manual mode
    setSelectedProduct(prod);
    setWeightInput('');
    setShowWeightModal(true);
    setTimeout(() => weightRef.current?.focus(), 100);
  }

  // ── Confirm manual weight ──────────────────────────────────────────────────
  function confirmWeight() {
    const w = parseFloat(weightInput);
    if (!w || w <= 0) { addToast('⚠️ सही वजन डालो', 'error'); return; }
    const amount = parseFloat((w * selectedProduct.price).toFixed(2));
    addItemToBill({
      itemNo:      selectedProduct.itemNo,
      itemName:    selectedProduct.nameHindi,
      itemNameEn:  selectedProduct.name,
      weight:      w,
      pricePerKg:  selectedProduct.price,
      amount,
    });
    setShowWeightModal(false);
    addToast(`✅ ${selectedProduct.nameHindi} ${w}kg — ₹${amount}`, 'success');
  }

  // ── Remove item from bill ─────────────────────────────────────────────────
  function removeItem(id) {
    setBillItems(prev => prev.filter(it => it.id !== id));
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = billItems.reduce((s, it) => s + it.amount, 0);

  // ── Print bill ────────────────────────────────────────────────────────────
  async function handlePrint() {
    if (billItems.length === 0) { addToast('⚠️ बिल खाली है!', 'error'); return; }
    try {
      const { billNo: newBillNo } = await saveBill(billItems, total);
      const billData = { billNo: newBillNo, items: billItems, total, date: new Date() };
      printBill(billData); // Send to bridge for thermal printer
      setLastBill(billData);
      setShowPrintPreview(true);
      setBillNo(prev => prev + 1);
      setBillItems([]);
      setLiveItem(null);
      setLiveWeight(null);
      addToast(`🖨️ Bill #${newBillNo} प्रिंट हुआ!`, 'success');
    } catch (e) {
      addToast('❌ Error saving bill', 'error');
    }
  }

  // ── Clear bill ────────────────────────────────────────────────────────────
  function clearBill() {
    if (billItems.length === 0) return;
    if (window.confirm('बिल साफ करें?')) {
      setBillItems([]);
      setLiveItem(null);
      setLiveWeight(null);
    }
  }

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>🧾 बिल बनाओ</h1>
          <p>Bill #{billNo} &nbsp;•&nbsp; {new Date().toLocaleDateString('hi-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 12 }}>
        {/* ── Scale Status Bar ── */}
        <div className="scale-status-bar" style={{ borderRadius: 'var(--radius-lg)', marginBottom: 12, border: '1px solid var(--border)' }}>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'4px 12px', borderRadius:'999px',
            background: scaleConnected ? 'var(--green-glow)' : 'rgba(255,77,109,0.1)',
            border: `1px solid ${scaleConnected ? 'var(--border-bright)' : 'rgba(255,77,109,0.3)'}`,
            fontSize:12, fontWeight:700,
            color: scaleConnected ? 'var(--green)' : 'var(--red)',
            flexShrink: 0,
          }}>
            <div className={`connection-dot${scaleConnected ? ' connected' : ''}`} style={{ width:6, height:6 }} />
            {scaleConnected ? '⚖️ Auto' : '✍️ Manual'}
          </div>

          <div className="scale-reading">
            <div className="scale-reading-item">
              <div className="scale-reading-label">Item No.</div>
              <div className={`scale-reading-value${liveItem ? '' : ' dim'}`}>
                {liveItem ? `#${liveItem.itemNo}` : '--'}
              </div>
            </div>
            <div className="scale-reading-item">
              <div className="scale-reading-label">सामान</div>
              <div className={`scale-reading-value${liveItem ? '' : ' dim'}`}
                style={{ fontSize:16, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                {liveItem ? liveItem.nameHindi : '------'}
              </div>
            </div>
            <div className="scale-reading-item">
              <div className="scale-reading-label">वजन (Kg)</div>
              <div className={`scale-reading-value${liveWeight ? '' : ' dim'}`}>
                {liveWeight != null ? `${liveWeight} kg` : '--.-'}
              </div>
            </div>
            <div className="scale-reading-item">
              <div className="scale-reading-label">रेट / Kg</div>
              <div className={`scale-reading-value${liveItem ? '' : ' dim'}`}>
                {liveItem ? `₹${liveItem.price}` : '--'}
              </div>
            </div>
            <div className="scale-reading-item">
              <div className="scale-reading-label">रकम</div>
              <div className="scale-reading-value" style={{ color:'var(--orange)' }}>
                {liveItem && liveWeight ? fmt(liveWeight * liveItem.price) : '--'}
              </div>
            </div>
          </div>

          {!scaleConnected && (
            <div style={{ fontSize:11, color:'var(--text-muted)', flexShrink:0 }}>
              Bridge नहीं मिला — Manual mode
            </div>
          )}
        </div>

        {/* ── Main Billing Layout ── */}
        <div className="billing-layout">
          {/* LEFT — Product Grid */}
          <div className="product-grid-wrap">
            <div className="product-grid-header">
              <input
                className="product-search"
                placeholder="🔍 नाम या नंबर से खोजो... (Search)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="category-filter">
                {CATS.map(c => (
                  <button key={c} className={`cat-btn${category === c ? ' active' : ''}`}
                    onClick={() => setCategory(c)}>
                    {c === 'All' ? 'सब' : c}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-grid">
              {filtered.map(prod => (
                <button
                  key={prod.id}
                  className="product-btn"
                  onClick={() => handleProductClick(prod)}
                  title={`${prod.name} — ₹${prod.price}/${prod.unit}`}
                >
                  <div className="product-btn-num">#{prod.itemNo}</div>
                  <div className="product-btn-name-hi">{prod.nameHindi}</div>
                  <div className="product-btn-name">{prod.name}</div>
                  <div className="product-btn-price">₹{prod.price}/{prod.unit}</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn:'1/-1', color:'var(--text-muted)', textAlign:'center', padding:40 }}>
                  🔍 कोई सामान नहीं मिला
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Bill Panel */}
          <div className="bill-panel">
            <div className="bill-panel-header">
              <div>
                <div className="bill-no">Bill #{billNo}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {new Date().toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' })}
                </div>
              </div>
              <span className="badge badge-orange">{billItems.length} item{billItems.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Bill Items */}
            <div className="bill-items-list">
              {billItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🛒</div>
                  <h3>बिल खाली है</h3>
                  <p>बाईं तरफ से सामान चुनो<br/>या तराजू पर नंबर डालो</p>
                </div>
              ) : (
                billItems.map((item, i) => (
                  <div key={item.id} className="bill-item">
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:700 }}>#{i+1}</span>
                        <div className="bill-item-name">{item.itemName}</div>
                      </div>
                      <div className="bill-item-detail">
                        {item.weight} kg × ₹{item.pricePerKg}/kg
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                      <div className="bill-item-amount">{fmt(item.amount)}</div>
                      <button className="bill-item-delete" onClick={() => removeItem(item.id)}>✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total + Actions */}
            <div className="bill-panel-total">
              {billItems.length > 0 && (
                <>
                  <div className="total-row">
                    <span>कुल सामान</span>
                    <span>{billItems.length} items</span>
                  </div>
                  <div className="total-row">
                    <span>कुल वजन</span>
                    <span>{billItems.reduce((s,i)=>s+(i.weight||0),0).toFixed(2)} kg</span>
                  </div>
                </>
              )}
              <div className="total-main">
                <div className="label">कुल रकम</div>
                <div className="amount">{fmt(total)}</div>
              </div>
              <div className="bill-actions">
                <button className="btn btn-danger btn-sm" style={{ flex:1 }} onClick={clearBill}>
                  🗑️ साफ करो
                </button>
                <button className="btn btn-primary" style={{ flex:2 }} onClick={handlePrint}>
                  🖨️ Print करो
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Manual Weight Modal ── */}
      {showWeightModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowWeightModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              ⚖️ वजन डालो
              <div style={{ fontSize:14, color:'var(--text-secondary)', fontWeight:400, marginTop:4,
                fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                #{selectedProduct.itemNo} &nbsp;{selectedProduct.nameHindi} &nbsp;—&nbsp; ₹{selectedProduct.price}/{selectedProduct.unit}
              </div>
            </div>
            <input
              ref={weightRef}
              type="number"
              step="0.05"
              min="0"
              className="weight-input-big"
              placeholder="0.00"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmWeight(); if (e.key === 'Escape') setShowWeightModal(false); }}
            />
            <div style={{ fontSize:18, color:'var(--orange)', fontWeight:800, textAlign:'center', marginTop:12 }}>
              {weightInput > 0
                ? `₹${(parseFloat(weightInput) * selectedProduct.price).toFixed(2)}`
                : '₹ --'}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setShowWeightModal(false)}>रद्द करो</button>
              <button className="btn btn-primary" style={{ flex:2 }} onClick={confirmWeight}>✅ जोड़ो</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print Preview Modal ── */}
      {showPrintPreview && lastBill && (
        <div className="modal-overlay" onClick={() => setShowPrintPreview(false)}>
          <div className="modal" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">🖨️ Bill #{lastBill.billNo}</div>
            <div className="print-preview">
              <div style={{ textAlign:'center', marginBottom:8 }}>
                <strong style={{ fontSize:16 }}>OM SHOP</strong><br/>
                <span style={{ fontSize:11 }}>सब्जी और फल दुकान</span><br/>
                <span style={{ fontSize:10 }}>----------------------------</span>
              </div>
              <div style={{ fontSize:11, marginBottom:8 }}>
                <div>Bill No: #{lastBill.billNo}</div>
                <div>Date: {new Date(lastBill.date).toLocaleString('en-IN')}</div>
              </div>
              <hr/>
              {lastBill.items.map((it,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'2px 0' }}>
                  <span>{it.itemName} {it.weight}kg</span>
                  <span>₹{it.amount.toFixed(2)}</span>
                </div>
              ))}
              <hr/>
              <div style={{ display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:14 }}>
                <span>TOTAL</span>
                <span>₹{lastBill.total.toFixed(2)}</span>
              </div>
              <div style={{ textAlign:'center', marginTop:8, fontSize:10 }}>
                ध न्यवाद! आते रहिए 🙏
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => setShowPrintPreview(false)}>
                ✅ Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
