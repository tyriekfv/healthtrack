-- Data-only migration: canonicalize existing lab_results.test_name values so
-- provider-specific spellings (Labcorp/Quest/Kaiser/etc.) for the same assay
-- collapse to one label. Going forward, new rows are canonicalized at write
-- time (see canonicalLabTestName in src/lib/repos/labs.ts) — this backfill
-- only fixes rows written before that change existed. Matching is
-- case/whitespace-insensitive on the literal spellings we know about; an
-- unrecognized test name is left untouched rather than guessed at.
UPDATE `lab_results` SET `test_name` = 'Hemoglobin' WHERE `test_name` != 'Hemoglobin' AND LOWER(TRIM(`test_name`)) IN ('hemoglobin','hgb');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Hematocrit' WHERE `test_name` != 'Hematocrit' AND LOWER(TRIM(`test_name`)) IN ('hematocrit','hct','hct, auto','hct auto');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'WBC' WHERE `test_name` != 'WBC' AND LOWER(TRIM(`test_name`)) IN ('wbc','white blood cell count','white blood cells','leukocytes');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'RBC' WHERE `test_name` != 'RBC' AND LOWER(TRIM(`test_name`)) IN ('rbc','red blood cell count','red blood cells','erythrocytes');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'RDW' WHERE `test_name` != 'RDW' AND LOWER(TRIM(`test_name`)) IN ('rdw','rdw-cv','rdw cv');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Platelets' WHERE `test_name` != 'Platelets' AND LOWER(TRIM(`test_name`)) IN ('platelets','platelet count','plt');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'MPV' WHERE `test_name` != 'MPV' AND LOWER(TRIM(`test_name`)) IN ('mpv','mean platelet volume');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Neutrophils %' WHERE `test_name` != 'Neutrophils %' AND LOWER(TRIM(`test_name`)) IN ('neutrophils','neutrophils %','neutrophils percent','neut %','neutrophil percent');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Neutrophils Absolute' WHERE `test_name` != 'Neutrophils Absolute' AND LOWER(TRIM(`test_name`)) IN ('neutrophils absolute','absolute neutrophils','neut abs','neutrophils abs');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Lymphocytes %' WHERE `test_name` != 'Lymphocytes %' AND LOWER(TRIM(`test_name`)) IN ('lymphocytes','lymphocytes %','lymphs %','lymphocyte percent');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Lymphocytes Absolute' WHERE `test_name` != 'Lymphocytes Absolute' AND LOWER(TRIM(`test_name`)) IN ('lymphocytes absolute','absolute lymphocytes','lymphs abs');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Monocytes %' WHERE `test_name` != 'Monocytes %' AND LOWER(TRIM(`test_name`)) IN ('monocytes','monocytes %','monocyte percent');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Monocytes Absolute' WHERE `test_name` != 'Monocytes Absolute' AND LOWER(TRIM(`test_name`)) IN ('monocytes absolute','absolute monocytes','monocytes abs');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Eosinophils %' WHERE `test_name` != 'Eosinophils %' AND LOWER(TRIM(`test_name`)) IN ('eosinophils','eosinophils %','eosinophil percent');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Eosinophils Absolute' WHERE `test_name` != 'Eosinophils Absolute' AND LOWER(TRIM(`test_name`)) IN ('eosinophils absolute','absolute eosinophils','eosinophils abs');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Basophils %' WHERE `test_name` != 'Basophils %' AND LOWER(TRIM(`test_name`)) IN ('basophils','basophils %','basophil percent');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Basophils Absolute' WHERE `test_name` != 'Basophils Absolute' AND LOWER(TRIM(`test_name`)) IN ('basophils absolute','absolute basophils','basophils abs');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Glucose' WHERE `test_name` != 'Glucose' AND LOWER(TRIM(`test_name`)) IN ('glucose','glucose, fasting','glucose fasting','glu');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'BUN' WHERE `test_name` != 'BUN' AND LOWER(TRIM(`test_name`)) IN ('bun','blood urea nitrogen','urea nitrogen');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Creatinine' WHERE `test_name` != 'Creatinine' AND LOWER(TRIM(`test_name`)) IN ('creatinine','creat');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'eGFR' WHERE `test_name` != 'eGFR' AND LOWER(TRIM(`test_name`)) IN ('egfr','gfr estimated','estimated gfr');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'BUN/Creatinine Ratio' WHERE `test_name` != 'BUN/Creatinine Ratio' AND LOWER(TRIM(`test_name`)) IN ('bun/creatinine ratio','bun creatinine ratio');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Sodium' WHERE `test_name` != 'Sodium' AND LOWER(TRIM(`test_name`)) IN ('sodium','na');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Potassium' WHERE `test_name` != 'Potassium' AND LOWER(TRIM(`test_name`)) IN ('potassium','k');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Chloride' WHERE `test_name` != 'Chloride' AND LOWER(TRIM(`test_name`)) IN ('chloride','cl');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'CO2' WHERE `test_name` != 'CO2' AND LOWER(TRIM(`test_name`)) IN ('co2','carbon dioxide','bicarbonate','co2, total','co2 total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Calcium' WHERE `test_name` != 'Calcium' AND LOWER(TRIM(`test_name`)) IN ('calcium','ca');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Total Protein' WHERE `test_name` != 'Total Protein' AND LOWER(TRIM(`test_name`)) IN ('total protein','protein, total','protein total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Globulin' WHERE `test_name` != 'Globulin' AND LOWER(TRIM(`test_name`)) IN ('globulin','globulin, total','globulin total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'A/G Ratio' WHERE `test_name` != 'A/G Ratio' AND LOWER(TRIM(`test_name`)) IN ('a/g ratio','albumin/globulin ratio','albumin globulin ratio');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Bilirubin, Total' WHERE `test_name` != 'Bilirubin, Total' AND LOWER(TRIM(`test_name`)) IN ('bilirubin, total','bilirubin total','total bilirubin');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'ALT' WHERE `test_name` != 'ALT' AND LOWER(TRIM(`test_name`)) IN ('alt','sgpt','alanine aminotransferase');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'AST' WHERE `test_name` != 'AST' AND LOWER(TRIM(`test_name`)) IN ('ast','sgot','aspartate aminotransferase');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Alkaline Phosphatase' WHERE `test_name` != 'Alkaline Phosphatase' AND LOWER(TRIM(`test_name`)) IN ('alkaline phosphatase','alp','alk phos');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Cholesterol, Total' WHERE `test_name` != 'Cholesterol, Total' AND LOWER(TRIM(`test_name`)) IN ('cholesterol, total','cholesterol total','total cholesterol','cholesterol');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'HDL Cholesterol' WHERE `test_name` != 'HDL Cholesterol' AND LOWER(TRIM(`test_name`)) IN ('hdl cholesterol','hdl','cholesterol, hdl','cholesterol hdl','hdl-c');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'LDL Cholesterol' WHERE `test_name` != 'LDL Cholesterol' AND LOWER(TRIM(`test_name`)) IN ('ldl cholesterol','ldl','cholesterol, ldl','cholesterol ldl','ldl-c','ldl chol calc','ldl cholesterol calc');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Triglycerides' WHERE `test_name` != 'Triglycerides' AND LOWER(TRIM(`test_name`)) IN ('triglycerides','trig');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Cholesterol/HDL Ratio' WHERE `test_name` != 'Cholesterol/HDL Ratio' AND LOWER(TRIM(`test_name`)) IN ('cholesterol/hdl ratio','cholesterol hdl ratio','chol/hdlc ratio');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Non-HDL Cholesterol' WHERE `test_name` != 'Non-HDL Cholesterol' AND LOWER(TRIM(`test_name`)) IN ('non-hdl cholesterol','non hdl cholesterol','non-hdl chol');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'TSH' WHERE `test_name` != 'TSH' AND LOWER(TRIM(`test_name`)) IN ('tsh','thyroid stimulating hormone');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T4, Free' WHERE `test_name` != 'T4, Free' AND LOWER(TRIM(`test_name`)) IN ('t4, free','t4 free','free t4','ft4');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T3, Free' WHERE `test_name` != 'T3, Free' AND LOWER(TRIM(`test_name`)) IN ('t3, free','t3 free','free t3','ft3');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T4, Total' WHERE `test_name` != 'T4, Total' AND LOWER(TRIM(`test_name`)) IN ('t4, total','t4 total','total t4','t4');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'T3, Total' WHERE `test_name` != 'T3, Total' AND LOWER(TRIM(`test_name`)) IN ('t3, total','t3 total','total t3','t3');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Testosterone, Total' WHERE `test_name` != 'Testosterone, Total' AND LOWER(TRIM(`test_name`)) IN ('testosterone','testosterone, total','testosterone total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Testosterone, Total, MS' WHERE `test_name` != 'Testosterone, Total, MS' AND LOWER(TRIM(`test_name`)) IN ('testosterone, total, ms','testosterone total ms','testosterone, total ms');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Testosterone, Free' WHERE `test_name` != 'Testosterone, Free' AND LOWER(TRIM(`test_name`)) IN ('testosterone, free','testosterone free','free testosterone','free t');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'SHBG' WHERE `test_name` != 'SHBG' AND LOWER(TRIM(`test_name`)) IN ('shbg','sex hormone binding globulin');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'LH' WHERE `test_name` != 'LH' AND LOWER(TRIM(`test_name`)) IN ('lh','luteinizing hormone');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'FSH' WHERE `test_name` != 'FSH' AND LOWER(TRIM(`test_name`)) IN ('fsh','follicle stimulating hormone');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'DHEA-S' WHERE `test_name` != 'DHEA-S' AND LOWER(TRIM(`test_name`)) IN ('dhea-s','dhea sulfate','dheas');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Estradiol' WHERE `test_name` != 'Estradiol' AND LOWER(TRIM(`test_name`)) IN ('estradiol','e2');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Estradiol, Ultrasensitive' WHERE `test_name` != 'Estradiol, Ultrasensitive' AND LOWER(TRIM(`test_name`)) IN ('estradiol, ultrasensitive','estradiol ultrasensitive');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'PSA, Total' WHERE `test_name` != 'PSA, Total' AND LOWER(TRIM(`test_name`)) IN ('psa','psa, total','psa total','prostate specific antigen');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'PSA, Free' WHERE `test_name` != 'PSA, Free' AND LOWER(TRIM(`test_name`)) IN ('psa, free','psa free','free psa','prostate specific antigen free','prostate specific ag free');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Vitamin D, 25-Hydroxy' WHERE `test_name` != 'Vitamin D, 25-Hydroxy' AND LOWER(TRIM(`test_name`)) IN ('vitamin d, 25-hydroxy','vitamin d 25-hydroxy','25-hydroxy vitamin d','vitamin d','vitamin d3','25-oh vitamin d','vit d, 25-oh');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Vitamin B12' WHERE `test_name` != 'Vitamin B12' AND LOWER(TRIM(`test_name`)) IN ('vitamin b12','b12','cobalamin');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Folate' WHERE `test_name` != 'Folate' AND LOWER(TRIM(`test_name`)) IN ('folate','folic acid');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Iron' WHERE `test_name` != 'Iron' AND LOWER(TRIM(`test_name`)) IN ('iron','iron, total','iron total');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'TIBC' WHERE `test_name` != 'TIBC' AND LOWER(TRIM(`test_name`)) IN ('tibc','total iron binding capacity');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Iron Saturation' WHERE `test_name` != 'Iron Saturation' AND LOWER(TRIM(`test_name`)) IN ('iron saturation','% saturation','transferrin saturation');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'Hemoglobin A1c' WHERE `test_name` != 'Hemoglobin A1c' AND LOWER(TRIM(`test_name`)) IN ('hemoglobin a1c','hba1c','a1c');--> statement-breakpoint
UPDATE `lab_results` SET `test_name` = 'hs-CRP' WHERE `test_name` != 'hs-CRP' AND LOWER(TRIM(`test_name`)) IN ('hs-crp','hscrp','c-reactive protein, cardiac','c-reactive protein cardiac','crp high sensitivity');
