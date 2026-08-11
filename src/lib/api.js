/**
 * OM SHOP — Cloud API
 * All database operations go through here.
 * Uses Supabase (cloud PostgreSQL) as the backend.
 */

import supabase from './supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────
export const todayStr = () => new Date().toISOString().slice(0, 10);

function dateStrNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// BILLS
// ══════════════════════════════════════════════════════════════════════════════

/** Get next bill number */
export async function getNextBillNo() {
  const { data } = await supabase
    .from('bills')
    .select('bill_no')
    .order('bill_no', { ascending: false })
    .limit(1);
  const { data: setting } = await supabase
    .from('settings').select('value').eq('key', 'startBillNo').single();
  const start = setting ? Number(setting.value) : 1000;
  return data?.length ? data[0].bill_no + 1 : start;
}

/** Save a complete bill + its items */
export async function saveBill(items, total) {
  const billNo = await getNextBillNo();
  const { data: bill, error: billErr } = await supabase
    .from('bills')
    .insert({
      bill_no:    billNo,
      date_str:   todayStr(),
      total:      parseFloat(total.toFixed(2)),
      item_count: items.length,
      is_deleted: false,
    })
    .select()
    .single();

  if (billErr) throw billErr;

  const billItems = items.map(it => ({
    bill_id:      bill.id,
    item_no:      it.itemNo,
    item_name:    it.itemName,
    item_name_en: it.itemNameEn || '',
    weight:       it.weight,
    price_per_kg: it.pricePerKg,
    amount:       parseFloat(it.amount.toFixed(2)),
  }));

  const { error: itemErr } = await supabase.from('bill_items').insert(billItems);
  if (itemErr) throw itemErr;

  return { billId: bill.id, billNo };
}

/** Soft-delete a bill (keeps it in DB, just hidden from totals) */
export async function deleteBill(billId, note = '') {
  const { error } = await supabase
    .from('bills')
    .update({ is_deleted: true, deleted_at: new Date().toISOString(), delete_note: note })
    .eq('id', billId);
  if (error) throw error;
}

/** Restore a soft-deleted bill */
export async function restoreBill(billId) {
  const { error } = await supabase
    .from('bills')
    .update({ is_deleted: false, deleted_at: null, delete_note: null })
    .eq('id', billId);
  if (error) throw error;
}

/** Get recent bills (non-deleted) */
export async function getBills({ limit = 100, dateStr = null } = {}) {
  let q = supabase
    .from('bills')
    .select('*')
    .eq('is_deleted', false)
    .order('id', { ascending: false })
    .limit(limit);
  if (dateStr) q = q.eq('date_str', dateStr);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/** Get deleted bills */
export async function getDeletedBills() {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

/** Get items for a specific bill */
export async function getBillItems(billId) {
  const { data, error } = await supabase
    .from('bill_items')
    .select('*')
    .eq('bill_id', billId);
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════════════

/** Stats for a single day */
export async function getDailyStats(dateStr) {
  const { data, error } = await supabase
    .from('bills')
    .select('total')
    .eq('date_str', dateStr)
    .eq('is_deleted', false);
  if (error) return { bills: 0, total: 0 };
  const total = (data || []).reduce((s, b) => s + parseFloat(b.total), 0);
  return { bills: data.length, total };
}

/** Last N days data for chart */
export async function getLastNDays(n = 7) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const { data } = await supabase
      .from('bills')
      .select('total')
      .eq('date_str', dateStr)
      .eq('is_deleted', false);
    const total = (data || []).reduce((s, b) => s + parseFloat(b.total), 0);
    const label = d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short' });
    result.push({ dateStr, label, total, billCount: (data || []).length });
  }
  return result;
}

/** Monthly data for last 12 months */
export async function getLast12Months() {
  const result = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const year  = new Date(now.getFullYear(), now.getMonth() - i, 1).getFullYear();
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1).getMonth() + 1;
    const from  = `${year}-${String(month).padStart(2,'0')}-01`;
    const to    = `${year}-${String(month).padStart(2,'0')}-31`;
    const { data } = await supabase
      .from('bills')
      .select('total')
      .gte('date_str', from)
      .lte('date_str', to)
      .eq('is_deleted', false);
    const total = (data || []).reduce((s, b) => s + parseFloat(b.total), 0);
    const label = new Date(year, month-1, 1).toLocaleDateString('hi-IN', { month:'short', year:'2-digit' });
    result.push({ label, total, billCount: (data || []).length });
  }
  return result;
}

/** Top selling items by revenue */
export async function getTopItems(days = 30) {
  const from = dateStrNDaysAgo(days);
  const { data: bills } = await supabase
    .from('bills')
    .select('id')
    .gte('date_str', from)
    .eq('is_deleted', false);
  if (!bills?.length) return [];

  const { data: items } = await supabase
    .from('bill_items')
    .select('item_name, weight, amount')
    .in('bill_id', bills.map(b => b.id));

  const map = {};
  for (const it of (items || [])) {
    if (!map[it.item_name]) map[it.item_name] = { name: it.item_name, qty: 0, revenue: 0 };
    map[it.item_name].qty     += parseFloat(it.weight || 0);
    map[it.item_name].revenue += parseFloat(it.amount || 0);
  }
  return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0, 8);
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export async function getProducts(activeOnly = false) {
  let q = supabase.from('products').select('*').order('item_no');
  if (activeOnly) q = q.eq('active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function upsertProduct(product) {
  const { error } = await supabase.from('products').upsert(product, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════════════════════
// FARMER PURCHASES
// ══════════════════════════════════════════════════════════════════════════════

export async function savePurchase(farmerName, dateStr, items, totalCost) {
  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({ farmer_name: farmerName, date_str: dateStr, total_cost: totalCost })
    .select().single();
  if (error) throw error;

  await supabase.from('purchase_items').insert(
    items.map(it => ({ purchase_id: purchase.id, ...it }))
  );
  return purchase;
}

export async function getPurchases(limit = 100) {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getPurchaseItems(purchaseId) {
  const { data, error } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', purchaseId);
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

export async function getSetting(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single();
  return data?.value || null;
}

export async function setSetting(key, value) {
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
}

// ══════════════════════════════════════════════════════════════════════════════
// REAL-TIME SUBSCRIPTION
// Subscribe to new bills coming in (from scale bridge)
// ══════════════════════════════════════════════════════════════════════════════
export function subscribeToBills(callback) {
  return supabase
    .channel('bills-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bills' }, callback)
    .subscribe();
}
