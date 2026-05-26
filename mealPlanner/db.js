// ═══════════════════════════════════════════════════════════════
// Family Dinner Time — Supabase Data Layer
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

export async function getPantry(familyId) {
  const { data, error } = await supabase
    .from('pantry_items').select('*').eq('family_id', familyId).order('name');
  if (error) throw error;
  return data || [];
}

export async function upsertPantryItem(item) {
  const { id, ...rest } = item;
  rest.updated_at = new Date().toISOString();
  if (id) {
    const { data, error } = await supabase
      .from('pantry_items').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('pantry_items').insert(rest).select().single();
  if (error) throw error;
  return data;
}

export async function adjustPantryQty(id, delta) {
  const { data: item } = await supabase
    .from('pantry_items').select('qty').eq('id', id).single();
  const newQty = Math.max(0, (parseFloat(item?.qty) || 0) + delta);
  const { data, error } = await supabase
    .from('pantry_items')
    .update({ qty: newQty, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePantryItem(id) {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw error;
}

// ─── Shopping List ─────────────────────────────────────────────

export async function getShopping(familyId) {
  const { data, error } = await supabase
    .from('shopping_items').select('*').eq('family_id', familyId).order('created_at');
  if (error) throw error;
  return data || [];
}

export async function insertShoppingItem(familyId, item) {
  const { data, error } = await supabase
    .from('shopping_items').insert({ family_id: familyId, ...item }).select().single();
  if (error) throw error;
  return data;
}

export async function updateShoppingChecked(id, checkedOff) {
  const { data, error } = await supabase
    .from('shopping_items').update({ checked_off: checkedOff }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteShoppingItem(id) {
  const { error } = await supabase.from('shopping_items').delete().eq('id', id);
  if (error) throw error;
}

export async function clearCheckedShopping(familyId) {
  const { error } = await supabase
    .from('shopping_items').delete().eq('family_id', familyId).eq('checked_off', true);
  if (error) throw error;
}

export async function clearAllShopping(familyId) {
  const { error } = await supabase
    .from('shopping_items').delete().eq('family_id', familyId);
  if (error) throw error;
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
