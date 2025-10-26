-- Comprehensive Medicine Names Database Enhancement
-- This script adds many more medicine names to improve search results
-- Run this in your Supabase SQL Editor

-- Add medicines starting with "Do" and other common medicines
INSERT INTO medicine_names (
    name, generic_name, description, manufacturer, sku, price, cost_price, 
    quantity_in_stock, minimum_stock_level, maximum_stock_level, 
    expiry_date, prescription_required, brand_name, common_names, popularity_score
) VALUES
-- Medicines starting with "Do"
('Doxycycline 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED021', 12.99, 6.50, 80, 20, 400, '2025-12-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx', 'Monodox'], 85),
('Doxycycline 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED022', 15.99, 8.00, 60, 15, 300, '2025-12-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx', 'Monodox'], 80),
('Doxycycline Hyclate', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED023', 11.99, 6.00, 70, 20, 350, '2025-11-30', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 75),
('Doxycycline Monohydrate', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED024', 13.99, 7.00, 65, 15, 300, '2025-10-15', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 70),
('Doxycycline Calcium', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED025', 14.99, 7.50, 55, 15, 250, '2025-09-20', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 65),
('Doxycycline Delayed Release', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED026', 16.99, 8.50, 45, 10, 200, '2025-08-10', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 60),
('Doxycycline Extended Release', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED027', 18.99, 9.50, 40, 10, 180, '2025-07-25', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 55),
('Doxycycline Suspension', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED028', 19.99, 10.00, 35, 10, 150, '2025-06-15', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 50),
('Doxycycline Injection', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED029', 25.99, 13.00, 25, 5, 100, '2025-05-30', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 45),
('Doxycycline Topical', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED030', 22.99, 11.50, 30, 8, 120, '2025-04-20', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 40),

-- More medicines starting with "Do"
('Dolophine', 'Methadone', 'Opioid pain medication and addiction treatment', 'PainRelief', 'MED031', 35.99, 18.00, 20, 5, 80, '2025-03-15', true, 'Methadose', ARRAY['Methadose', 'Dolophine'], 35),
('Dolophine HCl', 'Methadone', 'Opioid pain medication and addiction treatment', 'PainRelief', 'MED032', 37.99, 19.00, 18, 5, 75, '2025-02-28', true, 'Methadose', ARRAY['Methadose', 'Dolophine'], 30),
('Dolophine Tablets', 'Methadone', 'Opioid pain medication and addiction treatment', 'PainRelief', 'MED033', 39.99, 20.00, 15, 5, 70, '2025-01-20', true, 'Methadose', ARRAY['Methadose', 'Dolophine'], 25),
('Dolophine Oral Solution', 'Methadone', 'Opioid pain medication and addiction treatment', 'PainRelief', 'MED034', 42.99, 21.50, 12, 3, 60, '2024-12-31', true, 'Methadose', ARRAY['Methadose', 'Dolophine'], 20),
('Dolophine Injection', 'Methadone', 'Opioid pain medication and addiction treatment', 'PainRelief', 'MED035', 45.99, 23.00, 10, 3, 50, '2024-11-30', true, 'Methadose', ARRAY['Methadose', 'Dolophine'], 15),

-- Additional "Do" medicines
('Docusate Sodium', 'Docusate Sodium', 'Stool softener for constipation', 'DigestCorp', 'MED036', 8.99, 4.50, 100, 25, 500, '2025-12-31', false, 'Colace', ARRAY['Colace', 'Docusate'], 60),
('Docusate Calcium', 'Docusate Calcium', 'Stool softener for constipation', 'DigestCorp', 'MED037', 9.99, 5.00, 90, 20, 450, '2025-11-30', false, 'Colace', ARRAY['Colace', 'Docusate'], 55),
('Docusate Potassium', 'Docusate Potassium', 'Stool softener for constipation', 'DigestCorp', 'MED038', 10.99, 5.50, 85, 20, 400, '2025-10-31', false, 'Colace', ARRAY['Colace', 'Docusate'], 50),
('Docusate Sodium Syrup', 'Docusate Sodium', 'Stool softener for constipation', 'DigestCorp', 'MED039', 12.99, 6.50, 75, 15, 350, '2025-09-30', false, 'Colace', ARRAY['Colace', 'Docusate'], 45),
('Docusate Sodium Capsules', 'Docusate Sodium', 'Stool softener for constipation', 'DigestCorp', 'MED040', 11.99, 6.00, 80, 20, 400, '2025-08-31', false, 'Colace', ARRAY['Colace', 'Docusate'], 40),

-- More "Do" medicines
('Donepezil', 'Donepezil', 'Alzheimer disease medication', 'NeuroMed', 'MED041', 28.99, 14.50, 40, 10, 200, '2025-12-31', true, 'Aricept', ARRAY['Aricept', 'Donepezil'], 35),
('Donepezil HCl', 'Donepezil', 'Alzheimer disease medication', 'NeuroMed', 'MED042', 30.99, 15.50, 35, 10, 180, '2025-11-30', true, 'Aricept', ARRAY['Aricept', 'Donepezil'], 30),
('Donepezil Tablets', 'Donepezil', 'Alzheimer disease medication', 'NeuroMed', 'MED043', 32.99, 16.50, 30, 8, 150, '2025-10-31', true, 'Aricept', ARRAY['Aricept', 'Donepezil'], 25),
('Donepezil ODT', 'Donepezil', 'Alzheimer disease medication', 'NeuroMed', 'MED044', 34.99, 17.50, 25, 5, 120, '2025-09-30', true, 'Aricept', ARRAY['Aricept', 'Donepezil'], 20),
('Donepezil Extended Release', 'Donepezil', 'Alzheimer disease medication', 'NeuroMed', 'MED045', 36.99, 18.50, 20, 5, 100, '2025-08-31', true, 'Aricept', ARRAY['Aricept', 'Donepezil'], 15),

-- Additional comprehensive medicine names
('Domperidone', 'Domperidone', 'Anti-nausea medication', 'DigestCorp', 'MED046', 15.99, 8.00, 60, 15, 300, '2025-12-31', true, 'Motilium', ARRAY['Motilium', 'Domperidone'], 50),
('Domperidone Maleate', 'Domperidone', 'Anti-nausea medication', 'DigestCorp', 'MED047', 17.99, 9.00, 55, 15, 280, '2025-11-30', true, 'Motilium', ARRAY['Motilium', 'Domperidone'], 45),
('Domperidone Tablets', 'Domperidone', 'Anti-nausea medication', 'DigestCorp', 'MED048', 19.99, 10.00, 50, 12, 250, '2025-10-31', true, 'Motilium', ARRAY['Motilium', 'Domperidone'], 40),
('Domperidone Suspension', 'Domperidone', 'Anti-nausea medication', 'DigestCorp', 'MED049', 21.99, 11.00, 45, 10, 200, '2025-09-30', true, 'Motilium', ARRAY['Motilium', 'Domperidone'], 35),
('Domperidone Suppositories', 'Domperidone', 'Anti-nausea medication', 'DigestCorp', 'MED050', 23.99, 12.00, 40, 8, 180, '2025-08-31', true, 'Motilium', ARRAY['Motilium', 'Domperidone'], 30),

-- More comprehensive medicine names for better search coverage
('Diazepam', 'Diazepam', 'Benzodiazepine for anxiety and seizures', 'PsychMed', 'MED051', 12.99, 6.50, 30, 10, 150, '2025-12-31', true, 'Valium', ARRAY['Valium', 'Diazepam'], 70),
('Diazepam Tablets', 'Diazepam', 'Benzodiazepine for anxiety and seizures', 'PsychMed', 'MED052', 14.99, 7.50, 25, 8, 120, '2025-11-30', true, 'Valium', ARRAY['Valium', 'Diazepam'], 65),
('Diazepam Injection', 'Diazepam', 'Benzodiazepine for anxiety and seizures', 'PsychMed', 'MED053', 16.99, 8.50, 20, 5, 100, '2025-10-31', true, 'Valium', ARRAY['Valium', 'Diazepam'], 60),
('Diazepam Rectal Gel', 'Diazepam', 'Benzodiazepine for anxiety and seizures', 'PsychMed', 'MED054', 18.99, 9.50, 15, 5, 80, '2025-09-30', true, 'Valium', ARRAY['Valium', 'Diazepam'], 55),
('Diazepam Oral Solution', 'Diazepam', 'Benzodiazepine for anxiety and seizures', 'PsychMed', 'MED055', 20.99, 10.50, 18, 5, 90, '2025-08-31', true, 'Valium', ARRAY['Valium', 'Diazepam'], 50),

-- Additional medicines for comprehensive coverage
('Digoxin', 'Digoxin', 'Cardiac glycoside for heart conditions', 'CardioMed', 'MED056', 8.99, 4.50, 70, 20, 350, '2025-12-31', true, 'Lanoxin', ARRAY['Lanoxin', 'Digoxin'], 65),
('Digoxin Tablets', 'Digoxin', 'Cardiac glycoside for heart conditions', 'CardioMed', 'MED057', 10.99, 5.50, 65, 18, 320, '2025-11-30', true, 'Lanoxin', ARRAY['Lanoxin', 'Digoxin'], 60),
('Digoxin Injection', 'Digoxin', 'Cardiac glycoside for heart conditions', 'CardioMed', 'MED058', 12.99, 6.50, 55, 15, 280, '2025-10-31', true, 'Lanoxin', ARRAY['Lanoxin', 'Digoxin'], 55),
('Digoxin Elixir', 'Digoxin', 'Cardiac glycoside for heart conditions', 'CardioMed', 'MED059', 14.99, 7.50, 50, 12, 250, '2025-09-30', true, 'Lanoxin', ARRAY['Lanoxin', 'Digoxin'], 50),
('Digoxin Capsules', 'Digoxin', 'Cardiac glycoside for heart conditions', 'CardioMed', 'MED060', 16.99, 8.50, 45, 10, 220, '2025-08-31', true, 'Lanoxin', ARRAY['Lanoxin', 'Digoxin'], 45),

-- More medicines for better search results
('Diltiazem', 'Diltiazem', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED061', 11.99, 6.00, 80, 20, 400, '2025-12-31', true, 'Cardizem', ARRAY['Cardizem', 'Diltiazem'], 60),
('Diltiazem HCl', 'Diltiazem', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED062', 13.99, 7.00, 75, 18, 380, '2025-11-30', true, 'Cardizem', ARRAY['Cardizem', 'Diltiazem'], 55),
('Diltiazem Extended Release', 'Diltiazem', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED063', 15.99, 8.00, 70, 15, 350, '2025-10-31', true, 'Cardizem', ARRAY['Cardizem', 'Diltiazem'], 50),
('Diltiazem CD', 'Diltiazem', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED064', 17.99, 9.00, 65, 15, 320, '2025-09-30', true, 'Cardizem', ARRAY['Cardizem', 'Diltiazem'], 45),
('Diltiazem LA', 'Diltiazem', 'Calcium channel blocker for blood pressure', 'CardioMed', 'MED065', 19.99, 10.00, 60, 12, 300, '2025-08-31', true, 'Cardizem', ARRAY['Cardizem', 'Diltiazem'], 40),

-- Additional comprehensive medicines
('Diclofenac', 'Diclofenac', 'NSAID for pain and inflammation', 'PainRelief', 'MED066', 9.99, 5.00, 100, 25, 500, '2025-12-31', false, 'Voltaren', ARRAY['Voltaren', 'Diclofenac'], 70),
('Diclofenac Sodium', 'Diclofenac', 'NSAID for pain and inflammation', 'PainRelief', 'MED067', 11.99, 6.00, 95, 20, 450, '2025-11-30', false, 'Voltaren', ARRAY['Voltaren', 'Diclofenac'], 65),
('Diclofenac Potassium', 'Diclofenac', 'NSAID for pain and inflammation', 'PainRelief', 'MED068', 13.99, 7.00, 90, 20, 400, '2025-10-31', false, 'Voltaren', ARRAY['Voltaren', 'Diclofenac'], 60),
('Diclofenac Gel', 'Diclofenac', 'NSAID for pain and inflammation', 'PainRelief', 'MED069', 15.99, 8.00, 85, 15, 350, '2025-09-30', false, 'Voltaren', ARRAY['Voltaren', 'Diclofenac'], 55),
('Diclofenac Patch', 'Diclofenac', 'NSAID for pain and inflammation', 'PainRelief', 'MED070', 17.99, 9.00, 80, 15, 300, '2025-08-31', false, 'Voltaren', ARRAY['Voltaren', 'Diclofenac'], 50),

-- More medicines starting with "Do" and other letters for comprehensive coverage
('Doxazosin', 'Doxazosin', 'Alpha blocker for blood pressure and prostate', 'CardioMed', 'MED071', 14.99, 7.50, 60, 15, 300, '2025-12-31', true, 'Cardura', ARRAY['Cardura', 'Doxazosin'], 45),
('Doxazosin Mesylate', 'Doxazosin', 'Alpha blocker for blood pressure and prostate', 'CardioMed', 'MED072', 16.99, 8.50, 55, 12, 280, '2025-11-30', true, 'Cardura', ARRAY['Cardura', 'Doxazosin'], 40),
('Doxazosin Tablets', 'Doxazosin', 'Alpha blocker for blood pressure and prostate', 'CardioMed', 'MED073', 18.99, 9.50, 50, 10, 250, '2025-10-31', true, 'Cardura', ARRAY['Cardura', 'Doxazosin'], 35),
('Doxazosin Extended Release', 'Doxazosin', 'Alpha blocker for blood pressure and prostate', 'CardioMed', 'MED074', 20.99, 10.50, 45, 8, 200, '2025-09-30', true, 'Cardura', ARRAY['Cardura', 'Doxazosin'], 30),
('Doxazosin XL', 'Doxazosin', 'Alpha blocker for blood pressure and prostate', 'CardioMed', 'MED075', 22.99, 11.50, 40, 8, 180, '2025-08-31', true, 'Cardura', ARRAY['Cardura', 'Doxazosin'], 25),

-- Additional medicines for better search coverage
('Doxepin', 'Doxepin', 'Tricyclic antidepressant', 'PsychMed', 'MED076', 12.99, 6.50, 50, 15, 250, '2025-12-31', true, 'Sinequan', ARRAY['Sinequan', 'Doxepin'], 40),
('Doxepin HCl', 'Doxepin', 'Tricyclic antidepressant', 'PsychMed', 'MED077', 14.99, 7.50, 45, 12, 220, '2025-11-30', true, 'Sinequan', ARRAY['Sinequan', 'Doxepin'], 35),
('Doxepin Capsules', 'Doxepin', 'Tricyclic antidepressant', 'PsychMed', 'MED078', 16.99, 8.50, 40, 10, 200, '2025-10-31', true, 'Sinequan', ARRAY['Sinequan', 'Doxepin'], 30),
('Doxepin Tablets', 'Doxepin', 'Tricyclic antidepressant', 'PsychMed', 'MED079', 18.99, 9.50, 35, 8, 180, '2025-09-30', true, 'Sinequan', ARRAY['Sinequan', 'Doxepin'], 25),
('Doxepin Oral Solution', 'Doxepin', 'Tricyclic antidepressant', 'PsychMed', 'MED080', 20.99, 10.50, 30, 5, 150, '2025-08-31', true, 'Sinequan', ARRAY['Sinequan', 'Doxepin'], 20),

-- More comprehensive medicine names
('Doxorubicin', 'Doxorubicin', 'Chemotherapy medication', 'OncoMed', 'MED081', 125.99, 63.00, 10, 2, 50, '2025-12-31', true, 'Adriamycin', ARRAY['Adriamycin', 'Doxorubicin'], 15),
('Doxorubicin HCl', 'Doxorubicin', 'Chemotherapy medication', 'OncoMed', 'MED082', 135.99, 68.00, 8, 2, 40, '2025-11-30', true, 'Adriamycin', ARRAY['Adriamycin', 'Doxorubicin'], 12),
('Doxorubicin Liposomal', 'Doxorubicin', 'Chemotherapy medication', 'OncoMed', 'MED083', 145.99, 73.00, 6, 1, 30, '2025-10-31', true, 'Doxil', ARRAY['Doxil', 'Doxorubicin'], 10),
('Doxorubicin Injection', 'Doxorubicin', 'Chemotherapy medication', 'OncoMed', 'MED084', 155.99, 78.00, 5, 1, 25, '2025-09-30', true, 'Adriamycin', ARRAY['Adriamycin', 'Doxorubicin'], 8),
('Doxorubicin Powder', 'Doxorubicin', 'Chemotherapy medication', 'OncoMed', 'MED085', 165.99, 83.00, 4, 1, 20, '2025-08-31', true, 'Adriamycin', ARRAY['Adriamycin', 'Doxorubicin'], 5),

-- Additional medicines for comprehensive search coverage
('Doxycycline Monohydrate 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED086', 13.99, 7.00, 75, 20, 350, '2025-12-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx', 'Monodox'], 80),
('Doxycycline Hyclate 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED087', 12.99, 6.50, 70, 18, 320, '2025-11-30', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 75),
('Doxycycline Calcium 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED088', 14.99, 7.50, 65, 15, 300, '2025-10-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 70),
('Doxycycline Delayed Release 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED089', 16.99, 8.50, 60, 15, 280, '2025-09-30', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 65),
('Doxycycline Extended Release 100mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED090', 18.99, 9.50, 55, 12, 250, '2025-08-31', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 60),

-- More medicines for better search results
('Doxycycline Monohydrate 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED091', 15.99, 8.00, 50, 12, 240, '2025-12-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx', 'Monodox'], 55),
('Doxycycline Hyclate 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED092', 14.99, 7.50, 45, 10, 220, '2025-11-30', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 50),
('Doxycycline Calcium 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED093', 16.99, 8.50, 40, 10, 200, '2025-10-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 45),
('Doxycycline Delayed Release 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED094', 18.99, 9.50, 35, 8, 180, '2025-09-30', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 40),
('Doxycycline Extended Release 200mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED095', 20.99, 10.50, 30, 8, 160, '2025-08-31', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 35),

-- Additional comprehensive medicines
('Doxycycline Monohydrate 50mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED096', 11.99, 6.00, 85, 25, 400, '2025-12-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx', 'Monodox'], 75),
('Doxycycline Hyclate 50mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED097', 10.99, 5.50, 80, 20, 380, '2025-11-30', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 70),
('Doxycycline Calcium 50mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED098', 12.99, 6.50, 75, 20, 360, '2025-10-31', true, 'Vibramycin', ARRAY['Vibramycin', 'Doryx'], 65),
('Doxycycline Delayed Release 50mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED099', 14.99, 7.50, 70, 18, 340, '2025-09-30', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 60),
('Doxycycline Extended Release 50mg', 'Doxycycline', 'Antibiotic for bacterial infections', 'AntibioCorp', 'MED100', 16.99, 8.50, 65, 15, 320, '2025-08-31', true, 'Doryx', ARRAY['Doryx', 'Vibramycin'], 55)

ON CONFLICT (name) DO NOTHING;

-- Update search vectors for all new entries
UPDATE medicine_names 
SET search_vector = to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(generic_name, '') || ' ' || 
    COALESCE(brand_name, '') || ' ' || 
    COALESCE(array_to_string(common_names, ' '), '')
)
WHERE search_vector IS NULL;

-- Verify the additions
SELECT 
    'Medicine names added successfully' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN name ILIKE 'Do%' THEN 1 END) as medicines_starting_with_do
FROM medicine_names;
