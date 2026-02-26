-- Add booking window settings to trainers table
-- booking_window_days: how far into the future students can book (default 7 days)
-- min_notice_hours: minimum hours before lesson start for booking (default 24 hours)

ALTER TABLE trainers
  ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS min_notice_hours INTEGER DEFAULT 24;
