import { useState, useEffect } from 'react';
import {
  getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getActivityLogs, getErrorLogs, markErrorResolved, getEmployeeStats,
  logActivity, hashPassword,
} from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'employees', label: '👥 Employees', icon: '👥' },
  { id: 'activity',  label: '📋 Activity Log', icon: '📋' },
  { id: 'errors',    label: '🐛 Error Log', icon: '🐛' },
  { id: 'stats',     label: '📊 Stats', icon: '📊' },
];

const AVATARS = ['🧑', '👩', '👨', '🧑‍💼', '👩‍💼', '👨‍💼', '🧑‍🌾', '👩‍🌾', '👨‍🌾', '⭐', '🌟', '💫'];

export default function Admin() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [tab, setTab]                 = useState('employees');
  const [employees, setEmployees]     = useState([]);
  const [activityLogs, setActivity]   = useState([]);
  const [errorLogs, setErrors]        = useState([]);
  const [stats, setStats]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editingEmp, setEditingEmp]   = useState(null);
  const [actFilter, setActFilter]     = useState('all');
  const [form, setForm] = useState({
    name:'', username:'', password:'', role:'employee', phone:'', avatar:'🧑'
  });
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/'); return; }
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [emps, acts, errs, sts] = await Promise.all([
      getEmployees(), getActivityLogs({ limit: 200 }),
      getErrorLogs(200), getEmployeeStats(),
    ]);
    setEmployees(emps);
    setActivity(acts);
    setErrors(errs);
    setStats(sts);
    setLoading(false);
  }

  function openAdd() {
    setEditingEmp(null);
    setForm({ name:'', username:'', password:'', role:'employee', phone:'', avatar:'🧑' });
    setFormErr('');
    setShowModal(true);
  }

  function openEdit(emp) {
    setEditingEmp(emp);
    setForm({ name: emp.name, username: emp.username, password:'', role: emp.role, phone: emp.phone||'', avatar: emp.avatar||'🧑' });
    setFormErr('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.username) { setFormErr('Name और Username जरूरी है'); return; }
    if (!editingEmp && !form.password) { setFormErr('Password जरूरी है'); return; }
    if (form.password && form.password.length < 4) { setFormErr('Password कम से कम 4 अक्षर'); return; }
    setSaving(true);
    setFormErr('');
    try {
      if (editingEmp) {
        const updates = { name: form.name, role: form.role, phone: form.phone, avatar: form.avatar };
        if (form.password) updates.password = form.password;
        await updateEmployee(editingEmp.id, updates);
        await logActivity(user, 'UPDATE_EMPLOYEE', `Updated employee: ${form.name}`);
      } else {
        await createEmployee(form);
        await logActivity(user, 'CREATE_EMPLOYEE', `Created employee: ${form.name} (${form.role})`);
      }
      setShowModal(false);
      await loadAll();
    } catch (e) {
      setFormErr(e.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(emp) {
    if (emp.id === user.id) { alert("अपने आप को delete नहीं कर सकते!"); return; }
    if (!window.confirm(`"${emp.name}" को delete करें?`)) return;
    await deleteEmployee(emp.id);
    await logActivity(user, 'DELETE_EMPLOYEE', `Deleted employee: ${emp.name}`);
    await loadAll();
  }

  async function toggleActive(emp) {
    if (emp.id === user.id) { alert("खुद को deactivate नहीं कर सकते!"); return; }
    await updateEmployee(emp.id, { active: !emp.active });
    await loadAll();
  }

  async function handleResolveError(id) {
    await markErrorResolved(id);
    setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: true } : e));
  }

  const filteredActivity = actFilter === 'all'
    ? activityLogs
    : activityLogs.filter(a => String(a.employee_id) === actFilter);

  const actionColor = (action) => {
    if (action.includes('BILL'))    return '#00D4AA';
    if (action.includes('DELETE'))  return '#FF4D6D';
    if (action.includes('LOGIN'))   return '#6366f1';
    if (action.includes('UPDATE'))  return '#F97316';
    return 'var(--text-secondary)';
  };

  const unresolvedErrors = errorLogs.filter(e => !e.resolved).length;

  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <p>Loading Admin Panel...</p>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>⚙️ Admin Panel</h1>
          <p>Shop management — employees, activity, errors</p>
        </div>
        {tab === 'employees' && (
          <button className="btn btn-primary" onClick={openAdd}>👤 New Employee</button>
        )}
      </div>

      <div className="page-body">
        {/* Tab Bar */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
              {t.id === 'errors' && unresolvedErrors > 0 && (
                <span className="admin-badge">{unresolvedErrors}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── EMPLOYEES TAB ── */}
        {tab === 'employees' && (
          <div className="admin-grid">
            {employees.map(emp => (
              <div key={emp.id} className={`emp-card${emp.active ? '' : ' inactive'}`}>
                <div className="emp-card-header">
                  <div className="emp-avatar">{emp.avatar}</div>
                  <div className="emp-badges">
                    <span className={`badge ${emp.role === 'admin' ? 'badge-orange' : 'badge-blue'}`}>
                      {emp.role === 'admin' ? '👑 Admin' : '👤 Employee'}
                    </span>
                    <span className={`badge ${emp.active ? 'badge-green' : 'badge-red'}`}>
                      {emp.active ? '✓ Active' : '✗ Off'}
                    </span>
                  </div>
                </div>
                <div className="emp-name">{emp.name}</div>
                <div className="emp-username">@{emp.username}</div>
                {emp.phone && <div className="emp-phone">📞 {emp.phone}</div>}
                <div className="emp-meta">
                  <span>📅 {emp.join_date}</span>
                  {emp.last_login && (
                    <span>🕐 {new Date(emp.last_login).toLocaleDateString('en-IN')}</span>
                  )}
                </div>
                {/* Stats for this employee */}
                {stats[emp.id] && (
                  <div className="emp-stats">
                    <div className="emp-stat">
                      <div className="emp-stat-val">{stats[emp.id].bills}</div>
                      <div className="emp-stat-label">Bills</div>
                    </div>
                    <div className="emp-stat">
                      <div className="emp-stat-val">₹{stats[emp.id].total.toFixed(0)}</div>
                      <div className="emp-stat-label">Sales</div>
                    </div>
                  </div>
                )}
                <div className="emp-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(emp)}>✏️ Edit</button>
                  <button
                    className={`btn btn-sm ${emp.active ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => toggleActive(emp)}
                    disabled={emp.id === user.id}
                  >
                    {emp.active ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(emp)}
                    disabled={emp.id === user.id}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {tab === 'activity' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>📋 Activity Log</span>
              <select
                className="form-select"
                style={{ maxWidth: 200 }}
                value={actFilter}
                onChange={e => setActFilter(e.target.value)}
              >
                <option value="all">All Employees</option>
                {employees.map(e => (
                  <option key={e.id} value={String(e.id)}>{e.name}</option>
                ))}
              </select>
              <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-muted)' }}>
                {filteredActivity.length} records
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Employee</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Page</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontWeight:700 }}>{log.employee_name}</span>
                      </td>
                      <td>
                        <span style={{ color: actionColor(log.action), fontWeight:700, fontSize:12 }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize:13, maxWidth:250 }}>{log.details}</td>
                      <td style={{ color:'var(--orange)', fontWeight:700 }}>
                        {log.amount ? `₹${log.amount}` : '—'}
                      </td>
                      <td style={{ fontSize:11, color:'var(--text-muted)' }}>{log.page}</td>
                    </tr>
                  ))}
                  {filteredActivity.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ERRORS TAB ── */}
        {tab === 'errors' && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>🐛 Error Log</span>
              <span className="badge badge-red">{unresolvedErrors} unresolved</span>
              <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-muted)' }}>{errorLogs.length} total</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Employee</th>
                    <th>Error</th>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map(err => (
                    <tr key={err.id} style={{ opacity: err.resolved ? 0.5 : 1 }}>
                      <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {new Date(err.created_at).toLocaleString('en-IN')}
                      </td>
                      <td><span style={{ fontWeight:700 }}>{err.employee_name || '—'}</span></td>
                      <td>
                        <div style={{ fontSize:12, color:'#FF4D6D', fontWeight:700 }}>{err.error_type}</div>
                        <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{err.error_message}</div>
                      </td>
                      <td style={{ fontSize:11 }}>{err.page_url}</td>
                      <td>
                        <span className={`badge ${err.resolved ? 'badge-green' : 'badge-red'}`}>
                          {err.resolved ? '✓ Fixed' : '⚠ Open'}
                        </span>
                      </td>
                      <td>
                        {!err.resolved && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleResolveError(err.id)}>
                            ✓ Mark Fixed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {errorLogs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>🎉 No errors! All good</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === 'stats' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:24 }}>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:32 }}>👥</div>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--green)' }}>{employees.length}</div>
                <div style={{ color:'var(--text-muted)' }}>Total Employees</div>
              </div>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:32 }}>✅</div>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--green)' }}>{employees.filter(e=>e.active).length}</div>
                <div style={{ color:'var(--text-muted)' }}>Active</div>
              </div>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:32 }}>📋</div>
                <div style={{ fontSize:28, fontWeight:900, color:'var(--orange)' }}>{activityLogs.length}</div>
                <div style={{ color:'var(--text-muted)' }}>Total Actions</div>
              </div>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:32 }}>🐛</div>
                <div style={{ fontSize:28, fontWeight:900, color: unresolvedErrors > 0 ? '#FF4D6D' : 'var(--green)' }}>
                  {unresolvedErrors}
                </div>
                <div style={{ color:'var(--text-muted)' }}>Open Errors</div>
              </div>
            </div>

            <h3 style={{ marginBottom:16, color:'var(--text-secondary)' }}>📊 Per Employee Sales</h3>
            <div className="admin-grid">
              {employees.map(emp => {
                const s = stats[emp.id] || { bills: 0, total: 0 };
                return (
                  <div key={emp.id} className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontSize:36, marginBottom:8 }}>{emp.avatar}</div>
                    <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>{emp.name}</div>
                    <div style={{ color:'var(--text-muted)', fontSize:12, marginBottom:12 }}>@{emp.username} · {emp.role}</div>
                    <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
                      <div>
                        <div style={{ fontSize:22, fontWeight:900, color:'var(--green)' }}>{s.bills}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Bills</div>
                      </div>
                      <div>
                        <div style={{ fontSize:22, fontWeight:900, color:'var(--orange)' }}>₹{s.total.toFixed(0)}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Sales</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Employee Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {editingEmp ? '✏️ Edit Employee' : '👤 New Employee'}
            </div>

            {/* Avatar picker */}
            <div className="form-group">
              <label className="form-label">Avatar</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {AVATARS.map(av => (
                  <button
                    key={av} type="button"
                    style={{
                      fontSize:24, background: form.avatar === av ? 'var(--green-glow)' : 'var(--bg-elevated)',
                      border: form.avatar === av ? '2px solid var(--green)' : '2px solid transparent',
                      borderRadius:8, padding:'4px 6px', cursor:'pointer',
                    }}
                    onClick={() => setForm(f => ({ ...f, avatar: av }))}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name}
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder="Ramesh Kumar" />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" value={form.username}
                  onChange={e => setForm(f => ({...f, username: e.target.value.toLowerCase()}))}
                  placeholder="ramesh" disabled={!!editingEmp} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password {editingEmp ? '(blank = no change)' : '*'}</label>
                <input className="form-input" type="password" value={form.password}
                  onChange={e => setForm(f => ({...f, password: e.target.value}))}
                  placeholder={editingEmp ? '(leave blank)' : 'Min 4 chars'} />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={form.role}
                  onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                  <option value="employee">👤 Employee</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-input" value={form.phone}
                onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                placeholder="9876543210" />
            </div>

            {formErr && <div className="login-error">{formErr}</div>}

            <div className="modal-actions">
              <button className="btn btn-ghost" style={{flex:1}} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving...' : (editingEmp ? '✅ Update' : '✅ Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
