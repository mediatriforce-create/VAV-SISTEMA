-- =========================================================================
-- ANEXOS DE CHAT: Adicionar suporte a arquivos nas mensagens
-- =========================================================================
-- O campo file_metadata armazena os metadados do arquivo do Google Drive
-- como JSONB. Formato esperado:
-- {
--   "drive_file_id": "abc123",
--   "file_name": "foto.jpg",
--   "mime_type": "image/jpeg",
--   "size": 204800,
--   "web_view_link": "https://drive.google.com/...",
--   "thumbnail_link": "https://drive.google.com/thumbnail?id=abc123"
-- }

ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_metadata JSONB DEFAULT NULL;
