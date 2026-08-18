/**
 * OM SHOP — Scale Bridge v2
 * Sharp RKS-35 RS232 → Supabase Cloud DB
 *
 * What this does:
 *   1. Opens serial port (COM3 by default, change in config.json)
 *   2. Reads billing data from scale when PRINT is pressed
 *   3. Saves bill to Supabase cloud database automatically
 *   4. The web app on any phone/PC refreshes automatically
 *   5. Logs everything to bridge.log for debugging
 */

const { SerialPort }     = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { WebSocketServer }= require('ws');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const cfgPath = path.join(__dirname, 'config.json');
const cfg     = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const LOG     = path.join(__dirname, 'bridge.log');

// ── Logging ──────────────────────────────────────────────────────────────────
function log(msg) {
  const ts = new Date().toLocaleString('en-IN');
  const line = `[${ts}] ${msg}`;
  console.log(line);
  if (cfg.logRawData) {
    try { fs.appendFileSync(LOG, line + '\n'); } catch(_) {}
  }
}

// ── Supabase REST API ─────────────────────────────────────────────────────────
const SUPABASE_URL = cfg.supabaseUrl;
const SUPABASE_KEY = cfg.supabaseKey;

async function supabasePost(table, data) {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    log('⚠️  Supabase not configured — update config.json with URL and key');
    return null;
  }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url  = new URL(`/rest/v1/${table}`, SUPABASE_URL);

    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey':         SUPABASE_KEY,
        'Authorization':  `Bearer ${SUPABASE_KEY}`,
        'Prefer':         'return=representation',
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try   { resolve(JSON.parse(raw)); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function supabaseGet(table, params = '') {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;

  return new Promise((resolve, reject) => {
    const url = new URL(`/rest/v1/${table}?${params}`, SUPABASE_URL);

    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'GET',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try   { resolve(JSON.parse(raw)); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getNextBillNo() {
  const rows = await supabaseGet('bills', 'select=bill_no&order=bill_no.desc&limit=1');
  const settings = await supabaseGet('settings', 'select=value&key=eq.startBillNo');
  const start = settings?.[0]?.value ? Number(settings[0].value) : 1000;
  return rows?.length ? rows[0].bill_no + 1 : start;
}

async function saveBillToCloud(parsedBill) {
  try {
    const billNo   = await getNextBillNo();
    const today    = new Date().toISOString().slice(0, 10);
    const { items, total } = parsedBill;

    // Insert bill
    const bills = await supabasePost('bills', {
      bill_no:    billNo,
      date_str:   today,
      total:      parseFloat(total.toFixed(2)),
      item_count: items.length,
      is_deleted: false,
    });

    if (!bills || !bills[0]) {
      log('❌ Failed to save bill to Supabase');
      return;
    }

    const billId = bills[0].id;

    // Insert items
    for (const it of items) {
      await supabasePost('bill_items', {
        bill_id:      billId,
        item_no:      it.itemNo  || 0,
        item_name:    it.name    || `Item #${it.itemNo}`,
        item_name_en: it.nameEn  || '',
        weight:       it.weight,
        price_per_kg: it.rate,
        amount:       parseFloat(it.amount.toFixed(2)),
      });
    }

    log(`✅ Bill #${billNo} saved to cloud — ${items.length} items, ₹${total}`);

    // Also broadcast to any local web app via WebSocket
    broadcast({ type:'SCALE_BILL', items, total, billNo });

  } catch (err) {
    log(`❌ Supabase error: ${err.message}`);
  }
}

// ── WebSocket (for local web app if running simultaneously) ──────────────────
const wss = new WebSocketServer({ port: cfg.wsPort });
const clients = new Set();
let portOpen = false; // track real port status

wss.on('connection', (ws) => {
  clients.add(ws);
  log(`🌐 Web app connected locally (${clients.size} clients)`);

  // Immediately tell new client the current port status (fixes race condition)
  try {
    ws.send(JSON.stringify({
      type: portOpen ? 'SCALE_CONNECTED' : 'SCALE_DISCONNECTED',
      port: cfg.comPort,
    }));
  } catch (_) {}

  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(obj) {
  const str = JSON.stringify(obj);
  for (const ws of clients) {
    try { ws.send(str); } catch (_) { clients.delete(ws); }
  }
}

// ── Bill Buffer ───────────────────────────────────────────────────────────────
let billBuffer = [];
let billTimer  = null;

function flushBill() {
  if (billBuffer.length === 0) return;
  const snapshot = [...billBuffer];
  billBuffer = [];
  log(`📦 Processing bill (${snapshot.length} lines)...`);
  const parsed = parseBill(snapshot);
  if (parsed) saveBillToCloud(parsed);
}

function resetBillTimer() {
  if (billTimer) clearTimeout(billTimer);
  billTimer = setTimeout(flushBill, 2000); // wait 2s after last line
}

// ── Data Parser ───────────────────────────────────────────────────────────────
// Sharp RKS-35 sends ASCII data when PRINT is pressed.
// This parser handles multiple common formats from Indian billing scales.

function parseBill(lines) {
  const items = [];
  let total = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 3) continue;
    log(`  LINE: "${line}"`);

    // Skip obvious headers/footers
    if (/thank|welcome|shop|address|total bill|grand/i.test(line)) {
      // Try to extract total
      const nums = line.match(/\d+\.?\d*/g);
      if (/total/i.test(line) && nums) total = parseFloat(nums[nums.length-1]);
      continue;
    }

    const nums = line.match(/\d+\.?\d*/g);
    if (!nums || nums.length < 2) continue;
    const n = nums.map(Number);

    // ── Strategy 1: 4 numbers = itemNo, weight, rate, amount ────────────────
    if (n.length >= 4) {
      for (let s = 0; s <= n.length - 4; s++) {
        const [itemNo, weight, rate, amount] = [n[s], n[s+1], n[s+2], n[s+3]];
        const expected = weight * rate;
        if (
          itemNo >= 1 && itemNo <= 999 &&
          weight > 0.01 && weight < 200 &&
          rate > 0 && rate < 5000 &&
          Math.abs(expected - amount) / Math.max(expected, 0.01) < 0.15
        ) {
          items.push({ itemNo, weight, rate, amount: parseFloat(amount.toFixed(2)) });
          break;
        }
      }
      continue;
    }

    // ── Strategy 2: 3 numbers = weight, rate, amount (no item no) ───────────
    if (n.length === 3) {
      const [weight, rate, amount] = n;
      const expected = weight * rate;
      if (
        weight > 0.01 && weight < 200 &&
        rate > 0 && rate < 5000 &&
        Math.abs(expected - amount) / Math.max(expected, 0.01) < 0.15
      ) {
        items.push({
          itemNo: items.length + 1,
          weight, rate,
          amount: parseFloat(amount.toFixed(2))
        });
        continue;
      }
    }

    // ── Strategy 3: just weight (continuous output) ──────────────────────────
    if (n.length === 1 && n[0] > 0 && n[0] < 200) {
      broadcast({ type: 'SCALE_WEIGHT', weight: n[0] });
    }
  }

  if (items.length === 0) {
    log('  ⚠️  No items parsed — sending raw data for debugging');
    broadcast({ type: 'SCALE_RAW', lines });
    return null;
  }

  if (!total) total = parseFloat(items.reduce((s, i) => s + i.amount, 0).toFixed(2));
  return { items, total };
}

// ── Serial Port ───────────────────────────────────────────────────────────────
function openSerialPort() {
  log(`🔌 Opening ${cfg.comPort} @ ${cfg.baudRate} baud (8N1)...`);

  let port;
  try {
    port = new SerialPort({
      path: cfg.comPort, baudRate: cfg.baudRate,
      dataBits: cfg.dataBits, parity: cfg.parity, stopBits: cfg.stopBits,
    });
  } catch (err) {
    log(`❌ Cannot open port: ${err.message}`);
    log('   → Edit config.json → change "comPort" to your port (e.g. COM3, COM4)');
    setTimeout(openSerialPort, 5000);
    return;
  }

  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

  port.on('open', () => {
    portOpen = true;
    log(`✅ Port ${cfg.comPort} opened! Waiting for scale data...`);
    broadcast({ type: 'SCALE_CONNECTED', port: cfg.comPort });
  });

  parser.on('data', (line) => {
    const t = line.trim();
    if (!t) return;
    log(`📡 RECEIVED: "${t}"`);
    billBuffer.push(t);
    resetBillTimer();
  });

  port.on('error', (err) => {
    portOpen = false;
    log(`❌ Port error: ${err.message}`);
    broadcast({ type: 'SCALE_DISCONNECTED' });
    setTimeout(openSerialPort, 5000);
  });

  port.on('close', () => {
    portOpen = false;
    log('⚠️  Port closed — reconnecting in 5s...');
    broadcast({ type: 'SCALE_DISCONNECTED' });
    setTimeout(openSerialPort, 5000);
  });
}

// ── List Ports ────────────────────────────────────────────────────────────────
async function listPorts() {
  log('\n📋 Available COM Ports:');
  try {
    const ports = await SerialPort.list();
    if (!ports.length) log('   (none — plug in the USB cable first!)');
    else ports.forEach(p => log(`   ${p.path}  ${p.manufacturer || ''}`));
    log('   Edit config.json to change comPort\n');
  } catch (e) {
    log('   Error: ' + e.message);
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────
log('');
log('╔══════════════════════════════════════════════╗');
log('║   OM SHOP — Scale Bridge v2 (Cloud Edition) ║');
log('║   Sharp RKS-35 → RS232 → Supabase Cloud     ║');
log('╚══════════════════════════════════════════════╝');
log('');
log(SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL'
  ? `✅ Supabase: ${SUPABASE_URL}`
  : '❌ Supabase NOT configured — bills will NOT be saved to cloud!');
log(`🌐 WebSocket local: ws://localhost:${cfg.wsPort}`);
log('');

listPorts().then(() => openSerialPort());
