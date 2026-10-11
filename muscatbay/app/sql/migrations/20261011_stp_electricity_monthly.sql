-- STP electricity — monthly consumption and billed cost (owner request 2026-10-11).
--
-- One row per OWATCO report month. Two independent kWh sources are kept apart,
-- never merged:
--   owatco_kwh  "Power Consumption" from OWATCO's monthly O&M report; the cycle
--               runs from the 26th of the previous month to the 25th of the
--               named month (period_start / period_end).
--   nama_kwh    kWh on Nama's bill for account R54460 (meter LG19CT44019309),
--               from the community consumption workbook (Jan–Aug 2024 only).
-- billed_omr is Nama's "Total Current Month Dues Before VAT" for R54460 from
-- the MEDC electricity billing database. Billing periods may not match the
-- OWATCO cycle, so billed_omr ÷ owatco_kwh is an indicative rate only.
--
-- The STP is on Nama's Cost Reflective Tariff (CRT) — Nama, August 2026 — so
-- consumption × the flat 25 baisa/kWh is NOT its cost. Missing figures stay
-- NULL; a status column says why. Nothing here is estimated.
--
-- Sources: STP_monthly_electricity_2024-2026.xlsx (reviewed 11 Oct 2026),
-- "Community Electricity consumption / KW" (27 Oct 2024), "Fw: Electricity
-- 2025" (14 Jul 2026), "Electricity consumption for 2026" (16 Sep 2026).
-- Re-runnable: every row is an upsert on report_month.

create table if not exists public.stp_electricity_monthly (
    report_month   date primary key check (extract(day from report_month) = 1),
    period_start   date,
    period_end     date,
    owatco_kwh     numeric(10, 1) check (owatco_kwh is null or owatco_kwh >= 0),
    owatco_status  text not null check (owatco_status in
                     ('reported', 'reported_discrepancy', 'summary_only', 'not_found', 'not_received')),
    owatco_note    text,
    nama_kwh       numeric(10, 1) check (nama_kwh is null or nama_kwh >= 0),
    billed_omr     numeric(12, 3) check (billed_omr is null or billed_omr >= 0),
    billed_status  text not null check (billed_status in ('billed', 'unreliable', 'not_available')),
    billed_note    text,
    updated_at     timestamptz not null default now(),
    check (owatco_status in ('not_found', 'not_received') or owatco_kwh is not null),
    check (billed_status <> 'billed' or billed_omr is not null)
);

alter table public.stp_electricity_monthly enable row level security;

-- Read: anyone who may read the STP module. Write: admin only (data loads).
drop policy if exists mb_select on public.stp_electricity_monthly;
create policy mb_select on public.stp_electricity_monthly
    for select to authenticated
    using ((select public.mb_can_read_module('stp')));

drop policy if exists mb_insert on public.stp_electricity_monthly;
create policy mb_insert on public.stp_electricity_monthly
    for insert to authenticated
    with check ((select public.mb_has_any_role(array['admin']::text[])));

drop policy if exists mb_update on public.stp_electricity_monthly;
create policy mb_update on public.stp_electricity_monthly
    for update to authenticated
    using ((select public.mb_has_any_role(array['admin']::text[])))
    with check ((select public.mb_has_any_role(array['admin']::text[])));

drop policy if exists mb_delete on public.stp_electricity_monthly;
create policy mb_delete on public.stp_electricity_monthly
    for delete to authenticated
    using ((select public.mb_has_any_role(array['admin']::text[])));

revoke all on public.stp_electricity_monthly from anon;
grant select, insert, update, delete on public.stp_electricity_monthly to authenticated;

drop trigger if exists stp_electricity_monthly_updated_at on public.stp_electricity_monthly;
create trigger stp_electricity_monthly_updated_at
    before update on public.stp_electricity_monthly
    for each row execute function public.mb_set_updated_at();

-- ─── Data ───────────────────────────────────────────────────────────────────
insert into public.stp_electricity_monthly
    (report_month, period_start, period_end, owatco_kwh, owatco_status, owatco_note,
     nama_kwh, billed_omr, billed_status, billed_note)
values
    -- 2024: OWATCO reports Jan–Aug not found; Nama-billed kWh available Jan–Aug.
    ('2024-01-01', '2023-12-26', '2024-01-25', null, 'not_found', 'No OWATCO monthly report found.', 26487, null, 'not_available', '2024 monthly bills not available; 2024 total 7,925.743 OMR before VAT.'),
    ('2024-02-01', '2024-01-26', '2024-02-25', null, 'not_found', 'No OWATCO monthly report found.', 24141, null, 'not_available', null),
    ('2024-03-01', '2024-02-26', '2024-03-25', null, 'not_found', 'No OWATCO monthly report found.', 20398, null, 'not_available', null),
    ('2024-04-01', '2024-03-26', '2024-04-25', null, 'not_found', 'No OWATCO monthly report found.', 20131, null, 'not_available', null),
    ('2024-05-01', '2024-04-26', '2024-05-25', null, 'not_found', 'No OWATCO monthly report found.', 21308, null, 'not_available', null),
    ('2024-06-01', '2024-05-26', '2024-06-25', null, 'not_found', 'No OWATCO monthly report found.', 21314, null, 'not_available', null),
    ('2024-07-01', '2024-06-26', '2024-07-25', null, 'not_found', 'Only a secondary Q3 summary exists; it conflicts with the original reports and is not used.', 20815, null, 'not_available', null),
    ('2024-08-01', '2024-07-26', '2024-08-25', null, 'not_found', 'Only a secondary Q3 summary exists; it conflicts with the original reports and is not used.', 21748, null, 'not_available', null),
    ('2024-09-01', '2024-08-26', '2024-09-25', 19428, 'reported_discrepancy', 'Reported 19,428 kWh; the daily readings sum to 19,508 (+80). Reported figure kept.', null, null, 'not_available', null),
    ('2024-10-01', '2024-09-26', '2024-10-25', 19556, 'reported', null, null, null, 'not_available', null),
    ('2024-11-01', '2024-10-26', '2024-11-25', 22124, 'reported', null, null, null, 'not_available', null),
    ('2024-12-01', '2024-11-26', '2024-12-25', 21640, 'reported', null, null, null, 'not_available', null),
    -- 2025: complete OWATCO year; Nama bills from the billing database.
    ('2025-01-01', '2024-12-26', '2025-01-25', 22704, 'reported', null, null, 621.908, 'billed', null),
    ('2025-02-01', '2025-01-26', '2025-02-25', 22205, 'reported', null, null, 551.048, 'billed', null),
    ('2025-03-01', '2025-02-26', '2025-03-25', 20690, 'reported', null, null, 636.257, 'billed', null),
    ('2025-04-01', '2025-03-26', '2025-04-25', 23743, 'reported', null, null, 642.288, 'billed', null),
    ('2025-05-01', '2025-04-26', '2025-05-25', 23708, 'reported', null, null, 976.281, 'billed', null),
    ('2025-06-01', '2025-05-26', '2025-06-25', 23708, 'reported_discrepancy', 'Printed 23,708 kWh (identical to May); the daily readings sum to 24,143 (+435). Printed figure kept.', null, 933.557, 'billed', null),
    ('2025-07-01', '2025-06-26', '2025-07-25', 24103, 'reported', null, null, 922.816, 'billed', null),
    ('2025-08-01', '2025-07-26', '2025-08-25', 24895, 'reported', null, null, 1049.635, 'billed', null),
    ('2025-09-01', '2025-08-26', '2025-09-25', 23902, 'reported', null, null, 921.384, 'billed', null),
    ('2025-10-01', '2025-09-26', '2025-10-25', 24184, 'reported', null, null, 688.390, 'billed', null),
    ('2025-11-01', '2025-10-26', '2025-11-25', 24278, 'reported', null, null, 647.768, 'billed', null),
    ('2025-12-01', '2025-11-26', '2025-12-25', 22635, 'reported', null, null, 645.786, 'billed', null),
    -- 2026
    ('2026-01-01', '2025-12-26', '2026-01-25', 25081, 'reported', null, null, 706.456, 'billed', null),
    ('2026-02-01', '2026-01-26', '2026-02-25', 26349, 'summary_only', 'Report summary only; its daily table is malformed and cannot confirm the total.', null, 659.390, 'billed', null),
    ('2026-03-01', '2026-02-26', '2026-03-25', 22648, 'reported', null, null, 683.708, 'billed', null),
    ('2026-04-01', '2026-03-26', '2026-04-25', 25574, 'reported', null, null, 699.378, 'billed', null),
    ('2026-05-01', '2026-04-26', '2026-05-25', 27479, 'reported', null, null, null, 'unreliable', 'The billing database''s May sheet repeats June for every account; no reliable May bill.'),
    ('2026-06-01', '2026-05-26', '2026-06-25', 26316, 'reported', null, null, 1135.242, 'billed', null),
    ('2026-07-01', '2026-06-26', '2026-07-25', 25696, 'reported', null, null, 1052.897, 'billed', null),
    ('2026-08-01', '2026-07-26', '2026-08-25', 27010, 'reported', null, null, 1088.659, 'billed', null),
    ('2026-09-01', '2026-08-26', '2026-09-25', null, 'not_received', 'OWATCO September report not yet received (as of 11 Oct 2026).', null, null, 'not_available', 'September bill not yet in the billing database.')
on conflict (report_month) do update set
    period_start  = excluded.period_start,
    period_end    = excluded.period_end,
    owatco_kwh    = excluded.owatco_kwh,
    owatco_status = excluded.owatco_status,
    owatco_note   = excluded.owatco_note,
    nama_kwh      = excluded.nama_kwh,
    billed_omr    = excluded.billed_omr,
    billed_status = excluded.billed_status,
    billed_note   = excluded.billed_note;
