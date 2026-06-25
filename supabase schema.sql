-- Запустите этот SQL в Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS heroes (
  id            BIGSERIAL PRIMARY KEY,
  name_ru       TEXT NOT NULL,
  name_kz       TEXT DEFAULT '',
  service_type  TEXT DEFAULT '',
  rank          TEXT DEFAULT '',
  death_date    DATE,
  location      TEXT DEFAULT '',
  desc_ru       TEXT DEFAULT '',
  desc_kz       TEXT DEFAULT '',
  photo_url     TEXT DEFAULT '',
  submitter     TEXT DEFAULT '',
  status        TEXT DEFAULT 'pending',
  fatiha_count  INTEGER DEFAULT 0,
  submitted_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Безопасность: включить RLS
ALTER TABLE heroes ENABLE ROW LEVEL SECURITY;

-- Разрешить всем читать одобренные записи
CREATE POLICY "Public can read approved"
  ON heroes FOR SELECT
  USING (status = 'approved');

-- Разрешить всем добавлять заявки (pending)
CREATE POLICY "Public can submit"
  ON heroes FOR INSERT
  WITH CHECK (status = 'pending');

-- Обновление и удаление — только через service_role (ваш backend)
-- (service_role ключ обходит RLS автоматически)
