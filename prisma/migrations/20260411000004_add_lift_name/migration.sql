-- Add name column with a temporary default so existing rows are valid
ALTER TABLE "Lift" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';

-- Populate existing lifts sequentially from the name list (wraps if >100 lifts)
DO $$
DECLARE
  names TEXT[] := ARRAY[
    'Aspen Glide', 'Whistler Peak', 'Vail Summit', 'Powder Keg', 'Banff Breeze',
    'Snowbird Ridge', 'Mammoth Crest', 'Telluride Twist', 'Breckenridge Bowl',
    'Lake Louise Loft', 'Park City Plunge', 'Squaw Valley Sweep', 'Stowe Glider',
    'Keystone Kick', 'Big Sky Bound', 'Copper Canyon', 'Heavenly Haul',
    'Crested Butte Climb', 'Revelstoke Rider', 'Sundance Soar', 'Jackson Hole Jump',
    'Taos Traverse', 'Steamboat Surge', 'Alta Ascent', 'Jasper Joyride',
    'Snowmass Skimmer', 'Wolf Creek Wander', 'Killington Kick', 'Sunshine Village',
    'Mt Bachelor Blast', 'Deer Valley Drift', 'Silver Star Spin', 'Arapahoe Arc',
    'Fernie Flash', 'Sugarloaf Sweep', 'Whitefish Wave', 'Crystal Mountain Climb',
    'Sun Valley Swoop', 'Schweitzer Slide', 'Mount Snow Missile', 'Panorama Peak',
    'Loon Mountain Loop', 'Stratton Streaker', 'Tremblant Twist', 'Northstar Nudge',
    'Diamond Peak Dash', 'Red Mountain Rocket', 'Smugglers Notch', 'Sunday River Rush',
    'Bolton Valley Bolt', 'Loveland Leap', 'Monarch Mover', 'Kimberley Kite',
    'Canmore Cruiser', 'Waterton Winder', 'Grouse Mountain Glide', 'Cypress Cruiser',
    'Nakiska Nudge', 'Blue Mountain Blast', 'Horseshoe Hauler', 'Solitude Seeker',
    'Brighton Blazer', 'Snowbasin Swinger', 'Bridger Bowl Bolt', 'Red Lodge Rambler',
    'Granite Peak Glider', 'Mt Norquay Nudge', 'Powder Mountain Pulse',
    'Snowflake Summit', 'Glacier Gallop', 'Teton Topper', 'Cariboo Cruiser',
    'Coldsmoke Carver', 'Icefall Express', 'Timberline Traveller', 'Ridgeline Rocket',
    'Pinecone Pullaway', 'Frostbite Flyer', 'Mogul Mover', 'Cornice Cruiser',
    'Chute Runner', 'Basecamp Bullet', 'Treeline Tripper', 'Windburn Winger',
    'Couloir Climber', 'Snowpack Surfer', 'Crevasse Crosser', 'Bluebird Booster',
    'Avalanche Ace', 'Whiteout Wanderer', 'Slalom Slider', 'Mogul Magnet',
    'Powder Pilgrim', 'Hardpack Hero', 'Groomer Glider', 'Chairlift Charlie',
    'Backcountry Blazer', 'Summit Seeker', 'Freshtrack Flyer'
  ];
  r RECORD;
  i INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM "Lift" ORDER BY "createdAt" LOOP
    UPDATE "Lift"
    SET "name" = names[((i - 1) % array_length(names, 1)) + 1]
    WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;

-- Remove the default — future inserts must always supply a name
ALTER TABLE "Lift" ALTER COLUMN "name" DROP DEFAULT;
