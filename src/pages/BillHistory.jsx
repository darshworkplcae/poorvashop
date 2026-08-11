import { useState, useEffect } from 'react';
import { getBills, getBillItems, getDeletedBills, deleteBill, restoreBill } from '../lib/api';
import { useApp } from '../context/AppContext';

const fmt = n => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BillHistory() {
  const { addToast } = useApp();
  const [activeTab,   setActiveTab]   = useState('bills');   // 'bills' | 'deleted'
  const [bills,       setBills]       = useState([]);
  const [deleted,     setDeleted]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [expanded,    setExpanded]    = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null);  // bill to delete
  const [deleteNote,  setDeleteNote]  = useState('');

  useEffect(() => { loadBills(); }, []);

  async function loadBills() {
    setLoading(true);
    const [b, d] = await Promise.all([getBills({ limit: 200 }), getDeletedBills()]);
    setBills(b);
    setDeleted(d);
    setLoading(false);
  }

  async function expandBill(bill) {
    if (expanded === bill.id) { setExpanded(null); return; }
    setExpanded(bill.id);
    const items = await getBillItems(bill.id);
    setExpandedItems(items);
  }

  async function confirmDelete() {
    try {
      await deleteBill(deleteModal.id, deleteNote);
      addToast(`🗑️ Bill #${deleteModal.bill_no} हटा दिया`, 'info');
      setDeleteModal(null);
      setDeleteNote('');
      await loadBills();
    } catch { addToast('❌ Error deleting bill', 'error'); }
  }

  async function handleRestore(bill) {
    try {
      await restoreBill(bill.id);
      addToast(`✅ Bill #${bill.bill_no} वापस लाया`, 'success');
      await loadBills();
    } catch { addToast('❌ Error restoring bill', 'error'); }
  }

  const filtered = bills.filter(b => {
    const ms = search.trim() === '' || String(b.bill_no).includes(search);
    const md = dateFilter === '' || b.date_str === dateFilter;
    return ms && md;
  });

  const totalFiltered = filtered.reduce((s, b) => s + parseFloat(b.total), 0);

  const BillRow = ({ bill, showRestore = false }) => (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <div className="flex items-center justify-between"
        style={{ padding:'14px 20px', cursor:'pointer' }}
        onClick={() => expandBill(bill)}>
        <div className="flex items-center gap-12">
          <span className={`badge ${showRestore ? 'badge-red' : 'badge-green'}`}
            style={{ fontSize:13, padding:'4px 12px' }}>
            #{bill.bill_no}
          </span>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>
              {new Date(bill.date).toLocaleDateString('hi-IN', { day:'numeric', month:'long', year:'numeric' })}
              <span style={{ color:'var(--text-secondary)', fontWeight:400, marginLeft:8 }}>
                {new Date(bill.date).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' })}
              </span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              {bill.item_count} सामान
              {showRestore && bill.delete_note && (
                <span style={{ color:'var(--red)', marginLeft:8 }}>— {bill.delete_note}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-12">
          <div style={{ fontSize:20, fontWeight:800, color: showRestore ? 'var(--red)' : 'var(--green)' }}>
            {fmt(bill.total)}
          </div>
          {!showRestore && (
            <button
              className="btn btn-danger btn-sm"
              style={{ zIndex:2 }}
              onClick={e => { e.stopPropagation(); setDeleteModal(bill); setDeleteNote(''); }}>
              🗑️
            </button>
          )}
          {showRestore && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ color:'var(--green)', borderColor:'var(--green)', zIndex:2 }}
              onClick={e => { e.stopPropagation(); handleRestore(bill); }}>
              ↩️ वापस
            </button>
          )}
          <span style={{ color:'var(--text-muted)', fontSize:18 }}>{expanded === bill.id ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded === bill.id && (
        <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg-elevated)', padding:'12px 20px' }}>
          <table style={{ width:'100%', fontSize:13 }}>
            <thead>
              <tr>
                {['सामान','वजन','रेट/Kg','रकम'].map(h => (
                  <th key={h} style={{ textAlign: h==='सामान'?'left':'right', padding:'6px 0', color:'var(--text-muted)', fontWeight:700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expandedItems.map((it, i) => (
                <tr key={i}>
                  <td style={{ padding:'5px 0', fontFamily:"'Noto Sans Devanagari',sans-serif", fontWeight:600 }}>{it.item_name}</td>
                  <td style={{ textAlign:'right', color:'var(--text-secondary)' }}>{it.weight} kg</td>
                  <td style={{ textAlign:'right', color:'var(--text-secondary)' }}>₹{it.price_per_kg}</td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'var(--green)' }}>{fmt(it.amount)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="3" style={{ padding:'8px 0 0', fontWeight:800, borderTop:'1px solid var(--border)' }}>कुल</td>
                <td style={{ textAlign:'right', fontWeight:900, fontSize:16, color:'var(--green)', padding:'8px 0 0', borderTop:'1px solid var(--border)' }}>
                  {fmt(bill.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>📋 बिल इतिहास</h1>
          <p>Bill History — सब बिल यहाँ</p>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div className="flex gap-8" style={{ marginBottom:16 }}>
          <button className={`btn ${activeTab==='bills' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('bills')}>
            🧾 सब बिल ({bills.length})
          </button>
          <button className={`btn ${activeTab==='deleted' ? 'btn-danger' : 'btn-ghost'}`}
            style={ activeTab==='deleted' ? {} : { color:'var(--red)', borderColor:'rgba(255,77,109,0.3)' }}
            onClick={() => setActiveTab('deleted')}>
            🗑️ हटाए गए ({deleted.length})
          </button>
        </div>

        {activeTab === 'bills' && (
          <>
            {/* Filters */}
            <div className="card" style={{ marginBottom:16 }}>
              <div className="flex gap-12 items-center" style={{ flexWrap:'wrap' }}>
                <input className="form-input" style={{ maxWidth:200 }}
                  placeholder="🔍 Bill नंबर खोजो" value={search}
                  onChange={e => setSearch(e.target.value)} />
                <input type="date" className="form-input" style={{ maxWidth:200 }}
                  value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { setSearch(''); setDateFilter(''); }}>✕ Clear</button>
                <div style={{ marginLeft:'auto', fontSize:14, color:'var(--text-secondary)' }}>
                  {filtered.length} बिल &nbsp;|&nbsp;
                  <strong style={{ color:'var(--green)' }}>{fmt(totalFiltered)}</strong>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading"><div className="spinner"/></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>कोई बिल नहीं मिला</h3>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {filtered.map(bill => <BillRow key={bill.id} bill={bill} />)}
              </div>
            )}
          </>
        )}

        {activeTab === 'deleted' && (
          <>
            {/* Info banner */}
            <div style={{ background:'rgba(255,77,109,0.08)', border:'1px solid rgba(255,77,109,0.2)',
              borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:16, fontSize:13,
              color:'var(--red)' }}>
              ⚠️ ये बिल हटाए गए हैं — Daily/Weekly/Monthly total में नहीं जुड़ते।
              लेकिन record यहाँ हमेशा रहेगा। "वापस" बटन से restore कर सकते हो।
            </div>
            {deleted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>कोई हटाया हुआ बिल नहीं</h3>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {deleted.map(bill => <BillRow key={bill.id} bill={bill} showRestore />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title" style={{ color:'var(--red)' }}>
              🗑️ Bill #{deleteModal.bill_no} हटाएं?
            </div>
            <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:16 }}>
              यह बिल totals से हट जाएगा, लेकिन "हटाए गए" section में दिखता रहेगा।
              आप बाद में वापस ला सकते हो।
            </div>
            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius)',
              padding:'12px 16px', marginBottom:16 }}>
              <strong style={{ color:'var(--green)', fontSize:18 }}>{fmt(deleteModal.total)}</strong>
              &nbsp;&nbsp;
              <span style={{ color:'var(--text-secondary)', fontSize:13 }}>
                {deleteModal.item_count} items
              </span>
            </div>
            <div className="form-group">
              <label className="form-label">हटाने का कारण (optional)</label>
              <input className="form-input" placeholder="जैसे: Duplicate bill, Error..."
                value={deleteNote} onChange={e => setDeleteNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setDeleteModal(null)}>
                रद्द करो
              </button>
              <button className="btn btn-danger" style={{ flex:2 }} onClick={confirmDelete}>
                🗑️ हाँ, हटाओ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
