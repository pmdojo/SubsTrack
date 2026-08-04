-- SubTrack seed data — categories + app_library
-- Idempotent: uses ON CONFLICT DO NOTHING so re-runs are safe.

-- ═══════════════════════════════════════════════════════════════════════════
-- Categories (global presets — user_id NULL)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.categories (user_id, slug, label, emoji, color) values
  (null, 'streaming',    'Streaming',    '📺', '#E50914'),
  (null, 'music',        'Music',        '🎵', '#1DB954'),
  (null, 'ai',           'AI',           '✨', '#4C4CE5'),
  (null, 'design',       'Design',       '🎨', '#F24E1E'),
  (null, 'productivity', 'Productivity', '📝', '#0078D4'),
  (null, 'dev',          'Dev Tools',    '💻', '#181717'),
  (null, 'storage',      'Storage',      '☁️', '#3B82F6'),
  (null, 'social',       'Social',       '💬', '#5865F2'),
  (null, 'fitness',      'Fitness',      '🏃', '#F97316'),
  (null, 'news',         'News',         '📰', '#57534E'),
  (null, 'gaming',       'Gaming',       '🎮', '#7C3AED'),
  (null, 'utility',      'Utilities',    '🔧', '#8B887F')
on conflict (user_id, slug) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- App library — ~40 popular apps
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.app_library (slug, name, color, icon, category_slug, vendor_url, suggested_plans, popularity_rank) values
  -- Streaming
  ('netflix',      'Netflix',        '#E50914', 'N', 'streaming', 'https://www.netflix.com/account',
    '[{"label":"Mobile","price":149},{"label":"Basic","price":199},{"label":"Standard","price":499},{"label":"Premium","price":649}]'::jsonb, 100),
  ('prime-video',  'Prime Video',    '#00A8E1', 'P', 'streaming', 'https://www.primevideo.com/settings',
    '[{"label":"Monthly","price":179},{"label":"Yearly","price":1499}]'::jsonb, 95),
  ('disney-plus',  'Disney+ Hotstar','#0E47A1', 'D', 'streaming', 'https://www.hotstar.com/in/subscribe',
    '[{"label":"Mobile","price":149},{"label":"Super","price":299},{"label":"Premium","price":499}]'::jsonb, 90),
  ('youtube-premium','YouTube Premium','#FF0000', '▷', 'streaming', 'https://www.youtube.com/premium',
    '[{"label":"Individual","price":149},{"label":"Family","price":249}]'::jsonb, 85),
  ('hbo-max',      'HBO Max',        '#7C3AED', 'H', 'streaming', 'https://www.hbomax.com/subscription',
    '[{"label":"Standard","price":499}]'::jsonb, 60),
  ('apple-tv',     'Apple TV+',      '#111111', 'A', 'streaming', 'https://tv.apple.com',
    '[{"label":"Monthly","price":99}]'::jsonb, 50),
  -- Music
  ('spotify',      'Spotify',        '#1DB954', '♪', 'music', 'https://www.spotify.com/account/subscription',
    '[{"label":"Individual","price":119},{"label":"Duo","price":149},{"label":"Family","price":179},{"label":"Student","price":59}]'::jsonb, 90),
  ('apple-music',  'Apple Music',    '#111111', 'A', 'music', 'https://music.apple.com/account/subscribe',
    '[{"label":"Individual","price":99},{"label":"Family","price":149},{"label":"Student","price":49}]'::jsonb, 80),
  ('youtube-music','YouTube Music',  '#FF0000', '♫', 'music', 'https://music.youtube.com',
    '[{"label":"Individual","price":99},{"label":"Family","price":149}]'::jsonb, 60),
  ('gaana',        'Gaana Plus',     '#FE0000', 'G', 'music', 'https://gaana.com/subscription',
    '[{"label":"Monthly","price":99}]'::jsonb, 40),
  -- AI
  ('chatgpt',      'ChatGPT',        '#10A37F', 'AI', 'ai', 'https://chatgpt.com/#pricing',
    '[{"label":"Plus","price":1650},{"label":"Team","price":2400}]'::jsonb, 95),
  ('claude',       'Claude',         '#D97757', '✳', 'ai', 'https://claude.ai/settings/billing',
    '[{"label":"Pro","price":1700},{"label":"Max","price":8500}]'::jsonb, 90),
  ('midjourney',   'Midjourney',     '#000000', 'M', 'ai', 'https://www.midjourney.com/account',
    '[{"label":"Basic","price":830},{"label":"Standard","price":2500}]'::jsonb, 70),
  ('perplexity',   'Perplexity Pro', '#20808D', 'P', 'ai', 'https://www.perplexity.ai/pro',
    '[{"label":"Pro","price":1650}]'::jsonb, 60),
  ('github-copilot','GitHub Copilot','#181717', 'C', 'ai', 'https://github.com/settings/copilot',
    '[{"label":"Individual","price":830},{"label":"Business","price":1600}]'::jsonb, 65),
  -- Design
  ('figma',        'Figma',          '#F24E1E', 'F', 'design', 'https://www.figma.com/pricing/',
    '[{"label":"Professional","price":999},{"label":"Organization","price":3800}]'::jsonb, 90),
  ('adobe-cc',     'Adobe CC',       '#FA0F00', 'A', 'design', 'https://account.adobe.com/plans',
    '[{"label":"Single App","price":1596},{"label":"All Apps","price":4229}]'::jsonb, 80),
  ('canva',        'Canva Pro',      '#00C4CC', 'C', 'design', 'https://www.canva.com/pro',
    '[{"label":"Pro","price":499},{"label":"Teams","price":999}]'::jsonb, 75),
  ('framer',       'Framer',         '#0055FF', 'Fr', 'design', 'https://www.framer.com/pricing',
    '[{"label":"Mini","price":420},{"label":"Basic","price":840}]'::jsonb, 55),
  -- Productivity
  ('notion',       'Notion',         '#111111', 'N', 'productivity', 'https://www.notion.so/settings/plans',
    '[{"label":"Plus","price":660},{"label":"Business","price":1250}]'::jsonb, 85),
  ('microsoft-365','Microsoft 365',  '#0078D4', 'M', 'productivity', 'https://www.microsoft.com/en-in/microsoft-365',
    '[{"label":"Personal","price":499},{"label":"Family","price":629}]'::jsonb, 75),
  ('google-one',   'Google One',     '#4285F4', 'G', 'storage', 'https://one.google.com',
    '[{"label":"100 GB","price":130},{"label":"200 GB","price":210},{"label":"2 TB","price":650}]'::jsonb, 80),
  ('icloud-plus',  'iCloud+',        '#3B82F6', '☁', 'storage', 'https://www.icloud.com',
    '[{"label":"50 GB","price":75},{"label":"200 GB","price":219},{"label":"2 TB","price":749}]'::jsonb, 75),
  ('dropbox',      'Dropbox Plus',   '#0061FF', 'D', 'storage', 'https://www.dropbox.com/plans',
    '[{"label":"Plus","price":830}]'::jsonb, 45),
  ('slack',        'Slack',          '#4A154B', 'S', 'productivity', 'https://slack.com/pricing',
    '[{"label":"Pro","price":625}]'::jsonb, 60),
  ('todoist',      'Todoist Pro',    '#E44332', 'T', 'productivity', 'https://todoist.com/pricing',
    '[{"label":"Pro","price":330}]'::jsonb, 50),
  -- Dev
  ('github-pro',   'GitHub Pro',     '#181717', 'G', 'dev', 'https://github.com/settings/billing/plans',
    '[{"label":"Pro","price":330}]'::jsonb, 70),
  ('vercel',       'Vercel Pro',     '#000000', 'V', 'dev', 'https://vercel.com/pricing',
    '[{"label":"Pro","price":1700}]'::jsonb, 55),
  ('linear',       'Linear',         '#5E6AD2', 'L', 'dev', 'https://linear.app/pricing',
    '[{"label":"Standard","price":700}]'::jsonb, 50),
  ('sentry',       'Sentry',         '#362D59', 'S', 'dev', 'https://sentry.io/pricing',
    '[{"label":"Team","price":2100}]'::jsonb, 40),
  -- Social
  ('discord',      'Discord Nitro',  '#5865F2', 'D', 'social', 'https://discord.com/settings/premium',
    '[{"label":"Basic","price":275},{"label":"Nitro","price":830}]'::jsonb, 70),
  ('x-premium',    'X Premium',      '#000000', 'X', 'social', 'https://twitter.com/i/premium_sign_up',
    '[{"label":"Basic","price":225},{"label":"Premium","price":650},{"label":"Premium+","price":1300}]'::jsonb, 55),
  ('linkedin',     'LinkedIn Premium','#0A66C2', 'L', 'social', 'https://www.linkedin.com/premium',
    '[{"label":"Career","price":1500},{"label":"Business","price":3000}]'::jsonb, 45),
  -- Fitness
  ('cure-fit',     'Cult Fit',       '#F97316', 'C', 'fitness', 'https://www.cult.fit/subscribe',
    '[{"label":"Elite","price":1650}]'::jsonb, 55),
  ('strava',       'Strava Premium', '#FC5200', 'S', 'fitness', 'https://www.strava.com/premium',
    '[{"label":"Monthly","price":499}]'::jsonb, 40),
  -- News
  ('nyt',          'NYT',            '#000000', 'N', 'news', 'https://www.nytimes.com/subscription',
    '[{"label":"Basic","price":499}]'::jsonb, 40),
  ('the-ken',      'The Ken',        '#EE1C25', 'K', 'news', 'https://the-ken.com/subscribe',
    '[{"label":"Premium","price":625}]'::jsonb, 35),
  ('economist',    'The Economist',  '#E3120B', 'E', 'news', 'https://www.economist.com/subscribe',
    '[{"label":"Digital","price":1250}]'::jsonb, 30),
  -- Gaming
  ('xbox-game-pass','Xbox Game Pass','#107C10', 'X', 'gaming', 'https://www.xbox.com/subscriptions',
    '[{"label":"Ultimate","price":1099}]'::jsonb, 50),
  ('playstation-plus','PS Plus',     '#003791', 'P', 'gaming', 'https://www.playstation.com/en-in/ps-plus/',
    '[{"label":"Essential","price":499},{"label":"Extra","price":749}]'::jsonb, 40)
on conflict (slug) do nothing;
