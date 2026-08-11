import { useState, useEffect } from 'react';
import { getLastNDays, getLast12Months, getTopItems, getDailyStats, todayStr, getBills } from '../lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#00d4aa','#ff7c3d','#ffd166','#60a5fa','#a78bfa','#f87171','#34d399','#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-bright)',
        borderRadius:10, padding:'10px 14px' }}>
        <div style={{ color:'var(--text-secondary)', fontSize:12 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color || 'var(--green)', fontWeight:800, fontSize:15 }}>
            {typeof p.value === 'number' && p.name === 'total'
              ? `₹${p.value.toLocaleString('en-IN')}`
              : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const [view, setView]           = useState('week'); // week | month | year
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData]     = useState([]);
  const [summary, setSummary]     = useState({ total:0, bills:0, avg:0, best:0, bestDay:'' });
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadData(); }, [view]);

  async function loadData() {
    setLoading(true);
    try {
      let data = [];
      if (view === 'week')  data = await getLastNDays(7);
      if (view === 'month') data = await getLastNDays(30);
      if (view === 'year')  data = await getLast12Months();
      setChartData(data);

      // Summary
      const totalSales = data.reduce((s,d) => s + d.total, 0);
      const totalBills = data.reduce((s,d) => s + d.billCount, 0);
      const best = data.reduce((prev, curr) => curr.total > prev.total ? curr : prev, { total:0, label:'' });
      setSummary({
        total:   totalSales,
        bills:   totalBills,
        avg:     totalBills > 0 ? Math.round(totalSales / totalBills) : 0,
        best:    best.total,
        bestDay: best.label,
      });

      // Top items pie chart
      let days = 7;
      if (view === 'month') days = 30;
      if (view === 'year') days = 365;
      
      const items = await getTopItems(days);
      const sorted = items.map(it => ({ name: it.name, value: Math.round(it.revenue) }));
      setPieData(sorted);
    } finally {
      setLoading(false);
    }
  }

  const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;
  const views = [
    { key:'week',  label:'7 दिन' },
    { key:'month', label:'30 दिन' },
    { key:'year',  label:'12 महीने' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>📈 रिपोर्ट</h1>
          <p>कमाई की पूरी जानकारी</p>
        </div>
        <div className="flex gap-8">
          {views.map(v => (
            <button key={v.key}
              className={`btn btn-sm${view === v.key ? ' btn-primary' : ' btn-ghost'}`}
              onClick={() => setView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading"><div className="spinner"/><span>लोड हो रहा है...</span></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="stats-grid" style={{ marginBottom:20 }}>
              <div className="stat-card green">
                <span className="stat-icon">💰</span>
                <div className="stat-value" style={{ fontSize:24 }}>{fmt(summary.total)}</div>
                <div className="stat-label">कुल कमाई</div>
              </div>
              <div className="stat-card orange">
                <span className="stat-icon">🧾</span>
                <div className="stat-value">{summary.bills}</div>
                <div className="stat-label">कुल बिल</div>
              </div>
              <div className="stat-card gold">
                <span className="stat-icon">📊</span>
                <div className="stat-value" style={{ fontSize:24 }}>{fmt(summary.avg)}</div>
                <div className="stat-label">औसत बिल</div>
              </div>
              <div className="stat-card purple">
                <span className="stat-icon">🏆</span>
                <div className="stat-value" style={{ fontSize:24 }}>{fmt(summary.best)}</div>
                <div className="stat-label">Best Day</div>
                <div className="stat-subtext">{summary.bestDay}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="reports-grid" style={{ marginBottom:20 }}>
              {/* Sales bar/line chart */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">📊 कमाई का चार्ट</div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  {view === 'year' ? (
                    <LineChart data={chartData} margin={{ top:5, right:10, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,170,0.08)" />
                      <XAxis dataKey="label" tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="total" stroke="var(--green)" strokeWidth={3}
                        dot={{ fill:'var(--green)', r:4 }} activeDot={{ r:6 }} />
                    </LineChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top:5, right:10, left:0, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,212,170,0.08)" />
                      <XAxis dataKey="label" tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'var(--text-muted)', fontSize:10 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" fill="url(#grad2)" radius={[6,6,0,0]} />
                      <defs>
                        <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00d4aa" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#00a888" stopOpacity={0.5}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">🥧 Top Items (Revenue)</div>
                </div>
                {pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding:40 }}>
                    <div className="empty-state-icon" style={{ fontSize:32 }}>📦</div>
                    <p>डेटा नहीं है</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Data table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">📋 दिन-वार डेटा</div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>तारीख / Date</th>
                      <th>बिल गिनती</th>
                      <th>कुल कमाई</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...chartData].reverse().map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight:600 }}>{d.label}</td>
                        <td>
                          <span className="badge badge-blue">{d.billCount} bills</span>
                        </td>
                        <td style={{ fontWeight:800, color: d.total > 0 ? 'var(--green)' : 'var(--text-muted)', fontSize:15 }}>
                          {fmt(d.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
