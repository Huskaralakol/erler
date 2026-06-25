// api/heroes.js
// Vercel Serverless Function
// Uses Vercel KV (Redis) for persistent storage
// npm install @vercel/kv — add to package.json

import { kv } from '@vercel/kv';

const HEROES_KEY = 'erler:heroes';
const PENDING_KEY = 'erler:pending';

// Simple admin auth — set via Vercel Environment Variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'erler2024';

function authCheck(req) {
  const token = req.headers['x-admin-token'];
  return token === ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  // ── GET all approved heroes ──────────────────────────────
  if (req.method === 'GET' && action === 'heroes') {
    const heroes = await kv.get(HEROES_KEY) || [];
    return res.status(200).json({ ok: true, data: heroes });
  }

  // ── GET pending (admin only) ─────────────────────────────
  if (req.method === 'GET' && action === 'pending') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const pending = await kv.get(PENDING_KEY) || [];
    return res.status(200).json({ ok: true, data: pending });
  }

  // ── POST submit (public) — goes to pending ───────────────
  if (req.method === 'POST' && action === 'submit') {
    const body = req.body;
    if (!body.name_ru || !body.desc_ru) {
      return res.status(400).json({ ok: false, error: 'Name and description required' });
    }
    const pending = await kv.get(PENDING_KEY) || [];
    const newEntry = {
      ...body,
      id: Date.now(),
      submitted_at: new Date().toISOString(),
      status: 'pending'
    };
    pending.push(newEntry);
    await kv.set(PENDING_KEY, pending);
    return res.status(200).json({ ok: true, message: 'Submitted for review' });
  }

  // ── POST approve (admin) — move from pending to heroes ───
  if (req.method === 'POST' && action === 'approve') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { id } = req.body;
    const pending = await kv.get(PENDING_KEY) || [];
    const heroes = await kv.get(HEROES_KEY) || [];
    const idx = pending.findIndex(h => h.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Not found' });
    const [hero] = pending.splice(idx, 1);
    hero.status = 'approved';
    heroes.push(hero);
    await kv.set(HEROES_KEY, heroes);
    await kv.set(PENDING_KEY, pending);
    return res.status(200).json({ ok: true });
  }

  // ── DELETE hero (admin) ──────────────────────────────────
  if (req.method === 'DELETE' && action === 'hero') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { id } = req.body;
    const heroes = await kv.get(HEROES_KEY) || [];
    const filtered = heroes.filter(h => h.id !== id);
    await kv.set(HEROES_KEY, filtered);
    return res.status(200).json({ ok: true });
  }

  // ── DELETE pending (admin reject) ───────────────────────
  if (req.method === 'DELETE' && action === 'pending') {
    if (!authCheck(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    const { id } = req.body;
    const pending = await kv.get(PENDING_KEY) || [];
    const filtered = pending.filter(h => h.id !== id);
    await kv.set(PENDING_KEY, filtered);
    return res.status(200).json({ ok: true });
  }

  // ── POST fatiha count ────────────────────────────────────
  if (req.method === 'POST' && action === 'fatiha') {
    const { id } = req.body;
    const heroes = await kv.get(HEROES_KEY) || [];
    const hero = heroes.find(h => h.id === id);
    if (!hero) return res.status(404).json({ ok: false, error: 'Not found' });
    hero.fatiha_count = (hero.fatiha_count || 0) + 1;
    await kv.set(HEROES_KEY, heroes);
    return res.status(200).json({ ok: true, fatiha_count: hero.fatiha_count });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
}
