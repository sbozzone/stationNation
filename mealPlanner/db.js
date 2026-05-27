// ═══════════════════════════════════════════════════════════════
// Family Dinner Time — Supabase Data Layer
//
// Column mapping (existing DB → app):
//   pantry_items.quantity  → displayed as qty in app
//   shopping_items.is_checked → displayed as checked_off in app
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Families ──────────────────────────────────────────────────

export async function getFamilyByCode(code) {
  const { data, error } = await supabase
    .from('families').select('*').eq('code', code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createFamily(code, name) {
  const { data, error } = await supabase
    .from('families').insert({ code, name }).select().single();
  if (error) throw error;
  return data;
}

// ─── Dishes ────────────────────────────────────────────────────

export async function getDishes(familyId) {
  const { data, error } = await supabase
    .from('dishes').select('*').eq('family_id', familyId).order('name');
  if (error) throw error;
  return data || [];
}

export async function upsertDish(dish) {
  const { id, ...rest } = dish;
  if (id) {
    const { data, error } = await supabase
      .from('dishes').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('dishes').insert(rest).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDish(id) {
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Meal Plan ─────────────────────────────────────────────────

export async function getMealPlanRange(familyId, startDate, endDate) {
  const { data, error } = await supabase
    .from('meal_plan_days').select('*')
    .eq('family_id', familyId).gte('date', startDate).lte('date', endDate);
  if (error) throw error;
  return data || [];
}

export async function saveMealPlanDay(familyId, date, dishes) {
  const { data, error } = await supabase
    .from('meal_plan_days')
    .upsert({ family_id: familyId, date, dishes }, { onConflict: 'family_id,date' })
    .select().single();
  if (error) throw error;
  return data;
}

export async function clearMealPlanRange(familyId, startDate, endDate) {
  const { error } = await supabase
    .from('meal_plan_days').delete()
    .eq('family_id', familyId).gte('date', startDate).lte('date', endDate);
  if (error) throw error;
}

// ─── Day Activities ────────────────────────────────────────────

export async function getActivitiesRange(familyId, startDate, endDate) {
  const { data, error } = await supabase
    .from('day_activities').select('*')
    .eq('family_id', familyId).gte('date', startDate).lte('date', endDate)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertActivity(familyId, date, text, impactType) {
  const { data, error } = await supabase
    .from('day_activities')
    .insert({ family_id: familyId, date, text, impact_type: impactType })
    .select().single();
  if (error) throw error;
  return data;
}

export async function deleteActivity(id) {
  const { error } = await supabase.from('day_activities').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pantry ────────────────────────────────────────────────────
// DB column: "quantity" — app treats it as "qty"

export async function getPantry(familyId) {
  const { data, error } = await supabase
    .from('pantry_items').select('*').eq('family_id', familyId).order('name');
  if (error) throw error;
  // Normalize: expose quantity as qty for app consistency
  return (data || []).map(normalPantry);
}

export async function upsertPantryItem(item) {
  const { id, qty, ...rest } = item;
  const dbItem = { ...rest, quantity: qty ?? 0 };
  dbItem.updated_at = new Date().toISOString();
  if (id) {
    const { data, error } = await supabase
      .from('pantry_items').update(dbItem).eq('id', id).select().single();
    if (error) throw error;
    return normalPantry(data);
  }
  const { data, error } = await supabase
    .from('pantry_items').insert(dbItem).select().single();
  if (error) throw error;
  return normalPantry(data);
}

export async function adjustPantryQty(id, delta) {
  const { data: item } = await supabase
    .from('pantry_items').select('quantity').eq('id', id).single();
  const newQty = Math.max(0, (parseFloat(item?.quantity) || 0) + delta);
  const { data, error } = await supabase
    .from('pantry_items')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return normalPantry(data);
}

export async function deletePantryItem(id) {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw error;
}

function normalPantry(item) {
  if (!item) return item;
  const { quantity, ...rest } = item;
  return { ...rest, qty: parseFloat(quantity) || 0 };
}

// ─── Shopping List ─────────────────────────────────────────────
// DB column: "is_checked" — app treats it as "checked_off"

export async function getShopping(familyId) {
  const { data, error } = await supabase
    .from('shopping_items').select('*').eq('family_id', familyId).order('created_at');
  if (error) throw error;
  return (data || []).map(normalShopping);
}

export async function insertShoppingItem(familyId, item) {
  const { checked_off, ...rest } = item;
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ family_id: familyId, ...rest, is_checked: checked_off || false })
    .select().single();
  if (error) throw error;
  return normalShopping(data);
}

export async function updateShoppingChecked(id, checkedOff) {
  const { data, error } = await supabase
    .from('shopping_items').update({ is_checked: checkedOff }).eq('id', id).select().single();
  if (error) throw error;
  return normalShopping(data);
}

export async function deleteShoppingItem(id) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}

export async function clearCheckedShopping(familyId) {
  const { error } = await supabase
    .from('shopping_items').delete().eq('family_id', familyId).eq('is_checked', true);
  if (error) throw error;
}

export async function clearAllShopping(familyId) {
  const { error } = await supabase
    .from('shopping_items').delete().eq('family_id', familyId);
  if (error) throw error;
}

function normalShopping(item) {
  if (!item) return item;
  const { is_checked, ...rest } = item;
  return { ...rest, checked_off: is_checked || false };
}

// ─── Meal Templates ────────────────────────────────────────────

export async function getTemplates(familyId) {
  const { data, error } = await supabase
    .from('meal_templates').select('*').eq('family_id', familyId).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertTemplate(familyId, name, days) {
  const { data, error } = await supabase
    .from('meal_templates').insert({ family_id: familyId, name, days }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('meal_templates').delete().eq('id', id);
  if (error) throw error;
}
