-- One spelling per product characteristic (audit ECO-007, `npm run audit:specs`).
-- Names: no footnote stars, °C with a Latin C, м³ / дм³, O₂, synonyms merged.
-- Where every value of an unlabelled property carries the same unit, the unit
-- moves into the name ("Вага" "6 кг" → "Вага, кг" "6"); "0,6 м" layer heights
-- become millimetres like the rest. Values in other units (e.g. "до 6 атм")
-- are left untouched. Repeated names within one product keep the first row.

create function pg_temp.normalize_spec(label text, value text) returns jsonb
language plpgsql immutable as $$
declare
  l text := btrim(regexp_replace(label, '\s+', ' ', 'g'));
  v text := btrim(regexp_replace(value, '\s+', ' ', 'g'));
begin
  -- Spelling of names.
  l := regexp_replace(l, '\s*\*+', '', 'g');
  l := replace(replace(l, '°С', '°C'), '℃', '°C');
  l := regexp_replace(l, '(^|[^а-яіїєґa-z])(д?м)3($|[^0-9])', '\1\2³\3', 'gi');
  l := replace(replace(l, 'мг О2/л', 'мг O₂/л'), 'мг O2/л', 'мг O₂/л');
  l := case l
    when 'Тиск на вході, атм.' then 'Тиск на вході, атм'
    when 'Термін експлуатації не більше, міс.' then 'Термін експлуатації не більше, місяців'
    when 'Продуктивність робоча / максимальна, м³/год' then 'Продуктивність робоча/максимальна, м³/год'
    when 'манган, мг/л' then 'Манган, мг/л'
    when 'Габаритні розміри фільтра, (В х Д), см' then 'Габаритні розміри фільтра (В х Д), см'
    when 'Габаритні розміри фільтра, (В х Ш х Г), см' then 'Габаритні розміри фільтра (В х Ш х Г), см'
    when 'Розміри бака, В×Ш×Г, мм' then 'Розміри бака, В х Ш х Г, мм'
    when 'Вага фільтра, кг (в базової комплектації)' then 'Вага фільтра, кг (в базовій комплектації)'
    when 'Загальне мікробне число (ЗМЧ), од/мг' then 'Загальне мікробне число (ЗМЧ), од/мл'
    when 'Йодне число, мг/г (мін.)' then 'Йодне число, мг/г (мінімум)'
    when 'Вміст вологи при пакуванні, % (макc.)' then 'Вміст вологи при пакуванні, % (максимум)'
    when 'Вміст вологи при пакуванні, % (макс.)' then 'Вміст вологи при пакуванні, % (максимум)'
    when 'З’єднання (підключення)' then 'З''єднання'
    when 'Витрата води на регенерацію, м³/час' then 'Витрата води на регенерацію, м³/год'
    else l
  end;

  -- Unit moved from the value into the name (only when the value has exactly that unit).
  if l in ('Робочий тиск', 'Максимальний тиск', 'Максимальний робочий тиск') and v ~ '\s*бар(ів)?$' then
    l := l || ', бар'; v := regexp_replace(v, '\s*бар(ів)?$', '');
  elsif l in ('Твердість') and v ~ '\s*мг-екв/л$' then
    l := l || ', мг-екв/л'; v := regexp_replace(v, '\s*мг-екв/л$', '');
  elsif l in ('Залізо', 'Манган', 'Амоній', 'Вільний хлор') and v ~ '\s*мг/л$' then
    l := l || ', мг/л'; v := regexp_replace(v, '\s*мг/л$', '');
  elsif l = 'Вага' and v ~ '\s*кг$' then
    l := 'Вага, кг'; v := regexp_replace(v, '\s*кг$', '');
  elsif l = 'Висота' and v ~ '\s*мм$' then
    l := 'Висота, мм'; v := regexp_replace(v, '\s*мм$', '');
  elsif l in ('Температура води', 'Температура вихідної води') and v ~ '\s*°?\s*[CС℃]$' then
    l := l || ', °C'; v := regexp_replace(v, '\s*°?\s*[CС℃]$', '');
  elsif l = 'Максимальна продуктивність' and v ~ '\s*л/хв$' then
    l := 'Максимальна продуктивність, л/хв'; v := regexp_replace(v, '\s*л/хв$', '');
  elsif l = 'Продуктивність' and v ~ '^[0-9][0-9 ,.]*\s*л/хв$' then
    l := 'Продуктивність, л/хв'; v := regexp_replace(v, '\s*л/хв$', '');
  elsif l = 'Продуктивність' and v ~ '^[0-9][0-9 ,.]*\s*л/год' then
    l := 'Продуктивність, л/год'; v := regexp_replace(v, '\s*л/год', '');
  elsif l = 'Мінімальна висота шару' and v ~ '^[0-9]+([,.][0-9]+)?\s*мм$' then
    l := 'Мінімальна висота шару, мм'; v := regexp_replace(v, '\s*мм$', '');
  elsif l = 'Мінімальна висота шару' and v ~ '^[0-9]+([,.][0-9]+)?\s*м$' then
    l := 'Мінімальна висота шару, мм';
    v := (round(replace(regexp_replace(v, '\s*м$', ''), ',', '.')::numeric * 1000))::text;
  end if;

  -- Values: unified degree sign and ellipsis in ranges.
  v := replace(replace(v, '℃', '°C'), '...', '…');
  return jsonb_build_object('label', l, 'value', v);
end;
$$;

update public.products p
set details = jsonb_set(p.details, '{specs}', coalesce((
  select jsonb_agg(spec order by ord)
  from (
    select distinct on (lower(n.spec->>'label')) n.spec, n.ord
    from (
      select pg_temp.normalize_spec(e.elem->>'label', e.elem->>'value') as spec, e.ord
      from jsonb_array_elements(p.details->'specs') with ordinality as e(elem, ord)
    ) n
    where coalesce(n.spec->>'label', '') <> '' and coalesce(n.spec->>'value', '') <> ''
    order by lower(n.spec->>'label'), n.ord
  ) deduped
), '[]'::jsonb))
where jsonb_typeof(p.details->'specs') = 'array' and jsonb_array_length(p.details->'specs') > 0;
