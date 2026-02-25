-- ============================================================================
-- PRIVATE LESSONS SYSTEM
-- 3 tables: availability, exceptions, bookings
-- ============================================================================

-- ============================================================================
-- TABLE 1: private_lesson_availability
-- Recurring weekly schedule per trainer per day (morning + afternoon ranges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS private_lesson_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Day of week: 0=domingo, 1=lunes, 2=martes, ..., 6=sabado
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Morning time range (nullable = not available in the morning)
  morning_start TIME,
  morning_end TIME,

  -- Afternoon time range (nullable = not available in the afternoon)
  afternoon_start TIME,
  afternoon_end TIME,

  -- Slot duration for this day (minutes)
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_duration_minutes > 0),

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per trainer + club + day
  UNIQUE (trainer_profile_id, club_id, day_of_week),

  -- morning_start < morning_end when both present
  CONSTRAINT valid_morning CHECK (
    (morning_start IS NULL AND morning_end IS NULL) OR
    (morning_start IS NOT NULL AND morning_end IS NOT NULL AND morning_start < morning_end)
  ),
  -- afternoon_start < afternoon_end when both present
  CONSTRAINT valid_afternoon CHECK (
    (afternoon_start IS NULL AND afternoon_end IS NULL) OR
    (afternoon_start IS NOT NULL AND afternoon_end IS NOT NULL AND afternoon_start < afternoon_end)
  )
);

CREATE INDEX idx_pla_trainer ON private_lesson_availability(trainer_profile_id);
CREATE INDEX idx_pla_trainer_club ON private_lesson_availability(trainer_profile_id, club_id);

-- Auto-update updated_at
CREATE TRIGGER update_pla_updated_at
  BEFORE UPDATE ON private_lesson_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: private_lesson_exceptions
-- Block days, extra days, and vacation ranges
-- ============================================================================
CREATE TABLE IF NOT EXISTS private_lesson_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  exception_type VARCHAR(20) NOT NULL CHECK (exception_type IN ('block_day', 'extra_day', 'vacation')),

  -- For block_day and extra_day: single date
  exception_date DATE,

  -- For vacation: date range
  start_date DATE,
  end_date DATE,

  -- For extra_day: override time ranges and duration
  morning_start TIME,
  morning_end TIME,
  afternoon_start TIME,
  afternoon_end TIME,
  slot_duration_minutes INTEGER CHECK (slot_duration_minutes > 0),

  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- block_day/extra_day require exception_date; vacation requires start_date+end_date
  CONSTRAINT valid_exception_dates CHECK (
    (exception_type IN ('block_day', 'extra_day') AND exception_date IS NOT NULL) OR
    (exception_type = 'vacation' AND start_date IS NOT NULL AND end_date IS NOT NULL AND start_date <= end_date)
  )
);

CREATE INDEX idx_ple_trainer ON private_lesson_exceptions(trainer_profile_id);
CREATE INDEX idx_ple_date ON private_lesson_exceptions(exception_date);
CREATE INDEX idx_ple_range ON private_lesson_exceptions(start_date, end_date);

-- ============================================================================
-- TABLE 3: private_lesson_bookings
-- Player booking requests with status state machine
-- ============================================================================
CREATE TABLE IF NOT EXISTS private_lesson_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Who booked
  booked_by_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booker_name VARCHAR(200) NOT NULL,
  booker_email VARCHAR(200),
  booker_phone VARCHAR(50),

  -- Booking details
  lesson_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  num_companions INTEGER NOT NULL DEFAULT 0 CHECK (num_companions >= 0 AND num_companions <= 3),
  court_number INTEGER,

  -- Price snapshot at booking time
  price_per_person NUMERIC(10, 2),
  total_price NUMERIC(10, 2),

  -- Status: pending → confirmed | rejected | cancelled | auto_cancelled
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'auto_cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  auto_cancel_at TIMESTAMPTZ,  -- set to created_at + 2 hours on insert
  rejection_reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plb_trainer ON private_lesson_bookings(trainer_profile_id);
CREATE INDEX idx_plb_date ON private_lesson_bookings(lesson_date);
CREATE INDEX idx_plb_status ON private_lesson_bookings(status);
CREATE INDEX idx_plb_trainer_date ON private_lesson_bookings(trainer_profile_id, lesson_date);
CREATE INDEX idx_plb_auto_cancel ON private_lesson_bookings(status, auto_cancel_at)
  WHERE status = 'pending';

-- Auto-update updated_at
CREATE TRIGGER update_plb_updated_at
  BEFORE UPDATE ON private_lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set auto_cancel_at on insert (2 hours from creation)
CREATE OR REPLACE FUNCTION set_auto_cancel_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.auto_cancel_at IS NULL AND NEW.status = 'pending' THEN
    NEW.auto_cancel_at := NEW.created_at + INTERVAL '2 hours';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_auto_cancel
  BEFORE INSERT ON private_lesson_bookings
  FOR EACH ROW EXECUTE FUNCTION set_auto_cancel_at();

-- ============================================================================
-- RLS POLICIES: private_lesson_availability
-- ============================================================================
ALTER TABLE private_lesson_availability ENABLE ROW LEVEL SECURITY;

-- Trainers can manage their own availability
CREATE POLICY "Trainers manage own availability"
  ON private_lesson_availability FOR ALL
  USING (trainer_profile_id = auth.uid())
  WITH CHECK (trainer_profile_id = auth.uid());

-- Admins can view availability for trainers in their club
CREATE POLICY "Admins view trainer availability"
  ON private_lesson_availability FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Players can view availability for booking
CREATE POLICY "Players view availability for booking"
  ON private_lesson_availability FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('player', 'guardian')
    )
  );

-- ============================================================================
-- RLS POLICIES: private_lesson_exceptions
-- ============================================================================
ALTER TABLE private_lesson_exceptions ENABLE ROW LEVEL SECURITY;

-- Trainers can manage their own exceptions
CREATE POLICY "Trainers manage own exceptions"
  ON private_lesson_exceptions FOR ALL
  USING (trainer_profile_id = auth.uid())
  WITH CHECK (trainer_profile_id = auth.uid());

-- Admins can view exceptions for trainers in their club
CREATE POLICY "Admins view trainer exceptions"
  ON private_lesson_exceptions FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Players can view exceptions (needed for booking UI to show unavailable dates)
CREATE POLICY "Players view trainer exceptions"
  ON private_lesson_exceptions FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('player', 'guardian')
    )
  );

-- ============================================================================
-- RLS POLICIES: private_lesson_bookings
-- ============================================================================
ALTER TABLE private_lesson_bookings ENABLE ROW LEVEL SECURITY;

-- Trainers can view bookings assigned to them
CREATE POLICY "Trainers view own bookings"
  ON private_lesson_bookings FOR SELECT
  USING (trainer_profile_id = auth.uid());

-- Trainers can update bookings assigned to them (confirm/reject)
CREATE POLICY "Trainers update own bookings"
  ON private_lesson_bookings FOR UPDATE
  USING (trainer_profile_id = auth.uid());

-- Players can view their own bookings
CREATE POLICY "Players view own bookings"
  ON private_lesson_bookings FOR SELECT
  USING (booked_by_profile_id = auth.uid());

-- Players can create bookings
CREATE POLICY "Players create bookings"
  ON private_lesson_bookings FOR INSERT
  WITH CHECK (booked_by_profile_id = auth.uid());

-- Players can cancel their own pending bookings
CREATE POLICY "Players cancel own pending bookings"
  ON private_lesson_bookings FOR UPDATE
  USING (booked_by_profile_id = auth.uid() AND status = 'pending');

-- Admins can view all bookings for their club
CREATE POLICY "Admins view club bookings"
  ON private_lesson_bookings FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  );