const fs = require('fs');
let code = fs.readFileSync('c:/Users/manik/OneDrive/Desktop/work/medi-user/src/pages/HomeSampleList.tsx', 'utf-8');

// Replacements
code = code.replace(/HomeSampleList/g, 'LabTestList');
code = code.replace(/homeSampleCollectionApi/g, 'labTestApi');
code = code.replace(/import \{.*?homeSampleCollectionApi.*?\} from '\.\.\/lib\/homeSampleCollectionApi';/s, 
  "import { labTestApi, labBookingApi, type LabTestRecord, type LaboratoryRecord, type LabBookingRecord } from '../lib/labTestApi';");

code = code.replace(/getEligibleLaboratories/g, 'getLaboratoriesForTest');
code = code.replace(/getAvailability/g, 'getLaboratoryAvailability');
code = code.replace(/labTestApi\.createBooking/g, 'labBookingApi.createLabBooking');
code = code.replace(/collectionType: 'HOME_COLLECTION'/g, "collectionType: 'LAB_VISIT'");

// In handleConfirmAndPay we need to remove collectionAddress
code = code.replace(/collectionAddress: patientDetails\.address\.trim\(\),/g, "");
code = code.replace(/patientDetails\.address\.trim\(\)/g, "''");

// Re-write transition handlers
code = code.replace(/const handleProceedToHomeCollection = \(\) => \{[^}]+\};/s, 
  `const handleProceedToLabSelect = () => {
    if (selectedItem?.id) {
      loadEligibleLaboratories(selectedItem.id);
    }
    setViewState('LAB_SELECT');
  };`);

code = code.replace(/const handleProceedToPatient = \(\) => \{[^}]+\};/s, 
  `const handleProceedToPatient = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select collection date and time slot.');
      return;
    }
    setViewState('PATIENT');
  };`);

code = code.replace(/const handleProceedToDateTime = \(\) => \{[^}]+\};/s, 
  `const handleProceedToDateTime = () => {
    if (!selectedLab) {
      alert('Please select a laboratory.');
      return;
    }
    if (selectedLab) {
      loadSlots(selectedLab.id, selectedDate);
    }
    setViewState('DATE_TIME');
  };`);

code = code.replace(/const handleProceedToReview = \(\) => \{[^}]+\};/s, 
  `const handleProceedToReview = () => {
    if (!patientDetails.name.trim() || !patientDetails.phone.trim()) {
      alert('Please provide patient name and phone number.');
      return;
    }
    setViewState('REVIEW');
  };`);


// Handle view transition replacements
code = code.replace(/onClick=\{handleProceedToHomeCollection\}/g, 'onClick={handleProceedToLabSelect}');
// in LAB_SELECT view, the button goes to PATIENT, we want it to go to DATE_TIME
code = code.replace(/onClick=\{handleProceedToPatient\}/g, "onClick={handleProceedToDateTime}");
// in DATE_TIME view, the button goes to REVIEW (was PATIENT), but wait: DATE_TIME doesn't have a continue button in HomeSampleList? 
// Ah, DATE_TIME has "Continue to Review". Wait, let me check HomeSampleList DATE_TIME view. It goes to REVIEW!
// So DATE_TIME -> REVIEW. But we want DATE_TIME -> PATIENT!
code = code.replace(/onClick=\{handleProceedToReview\}/g, "onClick={handleProceedToPatient}");
// in PATIENT view, the form submit goes to DATE_TIME. We want it to go to REVIEW!
code = code.replace(/onSubmit=\{\(e\) => \{\s*e\.preventDefault\(\);\s*handleProceedToDateTime\(\);\s*\}\}/g, 
  "onSubmit={(e) => { e.preventDefault(); handleProceedToReview(); }}");

// Replace viewState names
code = code.replace(/viewState === 'HOME_COLLECTION'/g, "viewState === 'LAB_SELECT'");
code = code.replace(/setViewState\('HOME_COLLECTION'\)/g, "setViewState('LAB_SELECT')");

// Fix Back buttons
// DATE_TIME back button went to PATIENT. Change it to LAB_SELECT
code = code.replace(/onClick=\{\(\) => setViewState\('PATIENT'\)\}\s*className="w-full flex items-center justify-center bg-white text-slate-700/g, "onClick={() => setViewState('LAB_SELECT')} className=\"w-full flex items-center justify-center bg-white text-slate-700");
// PATIENT back button went to HOME_COLLECTION. Change it to DATE_TIME
code = code.replace(/onClick=\{\(\) => setViewState\('LAB_SELECT'\)\}\s*className="w-full flex items-center justify-center bg-white text-slate-700/g, "onClick={() => setViewState('DATE_TIME')} className=\"w-full flex items-center justify-center bg-white text-slate-700");


// Remove the address block from PATIENT view
code = code.replace(/<div className="pt-2 border-t border-slate-50 mt-4">[\s\S]*?<\/textarea>\s*<\/div>\s*\)\}\s*<\/div>/g, '</div>');

code = code.replace(/Doorstep Home Sample Collection Available/g, 'Laboratory Visit Available');
code = code.replace(/Choose Home Collection/g, 'Choose Laboratory');
code = code.replace(/home sample collection/gi, 'laboratory visit');
code = code.replace(/doorstep/gi, 'chosen laboratory');
code = code.replace(/phlebotomist/gi, 'technician');
code = code.replace(/HomeCollection/g, 'LabVisit');
code = code.replace(/home collection/gi, 'laboratory visit');

// Remove home collection fees logic from UI
code = code.replace(/\{selectedLab\?\.homeCollectionFee \? `₹\$\{selectedLab\.homeCollectionFee\}` : 'FREE'\}/g, "");
code = code.replace(/\{collectionMethod === 'HOME' && \([\s\S]*?\}\)/g, ""); 
code = code.replace(/\{collectionMethod === 'HOME' \? 'Home Sample Collection' : 'Visit Laboratory'\}/g, "'Visit Laboratory'");

// Remove the Continue to Patient button in DATE_TIME and replace text
code = code.replace(/Continue to Schedule Slot/g, "Continue to Booking Review");
code = code.replace(/Continue to Patient Details/g, "Continue to Date & Time"); 
// Wait, DATE_TIME button said "Continue to Booking Review", now it should say "Continue to Patient Details"
code = code.replace(/Continue to Booking Review/g, "Continue to Patient Details");
code = code.replace(/Continue to Patient Details/g, "Continue to Date & Time"); // Wait this will replace everything
// Let's do it manually

fs.writeFileSync('c:/Users/manik/OneDrive/Desktop/work/medi-user/src/pages/LabTestList.tsx', code);
console.log('Done');
