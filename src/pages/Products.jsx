import { useState, useEffect } from 'react';
import { getProducts, upsertProduct, deleteProduct } from '../lib/api';
import { useApp } from '../context/AppContext';

const CATS = ['Vegetables', 'Fruits', 'Herbs', 'Other'];
const UNITS = [
  { value: 'kg', label: 'kg (वजन)' },
  { value: 'पेंडी', label: 'पेंडी (गट्ठा/bunch)' },
  { value: 'piece', label: 'Piece (नग)' },
  { value: 'dozen', label: 'Dozen (डझन)' },
];

export default function Products() {
  const { addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [unitFilter, setUnitFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ item_no:'', name:'', name_hindi:'', category:'Vegetables', price:'', unit:'kg', active:true });

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    setLoading(true);
    const all = await getProducts();
    setProducts(all);
    setLoading(false);
  }

  function openAdd() {
    const maxNo = products.reduce((m, p) => Math.max(m, p.item_no), 0);
    setForm({ item_no: maxNo + 1, name:'', name_hindi:'', category:'Vegetables', price:'', unit:'kg', active:true });
    setEditing(null);
    setShowModal(true);
  }

  function openEdit(prod) {
    setForm({ ...prod, price: String(prod.price) });
    setEditing(prod.id);
    setShowModal(true);
  }

  async function saveProduct() {
    if (!form.item_no || !form.name_hindi || form.price === '') {
      addToast('⚠️ सभी जरूरी जानकारी भरो', 'error'); return;
    }
    const data = { ...form, item_no: Number(form.item_no), price: Number(form.price) };
    if (editing) data.id = editing;
    await upsertProduct(data);
    addToast(editing ? '✅ अपडेट हुआ' : '✅ जोड़ा गया', 'success');
    setShowModal(false);
    loadProducts();
  }

  async function toggleActive(prod) {
    await upsertProduct({ ...prod, active: !prod.active });
    loadProducts();
  }

  async function handleDelete(prod) {
    if (!window.confirm(`"${prod.name_hindi}" हटाएं?`)) return;
    await deleteProduct(prod.id);
    addToast('🗑️ हटा दिया', 'info');
    loadProducts();
  }

  const filtered = products.filter(p => {
    const matchCat = catFilter === 'All' || p.category === catFilter;
    const matchUnit = unitFilter === 'All' || p.unit === unitFilter;
    const matchSearch = search === '' ||
      (p.name||'').toLowerCase().includes(search.toLowerCase()) ||
      (p.name_hindi||'').includes(search) ||
      String(p.item_no).includes(search);
    return matchCat && matchUnit && matchSearch;
  });

  const unitBadgeColor = (unit) => {
    if (unit === 'kg') return 'badge-green';
    if (unit === 'पेंडी') return 'badge-orange';
    return 'badge-blue';
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>🥦 सामान लिस्ट</h1>
          <p>Products — रेट और नाम बदलो यहाँ</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ नया सामान</button>
      </div>

      <div className="page-body">
        <div className="card" style={{ marginBottom:16 }}>
          <div className="flex gap-12 items-center" style={{ flexWrap:'wrap' }}>
            <input className="form-input" style={{ maxWidth:220 }}
              placeholder="🔍 नाम या नंबर" value={search}
              onChange={e => setSearch(e.target.value)} />
            <div className="category-filter">
              {['All',...CATS].map(c => (
                <button key={c} className={`cat-btn${catFilter===c?' active':''}`}
                  onClick={() => setCatFilter(c)}>{c==='All'?'सब':c}</button>
              ))}
            </div>
            <div className="category-filter">
              <button className={`cat-btn${unitFilter==='All'?' active':''}`} onClick={()=>setUnitFilter('All')}>सब</button>
              <button className={`cat-btn${unitFilter==='kg'?' active':''}`} onClick={()=>setUnitFilter('kg')}>⚖️ kg</button>
              <button className={`cat-btn${unitFilter==='पेंडी'?' active':''}`} onClick={()=>setUnitFilter('पेंडी')}>🌿 पेंडी</button>
              <button className={`cat-btn${unitFilter==='piece'?' active':''}`} onClick={()=>setUnitFilter('piece')}>🔢 Piece</button>
            </div>
            <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-secondary)' }}>{filtered.length} items</span>
          </div>
        </div>

        {loading ? <div className="loading"><div className="spinner"/></div> : (
          <div className="card" style={{ padding:0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>नाम (मराठी)</th>
                    <th>English</th>
                    <th>Unit</th>
                    <th>रेट (₹)</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(prod => (
                    <tr key={prod.id} style={{ opacity: prod.active ? 1 : 0.4 }}>
                      <td><span style={{ fontWeight:800, color:'var(--green)', fontSize:16 }}>{prod.item_no}</span></td>
                      <td style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontWeight:700, fontSize:15 }}>{prod.name_hindi}</td>
                      <td style={{ color:'var(--text-secondary)' }}>{prod.name}</td>
                      <td><span className={`badge ${unitBadgeColor(prod.unit)}`}>{prod.unit}</span></td>
                      <td>
                        <span style={{ fontWeight:700, color: prod.price > 0 ? 'var(--orange)' : 'var(--text-muted)', fontSize:15 }}>
                          {prod.price > 0 ? `₹${prod.price}` : 'Set करो →'}
                        </span>
                        <span style={{ color:'var(--text-muted)', fontSize:11 }}>/{prod.unit}</span>
                      </td>
                      <td>
                        <button className={`badge ${prod.active ? 'badge-green' : 'badge-red'}`}
                          style={{ cursor:'pointer', border:'none' }}
                          onClick={() => toggleActive(prod)}>
                          {prod.active ? '✓ Active' : '✗ Off'}
                        </button>
                      </td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(prod)}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(prod)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? '✏️ Edit करो' : '➕ नया सामान'}</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Item Number *</label>
                <input className="form-input" type="number" value={form.item_no}
                  onChange={e => setForm(f=>({...f,item_no:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select className="form-select" value={form.unit}
                  onChange={e => setForm(f=>({...f,unit:e.target.value}))}>
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">मराठी नाम *</label>
              <input className="form-input" style={{ fontFamily:"'Noto Sans Devanagari',sans-serif", fontSize:18 }}
                value={form.name_hindi} onChange={e => setForm(f=>({...f,name_hindi:e.target.value}))}
                placeholder="जसे: कांदा, टमाटर..." />
            </div>
            <div className="form-group">
              <label className="form-label">English Name</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(f=>({...f,name:e.target.value}))}
                placeholder="e.g. Onion, Tomato..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">रेट (₹ per {form.unit})</label>
                <input className="form-input" type="number" value={form.price}
                  onChange={e => setForm(f=>({...f,price:e.target.value}))}
                  placeholder="₹ 0" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setShowModal(false)}>रद्द</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={saveProduct}>
                {editing ? '✅ Update' : '➕ जोड़ो'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
