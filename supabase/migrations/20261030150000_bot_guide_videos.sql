-- Video lessons for the bot's replacement guides ("▶️ Дивитися відео" button).
-- Official Ecosoft (youtube.com/@EcosoftUa) Ukrainian videos where they exist.
update public.bot_guides set video_url = 'https://www.youtube.com/watch?v=8rfTlfvE33U'
  where title like '%STANDARD — заміна картриджів%';

update public.bot_guides set video_url = 'https://www.youtube.com/watch?v=ptLqd_81OKU'
  where title like '%ABSOLUTE — заміна картриджів%';

-- One guide covers both PURE models: Balance video on the button, AquaCalcium as a link in the text.
update public.bot_guides set
  video_url = 'https://www.youtube.com/watch?v=YzSoVtHBJNo',
  body = body || E'\n\n▶️ Відео для PURE AquaCalcium: https://www.youtube.com/watch?v=YYecs2RfXsc'
  where title like '%PURE (Balance / AquaCalcium)%' and body not like '%YYecs2RfXsc%';

update public.bot_guides set video_url = 'https://www.youtube.com/watch?v=p-nek88Qxi0'
  where title like '%CROSS 90 — заміна картриджів%';

-- No official Ecosoft video for mainline housings; this one is generic and popular.
update public.bot_guides set video_url = 'https://www.youtube.com/watch?v=ZmAOnl5_Cuk'
  where title like '%Заміна картриджа в магістральному фільтрі%';

update public.bot_guides set video_url = 'https://www.youtube.com/watch?v=PiO5H63nvtk'
  where title like '%Монтаж фільтра зворотного осмосу%';
