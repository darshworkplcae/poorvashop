import { useState, useEffect } from 'react';
import { savePurchase as apiSavePurchase, getPurchases, getPurchaseItems, getProducts } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function FarmerStock() {
  const { addToast } = useApp();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [expanded, setExpanded]   = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);

  // Purchase form
  const [farmerName, setFarmerName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0,10));
  const [items, setItems] = useState([{ itemNo:'', itemName:'', quantity:'', pricePerKg:'' }]);

  useEffect(() => {
    getProducts(true).then(setProducts);
    loadPurchases();
  }, []);

  async function loadPurchases() {
    setLoading(true);
    const all = await getPurchases(100);
    setPurchases(all);
    setLoading(false);
  }

  function addRow() {
    setItems(prev => [...prev, { itemNo:'', itemName:'', quantity:'', pricePerKg:'' }]);
  }

  function removeRow(i) {
    setItems(prev => prev.filter((_,idx) => idx !== i));
  }

  function updateRow(i, field, val) {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      if (field === 'itemNo') {
        const prod = products.find(p => p.itemNo === Number(val));
        if (prod) next[i].itemName = prod.nameHindi;
      }
      return next;
    });
  }

  const rowTotal = row => {
    const q = parseFloat(row.quantity) || 0;
    const p = parseFloat(row.pricePerKg) || 0;
    return q * p;
  };

  const grandTotal = items.reduce((s, r) => s + rowTotal(r), 0);

  async function savePurchase() {
    const validItems = items.filter(r => r.itemNo && r.quantity && r.pricePerKg);
    if (validItems.length === 0) { addToast('⚠️ कम से कम एक सामान भरो', 'error'); return; }
    
    await apiSavePurchase(farmerName || 'Unknown', purchaseDate, validItems.map(r => ({
      item_no:     Number(r.itemNo),
      item_name:   r.itemName || `Item #${r.itemNo}`,
      quantity:   parseFloat(r.quantity),
      price_per_kg: parseFloat(r.pricePerKg),
      total_cost:  rowTotal(r),
    })), grandTotal);
    
    addToast('✅ माल आना दर्ज हुआ', 'success');
    setShowForm(false);
    setFarmerName('');
    setItems([{ itemNo:'', itemName:'', quantity:'', pricePerKg:'' }]);
    loadPurchases();
  }

  async function expandPurchase(p) {
    if (expanded === p.id) { setExpanded(null); return; }
    setExpanded(p.id);
    const its = await getPurchaseItems(p.id);
    setExpandedItems(its);
  }

  const fmt = n => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>🚛 किसान माल</h1>
          <p>Farmer Stock — माल आने की जानकारी</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ बंद करो' : '➕ माल आया'}
        </button>
      </div>

      <div className="page-body">
        {/* Entry Form */}
        {showForm && (
          <div className="card" style={{ marginBottom:20 }}>
            <div className="card-title" style={{ marginBottom:16 }}>📦 नया माल दर्ज करो</div>
            <div className="grid-2" style={{ marginBottom:16 }}>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">किसान / सप्लायर का नाम</label>
                <input className="form-input" placeholder="जैसे: Ramesh Bhai"
                  value={farmerName} onChange={e => setFarmerName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom:0 }}>
                <label className="form-label">तारीख</label>
                <input className="form-input" type="date" value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)} />
              </div>
            </div>

            {/* Items table */}
            <div className="table-wrap" style={{ marginBottom:12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Item #</th>
                    <th>नाम</th>
                    <th>मात्रा (Kg)</th>
                    <th>रेट (₹/Kg)</th>
                    <th>कुल</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, i) => (
                    <tr key={i}>
                      <td style={{ width:80 }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding:'6px 8px', fontSize:14 }}
                          placeholder="#"
                          value={row.itemNo}
                          onChange={e => updateRow(i, 'itemNo', e.target.value)}
                        />
                      </td>
                      <td style={{ minWidth:140 }}>
                        <input
                          className="form-input"
                          style={{ padding:'6px 8px', fontSize:14,
                            fontFamily:"'Noto Sans Devanagari',sans-serif" }}
                          placeholder="सामान का नाम"
                          value={row.itemName}
                          onChange={e => updateRow(i, 'itemName', e.target.value)}
                        />
                      </td>
                      <td style={{ width:100 }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding:'6px 8px', fontSize:14 }}
                          placeholder="0.0"
                          value={row.quantity}
                          onChange={e => updateRow(i, 'quantity', e.target.value)}
                        />
                      </td>
                      <td style={{ width:100 }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding:'6px 8px', fontSize:14 }}
                          placeholder="₹0"
                          value={row.pricePerKg}
                          onChange={e => updateRow(i, 'pricePerKg', e.target.value)}
                        />
                      </td>
                      <td style={{ fontWeight:700, color:'var(--orange)' }}>
                        {rowTotal(row) > 0 ? fmt(rowTotal(row)) : '—'}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeRow(i)}>✕</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center">
              <button className="btn btn-ghost btn-sm" onClick={addRow}>➕ एक और सामान</button>
              <div className="flex items-center gap-12">
                <div style={{ fontWeight:800, fontSize:18, color:'var(--green)' }}>
                  कुल: {fmt(grandTotal)}
                </div>
                <button className="btn btn-primary" onClick={savePurchase}>💾 Save करो</button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase History */}
        {loading ? (
          <div className="loading"><div className="spinner"/></div>
        ) : purchases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚛</div>
            <h3>कोई रिकॉर्ड नहीं</h3>
            <p>ऊपर "माल आया" बटन दबाओ और दर्ज करो</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {purchases.map(p => (
              <div key={p.id} className="card" style={{ padding:0, overflow:'hidden' }}>
                <div className="flex items-center justify-between"
                  style={{ padding:'14px 20px', cursor:'pointer' }}
                  onClick={() => expandPurchase(p)}>
                  <div className="flex items-center gap-12">
                    <span style={{ fontSize:24 }}>🚛</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)',
                        fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
                        {p.farmer_name}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {new Date(p.date_str).toLocaleDateString('hi-IN', { day:'numeric', month:'long', year:'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span style={{ fontWeight:800, fontSize:18, color:'var(--orange)' }}>
                      {fmt(p.total_cost)}
                    </span>
                    <span style={{ color:'var(--text-muted)', fontSize:18 }}>
                      {expanded === p.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {expanded === p.id && (
                  <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg-elevated)', padding:'12px 20px' }}>
                    <table style={{ width:'100%', fontSize:13 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign:'left', padding:'5px 0', color:'var(--text-muted)', fontWeight:700 }}>सामान</th>
                          <th style={{ textAlign:'right', color:'var(--text-muted)', fontWeight:700 }}>मात्रा</th>
                          <th style={{ textAlign:'right', color:'var(--text-muted)', fontWeight:700 }}>रेट</th>
                          <th style={{ textAlign:'right', color:'var(--text-muted)', fontWeight:700 }}>कुल</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expandedItems.map((it,i) => (
                          <tr key={i}>
                            <td style={{ padding:'4px 0', fontFamily:"'Noto Sans Devanagari',sans-serif", fontWeight:600 }}>
                              #{it.item_no} {it.item_name}
                            </td>
                            <td style={{ textAlign:'right', color:'var(--text-secondary)' }}>{it.quantity} kg</td>
                            <td style={{ textAlign:'right', color:'var(--text-secondary)' }}>₹{it.price_per_kg}</td>
                            <td style={{ textAlign:'right', fontWeight:700, color:'var(--orange)' }}>
                              {fmt(it.total_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
