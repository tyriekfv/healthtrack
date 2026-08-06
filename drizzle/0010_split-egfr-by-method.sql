-- Data-only migration: eGFR is the one analyte in lab-test-names.ts that
-- needs splitting rather than merging — creatinine-based eGFR and
-- cystatin-C-based eGFR are different equations that can diverge, but both
-- get reported under the identical bare name "eGFR", disambiguated only by
-- the panel they were drawn under. Existing rows written before
-- canonicalLabTestName became panel-aware need a one-time fix; new rows are
-- handled automatically at write time going forward (see repos/labs.ts).
UPDATE `lab_results` SET `test_name` = 'Cystatin C - eGFR' WHERE `test_name` != 'Cystatin C - eGFR' AND LOWER(TRIM(`test_name`)) IN ('egfr','gfr estimated','estimated gfr','glomerular filtration rate') AND `panel_name` LIKE '%cystatin%';--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'eGFR' WHERE `test_name` != 'eGFR' AND LOWER(TRIM(`test_name`)) IN ('gfr estimated','estimated gfr','glomerular filtration rate') AND (`panel_name` IS NULL OR `panel_name` NOT LIKE '%cystatin%');
