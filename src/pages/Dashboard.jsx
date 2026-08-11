import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyStats, getLastNDays, getBills, getTopItems, todayStr, subscribeToBills } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const fmt = n => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-bright)', borderRadius:10, padding:'10px 14px' }}>
      <div style={{ color:'var(--text-secondary)', fontSize:12 }}>{label}</div>
      <div style={{ color:'var(--green)', fontWeight:800, fontSize:16 }}>{fmt(payload[0].value)}</div>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [todayStats, setTodayStats]   = useState({ bills:0, total:0 });
  const [weekStats,  setWeekStats]    = useState({ bills:0, total:0 });
  const [monthStats, setMonthStats]   = useState({ bills:0, total:0 });
  const [chartData,  setChartData]    = useState([]);
  const [recentBills,setRecentBills]  = useState([]);
  const [topItems,   setTopItems]     = useState([]);
  const [loading,    setLoading]      = useState(true);
  const today = todayStr();

  useEffect(() => {
    loadAll();
    // Real-time: refresh when new bill arrives from scale
    const sub = subscribeToBills(() => loadAll());
    return () => sub.unsubscribe();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [td, chart, recent, top] = await Promise.all([
        getDailyStats(today),
        getLastNDays(7),
        getBills({ limit: 5 }),
        getTopItems(30),
      ]);
      setTodayStats(td);
      setChartData(chart);
      setRecentBills(recent);
      setTopItems(top);

      // Week & month totals
      const [weekDays, monthDays] = await Promise.all([getLastNDays(7), getLastNDays(30)]);
      setWeekStats({
        bills: weekDays.reduce((s,d) => s+d.billCount, 0),
        total: weekDays.reduce((s,d) => s+d.total, 0),
      });
      setMonthStats({
        bills: monthDays.reduce((s,d) => s+d.billCount, 0),
        total: monthDays.reduce((s,d) => s+d.total, 0),
      });
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>🌿 नमस्ते! {greeting} 🙏</h1>
          <p style={{ fontFamily:"'Noto Sans Devanagari',sans-serif" }}>
            {now.toLocaleDateString('hi-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            &nbsp;•&nbsp; {now.toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' })}
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/billing')}>
          ➕ नया बिल बनाओ
        </button>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>लोड हो रहा है...</span></div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card green">
                <span className="stat-icon">💰</span>
                <div className="stat-value">{fmt(todayStats.total)}</div>
                <div className="stat-label">आज की कमाई</div>
                <div className="stat-subtext">🧾 {todayStats.bills} बिल आज</div>
              </div>
              <div className="stat-card orange">
                <span className="stat-icon">📅</span>
                <div className="stat-value">{fmt(weekStats.total)}</div>
                <div className="stat-label">इस हफ्ते</div>
                <div className="stat-subtext">🧾 {weekStats.bills} बिल</div>
              </div>
              <div className="stat-card gold">
                <span className="stat-icon">🗓️</span>
                <div className="stat-value">{fmt(monthStats.total)}</div>
                <div className="stat-label">इस महीने</div>
                <div className="stat-subtext">🧾 {monthStats.bills} बिल</div>
              </div>
              <div className="stat-card blue">
                <span className="stat-icon">📊</span>
                <div className="stat-value">
                  {todayStats.bills > 0 ? fmt(Math.round(todayStats.total / todayStats.bills)) : '₹0'}
                </div>
                <div className="stat-label">औसत बिल</div>
                <div className="stat-subtext">आज का Average</div>
              </div>
            </div>

            {/* Chart + Top Items */}
            <div className="grid-2" style={{ marginBottom:20 }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">📈 पिछले 7 दिन की कमाई</div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,170,0.08)" />
                    <XAxis dataKey="label" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="url(#barGrad)" radius={[6,6,0,0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--green)" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="var(--green-dark)" stopOpacity={0.5}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">🏆 Top 5 सामान (इस महीने)</div>
                </div>
                {topItems.length === 0 ? (
                  <div className="empty-state" style={{ padding:'20px' }}>
                    <div className="empty-state-icon" style={{ fontSize:28 }}>📦</div>
                    <p>अभी कोई बिक्री नहीं</p>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {topItems.slice(0,5).map((item,i) => {
                      const pct = topItems[0].revenue > 0 ? (item.revenue / topItems[0].revenue)*100 : 0;
                      return (
                        <div key={item.name}>
                          <div className="flex justify-between items-center" style={{ marginBottom:4 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)',
                              fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{i+1}. {item.name}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--green)' }}>{fmt(item.revenue)}</span>
                          </div>
                          <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${pct}%`,
                              background:'linear-gradient(90deg, var(--green), var(--green-dark))',
                              borderRadius:3, transition:'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Bills */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">🧾 हाल के बिल</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>सब देखो →</button>
              </div>
              {recentBills.length === 0 ? (
                <div className="empty-state" style={{ padding:'30px 20px' }}>
                  <div className="empty-state-icon" style={{ fontSize:32 }}>🧾</div>
                  <p>कोई बिल नहीं बना अभी तक</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>बिल नं.</th><th>तारीख</th><th>सामान</th><th>कुल रकम</th></tr></thead>
                    <tbody>
                      {recentBills.map(b => (
                        <tr key={b.id}>
                          <td><span className="badge badge-green">#{b.bill_no}</span></td>
                          <td style={{ color:'var(--text-secondary)', fontSize:13 }}>
                            {new Date(b.date).toLocaleTimeString('hi-IN', { hour:'2-digit', minute:'2-digit' })}
                          </td>
                          <td style={{ color:'var(--text-secondary)' }}>{b.item_count} चीज़ें</td>
                          <td style={{ fontWeight:800, color:'var(--green)', fontSize:16 }}>{fmt(b.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
