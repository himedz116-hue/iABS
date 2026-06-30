-- ============================================
-- iABS Complete Database Schema v3
-- تشغيل هذا الملف كامل في Supabase SQL Editor
-- Supabase Dashboard > SQL Editor > New Query > لصق > Run
--
-- Database Connection (للاستخدام المباشر):
-- Connection_string=postgresql://postgres:VLmmNm9mI44GEUQw@db.avskaagaxwhjneuhlaxj.supabase.co:5432/postgres
-- ============================================

-- 1. CLEAN START - مسح الجداول القديمة
drop table if exists user_inventory cascade;
drop table if exists transactions cascade;
drop table if exists store_items cascade;
drop table if exists games cascade;
drop table if exists sponsors cascade;
drop table if exists leaderboard cascade;
drop table if exists announcements cascade;
drop table if exists promo_codes cascade;
drop table if exists arena_status cascade;
drop table if exists audit_logs cascade;
drop table if exists bans cascade;
drop table if exists app_config cascade;
drop table if exists profiles cascade;
drop table if exists users cascade;
drop type if exists item_type;

-- ============================================
-- 2. USERS TABLE (Authentication)
-- UserAuthPage.tsx inserts: kick_username, display_name, discord, password_hash, avatar, is_verified
-- GlobalPasswordPage.tsx selects: * WHERE kick_username=? AND password_hash=?
-- UserDashboard.tsx updates: points WHERE id=?
-- ============================================
create table users (
    id uuid default gen_random_uuid() primary key,
    kick_username text not null unique,
    display_name text not null,
    discord text default '',
    password_hash text not null,
    avatar text default '',
    points bigint default 0,
    is_verified boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_users_kick_username on users(kick_username);

alter table users enable row level security;
create policy "Allow public registration" on users for insert with check (true);
create policy "Allow public read" on users for select using (true);
create policy "Allow public update" on users for update using (true) with check (true);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_users_updated_at
    before update on users
    for each row
    execute function update_updated_at_column();

-- ============================================
-- 3. PROFILES TABLE
-- adminService.getAllProfiles(): SELECT * ORDER BY created_at DESC
-- leaderboardService.recordWin(): SELECT * WHERE username ILIKE ?, INSERT if missing
-- leaderboardService.claimPromoCode(): SELECT * WHERE username=?, INSERT/UPDATE credits
-- leaderboardService.checkIsBanned(): SELECT is_banned WHERE username=?
-- ProAvatar.tsx: SELECT active_frame_url WHERE username ILIKE ?
-- UserAuthPage.tsx: UPSERT (username, avatar_url, role)
-- AdminDashboard: update credits, is_banned, SELECT all
-- ============================================
create table profiles (
    id uuid default gen_random_uuid() primary key,
    username text not null unique,
    avatar_url text,
    active_frame_url text default '',
    is_banned boolean default false,
    role text default 'user',
    credits int default 0,
    created_at timestamptz default now()
);

create index if not exists idx_profiles_username on profiles(username);
create index if not exists idx_profiles_credits on profiles(credits);

alter table profiles enable row level security;
create policy "Public Manage Profiles" on profiles for all using (true);

-- ============================================
-- 4. LEADERBOARD
-- leaderboardService.getTopPlayers(): SELECT *, profiles(avatar_url,is_banned,credits) ORDER BY score DESC
-- leaderboardService.getAllRankedPlayers(): SELECT *, profiles(avatar_url,is_banned,credits,active_frame_url) ORDER BY score DESC
-- leaderboardService.recordWin(): UPSERT onConflict username (wins+1, score+points, last_win_at)
-- leaderboardService.adjustPlayerStats(): UPSERT onConflict username (score, wins)
-- leaderboardService.claimPromoCode(): UPDATE/INSERT score
-- leaderboardService.resetLeaderboard(): DELETE WHERE username != 'SYSTEM_ADMIN'
-- UserDashboard.tsx: SELECT score WHERE username ILIKE ?
-- ============================================
create table leaderboard (
    id uuid default gen_random_uuid() primary key,
    username text not null unique references profiles(username) on delete cascade,
    wins int default 0,
    score int default 0,
    last_win_at timestamptz default now()
);

create index if not exists idx_leaderboard_score on leaderboard(score desc);
create index if not exists idx_leaderboard_username on leaderboard(username);

alter table leaderboard enable row level security;
create policy "Public Manage Leaderboard" on leaderboard for all using (true);

-- ============================================
-- 5. ANNOUNCEMENTS
-- adminService: SELECT * ORDER BY created_at DESC, INSERT, DELETE by id
-- ============================================
create table announcements (
    id uuid default gen_random_uuid() primary key,
    content text not null,
    is_active boolean default true,
    created_at timestamptz default now()
);

alter table announcements enable row level security;
create policy "Public Manage Announcements" on announcements for all using (true);

-- ============================================
-- 6. PROMO CODES
-- leaderboardService.claimPromoCode(): SELECT * WHERE code=? AND is_active=true
-- adminService: SELECT/INSERT/DELETE/UPDATE (is_active)
-- ============================================
create table promo_codes (
    id uuid default gen_random_uuid() primary key,
    code text not null unique,
    reward_amount int default 100,
    max_uses int default 1,
    current_uses int default 0,
    is_active boolean default true,
    created_at timestamptz default now()
);

create index if not exists idx_promo_codes_code on promo_codes(code);

alter table promo_codes enable row level security;
create policy "Public Manage Promo" on promo_codes for all using (true);

-- ============================================
-- 7. ARENA STATUS
-- adminService.getArenaStatus(): SELECT * (converts to {key: value} map)
-- adminService.updateArenaStatus(): UPDATE value, updated_at WHERE key=?
-- ============================================
create table arena_status (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz default now()
);

alter table arena_status enable row level security;
create policy "Public Manage Status" on arena_status for all using (true);

-- ============================================
-- 8. AUDIT LOGS
-- adminService.getAuditLogs(): SELECT * ORDER BY created_at DESC LIMIT ?
-- adminService.logAction(): INSERT (admin_username, action, details)
-- ============================================
create table audit_logs (
    id uuid default gen_random_uuid() primary key,
    admin_username text,
    action text not null,
    details jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created on audit_logs(created_at desc);

alter table audit_logs enable row level security;
create policy "Public Manage Logs" on audit_logs for all using (true);

-- ============================================
-- 9. BANS
-- adminService.toggleUserBan(): INSERT on ban, DELETE on unban
-- ============================================
create table bans (
    id uuid default gen_random_uuid() primary key,
    username text not null references profiles(username) on delete cascade,
    reason text,
    banned_by text,
    expires_at timestamptz,
    created_at timestamptz default now()
);

alter table bans enable row level security;
create policy "Public Manage Bans" on bans for all using (true);

-- ============================================
-- 10. APP CONFIG
-- leaderboardService.verifyAdminPassword(): SELECT value WHERE key='admin_password'
-- GlobalPasswordPage.tsx: SELECT value WHERE key=?
-- AdminDashboard.tsx: SELECT * FROM app_config
-- ============================================
create table app_config (
    key text primary key,
    value text not null
);

alter table app_config enable row level security;
create policy "Public Manage Config" on app_config for all using (true);

-- ============================================
-- 11. GAMES TABLE
-- gamesService.getAllGames(): SELECT * ORDER BY position ASC
-- gamesService.updateGamePosition(): UPDATE position WHERE id=?
-- gamesService.updateAllPositions(): UPSERT games
-- ============================================
create table games (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    icon_name text,
    view_id text not null unique,
    is_primary boolean default false,
    is_visible boolean default true,
    has_obs boolean default false,
    is_coming_soon boolean default false,
    coming_soon_text text default 'قريباً',
    position integer default 0,
    created_at timestamptz default now()
);

create index if not exists games_position_idx on games (position);

alter table games enable row level security;
create policy "Allow public read games" on games for select using (true);
create policy "Allow all actions for games" on games for all using (true) with check (true);

-- ============================================
-- 12. STORE & INVENTORY
-- store_items: UserDashboard.tsx SELECT * WHERE is_active=true ORDER BY price ASC
-- user_inventory: SELECT item_id WHERE user_id=?, INSERT, UPDATE is_equipped, SELECT with join
-- transactions: SELECT * WHERE user_id=? ORDER BY created_at DESC, INSERT
-- users: UPDATE points WHERE id=? (sync with leaderboard)
-- profiles: UPDATE active_frame_url WHERE username ILIKE ? (equip frame)
-- ============================================
create type item_type as enum ('FRAME', 'EFFECT', 'BADGE');

create table store_items (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    type item_type not null,
    price bigint not null default 0,
    image_url text,
    config jsonb default '{}'::jsonb,
    is_active boolean default true,
    created_at timestamptz default now()
);

alter table store_items enable row level security;
create policy "Allow public read store_items" on store_items for select using (true);

create table user_inventory (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references users(id) on delete cascade,
    item_id uuid references store_items(id) on delete cascade,
    is_equipped boolean default false,
    acquired_at timestamptz default now(),
    unique(user_id, item_id)
);

create index if not exists idx_inventory_user on user_inventory(user_id);

alter table user_inventory enable row level security;
create policy "Allow users to read own inventory" on user_inventory for select using (true);
create policy "Allow users to manage own inventory" on user_inventory for all using (true);

create table transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references users(id) on delete cascade,
    amount bigint not null,
    type text not null,
    description text,
    created_at timestamptz default now()
);

create index if not exists idx_transactions_user on transactions(user_id);
create index if not exists idx_transactions_created on transactions(created_at desc);

alter table transactions enable row level security;
create policy "Allow users to read own transactions" on transactions for select using (true);
create policy "Allow users to insert own transactions" on transactions for insert with check (true);

-- ============================================
-- 13. SPONSORS
-- SponsorsWidget.tsx: SELECT * ORDER BY created_at ASC, INSERT, DELETE by id, UPDATE avatar_url
-- ============================================
create table sponsors (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    kick_username text not null,
    avatar_url text default '',
    created_at timestamptz default now()
);

alter table sponsors enable row level security;
create policy "Public Manage Sponsors" on sponsors for all using (true);

-- ============================================
-- 14. DEFAULT CONFIG DATA
-- ============================================
insert into app_config (key, value) values ('admin_password', '123456');

insert into arena_status (key, value) values ('global_mood', '{"theme": "default", "ambient": "standard", "particles": "none"}');
insert into arena_status (key, value) values ('viewer_override', '{"enabled": false, "count": 0}');
insert into arena_status (key, value) values ('audio_overlay', '{"enabled": false, "url": "", "volume": 0.5}');
insert into arena_status (key, value) values ('tournament_config', '{"active": false, "multiplier": 1, "win_goal": 5000}');

-- ============================================
-- 15. GAMES SEED DATA (23 games)
-- ============================================
insert into games (title, icon_name, view_id, is_primary, has_obs, is_coming_soon, position)
values
('ابدأ الفوازير', 'Sparkles', 'FAWAZIR_SELECT', true, false, false, 1),
('الكراسي الموسيقية', 'Armchair', 'MUSICAL_CHAIRS', true, false, false, 2),
('صائد الماوس باد', 'TecshIcon', 'GRID_HUNT', true, false, false, 3),
('تخمين الصورة', 'ImageIcon', 'BLUR_GUESS', false, false, false, 4),
('عجلة الحظ', 'Zap', 'SPIN_WHEEL', false, false, false, 5),
('سحب الجوائز', 'Gift', 'RAFFLE', false, false, false, 6),
('تحدي الأعلام', 'Flag', 'FLAG_QUIZ', false, false, false, 7),
('حرب الفرق', 'Users2', 'TEAM_BATTLE', false, false, false, 8),
('سباق الكتابة', 'Keyboard', 'TYPING_RACE', false, false, false, 9),
('حرب المصاقيل', 'Swords', 'MASAQIL_WAR', false, false, false, 10),
('تحدي الأكواب', 'Coffee', 'CUP_SHUFFLE', false, false, false, 11),
('حرب الألوان', 'PaintBucket', 'TERRITORY_WAR', false, false, false, 12),
('صادق أم كذاب', 'AlertTriangle', 'TRUTH_OR_LIE', false, true, false, 13),
('تحدي الرسم', 'PaintBucket', 'DRAWING_CHALLENGE', false, true, false, 14),
('حرب الفواكه', 'Sword', 'FRUIT_WAR', false, false, false, 15),
('جولة الشعارات', 'Globe', 'LOGO_ROUND', false, false, false, 16),
('تخمين الكلمات', 'Brain', 'FORBIDDEN_WORDS', false, true, false, 17),
('لعبة التصويت', 'Vote', 'VOTING_GAME', false, true, false, 18),
('القنبلة الموقوتة', 'Bomb', 'TIME_BOMB', false, false, false, 19),
('جسر الزجاج', 'Footprints', 'GLASS_BRIDGE_V2', false, false, false, 21),
('أرضية الحمم', 'Flame', 'FLOOR_IS_LAVA', false, false, false, 22),
('فك الشفرة', 'Smile', 'EMOJI_CODE', false, false, false, 23);

insert into games (title, icon_name, view_id, is_primary, has_obs, is_coming_soon, coming_soon_text, position)
values ('السكرابل السريع', 'Type', 'WORD_BUILDER', false, false, true, 'تحت التطوير', 20);

-- ============================================
-- 16. STORE SEED DATA (9 items)
-- ============================================
insert into store_items (name, description, type, price, image_url, config)
values
('الإطار البرونزي', 'إطار كلاسيكي للمبتدئين', 'FRAME', 500, 'برونزي.png', '{"borderColor": "#cd7f32"}'),
('الإطار الفضي', 'إطار فضي مميز للمنافسين الطموحين', 'FRAME', 1500, 'سلفر.png', '{"borderColor": "#c0c0c0"}'),
('الإطار الذهبي', 'إطار الذهب الفاخر للأعضاء المتألقين', 'FRAME', 3000, 'قولد.png', '{"borderColor": "#ffd700"}'),
('إطار الدايموند', 'إطار الألماس النادر والمبهر', 'FRAME', 4500, 'دايموند.png', '{"borderColor": "#b9f2ff"}'),
('الإطار النخبوي', 'الإطار الحصري للأساطير والنخبة فقط', 'FRAME', 7000, 'نخبوي.png', '{"borderColor": "#ff0000", "boxShadow": "0 0 20px #ff0000"}'),
('Diamond Sparkle', 'توهج الألماس الفريد', 'EFFECT', 2000, '', '{"animation": "pulse", "color": "#60a5fa"}'),
('Eagle Badge', 'وسام الصقر الجارح', 'BADGE', 300, '', '{"icon": "Zap", "color": "#f87171"}'),
('Crown of Kings', 'تاج الملوك الذهبي', 'BADGE', 5000, '', '{"icon": "Crown", "color": "#fbbf24"}'),
('Ghostly Aura', 'هالة الشبح الغامضة', 'EFFECT', 1200, '', '{"opacity": "0.5", "filter": "blur(2px)"}');

-- ============================================
-- تم الانتهاء! database جاهز
-- ============================================
