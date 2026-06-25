// heroes.js — Vercel Serverless Function
// База данных: Supabase (PostgreSQL)
// Установите: npm install @supabase/supabase-js

const { createClient } = require('@supabase/supabase-js');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'erler2024';

function getSupabase(useServiceRole = false) {
  const url = process.env.SUPABASE_URL;
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_KEY
    : process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function authCheck(req) {
  return req.headers['x-admin-token'] === ADMIN_PASSWORD;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── GET все одобренные записи (публично) ────────────────
  if (req.method === 'GET' && action === 'heroes') {
    const db = getSupabase();
    const { data, error } = await db
      .from('heroes')
      .select('*')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, data: data || [] });
  }

  // ── GET заявки на модерацию (только админ) ───────────────
  if (req.method === 'GET' && action === 'pending') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const db = getSupabase(true);
    const { data, error } = await db
      .from('heroes')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, data: data || [] });
  }

  // ── POST отправить заявку (публично) ─────────────────────
  if (req.method === 'POST' && action === 'submit') {
    const body = req.body;
    if (!body.name_ru || !body.desc_ru) {
      return res.status(400).json({ ok: false, error: 'Имя и описание обязательны' });
    }

    const db = getSupabase();
    const { error } = await db.from('heroes').insert([{
      name_ru:       body.name_ru,
      name_kz:       body.name_kz || '',
      service_type:  body.service_type || '',
      rank:          body.rank || '',
      death_date:    body.death_date || null,
      location:      body.location || '',
      desc_ru:       body.desc_ru,
      desc_kz:       body.desc_kz || '',
      photo_url:     body.photo_url || '',
      submitter:     body.submitter || '',
      status:        'pending',
      fatiha_count:  0,
      submitted_at:  new Date().toISOString()
    }]);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, message: 'Заявка отправлена на модерацию' });
  }

  // ── POST одобрить запись (только админ) ──────────────────
  if (req.method === 'POST' && action === 'approve') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { id } = req.body;
    const db = getSupabase(true);
    const { error } = await db
      .from('heroes')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── POST отклонить заявку (только админ) ─────────────────
  if (req.method === 'POST' && action === 'reject') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { id } = req.body;
    const db = getSupabase(true);
    const { error } = await db
      .from('heroes')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── DELETE удалить запись (только админ) ─────────────────
  if (req.method === 'DELETE' && action === 'hero') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });

    const { id } = req.body;
    const db = getSupabase(true);
    const { error } = await db
      .from('heroes')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── POST счётчик Фатихи ───────────────────────────────────
  if (req.method === 'POST' && action === 'fatiha') {
    const { id } = req.body;
    const db = getSupabase();

    // Получаем текущее значение
    const { data: hero, error: fetchErr } = await db
      .from('heroes')
      .select('fatiha_count')
      .eq('id', id)
      .single();

    if (fetchErr) return res.status(404).json({ ok: false, error: 'Not found' });

    const newCount = (hero.fatiha_count || 0) + 1;
    const { error } = await db
      .from('heroes')
      .update({ fatiha_count: newCount })
      .eq('id', id);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, fatiha_count: newCount });
  }

  return res.status(405).json({ ok: false, error: 'Unknown action' });
};
