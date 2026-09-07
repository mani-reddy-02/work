import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clinicalData = [
  // --- PRIMARY & GENERAL CARE ---
  { name: "General Medicine", description: "Primary care and comprehensive adult medicine.", conditions: ["Unexplained Fever", "Viral Infections", "Chronic Fatigue", "Body Ache", "Unexplained Weight Loss", "General Health Checkup", "High Cholesterol", "Mild Asthma"] },
  { name: "Family Medicine", description: "Comprehensive care for all ages.", conditions: ["Routine Checkup", "Preventive Care", "Minor Injuries", "Cold and Flu", "Vaccinations", "Health Screenings"] },
  { name: "Geriatrics", description: "Elderly care.", conditions: ["Fall Risk Assessment", "Dementia Screening", "Multiple Medication Review", "Age-Related Frailty", "Incontinence", "Osteoarthritis"] },
  
  // --- INTERNAL MEDICINE (ORGAN-SPECIFIC) ---
  { name: "Cardiology", description: "Heart and blood vessel disorders.", conditions: ["Chest Pain", "Heart Palpitations", "High Blood Pressure", "Shortness of Breath", "Arrhythmia", "Post-Heart Attack Care", "Heart Murmur"] },
  { name: "Neurology", description: "Disorders of the brain and nervous system.", conditions: ["Chronic Headaches", "Migraines", "Seizures", "Numbness or Tingling", "Memory Loss", "Vertigo", "Tremors", "Stroke Aftercare"] },
  { name: "Gastroenterology", description: "Digestive system and liver diseases.", conditions: ["Acid Reflux", "Stomach Ulcers", "Severe Diarrhea", "Chronic Constipation", "Bloating", "IBS", "Blood in Stool", "Swallowing Difficulties"] },
  { name: "Pulmonology", description: "Lungs and respiratory system.", conditions: ["Chronic Cough", "Severe Asthma", "COPD", "Pneumonia", "Tuberculosis", "Lung Fibrosis", "Breathing Difficulties"] },
  { name: "Nephrology", description: "Kidney care and diseases.", conditions: ["Chronic Kidney Disease", "Dialysis Consultation", "Kidney Failure", "Protein in Urine", "Acute Renal Issues", "Swelling in Legs/Ankles"] },
  { name: "Endocrinology", description: "Hormones and metabolic disorders.", conditions: ["Diabetes Type 1", "Diabetes Type 2", "Thyroid Disorders", "Hormonal Imbalance", "Obesity", "Osteoporosis"] },
  { name: "Rheumatology", description: "Autoimmune and joint diseases.", conditions: ["Rheumatoid Arthritis", "Lupus", "Gout", "Autoimmune Joint Pain", "Sjogren's Syndrome", "Vasculitis"] },
  { name: "Hematology", description: "Blood disorders.", conditions: ["Anemia", "Bleeding Disorders", "Sickle Cell Disease", "Blood Clots", "Hemophilia", "Low Platelet Count"] },
  { name: "Oncology (Medical)", description: "Cancer diagnosis and chemotherapy.", conditions: ["Cancer Consultation", "Chemotherapy Management", "Leukemia", "Lymphoma", "Unexplained Lumps", "Cancer Screening Follow-up"] },
  { name: "Immunology & Allergy", description: "Immune system and severe allergies.", conditions: ["Severe Food Allergies", "Pollen/Dust Allergies", "Anaphylaxis", "Autoimmune Screenings", "Immunodeficiency", "Chronic Hives"] },
  { name: "Infectious Diseases", description: "Complex viruses and bacterial infections.", conditions: ["HIV/AIDS Management", "Tropical Diseases", "Dengue Follow-up", "Malaria Follow-up", "Complex Bacterial Infections", "Prolonged Fevers"] },
  { name: "Dermatology", description: "Skin, hair, and nails.", conditions: ["Skin Rashes", "Severe Acne", "Hair Loss", "Eczema", "Psoriasis", "Suspicious Moles", "Warts", "Fungal Infections"] },
  { name: "Psychiatry", description: "Mental health and chemical imbalances.", conditions: ["Depression", "Severe Anxiety", "Panic Attacks", "Schizophrenia", "Bipolar Disorder", "OCD", "PTSD"] },
  { name: "Hepatology", description: "Liver, gallbladder, and biliary tree.", conditions: ["Hepatitis", "Fatty Liver", "Liver Cirrhosis", "Jaundice", "Abnormal Liver Tests"] },
  
  // --- SURGICAL DEPARTMENTS ---
  { name: "General Surgery", description: "Common surgeries.", conditions: ["Hernia Evaluation", "Gallbladder Stones", "Appendicitis Consult", "Piles / Hemorrhoids", "Fissures", "Cyst Removal"] },
  { name: "Orthopedics", description: "Bone and joint surgeries.", conditions: ["Joint Pain", "Bone Fractures", "Severe Back Pain", "Arthritis", "Muscle Sprains", "Sports Injuries", "Ligament Tear", "Spinal Disc Issues"] },
  { name: "Neurosurgery", description: "Brain and spine surgery.", conditions: ["Brain Tumor Consult", "Spinal Cord Surgery Consult", "Severe Sciatica", "Head Trauma Follow-up", "Nerve Decompression"] },
  { name: "Cardiothoracic Surgery", description: "Heart and lung surgeries.", conditions: ["Bypass Surgery Consult", "Valve Replacement Consult", "Lung Tumor Consult", "Aortic Surgery Consult"] },
  { name: "Vascular Surgery", description: "Arteries and veins.", conditions: ["Varicose Veins", "Deep Vein Thrombosis (DVT)", "Aortic Aneurysm", "Carotid Artery Disease", "Diabetic Foot Circulation"] },
  { name: "Gastrointestinal Surgery", description: "Complex digestive surgeries.", conditions: ["Bariatric (Weight Loss) Surgery", "Liver Resection", "Pancreatic Surgery", "Colorectal Surgery", "Stomach Cancer Surgery"] },
  { name: "Urology", description: "Male reproductive and urinary tract.", conditions: ["Kidney Stones", "UTI", "Prostate Enlargement", "Blood in Urine", "Erectile Dysfunction", "Bladder Control Issues"] },
  { name: "Plastic & Reconstructive Surgery", description: "Restoration and cosmetic.", conditions: ["Burn Scars", "Cleft Lip", "Breast Reconstruction", "Cosmetic Surgery Consult", "Skin Grafting"] },
  { name: "Pediatric Surgery", description: "Surgeries for infants and children.", conditions: ["Congenital Defects", "Pediatric Hernia", "Undescended Testes", "Spina Bifida", "Pediatric Tumors"] },
  { name: "Surgical Oncology", description: "Surgical cancer treatment.", conditions: ["Tumor Removal Consultation", "Breast Cancer Surgery Consult", "Biopsy Review", "Melanoma Excision"] },
  
  // --- WOMEN & CHILDREN ---
  { name: "Obstetrics", description: "Pregnancy and childbirth.", conditions: ["Pregnancy Checkup", "Prenatal Care", "High-Risk Pregnancy", "Ultrasound Consultation", "Postpartum Care"] },
  { name: "Gynecology", description: "Women's reproductive health.", conditions: ["Irregular Periods", "PCOS / PCOD", "Severe Pelvic Pain", "Menopause Symptoms", "Endometriosis", "Vaginal Infections", "Pap Smear"] },
  { name: "Pediatrics", description: "Child and infant care.", conditions: ["Childhood Fever", "Growth Issues", "Pediatric Asthma", "Childhood Allergies", "Bedwetting", "Teething Issues", "Colic"] },
  { name: "Neonatology", description: "Newborn intensive care.", conditions: ["Premature Birth Follow-up", "Congenital Anomalies", "Neonatal Jaundice", "Feeding Difficulties in Newborns"] },
  
  // --- SENSORY, HEAD & NECK ---
  { name: "Ophthalmology", description: "Eye and vision care.", conditions: ["Blurred Vision", "Eye Pain", "Cataracts", "Dry Eyes", "Glaucoma", "Macular Degeneration", "Diabetic Retinopathy"] },
  { name: "ENT (Otorhinolaryngology)", description: "Ear, nose, and throat.", conditions: ["Ear Infections", "Sinusitis", "Severe Sore Throat", "Hearing Loss", "Tonsillitis", "Tinnitus", "Nasal Polyps"] },
  { name: "Dentistry", description: "Oral health and dental care.", conditions: ["Severe Toothache", "Cavities", "Bleeding Gums", "Root Canal Consult", "Tooth Extraction", "Teeth Cleaning"] },
  { name: "Orthodontics", description: "Dental alignment.", conditions: ["Braces Consultation", "Misaligned Teeth", "Jaw Alignment", "Retainer Fitting"] },
  { name: "Maxillofacial Surgery", description: "Face and jaw surgery.", conditions: ["Wisdom Tooth Extraction", "Jaw Fractures", "TMJ Disorders", "Facial Trauma", "Oral Cysts"] },
  
  // --- ALLIED, THERAPEUTIC & SPECIALIZED ---
  { name: "Sports Medicine", description: "Athletic injuries and performance.", conditions: ["Athletic Injuries", "Performance Enhancement", "Tendonitis", "Concussion Protocol", "Overuse Injuries"] },
  { name: "Physiotherapy & Rehabilitation", description: "Physical recovery.", conditions: ["Post-Surgery Recovery", "Back Pain Therapy", "Paralysis Rehab", "Mobility Issues", "Stroke Rehabilitation"] },
  { name: "Dietetics & Nutrition", description: "Clinical nutrition and diet planning.", conditions: ["Weight Loss Planning", "Diabetic Diet", "PCOD Diet", "Clinical Nutrition", "Malnutrition", "Food Intolerance Consult"] },
  { name: "Pain Management", description: "Chronic pain treatment.", conditions: ["Chronic Pain", "Fibromyalgia", "Nerve Blocks", "Cancer Pain Management", "Severe Neuropathy"] },
  { name: "Sleep Medicine", description: "Sleep disorders.", conditions: ["Insomnia", "Snoring", "Narcolepsy", "Restless Leg Syndrome", "Sleep Apnea Check"] },
  { name: "Andrology", description: "Male reproductive health.", conditions: ["Male Infertility", "Low Testosterone", "Sexual Dysfunction", "Varicocele"] },
  { name: "Audiology", description: "Hearing and balance.", conditions: ["Hearing Aids Fitting", "Deafness", "Balance Disorders", "Speech Delay Assessments"] },
  { name: "Podiatry", description: "Foot and ankle care.", conditions: ["Diabetic Foot Ulcers", "Bunions", "Flat Feet", "Heel Spurs", "Ingrown Toenails"] },
  { name: "Psychology", description: "Therapy and counseling.", conditions: ["Therapy for Stress", "Grief Counseling", "Relationship Counseling", "Phobias", "Eating Disorders", "ADHD Management"] },
  { name: "Genetics", description: "Hereditary diseases.", conditions: ["Genetic Counseling", "Hereditary Diseases", "Down Syndrome Screening", "BRCA Gene Testing"] }
];

async function main() {
  console.log('Clearing existing platform reference data...');
  // Delete departments first due to foreign key constraints
  await prisma.department.deleteMany({});
  // Delete conditions next, then specialties
  await prisma.platformCondition.deleteMany({});
  await prisma.platformSpecialty.deleteMany({});

  console.log('Seeding massive Platform Specialties and Conditions...');

  for (const item of clinicalData) {
    const specialty = await prisma.platformSpecialty.create({
      data: {
        name: item.name,
        description: item.description,
        conditions: {
          create: item.conditions.map((c) => ({ name: c })),
        },
      },
    });
    console.log(`Created specialty: ${specialty.name} with ${item.conditions.length} conditions.`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
