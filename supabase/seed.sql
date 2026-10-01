-- WeOne demo data. Run on an empty database after the migrations.
-- Demo users are inserted straight into auth.users with no password, so nobody
-- can sign in as them. Their profiles are created by the handle_new_user trigger
-- and filled in below. Notifications and activities come from the triggers.

-- Lookup helpers for this session only.
create function pg_temp.u(p_username text) returns uuid language sql stable as
  $$ select id from public.profiles where username = p_username $$;
create function pg_temp.s(p_name text) returns uuid language sql stable as
  $$ select id from public.skills where name = p_name $$;
create function pg_temp.p(p_slug text) returns uuid language sql stable as
  $$ select id from public.projects where slug = p_slug $$;

-- ---------------------------------------------------------------------------
-- Skills
-- ---------------------------------------------------------------------------
insert into public.skills (name, category) values
  ('JavaScript', 'Programming'), ('TypeScript', 'Programming'), ('React', 'Programming'),
  ('Next.js', 'Programming'), ('Vue.js', 'Programming'), ('Node.js', 'Programming'),
  ('Python', 'Programming'), ('Django', 'Programming'), ('FastAPI', 'Programming'),
  ('Go', 'Programming'), ('Java', 'Programming'), ('Kotlin', 'Programming'),
  ('Swift', 'Programming'), ('Flutter', 'Programming'), ('C++', 'Programming'),
  ('C#', 'Programming'), ('Unity', 'Programming'), ('SQL', 'Programming'),
  ('PostgreSQL', 'Programming'), ('Machine Learning', 'Programming'),
  ('Data Analysis', 'Programming'), ('Cybersecurity', 'Programming'),
  ('Figma', 'Design'), ('UI Design', 'Design'), ('UX Research', 'Design'),
  ('Prototyping', 'Design'), ('Branding', 'Design'), ('Motion Design', 'Design'),
  ('Product Management', 'Product'), ('Business Analysis', 'Product'),
  ('Agile', 'Product'), ('User Interviews', 'Product'),
  ('Git', 'Tools'), ('Docker', 'Tools'), ('Linux', 'Tools'), ('AWS', 'Tools'),
  ('Supabase', 'Tools'), ('QA Testing', 'Tools'),
  ('SMM', 'Marketing'), ('Content Writing', 'Marketing'), ('SEO', 'Marketing'),
  ('Copywriting', 'Marketing');

-- ---------------------------------------------------------------------------
-- Users and profiles
-- ---------------------------------------------------------------------------
create temp table seed_users (
  id uuid, username text, full_name text, city text, headline text, bio text,
  available boolean, online_ok boolean, looking_for text[], languages text[],
  interests text[], days_ago int
);

insert into seed_users values
  ('00000000-0000-4000-a000-000000000001', 'aziz_dev', 'Aziz Karimov', 'Toshkent',
   'Frontend dasturchi · React, TypeScript',
   'TATU talabasi. Tez ishlaydigan va chiroyli interfeyslar yasashni yoqtiraman. Hackathonlarda jamoa qidiraman.',
   true, true, '{hackathon_team,collaboration,startup}', '{Oʻzbek,Rus,Ingliz}', '{Startaplar,Open source}', 120),
  ('00000000-0000-4000-a000-000000000002', 'madina_ux', 'Madina Yusupova', 'Toshkent',
   'Product designer · Figma, UX research',
   'Foydalanuvchi bilan suhbatdan boshlab prototipgacha. Ijtimoiy foydali loyihalarda ishlashni xohlayman.',
   true, true, '{collaboration,startup,mentorship}', '{Oʻzbek,Ingliz}', '{Dizayn,Taʼlim}', 115),
  ('00000000-0000-4000-a000-000000000003', 'jasur_go', 'Jasur Rahimov', 'Samarqand',
   'Backend dasturchi · Go, PostgreSQL',
   'API va maʼlumotlar bazasi bilan ishlayman. Yuqori yuklamali tizimlarni oʻrganyapman.',
   true, true, '{hackathon_team,startup,open_source}', '{Oʻzbek,Rus}', '{Backend,Open source}', 110),
  ('00000000-0000-4000-a000-000000000004', 'nilufar_ml', 'Nilufar Toshmatova', 'Toshkent',
   'ML talaba · Python, kompyuter koʻrish',
   'Qishloq xoʻjaligi uchun kompyuter koʻrish modellari ustida ishlayman. Kaggle musobaqalarida qatnashaman.',
   true, true, '{hackathon_team,learning,collaboration}', '{Oʻzbek,Ingliz}', '{AI,Agrotexnologiya}', 105),
  ('00000000-0000-4000-a000-000000000005', 'bekzod_mobile', 'Bekzod Aliyev', 'Fargʻona',
   'Mobil dasturchi · Flutter',
   'Fargʻona vodiysi uchun mobil ilovalar yasayman. Ikki ilovam Play Marketda.',
   true, true, '{startup,freelance,collaboration}', '{Oʻzbek,Rus}', '{Mobil ilovalar,Transport}', 100),
  ('00000000-0000-4000-a000-000000000006', 'shahzoda_pm', 'Shahzoda Ergasheva', 'Toshkent',
   'Product manager · talaba',
   'Gʻoyani aniq rejaga aylantiraman. Jamoalar bilan ishlash va foydalanuvchi suhbatlari mening kuchli tomonim.',
   true, true, '{startup,internship,hackathon_team}', '{Oʻzbek,Ingliz,Rus}', '{Mahsulot,Taʼlim}', 95),
  ('00000000-0000-4000-a000-000000000007', 'otabek_py', 'Otabek Nazarov', 'Buxoro',
   'Python backend · Django, FastAPI',
   'Olimpiada dasturlashidan backendga oʻtdim. Toza va testlangan kod yozishni yaxshi koʻraman.',
   false, true, '{internship,open_source}', '{Oʻzbek,Rus}', '{Algoritmlar,Backend}', 90),
  ('00000000-0000-4000-a000-000000000008', 'dilnoza_design', 'Dilnoza Saidova', 'Namangan',
   'UI dizayner · brending va illustratsiya',
   'Brending va mobil interfeyslar. Kichik bizneslar uchun vizual uslub yarataman.',
   true, true, '{freelance,collaboration}', '{Oʻzbek}', '{Dizayn,Illustratsiya}', 85),
  ('00000000-0000-4000-a000-000000000009', 'sardor_fs', 'Sardor Mirzayev', 'Toshkent',
   'Full-stack dasturchi · Next.js, Node.js',
   'Gʻoyadan birinchi foydalanuvchigacha olib boraman. Ikki marta hackathon gʻolibi.',
   true, true, '{hackathon_team,startup}', '{Oʻzbek,Rus,Ingliz}', '{Startaplar,SaaS}', 80),
  ('00000000-0000-4000-a000-000000000010', 'kamola_data', 'Kamola Abdullayeva', 'Samarqand',
   'Data analyst · SQL, Python',
   'Raqamlardan xulosa chiqaraman. Oʻzbek tili uchun ochiq datasetlar yigʻyapman.',
   true, true, '{collaboration,open_source,learning}', '{Oʻzbek,Ingliz}', '{Maʼlumotlar,NLP}', 75),
  ('00000000-0000-4000-a000-000000000011', 'javohir_devops', 'Javohir Qodirov', 'Toshkent',
   'Junior DevOps · Docker, Linux, AWS',
   'Deploy va monitoringni avtomatlashtiraman. Talabalar loyihalariga infratuzilmada yordam beraman.',
   true, true, '{internship,collaboration}', '{Oʻzbek,Rus}', '{Infratuzilma,Linux}', 70),
  ('00000000-0000-4000-a000-000000000012', 'malika_mkt', 'Malika Hasanova', 'Fargʻona',
   'SMM va kontent marketing',
   'Yosh brendlar uchun Instagram va Telegram kanallarini oʻstiraman.',
   true, true, '{startup,freelance}', '{Oʻzbek,Rus}', '{Marketing,Kontent}', 65),
  ('00000000-0000-4000-a000-000000000013', 'ulugbek_ios', 'Ulugʻbek Sobirov', 'Toshkent',
   'iOS dasturchi · Swift',
   'Native iOS ilovalar. Animatsiya va qulay interfeyslarga eʼtibor beraman.',
   false, false, '{internship}', '{Oʻzbek,Ingliz}', '{Mobil ilovalar}', 60),
  ('00000000-0000-4000-a000-000000000014', 'zarina_qa', 'Zarina Ismoilova', 'Buxoro',
   'QA muhandis · manual va avtotest',
   'Xatolarni foydalanuvchidan oldin topaman. Avtotestlarni oʻrganyapman.',
   true, true, '{internship,collaboration,learning}', '{Oʻzbek,Rus}', '{Sifat,Testlash}', 55),
  ('00000000-0000-4000-a000-000000000015', 'islom_sec', 'Islom Tursunov', 'Namangan',
   'Kiberxavfsizlik · CTF ishqibozi',
   'CTF musobaqalarida qatnashaman va talabalar uchun xavfsizlik boʻyicha mashgʻulotlar oʻtkazaman.',
   true, true, '{hackathon_team,mentorship,open_source}', '{Oʻzbek,Ingliz}', '{Xavfsizlik,CTF}', 50),
  ('00000000-0000-4000-a000-000000000016', 'gulnoza_fe', 'Gulnoza Rashidova', 'Samarqand',
   'Frontend dasturchi · Vue.js',
   'Turizm va taʼlim sohasidagi saytlar ustida ishlayman.',
   true, true, '{collaboration,freelance}', '{Oʻzbek,Rus,Ingliz}', '{Turizm,Frontend}', 45),
  ('00000000-0000-4000-a000-000000000017', 'timur_game', 'Timur Xolmatov', 'Toshkent',
   'Oʻyin dasturchi · Unity, C#',
   'Kichik indie oʻyinlar yasayman. Game jamlarda jamoa qidiraman.',
   true, true, '{hackathon_team,collaboration}', '{Oʻzbek,Rus}', '{Oʻyinlar,3D}', 40),
  ('00000000-0000-4000-a000-000000000018', 'sevara_content', 'Sevara Qosimova', 'Toshkent',
   'Kontent yozuvchi · kopirayting',
   'Texnologiyalar haqida oddiy tilda yozaman. Startaplar uchun matnlar tayyorlayman.',
   true, true, '{startup,freelance,collaboration}', '{Oʻzbek,Ingliz}', '{Matn,Startaplar}', 35),
  ('00000000-0000-4000-a000-000000000019', 'doniyor_node', 'Doniyor Usmonov', 'Fargʻona',
   'Backend dasturchi · Node.js',
   'Telegram botlar va REST APIlar yozaman. Vodiydagi startaplarga yordam beraman.',
   true, true, '{hackathon_team,startup,collaboration}', '{Oʻzbek,Rus}', '{Botlar,Backend}', 30),
  ('00000000-0000-4000-a000-000000000020', 'feruza_ba', 'Feruza Jalilova', 'Toshkent',
   'Biznes analitik · talaba',
   'Talablarni yigʻaman va jarayonlarni soddalashtiraman. Fintech va taʼlim menga qiziq.',
   true, false, '{internship,mentorship}', '{Oʻzbek,Rus,Ingliz}', '{Fintech,Taʼlim}', 25);

insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', su.id, 'authenticated', 'authenticated',
  su.username || '@demo.weone.example', now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object('full_name', su.full_name),
  now() - make_interval(days => su.days_ago), now() - make_interval(days => su.days_ago),
  '', '', '', ''
from seed_users su;

update public.profiles p
set username     = su.username,
    full_name    = su.full_name,
    city         = su.city,
    headline     = su.headline,
    bio          = su.bio,
    available    = su.available,
    is_online_ok = su.online_ok,
    looking_for  = su.looking_for,
    languages    = su.languages,
    interests    = su.interests,
    onboarded    = true,
    created_at   = now() - make_interval(days => su.days_ago)
from seed_users su
where p.id = su.id;

insert into public.user_skills (user_id, skill_id, level)
select pg_temp.u(v.username), pg_temp.s(v.skill), v.level
from (values
  ('aziz_dev', 'React', 'strong'), ('aziz_dev', 'TypeScript', 'strong'), ('aziz_dev', 'Next.js', 'comfortable'),
  ('aziz_dev', 'JavaScript', 'strong'), ('aziz_dev', 'Figma', 'learning'), ('aziz_dev', 'Git', 'comfortable'),
  ('madina_ux', 'Figma', 'strong'), ('madina_ux', 'UI Design', 'strong'), ('madina_ux', 'UX Research', 'comfortable'),
  ('madina_ux', 'Prototyping', 'strong'), ('madina_ux', 'User Interviews', 'comfortable'),
  ('jasur_go', 'Go', 'strong'), ('jasur_go', 'PostgreSQL', 'strong'), ('jasur_go', 'Docker', 'comfortable'),
  ('jasur_go', 'SQL', 'strong'), ('jasur_go', 'Linux', 'comfortable'), ('jasur_go', 'Git', 'comfortable'),
  ('nilufar_ml', 'Python', 'strong'), ('nilufar_ml', 'Machine Learning', 'comfortable'),
  ('nilufar_ml', 'Data Analysis', 'comfortable'), ('nilufar_ml', 'FastAPI', 'learning'),
  ('bekzod_mobile', 'Flutter', 'strong'), ('bekzod_mobile', 'Kotlin', 'comfortable'),
  ('bekzod_mobile', 'Supabase', 'comfortable'), ('bekzod_mobile', 'Git', 'comfortable'),
  ('shahzoda_pm', 'Product Management', 'comfortable'), ('shahzoda_pm', 'User Interviews', 'strong'),
  ('shahzoda_pm', 'Agile', 'comfortable'), ('shahzoda_pm', 'Figma', 'learning'),
  ('otabek_py', 'Python', 'strong'), ('otabek_py', 'Django', 'strong'), ('otabek_py', 'FastAPI', 'comfortable'),
  ('otabek_py', 'C++', 'strong'), ('otabek_py', 'PostgreSQL', 'comfortable'),
  ('dilnoza_design', 'Figma', 'strong'), ('dilnoza_design', 'Branding', 'strong'),
  ('dilnoza_design', 'UI Design', 'comfortable'), ('dilnoza_design', 'Motion Design', 'learning'),
  ('sardor_fs', 'Next.js', 'strong'), ('sardor_fs', 'Node.js', 'strong'), ('sardor_fs', 'TypeScript', 'strong'),
  ('sardor_fs', 'React', 'comfortable'), ('sardor_fs', 'Supabase', 'comfortable'), ('sardor_fs', 'PostgreSQL', 'comfortable'),
  ('kamola_data', 'SQL', 'strong'), ('kamola_data', 'Python', 'comfortable'),
  ('kamola_data', 'Data Analysis', 'strong'), ('kamola_data', 'Machine Learning', 'learning'),
  ('javohir_devops', 'Docker', 'strong'), ('javohir_devops', 'Linux', 'strong'),
  ('javohir_devops', 'AWS', 'comfortable'), ('javohir_devops', 'Go', 'learning'),
  ('malika_mkt', 'SMM', 'strong'), ('malika_mkt', 'Content Writing', 'comfortable'),
  ('malika_mkt', 'Copywriting', 'comfortable'), ('malika_mkt', 'SEO', 'learning'),
  ('ulugbek_ios', 'Swift', 'strong'), ('ulugbek_ios', 'Git', 'comfortable'), ('ulugbek_ios', 'Figma', 'learning'),
  ('zarina_qa', 'QA Testing', 'strong'), ('zarina_qa', 'Python', 'learning'), ('zarina_qa', 'SQL', 'comfortable'),
  ('islom_sec', 'Cybersecurity', 'strong'), ('islom_sec', 'Linux', 'strong'),
  ('islom_sec', 'Python', 'comfortable'), ('islom_sec', 'C++', 'comfortable'),
  ('gulnoza_fe', 'Vue.js', 'strong'), ('gulnoza_fe', 'JavaScript', 'strong'),
  ('gulnoza_fe', 'TypeScript', 'comfortable'), ('gulnoza_fe', 'Figma', 'comfortable'),
  ('timur_game', 'Unity', 'strong'), ('timur_game', 'C#', 'strong'), ('timur_game', 'Motion Design', 'learning'),
  ('sevara_content', 'Content Writing', 'strong'), ('sevara_content', 'Copywriting', 'strong'),
  ('sevara_content', 'SEO', 'comfortable'),
  ('doniyor_node', 'Node.js', 'strong'), ('doniyor_node', 'JavaScript', 'strong'),
  ('doniyor_node', 'PostgreSQL', 'comfortable'), ('doniyor_node', 'Docker', 'learning'),
  ('feruza_ba', 'Business Analysis', 'comfortable'), ('feruza_ba', 'SQL', 'learning'),
  ('feruza_ba', 'Agile', 'comfortable'), ('feruza_ba', 'User Interviews', 'comfortable')
) as v(username, skill, level);

insert into public.education (user_id, institution, degree, field, start_year, end_year)
select pg_temp.u(v.username), v.institution, v.degree, v.field, v.start_year, v.end_year
from (values
  ('aziz_dev', 'Muhammad al-Xorazmiy nomidagi TATU', 'Bakalavr', 'Dasturiy injiniring', 2023, 2027),
  ('madina_ux', 'Westminster xalqaro universiteti', 'Bakalavr', 'Biznes axborot tizimlari', 2022, 2026),
  ('jasur_go', 'Samarqand davlat universiteti', 'Bakalavr', 'Amaliy matematika', 2022, 2026),
  ('nilufar_ml', 'Inha universiteti (Toshkent)', 'Bakalavr', 'Kompyuter fanlari', 2023, 2027),
  ('bekzod_mobile', 'Fargʻona davlat universiteti', 'Bakalavr', 'Axborot tizimlari', 2021, 2025),
  ('shahzoda_pm', 'Westminster xalqaro universiteti', 'Bakalavr', 'Biznes boshqaruvi', 2023, 2027),
  ('otabek_py', 'Buxoro davlat universiteti', 'Bakalavr', 'Kompyuter injiniringi', 2022, 2026),
  ('sardor_fs', 'Muhammad al-Xorazmiy nomidagi TATU', 'Bakalavr', 'Kompyuter injiniringi', 2021, 2025),
  ('kamola_data', 'Samarqand davlat universiteti', 'Bakalavr', 'Statistika', 2022, 2026),
  ('islom_sec', 'Namangan muhandislik-texnologiya instituti', 'Bakalavr', 'Axborot xavfsizligi', 2023, 2027),
  ('feruza_ba', 'Toshkent davlat iqtisodiyot universiteti', 'Bakalavr', 'Raqamli iqtisodiyot', 2024, 2028)
) as v(username, institution, degree, field, start_year, end_year);

-- ---------------------------------------------------------------------------
-- Journey. Shared hackathon/competition entries are confirmed further below.
-- ---------------------------------------------------------------------------
create temp table seed_journey (
  ref text, username text, type text, title text, organization text, role text,
  result text, description text, start_date date, end_date date, skills text[]
);

insert into seed_journey values
  ('ai500_aziz', 'aziz_dev', 'hackathon', 'AI500 Hackathon', 'Toshkent Tech Hub', 'Frontend', 'Gʻolib',
   'Fermerlar uchun ekin kasalligini aniqlovchi ilova yasadik.', '2026-03-14', '2026-03-16', '{React,TypeScript}'),
  ('ai500_jasur', 'jasur_go', 'hackathon', 'AI500 Hackathon', 'Toshkent Tech Hub', 'Backend', 'Gʻolib',
   'API va rasm yuklash xizmatini yozdim.', '2026-03-14', '2026-03-16', '{Go,PostgreSQL}'),
  ('ai500_nilufar', 'nilufar_ml', 'hackathon', 'AI500 Hackathon', 'Toshkent Tech Hub', 'ML', 'Gʻolib',
   'Barg rasmlari boʻyicha klassifikatsiya modelini oʻqitdim.', '2026-03-14', '2026-03-16', '{Python,"Machine Learning"}'),
  ('ai500_sardor', 'sardor_fs', 'hackathon', 'AI500 Hackathon', 'Toshkent Tech Hub', 'Full-stack', 'Gʻolib',
   'Deploy va integratsiya.', '2026-03-14', '2026-03-16', '{Next.js,Node.js}'),
  ('dg_bekzod', 'bekzod_mobile', 'hackathon', 'Raqamli Avlod Hackathon', 'Fargʻona IT Hub', 'Mobil', 'Finalchi',
   'Shaharlararo yoʻlovchilar uchun ilova prototipi.', '2025-11-08', '2025-11-09', '{Flutter}'),
  ('dg_madina', 'madina_ux', 'hackathon', 'Raqamli Avlod Hackathon', 'Fargʻona IT Hub', 'Dizayner', 'Finalchi',
   'Ilovaning UX va prototipi.', '2025-11-08', '2025-11-09', '{Figma,Prototyping}'),
  ('dg_shahzoda', 'shahzoda_pm', 'hackathon', 'Raqamli Avlod Hackathon', 'Fargʻona IT Hub', 'Product', 'Finalchi',
   'Pitch va foydalanuvchi suhbatlari.', '2025-11-08', '2025-11-09', '{"User Interviews"}'),
  ('dg_doniyor', 'doniyor_node', 'hackathon', 'Raqamli Avlod Hackathon', 'Fargʻona IT Hub', 'Backend', 'Finalchi',
   'Telegram bot va API.', '2025-11-08', '2025-11-09', '{Node.js}'),
  ('icpc_otabek', 'otabek_py', 'competition', 'Dasturlash chempionati', 'Oʻzbekiston dasturlash federatsiyasi', 'Ishtirokchi', '3-oʻrin',
   'Jamoaviy olimpiada.', '2025-10-18', '2025-10-18', '{C++}'),
  ('icpc_islom', 'islom_sec', 'competition', 'Dasturlash chempionati', 'Oʻzbekiston dasturlash federatsiyasi', 'Ishtirokchi', '3-oʻrin',
   'Jamoaviy olimpiada.', '2025-10-18', '2025-10-18', '{C++}'),
  ('ctf_islom', 'islom_sec', 'competition', 'Respublika CTF', 'Kiberxavfsizlik markazi', 'Kapitan', '1-oʻrin',
   'Web va kriptografiya topshiriqlari.', '2026-05-20', '2026-05-21', '{Cybersecurity,Linux}'),
  ('gamejam_timur', 'timur_game', 'hackathon', 'Game Jam Toshkent', 'Indie Uz', 'Dasturchi', null,
   '48 soatda platformer oʻyin.', '2026-02-07', '2026-02-09', '{Unity,C#}'),
  ('intern_jasur', 'jasur_go', 'internship', 'Backend amaliyot', 'Ipak Yoʻli Tech', 'Stajyor', null,
   'Toʻlov xizmati uchun mikroservis.', '2025-06-01', '2025-08-31', '{Go,Docker}'),
  ('intern_zarina', 'zarina_qa', 'internship', 'QA amaliyot', 'Kod Lab', 'Stajyor', null,
   'Mobil ilova uchun test-keyslar.', '2026-01-15', '2026-04-15', '{"QA Testing"}'),
  ('course_kamola', 'kamola_data', 'course', 'Data Analytics kursi', 'Samarqand Startup Hub', null, 'Sertifikat',
   'SQL, vizualizatsiya va statistika.', '2025-09-01', '2025-12-20', '{SQL,"Data Analysis"}'),
  ('oss_aziz', 'aziz_dev', 'open_source', 'Oʻzbekcha UI kutubxonasi', 'GitHub', 'Contributor', null,
   'Komponentlar tarjimasi va tuzatishlar.', '2025-12-01', null, '{React,TypeScript}'),
  ('meetup_javohir', 'javohir_devops', 'meetup', 'DevOps Toshkent meetup', 'DevOps Uz', 'Maʼruzachi', null,
   'Docker bilan talabalar loyihasini deploy qilish haqida.', '2026-04-10', '2026-04-10', '{Docker}'),
  ('volunteer_malika', 'malika_mkt', 'volunteer', 'IT kunlari festivali', 'Fargʻona IT Hub', 'SMM', null,
   'Festival kanallarini yuritdim.', '2025-09-10', '2025-09-12', '{SMM}'),
  ('workshop_dilnoza', 'dilnoza_design', 'workshop', 'Brending ustaxonasi', 'Namangan Creative', 'Ishtirokchi', null,
   'Kichik bizneslar uchun logotip.', '2026-06-05', '2026-06-06', '{Branding,Figma}'),
  ('job_sardor', 'sardor_fs', 'job', 'Junior full-stack dasturchi', 'Kod Lab', 'Dasturchi', null,
   'Ichki CRM tizimi.', '2025-09-01', null, '{Next.js,PostgreSQL}');

with inserted as (
  insert into public.journey_items (
    user_id, type, title, organization, role, result, description, start_date, end_date, created_at
  )
  select pg_temp.u(sj.username), sj.type, sj.title, sj.organization, sj.role, sj.result,
         sj.description, sj.start_date, sj.end_date, sj.start_date::timestamptz + interval '3 days'
  from seed_journey sj
  returning id, user_id, title, start_date
)
insert into public.journey_item_skills (journey_item_id, skill_id)
select i.id, pg_temp.s(skill)
from inserted i
join seed_journey sj
  on pg_temp.u(sj.username) = i.user_id and sj.title = i.title and sj.start_date = i.start_date
cross join unnest(sj.skills) as skill;

-- Teammates confirm each other's entries; the trigger sets `verified`.
insert into public.journey_confirmations (journey_item_id, confirmer_id, created_at)
select ji.id, pg_temp.u(v.confirmer), ji.created_at + interval '1 day'
from (values
  ('jasur_go', 'aziz_dev'), ('aziz_dev', 'jasur_go'), ('aziz_dev', 'nilufar_ml'), ('nilufar_ml', 'sardor_fs'),
  ('madina_ux', 'bekzod_mobile'), ('bekzod_mobile', 'madina_ux'), ('doniyor_node', 'shahzoda_pm'),
  ('islom_sec', 'otabek_py')
) as v(confirmer, owner)
join public.journey_items ji
  on ji.user_id = pg_temp.u(v.owner) and ji.type in ('hackathon', 'competition')
 and ji.title in ('AI500 Hackathon', 'Raqamli Avlod Hackathon', 'Dasturlash chempionati');

-- ---------------------------------------------------------------------------
-- Projects (owner membership is added by trigger)
-- ---------------------------------------------------------------------------
insert into public.projects (
  owner_id, name, slug, tagline, description, category, status, is_looking, city, is_online, github_url, demo_url, created_at
)
select pg_temp.u(v.owner), v.name, v.slug, v.tagline, v.description, v.category, v.status,
       v.is_looking, v.city, v.is_online, v.github_url, v.demo_url, now() - make_interval(days => v.days_ago)
from (values
  ('aziz_dev', 'Talaba Bozori', 'talaba-bozori', 'Talabalar uchun ikkinchi qoʻl buyumlar bozori',
   'Kitob, texnika va yotoqxona buyumlarini universitet ichida sotish va almashish. Hozir Toshkentdagi uchta universitetda sinovdan oʻtyapti.',
   'Marketplace', 'building', true, 'Toshkent', true, 'https://github.com/weone-demo/talaba-bozori', null, 60),
  ('jasur_go', 'Navbat', 'navbat', 'Poliklinikalar uchun onlayn navbat',
   'Bemor navbatni telefon orqali oladi va kelish vaqtini biladi. Samarqanddagi bitta poliklinika bilan pilot rejalashtirilgan.',
   'Sogʻliq', 'idea', true, 'Samarqand', true, null, null, 50),
  ('madina_ux', 'KitobUz', 'kitobuz', 'Kitob almashish uchun ilova',
   'Oʻqilgan kitoblarni shahar ichida almashish. 600 dan ortiq foydalanuvchi.',
   'Taʼlim', 'launched', false, 'Toshkent', true, null, 'https://kitobuz.example', 90),
  ('nilufar_ml', 'AgroSense', 'agrosense', 'Barg rasmi orqali ekin kasalligini aniqlash',
   'AI500 hackathonida boshlangan loyiha. Model 12 xil kasallikni ajratadi, endi fermerlar bilan sinovdamiz.',
   'Qishloq xoʻjaligi', 'building', true, 'Toshkent', true, 'https://github.com/weone-demo/agrosense', null, 45),
  ('bekzod_mobile', 'Yoʻl Hamroh', 'yol-hamroh', 'Vodiy shaharlari orasida birga yoʻl yurish',
   'Fargʻona, Andijon va Namangan orasida yoʻlovchi va haydovchilarni bogʻlaydigan mobil ilova.',
   'Transport', 'building', true, 'Fargʻona', false, null, null, 40),
  ('shahzoda_pm', 'Oʻquv Reja', 'oquv-reja', 'Talabalar uchun haftalik oʻqish rejasi',
   'Dars jadvali va topshiriqlarni bitta joyda yigʻib, haftalik reja tuzib beradi.',
   'Taʼlim', 'launched', false, 'Toshkent', true, null, 'https://oquvreja.example', 70),
  ('islom_sec', 'CTF Arena', 'ctf-arena', 'Talabalar uchun kiberxavfsizlik mashgʻulotlari',
   'Oʻzbek tilida CTF topshiriqlari va reyting. Universitet klublari uchun.',
   'Xavfsizlik', 'idea', true, 'Namangan', true, null, null, 20),
  ('kamola_data', 'Ovoz', 'ovoz', 'Oʻzbek nutqi uchun ochiq dataset',
   'Koʻngillilar ovoz yozib beradi, biz tozalab ochiq dataset sifatida chiqaramiz.',
   'AI', 'building', true, 'Samarqand', true, 'https://github.com/weone-demo/ovoz', null, 30)
) as v(owner, name, slug, tagline, description, category, status, is_looking, city, is_online, github_url, demo_url, days_ago);

insert into public.project_skills (project_id, skill_id)
select pg_temp.p(v.slug), pg_temp.s(skill)
from (values
  ('talaba-bozori', '{Next.js,TypeScript,Supabase,Figma}'::text[]),
  ('navbat', '{Go,PostgreSQL,Flutter}'),
  ('kitobuz', '{Flutter,Supabase,Figma}'),
  ('agrosense', '{Python,"Machine Learning",FastAPI,React}'),
  ('yol-hamroh', '{Flutter,Node.js,PostgreSQL}'),
  ('oquv-reja', '{React,Node.js,Figma}'),
  ('ctf-arena', '{Cybersecurity,Linux,Docker,Python}'),
  ('ovoz', '{Python,"Data Analysis",SQL}')
) as v(slug, skills)
cross join unnest(v.skills) as skill;

insert into public.project_members (project_id, user_id, role, created_at)
select pg_temp.p(v.slug), pg_temp.u(v.username), v.role, now() - make_interval(days => v.days_ago)
from (values
  ('talaba-bozori', 'sardor_fs', 'Backend', 55),
  ('talaba-bozori', 'dilnoza_design', 'Dizayner', 50),
  ('kitobuz', 'bekzod_mobile', 'Mobil dasturchi', 85),
  ('kitobuz', 'malika_mkt', 'Marketing', 80),
  ('agrosense', 'jasur_go', 'Backend', 44),
  ('agrosense', 'aziz_dev', 'Frontend', 43),
  ('yol-hamroh', 'doniyor_node', 'Backend', 38),
  ('oquv-reja', 'aziz_dev', 'Frontend', 65),
  ('oquv-reja', 'zarina_qa', 'QA', 60),
  ('ovoz', 'nilufar_ml', 'ML', 25),
  ('ovoz', 'sevara_content', 'Kontent', 22),
  ('ctf-arena', 'javohir_devops', 'Infratuzilma', 15)
) as v(slug, username, role, days_ago);

create temp table seed_roles (slug text, title text, is_open boolean, skills text[]);
insert into seed_roles values
  ('talaba-bozori', 'Mobil dasturchi', true, '{Flutter}'),
  ('talaba-bozori', 'Marketing', true, '{SMM,"Content Writing"}'),
  ('navbat', 'Backend dasturchi', true, '{Go,PostgreSQL}'),
  ('navbat', 'Mobil dasturchi', true, '{Flutter}'),
  ('navbat', 'UI dizayner', true, '{Figma,"UI Design"}'),
  ('agrosense', 'Mobil dasturchi', true, '{Flutter,Kotlin}'),
  ('agrosense', 'Product manager', true, '{"Product Management","User Interviews"}'),
  ('yol-hamroh', 'UI dizayner', true, '{Figma,Prototyping}'),
  ('yol-hamroh', 'QA muhandis', true, '{"QA Testing"}'),
  ('ctf-arena', 'Frontend dasturchi', true, '{React,TypeScript}'),
  ('ctf-arena', 'Kontent muallifi', false, '{"Content Writing"}'),
  ('ovoz', 'Backend dasturchi', true, '{Python,FastAPI}'),
  ('ovoz', 'Frontend dasturchi', true, '{Vue.js}');

insert into public.project_roles (project_id, title, is_open)
select pg_temp.p(slug), title, is_open from seed_roles;

insert into public.project_role_skills (project_role_id, skill_id)
select r.id, pg_temp.s(skill)
from seed_roles sr
join public.project_roles r on r.project_id = pg_temp.p(sr.slug) and r.title = sr.title
cross join unnest(sr.skills) as skill;

insert into public.join_requests (project_id, user_id, project_role_id, message, created_at)
select pg_temp.p(v.slug), pg_temp.u(v.username),
       (select id from public.project_roles where project_id = pg_temp.p(v.slug) and title = v.role_title),
       v.message, now() - make_interval(days => v.days_ago)
from (values
  ('talaba-bozori', 'bekzod_mobile', 'Mobil dasturchi', 'Flutterda ikki ilova chiqarganman, qoʻshilishni xohlayman.', 3),
  ('navbat', 'ulugbek_ios', null, 'iOS versiyasi kerak boʻlsa yordam beraman.', 2),
  ('ovoz', 'gulnoza_fe', 'Frontend dasturchi', 'Ovoz yozish sahifasini Vue bilan qila olaman.', 1),
  ('yol-hamroh', 'zarina_qa', 'QA muhandis', 'Mobil ilovalarni testlash tajribam bor.', 4)
) as v(slug, username, role_title, message, days_ago);

-- ---------------------------------------------------------------------------
-- Connections: all are sent first, then most are accepted, so the triggers
-- create both the request and the accepted notifications and activities.
-- ---------------------------------------------------------------------------
insert into public.connections (requester_id, addressee_id, created_at)
select pg_temp.u(v.requester), pg_temp.u(v.addressee), now() - make_interval(days => v.days_ago)
from (values
  ('aziz_dev', 'jasur_go', 30), ('aziz_dev', 'nilufar_ml', 29), ('aziz_dev', 'sardor_fs', 28),
  ('madina_ux', 'bekzod_mobile', 27), ('madina_ux', 'shahzoda_pm', 26), ('jasur_go', 'nilufar_ml', 25),
  ('sardor_fs', 'javohir_devops', 20), ('kamola_data', 'nilufar_ml', 18), ('otabek_py', 'islom_sec', 16),
  ('doniyor_node', 'bekzod_mobile', 14), ('dilnoza_design', 'aziz_dev', 12), ('malika_mkt', 'madina_ux', 10),
  ('timur_game', 'aziz_dev', 2), ('gulnoza_fe', 'kamola_data', 2), ('feruza_ba', 'shahzoda_pm', 1),
  ('zarina_qa', 'bekzod_mobile', 1)
) as v(requester, addressee, days_ago);

update public.connections
set status = 'accepted'
where created_at < now() - interval '5 days';

insert into public.collab_requests (sender_id, receiver_id, reason, project_id, message, created_at)
select pg_temp.u(v.sender), pg_temp.u(v.receiver), v.reason, pg_temp.p(v.slug), v.message,
       now() - make_interval(days => v.days_ago)
from (values
  ('nilufar_ml', 'kamola_data', 'project', 'agrosense', 'AgroSense uchun dataset tozalashda yordam bera olasizmi?', 9),
  ('sardor_fs', 'otabek_py', 'hackathon', null, 'Keyingi hackathonga backend kerak, birga qatnashamizmi?', 3),
  ('islom_sec', 'aziz_dev', 'project', 'ctf-arena', 'CTF Arena uchun frontend qidiryapmiz.', 1)
) as v(sender, receiver, reason, slug, message, days_ago);

update public.collab_requests set status = 'accepted' where created_at < now() - interval '5 days';

-- ---------------------------------------------------------------------------
-- Conversations (written directly; the app goes through start_conversation)
-- ---------------------------------------------------------------------------
insert into public.conversations (id, created_at) values
  ('00000000-0000-4000-c000-000000000001', now() - interval '29 days'),
  ('00000000-0000-4000-c000-000000000002', now() - interval '24 days'),
  ('00000000-0000-4000-c000-000000000003', now() - interval '8 days');

insert into public.conversation_members (conversation_id, user_id, last_read_at)
select v.conversation_id::uuid, pg_temp.u(v.username), now() - make_interval(hours => v.read_hours_ago)
from (values
  ('00000000-0000-4000-c000-000000000001', 'aziz_dev', 30),
  ('00000000-0000-4000-c000-000000000001', 'jasur_go', 0),
  ('00000000-0000-4000-c000-000000000002', 'madina_ux', 0),
  ('00000000-0000-4000-c000-000000000002', 'bekzod_mobile', 0),
  ('00000000-0000-4000-c000-000000000003', 'nilufar_ml', 0),
  ('00000000-0000-4000-c000-000000000003', 'kamola_data', 48)
) as v(conversation_id, username, read_hours_ago);

insert into public.messages (conversation_id, sender_id, body, kind, project_id, created_at)
select v.conversation_id::uuid, pg_temp.u(v.sender), v.body, v.kind, pg_temp.p(v.slug),
       now() - make_interval(hours => v.hours_ago)
from (values
  ('00000000-0000-4000-c000-000000000001', 'aziz_dev', 'Salom! AI500 dagi API juda tez ishladi, rahmat.', 'text', null, 690),
  ('00000000-0000-4000-c000-000000000001', 'jasur_go', 'Rahmat! AgroSense ni davom ettiramizmi?', 'text', null, 688),
  ('00000000-0000-4000-c000-000000000001', 'aziz_dev', 'Albatta. Frontendni men olaman.', 'text', null, 686),
  ('00000000-0000-4000-c000-000000000001', 'jasur_go', 'Zoʻr, ertaga rasm yuklashni ulayman.', 'text', null, 26),
  ('00000000-0000-4000-c000-000000000002', 'madina_ux', 'KitobUz ning yangi ekranlarini koʻrdingizmi?', 'text', null, 100),
  ('00000000-0000-4000-c000-000000000002', 'bekzod_mobile', 'Ha, bugun Flutterda yigʻaman.', 'text', null, 98),
  ('00000000-0000-4000-c000-000000000003', 'nilufar_ml', 'Taklifni qabul qilganingiz uchun rahmat!', 'text', null, 190),
  ('00000000-0000-4000-c000-000000000003', 'nilufar_ml', '', 'project_invite', 'agrosense', 189),
  ('00000000-0000-4000-c000-000000000003', 'nilufar_ml', 'Dataset papkasini ham ulashdim.', 'text', null, 20)
) as v(conversation_id, sender, body, kind, slug, hours_ago);

-- A couple of older notifications already seen.
update public.notifications set read = true where created_at < now() - interval '20 days';
