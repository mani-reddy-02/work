import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, Hospital, Video, Clock, CheckCircle2, ChevronLeft, 
  MapPin, Phone, Star, ShieldCheck, User, Activity, FileText, AlertCircle, 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Info,
  Thermometer, Brain, Droplet, Heart, Wind, Bone, Flame, Sparkles, Eye, Shield, ArrowLeft, Calendar,
  Building2, Stethoscope, CalendarClock, CalendarCheck, ActivitySquare, Bot, X
} from 'lucide-react';
import HowItWorks from '../components/HowItWorks';
import KnowYourDiseaseModal from '../components/KnowYourDiseaseModal';
import { useAuth } from '../lib/auth';
import { opAppointmentApi, doctorApi, hospitalApi } from '../lib/opAppointmentApi';

import {
  HeartIcon, KidneyIcon, SkinIcon, LiverIcon, BrainIcon, LungsIcon,
  VirusIcon, BoneIcon, StomachIcon, EyeIcon, ToothIcon, DropsIcon,
  RibbonIcon, EarIcon, FemaleIcon, MaleIcon, ChildIcon, PsychiatryIcon,
  ThermometerIcon, WindIcon, HeadacheIcon, PainIcon, JointIcon,
  SparklesIcon, IntestinesIcon, ThroatIcon, ShieldVirusIcon, VomitIcon
} from '../components/DiseaseIcons';

// --- MOCK DATA ---
const opBookingStepsData = [
  { id: '01', title: 'Search Hospital', desc: 'Find a suitable hospital based on your location or healthcare need.', icon: Search },
  { id: '02', title: 'Select Hospital', desc: 'Choose a hospital that provides the required healthcare service.', icon: Building2 },
  { id: '03', title: 'Choose Department', desc: 'Select the department related to your health concern.', icon: Activity },
  { id: '04', title: 'Select Doctor', desc: 'Choose an available doctor based on specialization and availability.', icon: Stethoscope },
  { id: '05', title: 'Select Date & Time', desc: 'Choose a convenient available appointment slot.', icon: CalendarClock },
  { id: '06', title: 'Confirm Appointment', desc: 'Review your appointment details and confirm your booking.', icon: CalendarCheck }
];

const videoConsultationStepsData = [
  { id: '01', title: 'Search Disease', desc: 'Search for your disease or health concern.', icon: Search },
  { id: '02', title: 'Select Disease', desc: 'Choose the condition that best matches your healthcare concern.', icon: ActivitySquare },
  { id: '03', title: 'Find Hospital', desc: 'View hospitals that provide care for the selected condition.', icon: Building2 },
  { id: '04', title: 'Choose Doctor', desc: 'Select a suitable doctor based on specialization and availability.', icon: Stethoscope },
  { id: '05', title: 'Book Consultation', desc: 'Choose an available consultation time and confirm your booking.', icon: CalendarClock },
  { id: '06', title: 'Start Video Consultation', desc: 'Join your scheduled consultation with the selected doctor.', icon: Video }
];
const MOCK_HOSPITALS = [
  { 
    id: 'H1', 
    name: 'Apollo Hospitals', 
    address: 'Jubilee Hills, Hyderabad', 
    contact: '+91 40 2360 7777', 
    departments: ['Cardiology', 'Neurology', 'Orthopedics'], 
    description: 'Multi-specialty hospital with advanced healthcare and state-of-the-art infrastructure.', 
    verified: true 
  },
  { 
    id: 'H2', 
    name: 'KIMS Hospitals', 
    address: 'Minister Road, Secunderabad', 
    contact: '+91 40 4488 5000', 
    departments: ['Pediatrics', 'Gastroenterology', 'Dermatology'], 
    description: 'Leading healthcare provider known for clinical excellence and patient care.', 
    verified: true 
  },
];

const MOCK_DOCTORS = [
  { id: 'D1', name: 'Dr. Rajesh Kumar', specialization: 'Cardiologist', qualification: 'MBBS, MD, DM', experience: '15 Years', hospitalId: 'H1', hospitalName: 'Apollo Hospitals', department: 'Cardiology', consultInfo: 'Expert in interventional cardiology and heart failure.', fees: '₹1000', rating: 4.8 },
  { id: 'D2', name: 'Dr. Sneha Reddy', specialization: 'Neurologist', qualification: 'MBBS, MD, DM', experience: '12 Years', hospitalId: 'H1', hospitalName: 'Apollo Hospitals', department: 'Neurology', consultInfo: 'Specializes in stroke, epilepsy and movement disorders.', fees: '₹1200', rating: 4.9 },
  { id: 'D3', name: 'Dr. Amit Sharma', specialization: 'Pediatrician', qualification: 'MBBS, MD', experience: '10 Years', hospitalId: 'H2', hospitalName: 'KIMS Hospitals', department: 'Pediatrics', consultInfo: 'Child care, vaccinations, and pediatric infectious diseases.', fees: '₹800', rating: 4.7 },
  { id: 'D4', name: 'Dr. Priya Desai', specialization: 'Dermatologist', qualification: 'MBBS, MD', experience: '8 Years', hospitalId: 'H2', hospitalName: 'KIMS Hospitals', department: 'Dermatology', consultInfo: 'Skin health, cosmetic dermatology, and hair treatments.', fees: '₹900', rating: 4.6 },
];

const TIME_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '11:00 AM', '04:00 PM'];

export interface SlotDateOption {
  label: string;
  date: string;
  isoDate: string;
}

export const getUpcomingDates = (): SlotDateOption[] => {
  const dates: SlotDateOption[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleString('en-US', { weekday: 'short' });
    dates.push({
      label,
      date: `${month} ${day}`,
      isoDate
    });
  }
  return dates;
};

const INITIAL_DATES = getUpcomingDates();

const generalDiseases = [
  { id: 'fever', name: 'Fever', image: '/optimized/Fever.webp', icon: ThermometerIcon, bg: 'bg-red-50' },
  { id: 'common-cold', name: 'Common Cold', image: '/optimized/Common Cold.webp', icon: WindIcon, bg: 'bg-blue-50' },
  { id: 'flu', name: 'Flu', image: '/optimized/Flu.webp', icon: VirusIcon, bg: 'bg-green-50' },
  { id: 'cough', name: 'Cough', icon: WindIcon, bg: 'bg-cyan-50' },
  { id: 'headache', name: 'Headache', icon: BrainIcon, bg: 'bg-purple-50' },
  { id: 'migraine', name: 'Migraine', image: '/optimized/Migraine.webp', icon: HeadacheIcon, bg: 'bg-indigo-50' },
  { id: 'body-pain', name: 'Body Pain', icon: BoneIcon, bg: 'bg-slate-50' },
  { id: 'sore-throat', name: 'Sore Throat', image: '/optimized/Pharyngitis.webp', icon: ThroatIcon, bg: 'bg-orange-50' },
  { id: 'acidity', name: 'Acidity', image: '/optimized/GERD.webp', icon: StomachIcon, bg: 'bg-amber-50' },
  { id: 'gastritis', name: 'Gastritis', image: '/optimized/Gastritis.webp', icon: StomachIcon, bg: 'bg-orange-50' },
  { id: 'constipation', name: 'Constipation', image: '/optimized/Constipation.webp', icon: IntestinesIcon, bg: 'bg-stone-50' },
  { id: 'diarrhea', name: 'Diarrhea', image: '/optimized/Diarrhea.webp', icon: IntestinesIcon, bg: 'bg-yellow-50' },
  { id: 'vomiting', name: 'Vomiting', icon: VomitIcon, bg: 'bg-lime-50' },
  { id: 'allergies', name: 'Allergies', image: '/optimized/Allergy.webp', icon: SparklesIcon, bg: 'bg-pink-50' },
  { id: 'skin-rash', name: 'Skin Rash', image: '/optimized/Eczema.webp', icon: SkinIcon, bg: 'bg-rose-50' },
  { id: 'mild-infection', name: 'Mild Infection', image: '/optimized/Viral Infection.webp', icon: VirusIcon, bg: 'bg-teal-50' },
  { id: 'back-pain', name: 'Back Pain', image: '/optimized/Back Pain.webp', icon: BoneIcon, bg: 'bg-slate-50' },
  { id: 'joint-pain', name: 'Joint Pain', image: '/optimized/Joint Pain.webp', icon: JointIcon, bg: 'bg-blue-50' },
  { id: 'toothache', name: 'Toothache', icon: ToothIcon, bg: 'bg-sky-50' },
  { id: 'eye-irritation', name: 'Eye Irritation', image: '/optimized/Dry Eye.webp', icon: EyeIcon, bg: 'bg-cyan-50' },
];

const advancedDiseases = [
  { id: 'cancer', name: 'Cancer', image: '/optimized/Cancer.webp', icon: RibbonIcon, bg: 'bg-pink-50' },
  { id: 'heart', name: 'Heart Disease', image: '/optimized/Heart Disease.webp', icon: HeartIcon, bg: 'bg-red-50' },
  { id: 'heart-attack', name: 'Heart Attack', image: '/optimized/Heart Attack.webp', icon: HeartIcon, bg: 'bg-rose-50' },
  { id: 'stroke', name: 'Stroke', image: '/optimized/Stroke.webp', icon: BrainIcon, bg: 'bg-purple-50' },
  { id: 'kidney', name: 'Kidney Disease', image: '/optimized/Kidney Disease.webp', icon: KidneyIcon, bg: 'bg-blue-50' },
  { id: 'ckd', name: 'Chronic Kidney Disease', image: '/optimized/Kidney Disease.webp', icon: KidneyIcon, bg: 'bg-indigo-50' },
  { id: 'liver', name: 'Liver Disease', image: '/optimized/Hepatitis.webp', icon: LiverIcon, bg: 'bg-orange-50' },
  { id: 'cirrhosis', name: 'Cirrhosis', image: '/optimized/Fatty Liver Disease.webp', icon: LiverIcon, bg: 'bg-amber-50' },
  { id: 'diabetes', name: 'Diabetes Complications', image: '/optimized/Diabetes.webp', icon: DropsIcon, bg: 'bg-cyan-50' },
  { id: 'hypertension', name: 'Hypertension Complications', image: '/optimized/Hypertension.webp', icon: HeartIcon, bg: 'bg-red-50' },
  { id: 'neuro', name: 'Neurological Disorders', icon: BrainIcon, bg: 'bg-fuchsia-50' },
  { id: 'parkinsons', name: 'Parkinson\'s Disease', image: "/optimized/Parkinson's Disease.webp", icon: BrainIcon, bg: 'bg-violet-50' },
  { id: 'alzheimers', name: 'Alzheimer\'s Disease', image: "/optimized/Alzheimer's Disease.webp", icon: BrainIcon, bg: 'bg-purple-50' },
  { id: 'epilepsy', name: 'Epilepsy', image: '/optimized/Epilepsy.webp', icon: HeadacheIcon, bg: 'bg-indigo-50' },
  { id: 'autoimmune', name: 'Autoimmune Disorders', icon: ShieldVirusIcon, bg: 'bg-emerald-50' },
  { id: 'rheumatoid', name: 'Rheumatoid Arthritis', image: '/optimized/Arthritis.webp', icon: JointIcon, bg: 'bg-sky-50' },
  { id: 'asthma', name: 'Asthma', image: '/optimized/Asthma.webp', icon: LungsIcon, bg: 'bg-pink-50' },
  { id: 'copd', name: 'COPD', image: '/optimized/COPD.webp', icon: LungsIcon, bg: 'bg-rose-50' },
  { id: 'tb', name: 'Tuberculosis', image: '/optimized/Tuberculosis.webp', icon: LungsIcon, bg: 'bg-fuchsia-50' },
  { id: 'severe-respiratory', name: 'Severe Respiratory Disorders', image: '/optimized/Pneumonia.webp', icon: LungsIcon, bg: 'bg-purple-50' },
];

const categoricalDiseases = [
  { id: 'diet', name: 'Diet & Nutrition / Dietitian', desc: 'Diet and nutrition plans.', icon: SparklesIcon, bg: 'bg-emerald-50' },
  { id: 'yoga', name: 'Yoga & Wellness', desc: 'Physical and mental well-being.', icon: SparklesIcon, bg: 'bg-cyan-50' },
  { id: 'sexual', name: 'Sexual Health', desc: 'Sexual and reproductive health.', icon: HeartIcon, bg: 'bg-rose-50' },
  { id: 'cardio', name: 'Cardiology', desc: 'Heart and cardiovascular conditions.', icon: HeartIcon, bg: 'bg-red-50' },
  { id: 'neuro', name: 'Neurology', desc: 'Brain and nervous-system conditions.', icon: BrainIcon, bg: 'bg-purple-50' },
  { id: 'derm', name: 'Dermatology', desc: 'Skin, hair and nail conditions.', icon: SkinIcon, bg: 'bg-rose-50' },
  { id: 'ortho', name: 'Orthopedics', desc: 'Bones, joints, muscles and spine.', icon: BoneIcon, bg: 'bg-slate-50' },
  { id: 'gastro', name: 'Gastroenterology', desc: 'Digestive-system conditions.', icon: StomachIcon, bg: 'bg-orange-50' },
  { id: 'pulmo', name: 'Pulmonology', desc: 'Lung and respiratory conditions.', icon: LungsIcon, bg: 'bg-pink-50' },
  { id: 'endo', name: 'Endocrinology', desc: 'Hormonal and metabolic conditions.', icon: DropsIcon, bg: 'bg-cyan-50' },
  { id: 'nephro', name: 'Nephrology', desc: 'Kidney and urinary-system conditions.', icon: KidneyIcon, bg: 'bg-blue-50' },
  { id: 'hepato', name: 'Hepatology', desc: 'Liver-related conditions.', icon: LiverIcon, bg: 'bg-amber-50' },
  { id: 'onco', name: 'Oncology', desc: 'Cancer-related conditions.', icon: RibbonIcon, bg: 'bg-fuchsia-50' },
  { id: 'ophthal', name: 'Ophthalmology', desc: 'Eye-related conditions.', icon: EyeIcon, bg: 'bg-sky-50' },
  { id: 'ent', name: 'ENT', desc: 'Ear, nose and throat conditions.', icon: EarIcon, bg: 'bg-orange-50' },
  { id: 'gynae', name: 'Gynecology', desc: 'Women\'s reproductive health conditions.', icon: FemaleIcon, bg: 'bg-pink-50' },
  { id: 'pedia', name: 'Pediatrics', desc: 'Childhood diseases and conditions.', icon: ChildIcon, bg: 'bg-amber-50' },
  { id: 'uro', name: 'Urology', desc: 'Urinary and male reproductive conditions.', icon: MaleIcon, bg: 'bg-blue-50' },
  { id: 'psych', name: 'Psychiatry', desc: 'Mental and behavioral health conditions.', icon: PsychiatryIcon, bg: 'bg-indigo-50' },
  { id: 'rheumato', name: 'Rheumatology', desc: 'Autoimmune and inflammatory conditions.', icon: JointIcon, bg: 'bg-teal-50' },
  { id: 'infectious', name: 'Infectious Disease', desc: 'Bacterial, viral, fungal and other infections.', icon: VirusIcon, bg: 'bg-green-50' },
  { id: 'respiratory', name: 'Pulmonary / Respiratory', desc: 'Respiratory conditions.', icon: LungsIcon, bg: 'bg-rose-50' },
  { id: 'dental', name: 'Dental', desc: 'Teeth, gums and oral conditions.', icon: ToothIcon, bg: 'bg-slate-50' },
];

const CATEGORICAL_DISEASE_MAP: Record<string, Array<{ id: string; name: string; desc: string; icon: any; bg: string }>> = {
  cardio: [
    { id: 'heart-disease', name: 'Heart Disease', desc: 'Coronary artery disease, valve disorders & cardiac care.', icon: HeartIcon, bg: 'bg-red-50' },
    { id: 'hypertension', name: 'Hypertension / High BP', desc: 'Chronic high blood pressure management & monitoring.', icon: HeartIcon, bg: 'bg-rose-50' },
    { id: 'chest-pain', name: 'Angina & Chest Discomfort', desc: 'Exertional chest tightness, pain or pressure symptoms.', icon: PainIcon, bg: 'bg-orange-50' },
    { id: 'arrhythmia', name: 'Heart Palpitations & Arrhythmia', desc: 'Irregular, rapid, or fluttering heartbeat evaluation.', icon: Activity, bg: 'bg-red-50' },
    { id: 'heart-failure', name: 'Heart Failure Care', desc: 'Fluid retention, shortness of breath & cardiac rehabilitation.', icon: HeartIcon, bg: 'bg-pink-50' },
    { id: 'cholesterol', name: 'Hyperlipidemia & Cholesterol', desc: 'High triglycerides and cardiovascular preventive care.', icon: DropsIcon, bg: 'bg-amber-50' },
  ],
  neuro: [
    { id: 'migraine', name: 'Migraine & Chronic Headache', desc: 'Throbbing head pain, light sensitivity & aura symptoms.', icon: HeadacheIcon, bg: 'bg-indigo-50' },
    { id: 'stroke', name: 'Stroke Recovery & TIA', desc: 'Post-stroke rehab, weakness & cerebrovascular health.', icon: BrainIcon, bg: 'bg-purple-50' },
    { id: 'epilepsy', name: 'Epilepsy & Seizure Disorders', desc: 'Convulsions, blackouts and neurological diagnosis.', icon: BrainIcon, bg: 'bg-violet-50' },
    { id: 'parkinsons', name: 'Parkinson\'s & Tremors', desc: 'Movement disorders, stiffness & progressive motor care.', icon: BrainIcon, bg: 'bg-fuchsia-50' },
    { id: 'alzheimers', name: 'Dementia & Memory Loss', desc: 'Cognitive decline, Alzheimer\'s & geriatric neuro care.', icon: BrainIcon, bg: 'bg-purple-50' },
    { id: 'neuropathy', name: 'Peripheral Neuropathy', desc: 'Numbness, tingling or nerve pain in hands & feet.', icon: PainIcon, bg: 'bg-blue-50' },
  ],
  derm: [
    { id: 'skin-rash', name: 'Skin Rash & Hives (Urticaria)', desc: 'Itchy, red, inflammatory allergic flare-ups.', icon: SkinIcon, bg: 'bg-rose-50' },
    { id: 'acne', name: 'Acne & Facial Breakouts', desc: 'Pimples, cysts, hormonal acne & scar prevention.', icon: SparklesIcon, bg: 'bg-pink-50' },
    { id: 'eczema', name: 'Eczema & Atopic Dermatitis', desc: 'Dry, cracked, sensitive and itchy skin patches.', icon: SkinIcon, bg: 'bg-orange-50' },
    { id: 'psoriasis', name: 'Psoriasis & Scalp Care', desc: 'Silvery plaques, skin flaking & chronic inflammation.', icon: SkinIcon, bg: 'bg-amber-50' },
    { id: 'fungal-infection', name: 'Fungal & Ringworm Infections', desc: 'Tinea, athlete\'s foot and persistent skin fungal care.', icon: VirusIcon, bg: 'bg-teal-50' },
    { id: 'hair-loss', name: 'Hair Loss & Alopecia', desc: 'Thinning hair, scalp dermatitis & follicle treatments.', icon: SparklesIcon, bg: 'bg-purple-50' },
  ],
  ortho: [
    { id: 'joint-pain', name: 'Knee & Joint Pain', desc: 'Swelling, stiffness and reduced joint mobility.', icon: JointIcon, bg: 'bg-blue-50' },
    { id: 'back-pain', name: 'Back Pain & Sciatica', desc: 'Lower back stiffness, herniated disc & radiating pain.', icon: BoneIcon, bg: 'bg-slate-50' },
    { id: 'arthritis', name: 'Osteoarthritis & Gout', desc: 'Degenerative joint cartilage wear & inflammatory pain.', icon: JointIcon, bg: 'bg-sky-50' },
    { id: 'neck-shoulder', name: 'Cervical Spondylosis & Neck Pain', desc: 'Stiff neck, shoulder impingement & postural strain.', icon: PainIcon, bg: 'bg-indigo-50' },
    { id: 'osteoporosis', name: 'Osteoporosis & Bone Density', desc: 'Weak fragile bones & fracture risk management.', icon: BoneIcon, bg: 'bg-stone-50' },
    { id: 'sports-injury', name: 'Sports Injuries & Ligament Sprain', desc: 'ACL tears, sprains, muscle strains & rehab.', icon: BoneIcon, bg: 'bg-amber-50' },
  ],
  gastro: [
    { id: 'gerd-acidity', name: 'Acidity & Acid Reflux (GERD)', desc: 'Heartburn, chest burning & sour regurgitation.', icon: StomachIcon, bg: 'bg-amber-50' },
    { id: 'gastritis', name: 'Gastritis & Stomach Ulcers', desc: 'Upper abdominal burning, nausea and stomach irritation.', icon: StomachIcon, bg: 'bg-orange-50' },
    { id: 'constipation', name: 'Chronic Constipation', desc: 'Infrequent bowel movements & digestive discomfort.', icon: IntestinesIcon, bg: 'bg-stone-50' },
    { id: 'ibs', name: 'Irritable Bowel Syndrome (IBS)', desc: 'Cramping, bloating, diarrhea or alternating constipation.', icon: IntestinesIcon, bg: 'bg-yellow-50' },
    { id: 'fatty-liver', name: 'Fatty Liver & Liver Care', desc: 'Hepatic steatosis, digestive metabolism & enzyme elevation.', icon: LiverIcon, bg: 'bg-lime-50' },
    { id: 'gallbladder', name: 'Gallstones & Abdominal Colic', desc: 'Right upper quadrant abdominal pain after fatty meals.', icon: StomachIcon, bg: 'bg-teal-50' },
  ],
  pulmo: [
    { id: 'asthma', name: 'Asthma & Wheezing', desc: 'Bronchial constriction, nighttime coughing & shortness of breath.', icon: LungsIcon, bg: 'bg-pink-50' },
    { id: 'copd', name: 'COPD & Chronic Bronchitis', desc: 'Persistent phlegm, smoker\'s cough & reduced lung airflow.', icon: LungsIcon, bg: 'bg-rose-50' },
    { id: 'chronic-cough', name: 'Persistent / Chronic Cough', desc: 'Cough lasting over 3 weeks, allergy or post-nasal drip.', icon: WindIcon, bg: 'bg-cyan-50' },
    { id: 'pneumonia', name: 'Pneumonia & Chest Infection', desc: 'Fever, chest congestion & deep productive coughing.', icon: LungsIcon, bg: 'bg-fuchsia-50' },
    { id: 'sleep-apnea', name: 'Sleep Apnea & Snoring', desc: 'Daytime fatigue, interrupted sleep & respiratory screening.', icon: WindIcon, bg: 'bg-blue-50' },
    { id: 'pulmonary-allergy', name: 'Allergic Rhinitis & Bronchospasm', desc: 'Dust, pollen and environmental respiratory allergies.', icon: SparklesIcon, bg: 'bg-teal-50' },
  ],
  pedia: [
    { id: 'child-fever', name: 'Child Viral Fever', desc: 'High temperature, chills & infant pediatric care.', icon: ChildIcon, bg: 'bg-amber-50' },
    { id: 'pedia-cough', name: 'Pediatric Cough & Cold', desc: 'Runny nose, congestion & childhood viral respiratory care.', icon: WindIcon, bg: 'bg-blue-50' },
    { id: 'child-stomach', name: 'Colic & Childhood Stomach Pain', desc: 'Infant crying, digestive gas and abdominal distress.', icon: StomachIcon, bg: 'bg-orange-50' },
    { id: 'pedia-skin', name: 'Diaper Rash & Pediatric Eczema', desc: 'Childhood sensitive skin flare-ups & rashes.', icon: SkinIcon, bg: 'bg-rose-50' },
    { id: 'vaccination', name: 'Child Vaccinations & Immunization', desc: 'Standard national pediatric vaccination schedules.', icon: ShieldCheck, bg: 'bg-teal-50' },
    { id: 'growth-nutrition', name: 'Childhood Growth & Nutrition', desc: 'Milestones, appetite concerns & pediatric development.', icon: ChildIcon, bg: 'bg-yellow-50' },
  ],
  gynae: [
    { id: 'pcos-pcod', name: 'PCOD / PCOS Assessment', desc: 'Hormonal imbalance, irregular periods & cystic ovaries.', icon: FemaleIcon, bg: 'bg-pink-50' },
    { id: 'period-pain', name: 'Menstrual Disorders & Dysmenorrhea', desc: 'Heavy flow, severe cramping or missed periods.', icon: FemaleIcon, bg: 'bg-rose-50' },
    { id: 'pregnancy-care', name: 'Pregnancy & Prenatal Care', desc: 'Trimester checkups, fetal monitoring & maternal health.', icon: FemaleIcon, bg: 'bg-purple-50' },
    { id: 'pelvic-infection', name: 'Pelvic Infection & Vaginitis', desc: 'Unusual discharge, itching and lower abdominal discomfort.', icon: PainIcon, bg: 'bg-orange-50' },
    { id: 'fibroids', name: 'Uterine Fibroids & Polyps', desc: 'Benign growths, pelvic pressure & non-surgical monitoring.', icon: FemaleIcon, bg: 'bg-amber-50' },
    { id: 'menopause', name: 'Menopause Support & Hot Flashes', desc: 'Hormone transitions, mood shifts & bone health.', icon: FemaleIcon, bg: 'bg-red-50' },
  ],
  ent: [
    { id: 'sinusitis', name: 'Sinusitis & Nasal Blockage', desc: 'Facial pain, headache, sinus pressure & congested breathing.', icon: WindIcon, bg: 'bg-cyan-50' },
    { id: 'throat-infection', name: 'Sore Throat & Tonsillitis', desc: 'Swollen tonsils, painful swallowing & pharyngeal redness.', icon: ThroatIcon, bg: 'bg-orange-50' },
    { id: 'ear-infection', name: 'Ear Pain & Otitis Media', desc: 'Ear discharge, fluid buildup, throbbing pain or itching.', icon: EarIcon, bg: 'bg-blue-50' },
    { id: 'hearing-loss', name: 'Hearing Loss & Tinnitus', desc: 'Ringing in ears, muffled sound & audiology assessment.', icon: EarIcon, bg: 'bg-indigo-50' },
    { id: 'vertigo-ent', name: 'Inner Ear Balance & Vertigo (BPPV)', desc: 'Spinning sensation when turning head & balance care.', icon: BrainIcon, bg: 'bg-purple-50' },
  ],
  dental: [
    { id: 'toothache', name: 'Severe Toothache', desc: 'Sharp, throbbing tooth pain when eating or drinking.', icon: ToothIcon, bg: 'bg-sky-50' },
    { id: 'bleeding-gums', name: 'Bleeding Gums & Gingivitis', desc: 'Gum redness, swelling and tenderness during brushing.', icon: ToothIcon, bg: 'bg-red-50' },
    { id: 'cavities', name: 'Dental Cavities & Decay', desc: 'Holes in teeth, enamel erosion and dark tooth spots.', icon: ToothIcon, bg: 'bg-slate-50' },
    { id: 'root-canal', name: 'Root Canal & Nerve Infection', desc: 'Pulp inflammation, dental abscess and restorative care.', icon: ToothIcon, bg: 'bg-amber-50' },
    { id: 'teeth-alignment', name: 'Teeth Alignment & Orthodontics', desc: 'Crooked teeth, bite correction, braces & aligners.', icon: SparklesIcon, bg: 'bg-emerald-50' },
  ],
  endo: [
    { id: 'diabetes', name: 'Diabetes Mellitus (Type 1 & 2)', desc: 'Blood sugar fluctuations, HbA1c control & insulin guidance.', icon: DropsIcon, bg: 'bg-cyan-50' },
    { id: 'thyroid', name: 'Thyroid Disorders (Hypo / Hyper)', desc: 'Fatigue, unexplained weight changes & TSH management.', icon: DropsIcon, bg: 'bg-purple-50' },
    { id: 'hormonal-metabolic', name: 'Metabolic Syndrome & Obesity', desc: 'Insulin resistance, visceral fat & metabolic wellness.', icon: Activity, bg: 'bg-amber-50' },
    { id: 'osteoporosis-endo', name: 'Calcium & Parathyroid Disorders', desc: 'Bone density deficiency, calcium and vitamin D management.', icon: BoneIcon, bg: 'bg-teal-50' },
  ],
  nephro: [
    { id: 'kidney-stones', name: 'Kidney Stones (Renal Calculi)', desc: 'Severe flank pain, blood in urine and urinary colic.', icon: KidneyIcon, bg: 'bg-indigo-50' },
    { id: 'ckd', name: 'Chronic Kidney Disease (CKD)', desc: 'Elevated creatinine, eGFR monitoring & renal function.', icon: KidneyIcon, bg: 'bg-blue-50' },
    { id: 'uti', name: 'Urinary Tract Infection (UTI)', desc: 'Burning during urination, frequency and bladder discomfort.', icon: DropsIcon, bg: 'bg-amber-50' },
    { id: 'proteinuria', name: 'Proteinuria & Kidney Swelling', desc: 'Edema in legs/face, protein leakage & nephrotic care.', icon: DropsIcon, bg: 'bg-cyan-50' },
  ],
  hepato: [
    { id: 'fatty-liver-hepato', name: 'Fatty Liver Disease (NAFLD)', desc: 'Fat accumulation in liver, elevated ALT/AST & diet care.', icon: LiverIcon, bg: 'bg-amber-50' },
    { id: 'hepatitis', name: 'Viral Hepatitis (A, B, C, E)', desc: 'Jaundice, dark urine, liver swelling & antiviral monitoring.', icon: LiverIcon, bg: 'bg-orange-50' },
    { id: 'cirrhosis', name: 'Liver Cirrhosis & Portal Pressure', desc: 'Liver scarring, ascites, fluid buildup & specialist care.', icon: LiverIcon, bg: 'bg-yellow-50' },
  ],
  onco: [
    { id: 'cancer-screening', name: 'Cancer Screening & Diagnosis', desc: 'Preventative diagnostic checks, biopsy & second opinion.', icon: RibbonIcon, bg: 'bg-fuchsia-50' },
    { id: 'chemotherapy-care', name: 'Chemotherapy & Medical Oncology', desc: 'Systemic cancer treatments, immunotherapy & side effect care.', icon: RibbonIcon, bg: 'bg-pink-50' },
    { id: 'tumor-evaluation', name: 'Tumor & Mass Evaluation', desc: 'Unexplained lumps, weight loss and multidisciplinary oncology.', icon: RibbonIcon, bg: 'bg-rose-50' },
  ],
  ophthal: [
    { id: 'dry-eye', name: 'Dry Eye Syndrome & Irritation', desc: 'Burning, redness, gritty sensation and screen fatigue.', icon: EyeIcon, bg: 'bg-cyan-50' },
    { id: 'vision-blur', name: 'Blurry Vision & Refraction', desc: 'Difficulty focusing, myopia, astigmatism & lens check.', icon: EyeIcon, bg: 'bg-blue-50' },
    { id: 'conjunctivitis', name: 'Conjunctivitis & Eye Infection', desc: 'Pink eye, discharge, morning crusting and eyelid swelling.', icon: EyeIcon, bg: 'bg-rose-50' },
    { id: 'cataract', name: 'Cataract Consultation', desc: 'Cloudy vision, glare, halos and intraocular lens guidance.', icon: EyeIcon, bg: 'bg-sky-50' },
  ],
  uro: [
    { id: 'uro-stones', name: 'Bladder & Ureteral Stones', desc: 'Sharp lower abdominal or groin pain with urination changes.', icon: KidneyIcon, bg: 'bg-cyan-50' },
    { id: 'prostate', name: 'Prostate Enlargement (BPH)', desc: 'Weak stream, nocturnal urination and urinary hesitancy.', icon: MaleIcon, bg: 'bg-indigo-50' },
    { id: 'uro-infection', name: 'Urinary Tract Infection & Incontinence', desc: 'Urgency, leaking, dysuria and urological diagnostics.', icon: MaleIcon, bg: 'bg-blue-50' },
  ],
  psych: [
    { id: 'anxiety-panic', name: 'Anxiety & Panic Disorders', desc: 'Excessive worry, nervousness, racing heart & panic episodes.', icon: PsychiatryIcon, bg: 'bg-indigo-50' },
    { id: 'depression', name: 'Depression & Mood Disorders', desc: 'Persistent sadness, low energy, loss of interest & support.', icon: PsychiatryIcon, bg: 'bg-purple-50' },
    { id: 'stress-insomnia', name: 'Severe Stress & Sleep Disorders', desc: 'Difficulty falling asleep, daytime fatigue & burnout care.', icon: BrainIcon, bg: 'bg-blue-50' },
  ],
  rheumato: [
    { id: 'rheumatoid-arthritis', name: 'Rheumatoid Arthritis (RA)', desc: 'Symmetrical morning joint stiffness and autoimmune pain.', icon: JointIcon, bg: 'bg-teal-50' },
    { id: 'gout', name: 'Gout & Uric Acid Crystals', desc: 'Acute big toe or joint redness, warmth and throbbing pain.', icon: JointIcon, bg: 'bg-amber-50' },
    { id: 'ankylosing', name: 'Ankylosing Spondylitis', desc: 'Chronic inflammatory spine stiffness & sacroiliac joint care.', icon: BoneIcon, bg: 'bg-sky-50' },
  ],
  infectious: [
    { id: 'viral-fever', name: 'Viral Fever & Seasonal Infection', desc: 'High fever, body aches, exhaustion & blood count check.', icon: VirusIcon, bg: 'bg-green-50' },
    { id: 'dengue-malaria', name: 'Dengue & Malaria Screening', desc: 'Sudden high fever, severe eye/bone pain & platelet care.', icon: VirusIcon, bg: 'bg-teal-50' },
    { id: 'typhoid', name: 'Typhoid & Intestinal Infection', desc: 'Step-ladder fever, stomach pain, headache & antibiotics.', icon: VirusIcon, bg: 'bg-orange-50' },
  ],
  diet: [
    { id: 'weight-management', name: 'Weight Loss & Obesity Diet', desc: 'Personalized calorie-deficit & nutrient-dense eating plans.', icon: SparklesIcon, bg: 'bg-emerald-50' },
    { id: 'diabetic-diet', name: 'Diabetic Nutrition Plan', desc: 'Low GI foods, carbohydrate counting & glycemic control.', icon: DropsIcon, bg: 'bg-cyan-50' },
    { id: 'cardiac-diet', name: 'Heart-Healthy Nutrition', desc: 'Low sodium, heart-healthy fats and lipid-lowering meal plans.', icon: HeartIcon, bg: 'bg-red-50' },
  ],
  yoga: [
    { id: 'stress-relief', name: 'Stress Relief & Meditation', desc: 'Pranayama, mindfulness and nervous system relaxation.', icon: SparklesIcon, bg: 'bg-cyan-50' },
    { id: 'spine-flexibility', name: 'Spine & Joint Flexibility', desc: 'Asanas for back stiffness, posture correction & mobility.', icon: BoneIcon, bg: 'bg-teal-50' },
  ],
  sexual: [
    { id: 'sexual-wellness', name: 'Sexual Wellness & Counseling', desc: 'Confidential consultation for reproductive health concerns.', icon: HeartIcon, bg: 'bg-rose-50' },
    { id: 'hormonal-vitality', name: 'Hormonal Balance & Vitality', desc: 'Libido, hormone therapy & confidential specialist care.', icon: DropsIcon, bg: 'bg-purple-50' },
  ]
};

const getDiseasesForCategory = (catId: string, catName: string, rawConditions: any[] = []) => {
  // If backend has conditions for this category/specialty, prioritize them
  const backendMatches = rawConditions.filter(c => 
    c.specialtyId === catId || (c.specialtyName && c.specialtyName.toLowerCase().includes(catName.toLowerCase()))
  );

  if (backendMatches.length > 0) {
    return backendMatches.map((bm, idx) => ({
      id: bm.id,
      name: bm.name,
      desc: bm.description || `Specialized clinical care and diagnosis for ${bm.name}.`,
      icon: Stethoscope,
      bg: ['bg-red-50', 'bg-blue-50', 'bg-emerald-50', 'bg-purple-50', 'bg-amber-50'][idx % 5]
    }));
  }

  if (CATEGORICAL_DISEASE_MAP[catId]) {
    return CATEGORICAL_DISEASE_MAP[catId];
  }
  return [
    { id: `${catId}-1`, name: `${catName} Consultation`, desc: `General consultation and assessment for ${catName}.`, icon: Stethoscope, bg: 'bg-blue-50' },
    { id: `${catId}-2`, name: `Acute ${catName} Condition`, desc: `Recent or sudden symptoms requiring diagnosis.`, icon: Activity, bg: 'bg-red-50' },
    { id: `${catId}-3`, name: `Chronic ${catName} Care`, desc: `Long-term symptom management and follow-up care.`, icon: ShieldCheck, bg: 'bg-teal-50' },
    { id: `${catId}-4`, name: `Preventative ${catName} Checkup`, desc: `Preventative screening and wellness review.`, icon: SparklesIcon, bg: 'bg-emerald-50' },
  ];
};

type ViewState = 
  | 'LANDING'
  | 'CATEGORICAL_DISEASES'
  | 'HOSPITAL_RESULTS'
  | 'HOSPITAL_DETAILS'
  | 'DOCTOR_LIST'
  | 'DOCTOR_PROFILE'
  | 'SELECT_SLOT'
  | 'REASON'
  | 'REVIEW'
  | 'CONFIRMATION'
  | 'APPOINTMENT_STATUS'
  | 'VIDEO_UPCOMING'
  | 'VIDEO_CALL'
  | 'VIDEO_COMPLETED';

const Specialties = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'hospital-op';
  const isVideo = type === 'video-consult' || type === 'doctor';
  const { user } = useAuth();

  // State Management
  const [view, setView] = useState<ViewState>('LANDING');
  const [activeTab, setActiveTab] = useState('general');
  const [showAllGeneral, setShowAllGeneral] = useState(false);
  const [showAllAdvanced, setShowAllAdvanced] = useState(false);
  const [showAllCategorical, setShowAllCategorical] = useState(false);
  
  // Real Data State
  const [diseasesList, setDiseasesList] = useState({
    general: generalDiseases,
    advanced: advancedDiseases,
    categorical: categoricalDiseases,
    raw: [] as any[]
  });
  const [hospitalsList, setHospitalsList] = useState<any[]>(MOCK_HOSPITALS);
  const [doctorsList, setDoctorsList] = useState<any[]>(MOCK_DOCTORS);
  const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);
  const [isHospitalsLoading, setIsHospitalsLoading] = useState(false);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Selection State
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoricalDiseaseSearch, setCategoricalDiseaseSearch] = useState('');
  
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [upcomingDates] = useState<SlotDateOption[]>(INITIAL_DATES);
  const [selectedDate, setSelectedDate] = useState<string>(() => INITIAL_DATES[0]?.date || 'Today');
  const [selectedDateIso, setSelectedDateIso] = useState<string>(() => INITIAL_DATES[0]?.isoDate || new Date().toISOString().split('T')[0]);
  const [isDoctorAvailable, setIsDoctorAvailable] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  
  // Booking State
  const [bookingId, setBookingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('PENDING'); // PENDING, CONFIRMED, COMPLETED, CANCELLED
  const [notification, setNotification] = useState('');
  
  // Video specific state
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Know Your Disease AI Modal state
  const [showAiModal, setShowAiModal] = useState(false);

  // Fetch real diseases on mount
  useEffect(() => {
    let mounted = true;
    opAppointmentApi.fetchDiseases().then((res) => {
      if (mounted && res.success && res.data) {
        const backendConditions = res.data.conditions;

        // Enrich general diseases with real IDs if matched
        const enrichedGeneral = generalDiseases.map((gd) => {
          const match = backendConditions.find(bc =>
            bc.name.toLowerCase().includes(gd.name.toLowerCase()) ||
            gd.name.toLowerCase().includes(bc.name.toLowerCase())
          );
          return match ? { ...gd, id: match.id, specialtyId: match.specialtyId, specialtyName: match.specialtyName } : gd;
        });

        // Enrich advanced diseases with real IDs if matched
        const enrichedAdvanced = advancedDiseases.map((ad) => {
          const match = backendConditions.find(bc =>
            bc.name.toLowerCase().includes(ad.name.toLowerCase()) ||
            ad.name.toLowerCase().includes(bc.name.toLowerCase())
          );
          return match ? { ...ad, id: match.id, specialtyId: match.specialtyId, specialtyName: match.specialtyName } : ad;
        });

        // Enrich categorical with real specialty IDs
        const enrichedCategorical = categoricalDiseases.map((cd) => {
          const match = res.data!.categorical.find(cat =>
            cat.name.toLowerCase().includes(cd.name.toLowerCase()) ||
            cd.name.toLowerCase().includes(cat.name.toLowerCase())
          );
          return match ? { ...cd, id: match.id, specialtyId: match.id } : cd;
        });

        setDiseasesList({
          general: enrichedGeneral,
          advanced: enrichedAdvanced,
          categorical: enrichedCategorical,
          raw: backendConditions
        });
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  // Pre-load real hospitals on mount
  useEffect(() => {
    let active = true;
    hospitalApi.getHospitals().then((res) => {
      if (active && res.success && res.data && res.data.length > 0) {
        setHospitalsList(res.data);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch real hospitals when entering hospital view or changing search/disease
  useEffect(() => {
    if (view === 'HOSPITAL_RESULTS' || view === 'HOSPITAL_DETAILS') {
      let active = true;
      setIsHospitalsLoading(true);
      hospitalApi.getHospitals({ search: hospitalSearch, conditionId: selectedDisease?.id }).then((res) => {
        if (active) {
          setIsHospitalsLoading(false);
          if (res.success && res.data) {
            setHospitalsList(res.data);
          }
        }
      }).catch(() => {
        if (active) setIsHospitalsLoading(false);
      });
      return () => { active = false; };
    }
  }, [view, hospitalSearch, selectedDisease]);

  // Fetch real doctors when entering doctor list
  useEffect(() => {
    if (view === 'DOCTOR_LIST' || view === 'DOCTOR_PROFILE') {
      let active = true;
      setIsDoctorsLoading(true);
      if (selectedHospital?.id) {
        hospitalApi.getHospitalDoctors(selectedHospital.id, selectedDepartment || undefined).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && res.data) {
              setDoctorsList(res.data);
            }
          }
        }).catch(() => {
          if (active) setIsDoctorsLoading(false);
        });
      } else {
        doctorApi.getDoctors({
          search: hospitalSearch,
          departmentId: selectedDepartment || undefined,
          specialtyId: selectedDisease?.specialtyId
        }).then((res) => {
          if (active) {
            setIsDoctorsLoading(false);
            if (res.success && res.data) {
              setDoctorsList(res.data);
            }
          }
        }).catch(() => {
          if (active) setIsDoctorsLoading(false);
        });
      }
      return () => { active = false; };
    }
  }, [view, selectedHospital, selectedDepartment, hospitalSearch, selectedDisease]);

  // Fetch real availability when selecting slots
  useEffect(() => {
    if (view === 'SELECT_SLOT' && selectedDoctor?.id) {
      let active = true;
      setIsSlotsLoading(true);
      const isMockDoctor = selectedDoctor.id === 'D1' || !selectedDoctor.id.includes('-');
      if (!isMockDoctor) {
        setAvailableSlots([]);
      }
      const queryDate = selectedDateIso || new Date().toISOString().split('T')[0];
      opAppointmentApi.fetchDoctorAvailability(selectedDoctor.id, queryDate).then((res) => {
        if (active) {
          setIsSlotsLoading(false);
          if (res.success && res.data) {
            setIsDoctorAvailable(res.data.isAvailable !== false);
            setAvailableSlots(res.data.availableSlots || []);
          } else {
            // Mock doctors in unit test environment
            if (isMockDoctor) {
              setAvailableSlots(TIME_SLOTS);
              setIsDoctorAvailable(true);
            } else {
              setAvailableSlots([]);
              setIsDoctorAvailable(false);
            }
          }
        }
      }).catch(() => {
        if (active) {
          setIsSlotsLoading(false);
          if (isMockDoctor) {
            setAvailableSlots(TIME_SLOTS);
            setIsDoctorAvailable(true);
          } else {
            setAvailableSlots([]);
            setIsDoctorAvailable(false);
          }
        }
      });
      return () => { active = false; };
    }
  }, [view, selectedDoctor, selectedDateIso]);

  const handleAiSelectConcern = (concern: any) => {
    const term = concern.diseaseSearchTerm || concern.name;
    const matched = diseasesList.general.find(d => d.name.toLowerCase().includes(term.toLowerCase())) ||
                    diseasesList.advanced.find(d => d.name.toLowerCase().includes(term.toLowerCase())) ||
                    diseasesList.categorical.find(d => d.name.toLowerCase().includes(term.toLowerCase()));

    if (matched) {
      handleDiseaseSelect(matched);
    } else {
      setSelectedDisease({
        id: concern.id,
        name: concern.name,
        icon: Stethoscope
      });
      setView('HOSPITAL_RESULTS');
    }
  };

  // Reset state when tab changes
  useEffect(() => {
    setView('LANDING');
    setSelectedHospital(null);
    setSelectedDoctor(null);
    setSelectedDisease(null);
    setSelectedCategory(null);
    setCategoricalDiseaseSearch('');
    setHospitalSearch('');
    setBookingError('');
  }, [isVideo]);

  const handleBack = () => {
    setBookingError('');
    switch (view) {
      case 'CATEGORICAL_DISEASES':
        setView('LANDING');
        setSelectedCategory(null);
        setCategoricalDiseaseSearch('');
        break;
      case 'HOSPITAL_RESULTS':
      case 'DOCTOR_LIST':
        if (selectedDisease) {
           if (selectedCategory) {
             setView('CATEGORICAL_DISEASES');
           } else {
             setView('LANDING');
           }
           setSelectedDisease(null);
           setSelectedDepartment(null);
           setHospitalSearch('');
        } else {
           setView(selectedHospital ? 'HOSPITAL_DETAILS' : 'LANDING');
           if (!selectedHospital) {
               setSelectedDepartment(null);
           }
        }
        break;
      case 'HOSPITAL_DETAILS':
        setView('HOSPITAL_RESULTS');
        break;
      case 'DOCTOR_PROFILE':
        setView('DOCTOR_LIST');
        break;
      case 'SELECT_SLOT':
        setView('DOCTOR_PROFILE');
        break;
      case 'REASON':
        setView('SELECT_SLOT');
        break;
      case 'REVIEW':
        setView('REASON');
        break;
      case 'APPOINTMENT_STATUS':
      case 'VIDEO_UPCOMING':
      case 'VIDEO_COMPLETED':
        setView('LANDING');
        break;
      default:
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/');
        }
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const confirmBooking = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setBookingError('');

    try {
      const targetDate = selectedDateIso || new Date().toISOString().split('T')[0];
      const res = await opAppointmentApi.createOpAppointment({
        hospitalId: selectedHospital?.id || selectedDoctor?.hospitalId,
        doctorId: selectedDoctor?.id,
        departmentId: selectedDoctor?.departmentId,
        conditionId: selectedDisease?.id,
        date: targetDate,
        timeSlot: selectedTime || '10:00 AM',
        patientName: user?.name,
        patientPhone: user?.phone,
        reason: reason || (isVideo ? 'Video Consultation' : 'OP Consultation visit'),
        opType: isVideo ? 'Video Consultation' : 'Normal'
      });

      if (!res.success) {
        const errMsg = typeof res.error === 'object' ? res.error.message : (res.error || 'Failed to book appointment');
        setBookingError(errMsg);
        showNotification(errMsg);
        setIsSubmitting(false);
        // Refresh available slots for this doctor so the user sees updated availability
        if (selectedDoctor?.id) {
          opAppointmentApi.fetchDoctorAvailability(selectedDoctor.id, targetDate).then(r => {
            if (r.success && r.data?.availableSlots) setAvailableSlots(r.data.availableSlots);
          }).catch(() => {});
        }
        return;
      }

      const realBookingId = res.data.id || res.data.appointmentId;
      setBookingId(realBookingId);
      setBookingStatus('CONFIRMED');
      setView('CONFIRMATION');
      showNotification(`Your appointment with Dr. ${selectedDoctor.name.split(' ')[1] || selectedDoctor.name} has been booked successfully.`);
    } catch (err: any) {
      setBookingError(err.message || 'Error booking appointment');
      showNotification(err.message || 'Error booking appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiseaseSelect = (disease: any) => {
    setSelectedDisease(disease);
    setView('HOSPITAL_RESULTS');
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setCategoricalDiseaseSearch('');
    setView('CATEGORICAL_DISEASES');
  };

  // --- RENDERERS ---

  const renderDiseaseCategories = () => {
    const query = hospitalSearch.toLowerCase().trim();
    
    let filteredGeneral = diseasesList.general;
    let filteredAdvanced = diseasesList.advanced;
    let filteredCategorical = diseasesList.categorical;

    if (query) {
      filteredGeneral = diseasesList.general.filter(d => 
        d.name.toLowerCase().includes(query)
      );
      filteredAdvanced = diseasesList.advanced.filter(d => 
        d.name.toLowerCase().includes(query)
      );
      filteredCategorical = diseasesList.categorical.filter(d => 
        d.name.toLowerCase().includes(query) || (d.desc && d.desc.toLowerCase().includes(query))
      );
    }

    const displayedGeneral = showAllGeneral || query ? filteredGeneral : filteredGeneral.slice(0, 8);
    const displayedAdvanced = showAllAdvanced || query ? filteredAdvanced : filteredAdvanced.slice(0, 8);
    const displayedCategorical = showAllCategorical || query ? filteredCategorical : filteredCategorical.slice(0, 4);

    const hasResults = filteredGeneral.length > 0 || filteredAdvanced.length > 0 || filteredCategorical.length > 0;

    return (
      <div className="bg-slate-50 p-4 py-5">
      <h2 className="text-[17px] font-bold text-slate-900 mb-1">Browse Diseases</h2>
      <p className="text-[12px] text-slate-500 mb-4">
        {isVideo ? 'Select a disease to find available doctors' : 'Select a disease to find suitable hospitals'}
      </p>
      
      {!hasResults ? (
        <div className="text-center py-8">
           <p className="text-[14px] text-slate-500 font-bold">No matching diseases found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
         {/* Tabs */}
         <div className="flex border-b border-slate-100">
            <button 
              className={`flex-1 py-4 text-[13px] font-bold text-center border-b-[2.5px] transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button 
              className={`flex-1 py-4 text-[13px] font-bold text-center border-b-[2.5px] transition-colors ${activeTab === 'advanced' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('advanced')}
            >
              Advanced
            </button>
         </div>
         
         {/* Tab Content */}
         <div className="p-4">
           {activeTab === 'general' && (
             <>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-4">
                 {displayedGeneral.map((item) => (
                    <div key={item.id} onClick={() => handleDiseaseSelect(item)} className="flex flex-col items-center bg-white rounded-2xl p-2 cursor-pointer border border-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow h-[90px] justify-center">
                      <div className={`w-[54px] h-[54px] rounded-full ${item.bg} flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1`}>
                          {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
                          ) : (
                              <item.icon className={`w-8 h-8`} />
                          )}
                      </div>
                      <span className="text-[11px] font-bold text-center text-slate-800 leading-tight">
                          {item.name}
                      </span>
                    </div>
                 ))}
               </div>
               
               {!query && filteredGeneral.length > 8 && (
                 <div className="mt-5 flex justify-center">
                   <button 
                     onClick={() => setShowAllGeneral(!showAllGeneral)}
                     className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                   >
                     {showAllGeneral ? 'Show Less ↑' : 'See More Diseases →'}
                   </button>
                 </div>
               )}
             </>
           )}

           {activeTab === 'advanced' && (
             <>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-4">
                 {displayedAdvanced.map((item) => (
                    <div key={item.id} onClick={() => handleDiseaseSelect(item)} className="flex flex-col items-center bg-white rounded-2xl p-2 cursor-pointer border border-slate-50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow h-[90px] justify-center">
                      <div className={`w-[54px] h-[54px] rounded-full ${item.bg} flex items-center justify-center mb-2 shadow-sm overflow-hidden p-1`}>
                          {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
                          ) : (
                              <item.icon className={`w-8 h-8`} />
                          )}
                      </div>
                      <span className="text-[11px] font-bold text-center text-slate-800 leading-tight">
                          {item.name}
                      </span>
                    </div>
                 ))}
               </div>

               {!query && filteredAdvanced.length > 8 && (
                 <div className="mt-5 flex justify-center">
                   <button 
                     onClick={() => setShowAllAdvanced(!showAllAdvanced)}
                     className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
                   >
                     {showAllAdvanced ? 'Show Less ↑' : 'See More Diseases →'}
                   </button>
                 </div>
               )}
             </>
           )}
         </div>
      </div>

      <div>
         <h2 className="text-[17px] font-bold text-slate-900 mb-3">Categorical Diseases</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           {displayedCategorical.map((cat) => (
              <div key={cat.id} onClick={() => handleCategorySelect(cat)} className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                 <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full ${cat.bg} flex items-center justify-center shrink-0 shadow-sm border border-slate-100/50`}>
                       <cat.icon className={`w-8 h-8`} />
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-900 text-[13px] mb-0.5">{cat.name}</h3>
                       <p className="text-[10px] text-slate-500 font-medium leading-tight whitespace-pre-line">{cat.desc}</p>
                    </div>
                 </div>
                 <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0 rotate-180" />
              </div>
           ))}
         </div>
         
         {!query && filteredCategorical.length > 4 && (
           <div className="mt-4 mb-2 flex justify-center">
             <button 
               onClick={() => setShowAllCategorical(!showAllCategorical)}
               className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors"
             >
               {showAllCategorical ? 'Show Less ↑' : 'See More Diseases →'}
             </button>
           </div>
         )}
      </div>
        </>
      )}
    </div>
  );
};

  const renderLanding = () => {
    return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-[#0055ff] to-[#06b6d4] pt-5 pb-8 px-4 text-white rounded-b-3xl relative overflow-hidden">
        {isVideo && (
          <div className="absolute right-0 top-0 opacity-10">
            <Video className="w-32 h-32 -mr-6 -mt-4" strokeWidth={1} />
          </div>
        )}
        <div className="flex items-center gap-3 mb-1 relative z-10">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/20 rounded-full transition-colors -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-bold">{isVideo ? 'Video Consultation' : 'Book an OP Appointment'}</h1>
        </div>
        <p className="text-[11px] text-blue-100 mb-5 max-w-[280px] relative z-10">
          {isVideo 
            ? 'Consult with a doctor online from wherever you are.' 
            : 'Find a hospital, choose a doctor, and book an available appointment.'}
        </p>
      </div>

      <HowItWorks 
        title={isVideo ? "How Video Consultation Works" : "How OP Booking Works"}
        steps={isVideo ? videoConsultationStepsData : opBookingStepsData}
        className="shadow-sm -mt-2 relative z-20 rounded-t-3xl mb-2"
      />

      {renderDiseaseCategories()}
    </div>
  )};

  const renderCategoricalDiseases = () => {
    if (!selectedCategory) return null;
    
    const categoryDiseases = getDiseasesForCategory(selectedCategory.id, selectedCategory.name, diseasesList.raw);
    const query = categoricalDiseaseSearch.toLowerCase().trim();
    const filtered = query
      ? categoryDiseases.filter(d => d.name.toLowerCase().includes(query) || (d.desc && d.desc.toLowerCase().includes(query)))
      : categoryDiseases;

    return (
      <div className="px-4 py-4 space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
        {/* Category Header Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl ${selectedCategory.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm border border-slate-100/60`}>
            {selectedCategory.icon ? (
              <selectedCategory.icon className="w-8 h-8" />
            ) : (
              <Stethoscope className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {isVideo ? 'Video Consultation' : 'OP Consultation'}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {filtered.length} {filtered.length === 1 ? 'condition' : 'conditions'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedCategory.name}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
              {selectedCategory.desc || 'Select a specific health condition or concern to find specialized doctors and hospitals.'}
            </p>
          </div>
        </div>

        {/* Search within Category */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder={`Search within ${selectedCategory.name}...`}
            value={categoricalDiseaseSearch}
            onChange={(e) => setCategoricalDiseaseSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-10 py-3 rounded-2xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
          />
          {categoricalDiseaseSearch && (
            <button
              onClick={() => setCategoricalDiseaseSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* General Category Consultation Option */}
        <div 
          onClick={() => handleDiseaseSelect(selectedCategory)}
          className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/70 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                  General {selectedCategory.name} Consultation
                </h3>
                <span className="text-[10px] font-semibold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                  All Conditions
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Not sure of exact condition? Consult any {selectedCategory.name} specialist
              </p>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-blue-500 shrink-0 rotate-180 group-hover:translate-x-0.5 transition-transform" />
        </div>

        {/* Specific Disease List */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Specific Conditions & Diagnoses
            </h3>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item) => {
                const ItemIcon = item.icon || Stethoscope;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleDiseaseSelect(item)}
                    className="flex items-start justify-between bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className={`w-11 h-11 rounded-xl ${item.bg || 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform`}>
                        <ItemIcon className="w-6 h-6 text-slate-700" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-[13px] leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300 shrink-0 rotate-180 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching conditions found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term or select general consultation above.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHospitalResults = () => {
    const query = hospitalSearch.toLowerCase().trim();
    const hasSearch = query.length > 0;
    const showPopular = searchFocused && !hasSearch;
    
    let filteredHospitals = hospitalsList;
    
    if (query) {
      filteredHospitals = hospitalsList.filter(h => 
        h.name.toLowerCase().includes(query) || 
        (h.departments && h.departments.some((d: string) => d.toLowerCase().includes(query))) ||
        (h.description && h.description.toLowerCase().includes(query)) ||
        (h.city && h.city.toLowerCase().includes(query))
      );
    }
    
    let title = selectedDisease 
      ? `Hospitals for ${selectedDisease.name}`
      : (query ? `Hospitals found for "${hospitalSearch}"` : `All Hospitals`);
      
    let subtitle = selectedDisease 
      ? 'Hospitals offering care for this condition' 
      : (query ? 'Select a hospital to view details' : 'Browse available hospitals');

    if (showPopular) {
      title = 'Popular Hospitals';
      subtitle = 'Top rated hospitals in your area';
    }

    return (
      <div className={`px-4 py-6 ${!hasSearch ? 'animate-in fade-in slide-in-from-right-4' : ''}`}>
        <div className="relative max-w-md mx-auto z-10 mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={hospitalSearch}
            onChange={(e) => setHospitalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="block w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-[13px] font-medium" 
            placeholder={isVideo ? "Search hospital, doctor..." : "Search hospital by name, city, location..."}
          />
        </div>

        <h2 className="text-[16px] font-bold text-slate-800 mb-1">{title}</h2>
        <p className="text-[12px] text-slate-500 mb-4">{subtitle}</p>
        
        {isHospitalsLoading && (
          <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Loading hospitals...</span>
          </div>
        )}

        {!isHospitalsLoading && filteredHospitals.length === 0 ? (
          <div className="text-center py-8">
             <p className="text-[14px] text-slate-500 font-bold">{hasSearch ? "No hospitals found matching your search" : "No hospitals found."}</p>
          </div>
        ) : (
        <div className="space-y-3">
          {filteredHospitals.map(hosp => (
            <div key={hosp.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 text-[15px] flex items-center gap-1.5">
                  {hosp.name}
                  {hosp.verified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                {hosp.address}
              </p>
              <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                {hosp.contact}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(hosp.departments || []).slice(0, 3).map((dept: string) => (
                  <span key={dept} className="px-2 py-1 bg-slate-50 text-slate-600 text-[9px] rounded-md font-medium border border-slate-100">
                    {dept}
                  </span>
                ))}
              </div>

              <button 
                onClick={() => { setSelectedHospital(hosp); setView(isVideo ? 'DOCTOR_LIST' : 'HOSPITAL_DETAILS'); }}
                className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px]"
              >
                {isVideo ? 'View Available Doctors' : 'View Hospital'}
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderHospitalDetails = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
        <h2 className="font-bold text-slate-900 text-[18px] flex items-center gap-2 mb-2">
          {selectedHospital.name}
          {selectedHospital.verified && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
        </h2>
        <p className="text-[12px] text-slate-600 mb-4">{selectedHospital.description}</p>
        
        <div className="space-y-2 mb-4">
          <p className="text-[11px] text-slate-500 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            {selectedHospital.address}
          </p>
          <p className="text-[11px] text-slate-500 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" />
            {selectedHospital.contact}
          </p>
        </div>

        {selectedHospital.services && selectedHospital.services.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Services & Facilities</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedHospital.services.map((srv: string) => (
                <span key={srv} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg capitalize">
                  {srv.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <h3 className="font-bold text-slate-800 text-[15px] mb-3">Departments</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(!selectedHospital.departments || selectedHospital.departments.length === 0) ? (
          <div className="col-span-2 text-center py-6 bg-white rounded-xl border border-slate-100 text-xs text-slate-400 font-medium">
            No departments currently listed for this hospital
          </div>
        ) : (
          selectedHospital.departments.map((dept: string) => (
            <div 
              key={dept} 
              onClick={() => { setSelectedDepartment(dept); setView('DOCTOR_LIST'); }}
              className="bg-white rounded-xl p-4 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-[11px] font-bold text-slate-800">{dept}</span>
            </div>
          ))
        )}
      </div>

      <button 
        onClick={() => { setSelectedDepartment(null); setView('DOCTOR_LIST'); }}
        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm"
      >
        View All Doctors
      </button>
    </div>
  );

  const renderDoctorList = () => {
    // Filter doctors based on selected hospital/dept or search query
    let docs = doctorsList;
    if (!isVideo && selectedHospital) {
      docs = doctorsList.filter(d => d.hospitalId === selectedHospital.id);
      if (selectedDepartment) {
        const deptDocs = docs.filter(d => d.department === selectedDepartment || d.departmentId === selectedDepartment);
        if (deptDocs.length > 0) {
          docs = deptDocs;
        }
      }
      if (docs.length === 0) {
        docs = doctorsList.filter(d => d.hospitalId === selectedHospital.id);
      }
    }

    const title = isVideo 
      ? (selectedDisease ? `Available Doctors for ${selectedDisease.name}` : `Available Specialists Online`)
      : (selectedHospital ? `Doctors at ${selectedHospital.name}` : `Doctors for "${selectedDisease?.name || 'Selected Condition'}"`);

    return (
      <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">{title}</h2>

        {isDoctorsLoading && (
          <div className="flex items-center justify-center py-6 text-blue-600 gap-2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Loading doctors...</span>
          </div>
        )}

        {!isDoctorsLoading && docs.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-[14px] text-slate-500 font-bold">No doctors found</p>
            <p className="text-[11px] text-slate-400 mt-1">No doctors are currently available for this selection.</p>
          </div>
        ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <div key={doc.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {doc.avatar ? (
                    <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-[14px]">{doc.name}</h3>
                  <p className="text-[11px] text-blue-600 font-medium mb-0.5">{doc.specialization} • {doc.qualification}</p>
                  <p className="text-[10px] text-slate-500 mb-1">{doc.hospitalName}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {doc.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {doc.experience}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedDoctor(doc); setView('DOCTOR_PROFILE'); }}
                className="w-full mt-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[12px]"
              >
                View Doctor
              </button>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderDoctorProfile = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3 overflow-hidden">
          {selectedDoctor.avatar ? (
            <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-slate-400" />
          )}
        </div>
        <h2 className="font-bold text-slate-900 text-[18px] mb-0.5">{selectedDoctor.name}</h2>
        <p className="text-[12px] text-blue-600 font-medium mb-1">{selectedDoctor.specialization}</p>
        <p className="text-[11px] text-slate-500 mb-3">{selectedDoctor.qualification} • {selectedDoctor.experience}</p>
        
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 mb-4 bg-slate-50 py-2 rounded-xl">
          <span className="flex items-center gap-1"><Hospital className="w-4 h-4 text-blue-500" /> {selectedDoctor.hospitalName}</span>
          <span className="flex items-center gap-1"><Activity className="w-4 h-4 text-blue-500" /> {selectedDoctor.department}</span>
        </div>
        
        <p className="text-[11px] text-slate-600 text-left bg-blue-50/50 p-3 rounded-xl">
          <span className="font-bold block mb-1">Consultation Information:</span>
          {selectedDoctor.consultInfo}
        </p>
      </div>

      <h3 className="font-bold text-slate-800 text-[15px] mb-3">Availability</h3>
      <p className="text-[11px] text-slate-500 mb-4 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" /> Select an available slot to proceed
      </p>

      <button 
        onClick={() => setView('SELECT_SLOT')}
        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm"
      >
        {isVideo ? 'Book Video Consultation' : 'Book Appointment'}
      </button>
    </div>
  );

  const renderSelectSlot = () => {
    return (
      <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">Select {isVideo ? 'Consultation' : 'Appointment'} Date</h2>
        <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 hide-scrollbar mb-4">
          {upcomingDates.map((d) => (
            <div 
              key={d.isoDate}
              onClick={() => {
                setSelectedDate(d.date);
                setSelectedDateIso(d.isoDate);
                setSelectedTime('');
              }}
              className={`flex flex-col items-center justify-center shrink-0 w-[72px] h-[72px] rounded-2xl border transition-all cursor-pointer ${selectedDateIso === d.isoDate ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white'}`}
            >
              <span className={`text-[10px] font-medium mb-1 ${selectedDateIso === d.isoDate ? 'text-blue-600' : 'text-slate-500'}`}>{d.label}</span>
              <span className={`text-[13px] font-bold ${selectedDateIso === d.isoDate ? 'text-blue-700' : 'text-slate-800'}`}>{d.date}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3 mt-6">
          <h2 className="text-[15px] font-bold text-slate-800">Available Time Slots</h2>
          {isSlotsLoading && <span className="text-[10px] text-blue-600 font-medium animate-pulse">Checking live availability...</span>}
        </div>

        {isSlotsLoading && availableSlots.length === 0 ? (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-11 rounded-xl bg-slate-100 animate-pulse border border-slate-200/50" />
            ))}
          </div>
        ) : !isDoctorAvailable || availableSlots.length === 0 ? (
          <div className="py-8 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mb-8">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No Slots Available</p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedDoctor?.name ? `Dr. ${selectedDoctor.name.replace(/^Dr\.\s*/i, '')}` : 'The doctor'} is not available on this day ({selectedDate}). Please select another date.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {availableSlots.map(time => (
              <div 
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`py-3 rounded-xl border text-center text-[12px] font-bold cursor-pointer transition-all ${selectedTime === time ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}
              >
                {time}
              </div>
            ))}
          </div>
        )}

        <button 
          disabled={!selectedTime}
          onClick={() => setView('REASON')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    );
  };

  const renderReason = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-[15px] font-bold text-slate-800 mb-2">Reason for {isVideo ? 'Consultation' : 'Appointment'}</h2>
      <p className="text-[11px] text-slate-500 mb-4">Please provide a brief description to help the doctor prepare for your visit.</p>
      
      <textarea 
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full h-32 p-4 border border-slate-200 rounded-2xl bg-white text-[13px] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none mb-6 shadow-sm"
        placeholder={isVideo ? "Briefly describe what you would like to discuss with the doctor..." : "Describe the reason for your visit..."}
      ></textarea>

      <button 
        disabled={reason.length < 5}
        onClick={() => setView('REVIEW')}
        className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Review Details
      </button>
    </div>
  );

  const renderReview = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-[15px] font-bold text-slate-800 mb-4">Review {isVideo ? 'Video Consultation' : 'Appointment'}</h2>
      
      {bookingError && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{bookingError}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Patient</div>
            <div className="font-bold text-slate-900 text-[14px]">{user?.name || 'Patient'}</div>
            {user?.phone && <div className="text-[11px] text-slate-500">{user.phone}</div>}
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {isVideo ? 'Video Consultation' : 'OP Appointment'}
          </span>
        </div>
        
        <div className="p-4 border-b border-slate-100">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Doctor</div>
          <div className="font-bold text-slate-900 text-[14px]">{selectedDoctor.name}</div>
          <div className="text-[11px] text-blue-600">{selectedDoctor.specialization}</div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Hospital</div>
            <div className="font-bold text-slate-800 text-[13px]">{selectedDoctor.hospitalName}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Department</div>
            <div className="font-bold text-slate-800 text-[13px]">{selectedDoctor.department}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Date</div>
              <div className="font-bold text-slate-800 text-[13px]">{selectedDate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Time</div>
              <div className="font-bold text-slate-800 text-[13px]">{selectedTime}</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Reason</div>
            <div className="text-[12px] text-slate-700 bg-slate-50 p-3 rounded-lg mt-1 border border-slate-100">{reason}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => setView('SELECT_SLOT')}
          className="flex-1 py-3.5 rounded-xl border border-blue-600 text-blue-600 font-bold text-[13px]"
        >
          Edit
        </button>
        <button 
          disabled={isSubmitting}
          onClick={confirmBooking}
          className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Confirming...</span>
            </>
          ) : (
            `Confirm ${isVideo ? 'Consultation' : 'Appointment'}`
          )}
        </button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="px-4 py-8 text-center animate-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
        <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
        <CheckCircle2 className="w-10 h-10 text-green-500" />
      </div>
      
      <h2 className="text-[20px] font-bold text-slate-900 mb-2">
        {isVideo ? 'Video Consultation Scheduled' : 'Appointment Confirmed'}
      </h2>
      <p className="text-[12px] text-slate-500 mb-6 max-w-[250px] mx-auto">
        Your {isVideo ? 'consultation' : 'appointment'} has been successfully booked.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 text-left mx-auto max-w-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-bold">Booking ID</span>
          <span className="text-[13px] font-bold text-slate-900">{bookingId}</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Status</span>
            <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{isVideo ? 'Scheduled' : 'Confirmed'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Doctor</span>
            <span className="text-[12px] font-bold text-slate-800">{selectedDoctor.name}</span>
          </div>
          {!isVideo && (
            <div className="flex justify-between">
              <span className="text-[11px] text-slate-500">Hospital</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedDoctor.hospitalName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[11px] text-slate-500">Date & Time</span>
            <span className="text-[12px] font-bold text-slate-800">{selectedDate}, {selectedTime}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => setView(isVideo ? 'VIDEO_UPCOMING' : 'APPOINTMENT_STATUS')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-colors"
        >
          View {isVideo ? 'Consultation' : 'Appointment'}
        </button>
        <button 
          onClick={() => navigate('/bookings')}
          className="w-full py-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[13px] hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" /> Go to My Bookings
        </button>
        <button 
          onClick={() => setView('LANDING')}
          className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );

  const renderAppointmentStatus = () => (
    <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-slate-800">Appointment Details</h2>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
          bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
          bookingStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
          bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {bookingStatus}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-[15px]">{selectedDoctor.name}</h3>
            <p className="text-[11px] text-blue-600 font-medium mb-1">{selectedDoctor.specialization}</p>
            <p className="text-[11px] text-slate-500">{selectedDoctor.hospitalName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Date & Time</span>
            <span className="text-[12px] font-bold text-slate-800 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {selectedDate}, {selectedTime}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Booking ID</span>
            <span className="text-[12px] font-bold text-slate-800">{bookingId}</span>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-[13px] mb-3">Appointment History</h3>
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-6 relative">
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100"></div>
        
        <div className="flex gap-4 mb-6 relative">
          <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div>
            <h4 className="text-[12px] font-bold text-slate-800">Appointment Booked</h4>
            <p className="text-[10px] text-slate-500">Your appointment request was placed.</p>
          </div>
        </div>
        
        <div className="flex gap-4 mb-6 relative">
          <div className={`w-5 h-5 rounded-full ${bookingStatus !== 'PENDING' ? 'bg-green-500' : 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10`}>
            {bookingStatus !== 'PENDING' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
          </div>
          <div>
            <h4 className={`text-[12px] font-bold ${bookingStatus !== 'PENDING' ? 'text-slate-800' : 'text-slate-400'}`}>Confirmed</h4>
            <p className="text-[10px] text-slate-500">Hospital has confirmed your slot.</p>
          </div>
        </div>

        <div className="flex gap-4 relative">
          <div className={`w-5 h-5 rounded-full ${bookingStatus === 'COMPLETED' ? 'bg-blue-500' : 'bg-slate-200'} border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10`}>
            {bookingStatus === 'COMPLETED' && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
          </div>
          <div>
            <h4 className={`text-[12px] font-bold ${bookingStatus === 'COMPLETED' ? 'text-slate-800' : 'text-slate-400'}`}>Completed</h4>
            <p className="text-[10px] text-slate-500">Visit was completed successfully.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-3">
        <button 
          onClick={() => navigate('/bookings')}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[13px] shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" /> View in My Bookings
        </button>
        {bookingStatus !== 'CANCELLED' && bookingStatus !== 'COMPLETED' && (
          <button 
            onClick={() => {
              setBookingStatus('CANCELLED');
              showNotification('Appointment has been cancelled.');
            }}
            className="w-full py-3.5 rounded-xl border border-red-200 text-red-500 font-bold text-[13px] bg-red-50 hover:bg-red-100 transition-colors"
          >
            Cancel Appointment
          </button>
        )}
      </div>
    </div>
  );

  const renderVideoUpcoming = () => {
    // Demo interaction: wait 3 seconds then allow join
    const canJoin = isVideoActive;
    
    return (
      <div className="px-4 py-6 animate-in fade-in slide-in-from-right-4 text-center h-full flex flex-col justify-center min-h-[70vh]">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 relative">
          <VideoIcon className="w-10 h-10 text-blue-500" />
          <div className="absolute top-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
        </div>
        
        <h2 className="text-[20px] font-bold text-slate-900 mb-1">Upcoming Consultation</h2>
        <p className="text-[13px] text-blue-600 font-medium mb-6">Dr. {selectedDoctor.name.split(' ')[1]}</p>
        
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mx-auto max-w-[280px] mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-500 font-bold">Consultation ID</span>
            <span className="text-[12px] font-bold text-slate-900">{bookingId}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-slate-500 font-bold">Date</span>
            <span className="text-[12px] font-bold text-slate-900">{selectedDate}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-bold">Time</span>
            <span className="text-[12px] font-bold text-slate-900">{selectedTime}</span>
          </div>
        </div>

        {!canJoin ? (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-full text-[12px] font-bold">
              <Clock className="w-4 h-4 animate-spin-slow" />
              Waiting for consultation time...
            </div>
            <p className="text-[10px] text-slate-400 mt-3 cursor-pointer underline" onClick={() => setIsVideoActive(true)}>
              (Demo: Click here to activate slot)
            </p>
          </div>
        ) : (
          <button 
            onClick={() => setView('VIDEO_CALL')}
            className="w-full py-4 rounded-xl bg-green-500 text-white font-bold text-[14px] shadow-md animate-in slide-in-from-bottom-2 flex items-center justify-center gap-2"
          >
            <VideoIcon className="w-5 h-5" /> Join Now
          </button>
        )}
      </div>
    );
  };

  const renderVideoCall = () => (
    <div className="fixed inset-0 z-50 bg-[#111827] flex flex-col animate-in fade-in">
      {/* Header */}
      <div className="p-4 flex items-center justify-between text-white bg-black/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[13px]">{selectedDoctor.name}</h3>
            <p className="text-[10px] text-slate-300">00:14</p>
          </div>
        </div>
        <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-red-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
          Recording
        </div>
      </div>

      {/* Main Video Area (Doctor) */}
      <div className="flex-1 relative flex items-center justify-center bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-900/50"></div>
        <User className="w-32 h-32 text-slate-700 opacity-50" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-[12px]">
          Waiting for doctor's video...
        </div>
        
        {/* PIP (Patient) */}
        <div className="absolute bottom-4 right-4 w-28 h-36 bg-slate-800 rounded-xl border-2 border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
          {camOn ? (
            <User className="w-12 h-12 text-slate-600" />
          ) : (
            <div className="bg-slate-900 w-full h-full flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-red-500" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/60 backdrop-blur-xl p-6 pb-10 flex items-center justify-center gap-6">
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => {
            setView('VIDEO_COMPLETED');
            setBookingStatus('COMPLETED');
          }}
          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setCamOn(!camOn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${camOn ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  const renderVideoCompleted = () => (
    <div className="px-4 py-8 animate-in fade-in slide-in-from-right-4 text-center h-full flex flex-col">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-blue-500" />
      </div>
      
      <h2 className="text-[20px] font-bold text-slate-900 mb-2">Consultation Completed</h2>
      <p className="text-[12px] text-slate-500 mb-8 max-w-[250px] mx-auto">
        Your video consultation with Dr. {selectedDoctor.name.split(' ')[1]} has ended successfully.
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8 text-left mx-auto max-w-sm w-full">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
               <User className="w-5 h-5 text-slate-400" />
             </div>
             <div>
               <div className="font-bold text-slate-800 text-[14px]">{selectedDoctor.name}</div>
               <div className="text-[11px] text-slate-500">Duration: 14 mins 32 secs</div>
             </div>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Consultation Details</div>
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-slate-600">Date</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedDate}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-[12px] text-slate-600">Time</span>
              <span className="text-[12px] font-bold text-slate-800">{selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-slate-600">ID</span>
              <span className="text-[12px] font-bold text-slate-800">{bookingId}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-auto">
        <button 
          onClick={() => showNotification("Demo: Prescription will be available shortly.")}
          className="w-full py-3.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-[13px] flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" /> View Summary & Prescription
        </button>
        <button 
          onClick={() => setView('LANDING')}
          className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50"
        >
          Back to Appointments
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-x-hidden">
      
      {/* Dynamic Header */}
      {view !== 'LANDING' && view !== 'VIDEO_CALL' && (
        <div className="bg-white px-4 py-4 flex items-center gap-3 sticky top-0 z-20 border-b border-slate-100">
          <button 
            onClick={handleBack}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[15px] font-bold text-slate-800">
            {view === 'CATEGORICAL_DISEASES' ? (selectedCategory?.name || 'Categorical Diseases') :
             view === 'HOSPITAL_RESULTS' ? 'Search Results' : 
             view === 'HOSPITAL_DETAILS' ? 'Hospital Details' :
             view === 'DOCTOR_LIST' ? 'Select Doctor' :
             view === 'DOCTOR_PROFILE' ? 'Doctor Profile' :
             view === 'SELECT_SLOT' ? 'Select Slot' :
             view === 'REASON' ? 'Reason' :
             view === 'REVIEW' ? 'Review' :
             view === 'APPOINTMENT_STATUS' ? 'Status' :
             view === 'VIDEO_UPCOMING' ? 'Upcoming' :
             view === 'VIDEO_COMPLETED' ? 'Summary' :
             ''}
          </h2>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {view === 'LANDING' && renderLanding()}
        {view === 'CATEGORICAL_DISEASES' && renderCategoricalDiseases()}
        {view === 'HOSPITAL_RESULTS' && renderHospitalResults()}
        {view === 'HOSPITAL_DETAILS' && renderHospitalDetails()}
        {view === 'DOCTOR_LIST' && renderDoctorList()}
        {view === 'DOCTOR_PROFILE' && renderDoctorProfile()}
        {view === 'SELECT_SLOT' && renderSelectSlot()}
        {view === 'REASON' && renderReason()}
        {view === 'REVIEW' && renderReview()}
        {view === 'CONFIRMATION' && renderConfirmation()}
        {view === 'APPOINTMENT_STATUS' && renderAppointmentStatus()}
        {view === 'VIDEO_UPCOMING' && renderVideoUpcoming()}
        {view === 'VIDEO_CALL' && renderVideoCall()}
        {view === 'VIDEO_COMPLETED' && renderVideoCompleted()}
      </div>

      {/* 3. "KNOW YOUR DISEASE" — FLOATING AI TILE */}
      <aside aria-label="Know Your Disease AI Guide" className="fixed bottom-24 right-4 md:right-8 z-30 max-w-[280px] sm:max-w-[320px] pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="group w-full flex items-center gap-3 p-2.5 sm:p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-2xl shadow-xl shadow-indigo-900/30 border border-indigo-500/40 hover:border-indigo-400 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-left backdrop-blur-md"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
            </span>
          </div>
          
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-bold text-white tracking-tight leading-none truncate">
                Know Your Disease
              </span>
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300 shrink-0" />
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-tight mt-1 truncate">
              Not sure what you're experiencing? Get AI help
            </p>
          </div>
          
          <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </aside>

      {/* Know Your Disease AI Modal */}
      <KnowYourDiseaseModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onSelectConcern={handleAiSelectConcern}
        consultationType={isVideo ? 'doctor' : 'hospital-op'}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-[12px] font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            {notification}
          </div>
        </div>
      )}
    </div>
  );
};

export default Specialties;
