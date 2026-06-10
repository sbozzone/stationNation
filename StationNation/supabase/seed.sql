-- StationNation seed data
-- Ports all mock data from app/mockData.ts.
-- Run AFTER schema.sql.

-- ============================================================
-- Stations
-- ============================================================

INSERT INTO stations (id, name, distance, cleanliness_tier, score, rating_count, freshness_hours, safety_badges, sub_ratings, latitude, longitude)
VALUES
  (
    'chevron-valley',
    'Chevron — Valley Boulevard',
    '0.4 mi',
    'clean',
    4.5,
    128,
    2,
    ARRAY['Lot well lit','24/7','Staff on site','Visible from road'],
    '{"clean":5,"friendly":4,"convenient":4}'::jsonb,
    30,
    45
  ),
  (
    'shell-crossing',
    'Shell — North Crossing',
    '1.2 mi',
    'mixed',
    3.2,
    64,
    18,
    ARRAY['Indoor entrance','Staff on site','24/7'],
    '{"clean":3,"friendly":3,"convenient":4}'::jsonb,
    65,
    25
  ),
  (
    'valero-exit14',
    'Valero — Exit 14',
    '1.5 mi',
    'gross',
    1.8,
    32,
    6,
    ARRAY['Outdoor entrance','Visible from road'],
    '{"clean":1.5,"friendly":2,"convenient":3}'::jsonb,
    45,
    80
  ),
  (
    'texaco-route9',
    'Texaco Express — Route 9',
    '2.1 mi',
    'unrated',
    0.0,
    0,
    0,
    ARRAY['Lot well lit','24/7','Visible from road'],
    '{"clean":0,"friendly":0,"convenient":0}'::jsonb,
    80,
    60
  ),
  (
    'bp-avon',
    'BP Travel Center — Avon',
    '0.8 mi',
    'clean',
    4.1,
    96,
    12,
    ARRAY['Lot well lit','24/7','Indoor entrance','Staff on site'],
    '{"clean":4,"friendly":4,"convenient":5}'::jsonb,
    20,
    70
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Reviews
-- ============================================================

INSERT INTO reviews (id, station_id, username, avatar_initials, created_at, text, score, helpful_count)
VALUES
  (
    'rev-1',
    'chevron-valley',
    'SarahDrivesAlone',
    'SD',
    NOW() - INTERVAL '2 hours',
    'Super clean restrooms, bright LED lighting outside. Felt very safe coming here at 11 PM to refuel and stretch.',
    5,
    24
  ),
  (
    'rev-2',
    'chevron-valley',
    'RoadWarrior99',
    'RW',
    NOW() - INTERVAL '1 day',
    'Clean floor, fully stocked toilet paper, and the hand dryer actually works. Indoor entrance near the register.',
    4,
    12
  ),
  (
    'rev-3',
    'shell-crossing',
    'TransitMama',
    'TM',
    NOW() - INTERVAL '18 hours',
    'Restrooms are indoor, which is nice for safety. However, cleanliness was mediocre. Needs a good sweep and restocking.',
    3,
    15
  ),
  (
    'rev-4',
    'shell-crossing',
    'EchoTracer',
    'ET',
    NOW() - INTERVAL '3 days',
    'Average station. Staff was friendly but restroom smelled a bit like old damp cleaner. Safe but not pristine.',
    3.5,
    8
  ),
  (
    'rev-5',
    'valero-exit14',
    'NightCruiser',
    'NC',
    NOW() - INTERVAL '6 hours',
    'Avoid if possible. Restroom is outdoor around the back and very poorly lit. Trash was overflowing and no soap.',
    1,
    42
  ),
  (
    'rev-6',
    'valero-exit14',
    'SoloGal7',
    'SG',
    NOW() - INTERVAL '2 days',
    'Dirty floors, lock on the door was loose. I felt uncomfortable since it is behind the main building.',
    2,
    29
  ),
  (
    'rev-7',
    'bp-avon',
    'AvonLocal',
    'AL',
    NOW() - INTERVAL '12 hours',
    'Decent stop, very bright parking lot. Restrooms inside are usually clean. Staff is always at the counter.',
    4,
    18
  )
ON CONFLICT (id) DO NOTHING;
