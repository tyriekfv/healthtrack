-- Data-only migration: backfill for the additional provider-specific
-- spellings added to ANALYTE_GROUPS in src/lib/lab-test-names.ts after
-- 0009 — same rationale as that migration (see its header). New rows are
-- already canonicalized at write time; this only fixes rows written before
-- these variants were recognized.
UPDATE `lab_results` SET `test_name` = 'WBC' WHERE `test_name` != 'WBC' AND LOWER(TRIM(`test_name`)) IN ('wbc','white blood cell count','white blood cells','leukocytes','wbc''s auto','wbc, auto');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'RBC' WHERE `test_name` != 'RBC' AND LOWER(TRIM(`test_name`)) IN ('rbc','red blood cell count','red blood cells','erythrocytes','rbc, auto');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'RDW' WHERE `test_name` != 'RDW' AND LOWER(TRIM(`test_name`)) IN ('rdw','rdw-cv','rdw cv','rdw, blood');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Platelets' WHERE `test_name` != 'Platelets' AND LOWER(TRIM(`test_name`)) IN ('platelets','platelet count','plt','platelets, automated count');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Lymphocytes Absolute' WHERE `test_name` != 'Lymphocytes Absolute' AND LOWER(TRIM(`test_name`)) IN ('lymphocytes absolute','absolute lymphocytes','lymphs abs','lymphs (absolute)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Eosinophils %' WHERE `test_name` != 'Eosinophils %' AND LOWER(TRIM(`test_name`)) IN ('eosinophils','eosinophils %','eosinophil percent','eos');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Eosinophils Absolute' WHERE `test_name` != 'Eosinophils Absolute' AND LOWER(TRIM(`test_name`)) IN ('eosinophils absolute','absolute eosinophils','eosinophils abs','eos (absolute)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Basophils %' WHERE `test_name` != 'Basophils %' AND LOWER(TRIM(`test_name`)) IN ('basophils','basophils %','basophil percent','basos');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Basophils Absolute' WHERE `test_name` != 'Basophils Absolute' AND LOWER(TRIM(`test_name`)) IN ('basophils absolute','absolute basophils','basophils abs','baso (absolute)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Immature Granulocytes' WHERE `test_name` != 'Immature Granulocytes' AND LOWER(TRIM(`test_name`)) IN ('immature granulocytes','immature grans (abs)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Glucose' WHERE `test_name` != 'Glucose' AND LOWER(TRIM(`test_name`)) IN ('glucose','glucose, fasting','glucose fasting','glu','glucose, random');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'BUN' WHERE `test_name` != 'BUN' AND LOWER(TRIM(`test_name`)) IN ('bun','blood urea nitrogen','urea nitrogen','urea nitrogen (bun)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'CO2' WHERE `test_name` != 'CO2' AND LOWER(TRIM(`test_name`)) IN ('co2','carbon dioxide','bicarbonate','co2, total','co2 total','carbon dioxide, total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'ALT' WHERE `test_name` != 'ALT' AND LOWER(TRIM(`test_name`)) IN ('alt','sgpt','alanine aminotransferase','alt (sgpt)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'AST' WHERE `test_name` != 'AST' AND LOWER(TRIM(`test_name`)) IN ('ast','sgot','aspartate aminotransferase','ast (sgot)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'LDL Cholesterol' WHERE `test_name` != 'LDL Cholesterol' AND LOWER(TRIM(`test_name`)) IN ('ldl cholesterol','ldl','cholesterol, ldl','cholesterol ldl','ldl-c','ldl chol calc','ldl cholesterol calc','ldl calculated','ldl-c (nih calc)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'LDL Particle Number' WHERE `test_name` != 'LDL Particle Number' AND LOWER(TRIM(`test_name`)) IN ('ldl-p','ldl-p (ldl particle number)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'LDL Size' WHERE `test_name` != 'LDL Size' AND LOWER(TRIM(`test_name`)) IN ('ldl size','ldl size (ir panel)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Triglycerides' WHERE `test_name` != 'Triglycerides' AND LOWER(TRIM(`test_name`)) IN ('triglycerides','trig','triglyceride');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Non-HDL Cholesterol' WHERE `test_name` != 'Non-HDL Cholesterol' AND LOWER(TRIM(`test_name`)) IN ('non-hdl cholesterol','non hdl cholesterol','non-hdl chol','cholesterol, non-hdl');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Testosterone, Free' WHERE `test_name` != 'Testosterone, Free' AND LOWER(TRIM(`test_name`)) IN ('testosterone, free','testosterone free','free testosterone','free t','free testosterone (direct)','free testosterone(direct)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Estradiol, Ultrasensitive' WHERE `test_name` != 'Estradiol, Ultrasensitive' AND LOWER(TRIM(`test_name`)) IN ('estradiol, ultrasensitive','estradiol ultrasensitive','estradiol, sensitive','estradiol sensitive','estradiol, ultrasensitive, lc/ms');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'PSA, Total' WHERE `test_name` != 'PSA, Total' AND LOWER(TRIM(`test_name`)) IN ('psa','psa, total','psa total','prostate specific antigen','prostate specific ag');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T4, Free' WHERE `test_name` != 'T4, Free' AND LOWER(TRIM(`test_name`)) IN ('t4, free','t4 free','free t4','ft4','t4, free (direct)');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T3, Free' WHERE `test_name` != 'T3, Free' AND LOWER(TRIM(`test_name`)) IN ('t3, free','t3 free','free t3','ft3','triiodothyronine (t3), free');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Vitamin B12' WHERE `test_name` != 'Vitamin B12' AND LOWER(TRIM(`test_name`)) IN ('vitamin b12','b12','cobalamin','vit b12');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'TIBC' WHERE `test_name` != 'TIBC' AND LOWER(TRIM(`test_name`)) IN ('tibc','total iron binding capacity','iron binding capacity');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Iron Saturation' WHERE `test_name` != 'Iron Saturation' AND LOWER(TRIM(`test_name`)) IN ('iron saturation','% saturation','transferrin saturation','iron sat');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Hemoglobin A1c' WHERE `test_name` != 'Hemoglobin A1c' AND LOWER(TRIM(`test_name`)) IN ('hemoglobin a1c','hba1c','a1c','hemoglobin a1c','hgba1c%','hgba1c');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'SHBG' WHERE `test_name` != 'SHBG' AND LOWER(TRIM(`test_name`)) IN ('shbg','sex hormone binding globulin','sex horm binding glob, serum','sex horm binding glob');
