-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_clicked_at TIMESTAMP,
  INDEX idx_code (code)
);

-- Create clicks table for detailed analytics (optional but recommended for scale)
CREATE TABLE IF NOT EXISTS click_logs (
  id SERIAL PRIMARY KEY,
  link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  INDEX idx_link_id (link_id),
  INDEX idx_clicked_at (clicked_at)
);

-- For PostgreSQL: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_link_clicked ON click_logs(link_id, clicked_at DESC);