import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../lib/api';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { scaleConnected, addToast } = useApp();
  const [startBillNo, setStartBillNo] = useState('1000');
  const [shopName, setShopName]       = useState('OM SHOP');
  const [shopAddress, setShopAddress] = useState('');
  const [bridgePort, setBridgePort]   = useState('3001');

  useEffect(() => {
    async function loadSettings() {
      setStartBillNo(await getSetting('startBillNo') || '1000');
      setShopName(await getSetting('shopName') || 'POORVA SHOP');
      setShopAddress(await getSetting('shopAddress') || '');
      setBridgePort(await getSetting('bridgePort') || '3001');
    }
    loadSettings();
  }, []);

  async function saveSetting(key, value) {
    await setSetting(key, value);
  }

  async function saveAll() {
    await saveSetting('startBillNo', startBillNo);
    await saveSetting('shopName', shopName);
    await saveSetting('shopAddress', shopAddress);
    await saveSetting('bridgePort', bridgePort);
    addToast('✅ Settings सेव हुई', 'success');
  }

  async function clearAllData() {
    if (!window.confirm('⚠️ सारा डेटा हटाना चाहते हो? यह वापस नहीं आएगा!')) return;
    if (!window.confirm('क्या आप सच में sure हो?')) return;
    addToast('⚠️ क्लाउड डेटा हटाने के लिए एडमिन से संपर्क करें', 'info');
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>⚙️ Settings</h1>
          <p>दुकान की सेटिंग्स</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 600, display:'flex', flexDirection:'column', gap:20 }}>

          {/* Shop Info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>🏪 दुकान की जानकारी</div>
            <div className="form-group">
              <label className="form-label">दुकान का नाम</label>
              <input className="form-input" value={shopName}
                onChange={e => setShopName(e.target.value)} placeholder="OM SHOP" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">पता (Address — बिल पर आएगा)</label>
              <input className="form-input" value={shopAddress}
                onChange={e => setShopAddress(e.target.value)}
                placeholder="Pune, Maharashtra" />
            </div>
          </div>

          {/* Bill Settings */}
          <div className="card">
            <div className="card-title" style={{ marginBottom:16 }}>🧾 Bill Settings</div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">पहला Bill नंबर</label>
              <input className="form-input" style={{ maxWidth:200 }} type="number"
                value={startBillNo}
                onChange={e => setStartBillNo(e.target.value)} />
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                नए सिरे से शुरू करना हो तो यहाँ बदलो
              </div>
            </div>
          </div>

          {/* Scale / Bridge */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚖️ Scale Bridge Settings</div>
              <span className={`badge ${scaleConnected ? 'badge-green' : 'badge-red'}`}>
                {scaleConnected ? '✓ Connected' : '✗ Not Connected'}
              </span>
            </div>

            <div style={{ background:'var(--bg-elevated)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:16,
              border:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.8 }}>
              <div style={{ fontWeight:700, color:'var(--green)', marginBottom:6 }}>🔌 Scale कैसे जोड़ें?</div>
              <ol style={{ paddingLeft:20 }}>
                <li>Scale के पीछे <strong>RS232 या USB port</strong> देखो</li>
                <li>अगर RS232 है तो <strong>RS232-to-USB adapter</strong> (₹150 Amazon) खरीदो</li>
                <li>Cable PC में लगाओ</li>
                <li><strong>bridge.js</strong> script चलाओ (अलग से मिलेगा)</li>
                <li>Bridge शुरू होने पर यहाँ <span style={{ color:'var(--green)' }}>Connected</span> दिखेगा</li>
              </ol>
            </div>

            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Bridge Port (default: 3001)</label>
              <input className="form-input" style={{ maxWidth:200 }} type="number"
                value={bridgePort} onChange={e => setBridgePort(e.target.value)} />
            </div>
          </div>

          {/* Save */}
          <button className="btn btn-primary btn-lg" onClick={saveAll}>
            💾 Settings Save करो
          </button>

          {/* Danger Zone */}
          <div className="card" style={{ borderColor:'rgba(255,77,109,0.3)' }}>
            <div className="card-title" style={{ color:'var(--red)', marginBottom:12 }}>
              ⚠️ Danger Zone
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
              नीचे का बटन दबाने से सारे बिल और किसान रिकॉर्ड हट जाएंगे। Products सुरक्षित रहेंगे।
            </p>
            <button className="btn btn-danger" onClick={clearAllData}>
              🗑️ सारा डेटा हटाओ (Danger!)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
