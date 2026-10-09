import { env } from '../../config/env';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface HealthEducationResponse {
  answer: string;
  language: 'en' | 'te';
  providerConfigured: boolean;
  model: string;
  disclaimer: string;
  isEmergencyAlert: boolean;
  suggestedFollowUps?: string[];
}

export class HealthEducationService {
  private static readonly MODEL_NAME = 'gemini-3.8-flash';
  private static readonly API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  /**
   * Cleans PII/PHI before sending text to any external AI provider
   */
  private static sanitizeText(text: string): string {
    return text
      // Redact email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      // Redact phone numbers and numeric identifiers
      .replace(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]')
      // Redact 10-12 digit numeric blocks (Aadhaar / account numbers)
      .replace(/\b\d{10,12}\b/g, '[REDACTED_ID]');
  }

  /**
   * Checks if Google Gemini API key is configured
   */
  static isConfigured(): boolean {
    const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    return !!(key && key.trim().length > 10);
  }

  /**
   * Detects critical emergency warning words in prompt
   */
  private static hasEmergencyWords(prompt: string): boolean {
    const lower = prompt.toLowerCase();
    const emergencyTriggers = [
      'chest pain', 'heart attack', 'cannot breathe', 'gasping for air',
      'unconscious', 'fainted and not waking', 'slurred speech stroke',
      'coughing blood', 'vomiting blood', 'poisoning', 'swallowed poison',
      'uncontrolled bleeding', 'severe head injury'
    ];
    return emergencyTriggers.some(t => lower.includes(t));
  }

  /**
   * Provides verified general health education responses across a wide range of topics
   * and conversational intents when Gemini API is unavailable or rate-limited.
   */
  private static getEducationalFallback(prompt: string, language: 'en' | 'te'): { answer: string; suggestedFollowUps: string[] } {
    const rawLower = prompt.toLowerCase().trim();
    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(prompt);

    // 1. GREETINGS & INTRODUCTIONS
    const isGreeting = /^(hi|hey|hello|namaste|vanakkam|good\s*(morning|afternoon|evening)|howdy|greetings|help|start)\b/i.test(rawLower) ||
      rawLower.includes('hey medi') || rawLower.includes('medi ai') || rawLower.includes('who are you') ||
      rawLower.includes('what can you do') || rawLower.includes('what are you') ||
      rawLower.includes('హలో') || rawLower.includes('నమస్కారం') || rawLower.includes('హాయ్') || rawLower.includes('బాగున్నారా');

    if (isGreeting) {
      if (isTelugu) {
        return {
          answer: `**నమస్కారం! నేను మెడిక్యూ AI (Mediquee AI), మీ వ్యక్తిగత ఆరోగ్య సహాయకుడిని.** 👋\n\nమీ రోజువారీ ఆరోగ్య సందేహాలు మరియు అవగాహన కోసం నేను ఇక్కడ ఉన్నాను:\n\n- **లక్షణాల అవగాహన:** జ్వరం, జలుబు, తలనొప్పి, ఎసిడిటీ లేదా శరీర నొప్పుల కారణాలు మరియు నివారణ జాగ్రత్తలు.\n- **ఆరోగ్యకరమైన జీవనశైలి:** సమతుల్య ఆహారం, శరీర హైడ్రేషన్, మంచి నిద్ర మరియు వ్యాయామం.\n- **వైద్య పరీక్షల వివరాలు:** రక్త పరీక్షలు (HbA1c, CBC, లిపిడ్ ప్రొఫైల్) మరియు నివేదికల వివరణ.\n- **వైద్యుల సంప్రదింపు:** మీ సమస్యకు మెడిక్యూలో ఏ స్పెషలిస్ట్ డాక్టర్‌ను సంప్రదించాలో మార్గదర్శనం.\n\n*మీరు ఈరోజు ఏ ఆరోగ్య సమాచారం గురించి తెలుసుకోవాలనుకుంటున్నారు?*`,
          suggestedFollowUps: [
            'జ్వరం వచ్చినప్పుడు తీసుకోవాల్సిన జాగ్రత్తలు?',
            'గ్యాస్ మరియు ఎసిడిటీ నివారణ ఎలా?',
            'ఆరోగ్యకరమైన రక్తపోటు (బీపీ) స్థాయిలు ఎంత?'
          ]
        };
      }
      return {
        answer: `**Hello! I am Mediquee AI, your personal healthcare and wellness assistant.** 👋\n\nI can help you navigate everyday health questions with easy-to-understand educational guidance:\n\n- **Understanding Symptoms:** Ask about causes, home care, and relief for fever, cold, headaches, acidity, or body aches.\n- **Preventive Wellness:** Practical principles on balanced nutrition, hydration, sleep hygiene, and physical exercise.\n- **Health Literacy:** Clear explanations of common lab tests (HbA1c, CBC, lipid profile) and medical terms.\n- **Doctor Guidance:** Guidance on which medical specialist or OP department fits your symptoms on MediQuee.\n\n*How are you feeling today, or what health topic would you like to explore?*`,
        suggestedFollowUps: [
          'What causes sudden fever?',
          'Tips to manage acidity and indigestion',
          'How do I choose the right doctor on MediQuee?'
        ]
      };
    }

    // 2. GRATITUDE / THANKS
    if (rawLower.includes('thank') || rawLower.includes('dhanyavad') || rawLower.includes('ధన్యవాదాలు')) {
      if (isTelugu) {
        return {
          answer: `**చాలా ధన్యవాదాలు!** 😊\n\nమీకు మరియు మీ కుటుంబ సభ్యులకు మంచి ఆరోగ్యం చేకూరాలని కోరుకుంటున్నాము. ఆరోగ్యకరమైన సమతుల్య ఆహారం, తగినంత నీరు తాగడం మరియు క్రమబద్ధమైన ఆరోగ్య పరీక్షలు ఉత్తమ ఆరోగ్యాన్ని అందిస్తాయి.\n\nమీకు డాక్టర్ సంప్రదింపులు లేదా ల్యాబ్ పరీక్షలు అవసరమైనప్పుడు మెడిక్యూ ఎల్లప్పుడూ అందుబాటులో ఉంటుంది. ఏవైనా ఇతర సందేహాలుంటే నిరభ్యంతరంగా అడగండి!`,
          suggestedFollowUps: [
            'ఆరోగ్యకరమైన జీవనశైలి చిట్కాలు',
            'వార్షిక ఆరోగ్య పరీక్షల వివరాలు',
            'మెడిక్యూలో డాక్టర్ బుకింగ్ ఎలా చేయాలి?'
          ]
        };
      }
      return {
        answer: `**You're very welcome!** 😊\n\nWishing you and your loved ones great health and vitality. Remember that a proactive lifestyle—balanced nutrition, staying well-hydrated, and routine health checkups—is the best preventive medicine.\n\nWhenever you need to consult a verified doctor or book diagnostic lab tests, MediQuee is right at your doorstep. Let me know if you have any other questions!`,
        suggestedFollowUps: [
          'What preventive health tests are recommended annually?',
          'Tips for staying healthy and active',
          'How to book a doctor consultation on MediQuee'
        ]
      };
    }

    // 3. COLD, COUGH, SORE THROAT, FLU
    if (rawLower.includes('cough') || rawLower.includes('cold') || rawLower.includes('throat') || rawLower.includes('flu') || rawLower.includes('sneez') || rawLower.includes('phlegm') || rawLower.includes('congestion') || rawLower.includes('దగ్గు') || rawLower.includes('జలుబు') || rawLower.includes('గొంతు')) {
      if (isTelugu) {
        return {
          answer: `**దగ్గు, జలుబు మరియు గొంతు నొప్పి గురించి సాధారణ అవగాహన:**\n\n- **సాధారణ కారణాలు:** చాలా వరకు తీవ్రమైన జలుబు మరియు దగ్గు వైరల్ ఇన్ఫెక్షన్ల వల్ల వస్తాయి. ఇవి సాధారణంగా 5 నుండి 7 రోజులలో క్రమంగా తగ్గుతాయి.\n- **ఇంటి జాగ్రత్తలు & ఉపశమనం:**\n  - **గోరువెచ్చని ద్రవాలు:** గోరువెచ్చని నీరు, అల్లం-తులసి టీ, లేదా సూప్‌లు గొంతు మంటను తగ్గిస్తాయి.\n  - **ఉప్పు నీటి పుక్కిలింత:** గోరువెచ్చని నీటిలో కొద్దిగా ఉప్పు వేసి రోజుకు 2-3 సార్లు పుక్కిలించడం వల్ల గొంతు వాపు తగ్గుతుంది.\n  - **ఆవిరి పట్టడం:** ముక్కు దిబ్బడ తగ్గడానికి ఆవిరి సహాయపడుతుంది.\n- **ముఖ్య గమనిక:** వైరల్ జలుబులకు యాంటీబయాటిక్స్ పనిచేయవు; సొంతంగా మందులు వాడకండి.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:** దగ్గు 10 రోజుల కంటే ఎక్కువ ఉన్నా, శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా అధిక జ్వరం ఉంటే మెడిక్యూలో **జనరల్ ఫిజిషియన్ లేదా పల్మనాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'గొంతు నొప్పికి సహజ నివారణలు ఏమిటి?',
            'జలుబు ఎన్ని రోజుల్లో సాధారణంగా తగ్గుతుంది?',
            'జనరల్ ఫిజిషియన్ కన్సల్టేషన్ బుక్ చేయండి'
          ]
        };
      }
      return {
        answer: `**Understanding Cough, Cold & Sore Throat (General Education):**\n\n- **Common Causes:** Most acute colds, coughs, and throat irritations are triggered by common viral upper respiratory infections (such as rhinoviruses) that run their course over 5 to 7 days.\n- **Home Care & Supportive Relief:**\n  - **Hydration:** Warm liquids (herbal tea, clear broths, warm water with lemon) soothe mucous membranes and loosen secretions.\n  - **Saltwater Gargle:** Dissolve 1/2 tsp of salt in a glass of warm water and gargle 2–3 times daily to relieve throat inflammation.\n  - **Steam Inhalation:** Gentle steam inhalation helps ease nasal congestion and airway dryness.\n  - **Rest:** Quality sleep provides the energy your immune system requires to combat the virus.\n- **Important Safety Note:** Viral colds do **not** respond to antibiotics. Avoid self-medicating with antibiotics.\n- **When to Consult a Doctor:** If your cough persists for more than 10-14 days, produces thick or discolored phlegm, causes shortness of breath, or is accompanied by high fever over 102°F, consult a **General Physician or Pulmonologist** on MediQuee.`,
        suggestedFollowUps: [
          'When does a sore throat need a doctor visit?',
          'Can steam inhalation help nasal congestion?',
          'Consult a General Physician on MediQuee'
        ]
      };
    }

    // 4. STOMACH PAIN, ACIDITY, GASTRIC, INDIGESTION, CONSTIPATION
    if (rawLower.includes('stomach') || rawLower.includes('acid') || rawLower.includes('gas') || rawLower.includes('gastric') || rawLower.includes('indigestion') || rawLower.includes('bloat') || rawLower.includes('constipat') || rawLower.includes('heartburn') || rawLower.includes('gerd') || rawLower.includes('vomit') || rawLower.includes('nausea') || rawLower.includes('belly') || rawLower.includes('కడుపు') || rawLower.includes('ఎసిడిటీ') || rawLower.includes('గ్యాస్') || rawLower.includes('వాంతులు') || rawLower.includes('అజీర్ణం')) {
      if (isTelugu) {
        return {
          answer: `**కడుపు నొప్పి, ఎసిడిటీ మరియు జీర్ణ సమస్యల అవగాహన:**\n\n- **కారణాలు:** అధిక కారం, నూనె పదార్థాలు తినడం, సకాలంలో భోజనం చేయకపోవడం, ఒత్తిడి లేదా భోజనం చేసిన వెంటనే పడుకోవడం వల్ల గ్యాస్ మరియు ఎసిడిటీ వస్తాయి.\n- **నివారణ చర్యలు & అలవాట్లు:**\n  - ఒకేసారి ఎక్కువ ఆహారం తీసుకోకుండా, తక్కువ మోతాదులో సమయానికి తినండి.\n  - భోజనం చేసిన తర్వాత కనీసం 2 గంటల పాటు నిద్రపోకుండా నిటారుగా ఉండండి.\n  - రోజుకు కనీసం 2.5 నుండి 3 లీటర్ల నీరు తాగండి.\n  - పీచు పదార్థాలు (ఫైబర్) ఎక్కువగా ఉండే తాజా కూరగాయలు, పండ్లు ఆహారంలో చేర్చండి.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:** తీవ్రమైన కడుపు నొప్పి, రక్తంతో కూడిన వాంతులు, లేదా మలంలో రక్తం కనిపిస్తే ఆలస్యం చేయకుండా మెడిక్యూలో **గ్యాస్ట్రోఎంటరాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'ఎసిడిటీని తగ్గించే ఆహార నియమాలు ఏమిటి?',
            'జీర్ణక్రియ మెరుగుపడటానికి ఏం చేయాలి?',
            'గ్యాస్ట్రోఎంటరాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Acidity, Gas & Digestive Discomfort (General Education):**\n\n- **How It Happens:** Acidity and acid reflux (GERD) occur when gastric acid travels backward up into the esophagus. Gas and bloating arise from swallowed air, slow motility, or bacterial fermentation of undigested foods.\n- **Common Triggers:** Eating heavily spiced, deep-fried, or highly processed meals; skipping meals or irregular meal schedules; lying down immediately after dinner; excess caffeine or soda; and emotional stress.\n- **Healthy Digestive Habits:**\n  - **Smaller Portions:** Eat smaller, balanced meals to prevent stomach overdistension.\n  - **Upright Posture:** Remain sitting or lightly strolling for at least 2 hours after a meal before lying down.\n  - **Hydration & Dietary Fiber:** Drink adequate water between meals and consume fiber (vegetables, oats, papaya) for healthy bowel transit.\n- **When to See a Specialist:** If you experience severe, persistent abdominal pain, dark black stools, frequent vomiting, or difficulty swallowing, consult a **Gastroenterologist or General Physician** on MediQuee immediately.`,
        suggestedFollowUps: [
          'What foods trigger acid reflux and heartburn?',
          'How much dietary fiber should I consume daily?',
          'Consult a Gastroenterologist on MediQuee'
        ]
      };
    }

    // 5. HEADACHE & MIGRAINE
    if (rawLower.includes('headache') || rawLower.includes('migraine') || rawLower.includes('head pain') || rawLower.includes('tension headache') || rawLower.includes('cluster') || rawLower.includes('తలనెప్పి') || rawLower.includes('తలనొప్పి')) {
      if (isTelugu) {
        return {
          answer: `**తలనొప్పి మరియు మైగ్రేన్ సాధారణ కారణాలు & ఉపశమనం:**\n\n- **సాధారణ కారణాలు:** ఎక్కువసేపు కంప్యూటర్ లేదా మొబైల్ స్క్రీన్ చూడటం, నిద్రలేమి, అధిక ఒత్తిడి, లేదా శరీరంలో నీటి లోపం (డీహైడ్రేషన్) వల్ల తలనొప్పి రావచ్చు.\n- **ఉపశమనం & నివారణ చిట్కాలు:**\n  - వెంటనే ఒక పెద్ద గ్లాసు నీరు తాగండి (డీహైడ్రేషన్ సాధారణ తలనొప్పికి ప్రధాన కారణం).\n  - ప్రశాంతమైన, తక్కువ వెలుతురు ఉన్న గదిలో విశ్రాంతి తీసుకోండి.\n  - కంప్యూటర్ ఉపయోగించేటప్పుడు 20-20-20 సూత్రాన్ని పాటించండి (ప్రతి 20 నిమిషాలకు 20 అడుగుల దూరంలోని వస్తువును 20 సెకన్ల పాటు చూడటం).\n- **వైద్య సలహా:** తలనొప్పి తరచుగా వస్తున్నా, చూపు మసకబారినా లేదా వాంతులతో కూడిన తీవ్ర నొప్పి ఉంటే మెడిక్యూలో **న్యూరాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'మైగ్రేన్ లక్షణాలు ఎలా ఉంటాయి?',
            'స్క్రీన్ టైమ్ తలనొప్పి నివారణ చిట్కాలు',
            'న్యూరాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Headaches & Migraines (General Education):**\n\n- **Types of Headaches:**\n  - **Tension Headaches:** The most prevalent type; feels like a tight band around the head, commonly triggered by stress, screen eye strain, neck posture, or lack of sleep.\n  - **Migraines:** Characterized by throbbing, pulsing pain (often localized to one side), frequently accompanied by light sensitivity, sound sensitivity, or nausea.\n- **Practical Relief & Prevention:**\n  - **Hydrate Immediately:** Mild dehydration is a very common silent headache trigger; drink a large glass of water.\n  - **Restful Break:** Rest in a quiet, dimly lit room and apply a cool, damp cloth across the forehead.\n  - **Screen Hygiene:** Follow the 20-20-20 rule to relax your ocular focusing muscles during desk work.\n- **When to Seek Evaluation:** If headaches occur several times a week, steadily worsen, or awaken you from sleep, consult a **Neurologist or General Physician** on MediQuee.`,
        suggestedFollowUps: [
          'What is the difference between migraine and tension headache?',
          'How does screen time cause headaches?',
          'Consult a Neurologist on MediQuee'
        ]
      };
    }

    // 6. FEVER & HIGH TEMPERATURE
    if (rawLower.includes('fever') || rawLower.includes('temperature') || rawLower.includes('chills') || rawLower.includes('high temp') || rawLower.includes('జ్వరం')) {
      if (isTelugu) {
        return {
          answer: `**జ్వరం (Fever) గురించి సాధారణ అవగాహన & సంరక్షణ:**\n\n- **జ్వరం అంటే ఏమిటి:** శరీర ఉష్ణోగ్రత 100.4°F (38°C) కంటే పెరిగినప్పుడు దానిని జ్వరంగా పరిగణిస్తారు. ఇది ఇన్ఫెక్షన్‌తో పోరాడుతున్నప్పుడు రోగనిరోధక వ్యవస్థ చూపే సహజ రక్షణ చర్య.\n- **తీసుకోవాల్సిన జాగ్రత్తలు:**\n  - పుష్కలంగా నీరు, కొబ్బరి నీళ్ళు, లేదా సూప్‌లు తాగడం ద్వారా శరీరంలో నీటి స్థాయిని కాపాడుకోండి.\n  - మంచి గాలి వెలుతురు ఉన్న గదిలో విశ్రాంతి తీసుకోండి.\n  - నుదుటిపై గోరువెచ్చని నీటి గుడ్డతో అద్దడం ద్వారా శరీర వేడిని సౌకర్యవంతంగా తగ్గించవచ్చు.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:** ఉష్ణోగ్రత 102°F దాటినా, 3 రోజుల కంటే ఎక్కువ కాలం కొనసాగినా, లేదా మెడ పట్టేయడం, దద్దుర్లు ఉంటే వెంటనే మెడిక్యూలో **జనరల్ ఫిజిషియన్** డాక్టర్‌ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'జ్వరం ఉన్నప్పుడు ఎలాంటి ఆహారం తీసుకోవాలి?',
            'పిల్లల్లో జ్వరం వస్తే ఎప్పుడు డాక్టర్‌ను కలవాలి?',
            'జనరల్ ఫిజిషియన్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Fever (General Education):**\n\n- **What Fever Is:** A fever is an elevated core body temperature (generally 100.4°F / 38°C or higher). It represents your immune system's natural physiological mechanism to fight viral or bacterial invaders.\n- **Supportive Care:**\n  - **Hydration:** Elevated temperatures increase fluid loss; drink water, electrolyte solutions, coconut water, or clear broths.\n  - **Environment:** Rest in a comfortable, well-ventilated room with lightweight, breathable clothing.\n  - **Lukewarm Sponge:** Using a lukewarm washcloth on the forehead and neck can safely relieve heat discomfort.\n- **When to Consult a Doctor:** If body temperature exceeds 102°F (38.9°C), persists for more than 3 days, or is accompanied by a stiff neck, persistent vomiting, or rash, consult a **General Physician** on MediQuee promptly.`,
        suggestedFollowUps: [
          'What fluids are best during a fever?',
          'What are red-flag fever symptoms that need immediate care?',
          'Consult a General Physician on MediQuee'
        ]
      };
    }

    // 7. DIABETES, BLOOD SUGAR, HbA1c
    if (rawLower.includes('diabetes') || rawLower.includes('sugar') || rawLower.includes('glucose') || rawLower.includes('hba1c') || rawLower.includes('insulin') || rawLower.includes('మధుమేహం') || rawLower.includes('షుగర్') || rawLower.includes('గ్లూకోజ్')) {
      if (isTelugu) {
        return {
          answer: `**మధుమేహం (షుగర్) & రక్తంలో గ్లూకోజ్ స్థాయిల సమాచారం:**\n\n- **డయాబెటిస్ అంటే ఏమిటి:** శరీరంలో ఇన్సులిన్ ఉత్పత్తి తగ్గడం లేదా ఇన్సులిన్ నిరోధకత వల్ల రక్తంలో గ్లూకోజ్ (చక్కెర) స్థాయిలు పెరిగే జీవక్రియ పరిస్థితి.\n- **సాధారణ కొలతలు:**\n  - ఖాళీ కడుపుతో (Fasting): 70–99 mg/dL సాధారణం; 126 mg/dL కంటే ఎక్కువ ఉంటే మధుమేహం.\n  - HbA1c (గత 3 నెలల సగటు): 5.7% కంటే తక్కువ సాధారణం; 6.5% కంటే ఎక్కువ ఉంటే డయాబెటిస్.\n- **నివారణ & నియంత్రణ:**\n  - తృణధాన్యాలు (మిల్లెట్స్), తాజా ఆకుకూరలు, ఫైబర్ ఆహారం తీసుకోండి.\n  - స్వీట్లు, శీతల పానీయాలు, మైదా పదార్థాలను నివారించండి.\n  - ప్రతిరోజూ కనీసం 30 నిమిషాలు నడక లేదా వ్యాయామం చేయండి.\n- **వైద్య సంప్రదింపు:** వ్యక్తిగత చికిత్స మరియు మందుల కోసం మెడిక్యూలో **ఎండోక్రినాలజిస్ట్ లేదా జనరల్ ఫిజిషియన్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'షుగర్ నియంత్రణకు మంచి ఆహారం ఏమిటి?',
            'HbA1c పరీక్ష ఎందుకు చేయించుకోవాలి?',
            'ఎండోక్రినాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Diabetes & Blood Sugar (General Education):**\n\n- **Core Mechanism:** Diabetes occurs when the pancreas produces insufficient insulin or the body becomes resistant to insulin, causing elevated glucose levels in the bloodstream.\n- **Standard Diagnostic Targets:**\n  - **Fasting Blood Sugar:** 70–99 mg/dL (Normal); 100–125 mg/dL (Prediabetes); 126+ mg/dL (Diabetes).\n  - **HbA1c (3-Month Average):** Below 5.7% (Normal); 5.7%–6.4% (Prediabetes); 6.5%+ (Diabetes).\n- **Preventive Lifestyle Steps:**\n  - **Dietary Choices:** Prioritize whole grains, millets, leafy vegetables, legumes, and lean proteins. Cut back on sugary beverages, sweets, and refined flours.\n  - **Physical Activity:** Aim for at least 150 minutes of moderate aerobic activity (e.g., brisk walking) per week.\n- **Medical Guidance:** For personalized blood sugar monitoring and medical plans, consult an **Endocrinologist or Diabetologist** on MediQuee.`,
        suggestedFollowUps: [
          'What is the target HbA1c level for diabetics?',
          'What are low glycemic index foods?',
          'Consult an Endocrinologist on MediQuee'
        ]
      };
    }

    // 8. BLOOD PRESSURE, HYPERTENSION
    if (rawLower.includes('blood pressure') || rawLower.includes('bp') || rawLower.includes('hypertension') || rawLower.includes('hypotension') || rawLower.includes('రక్తపోటు') || rawLower.includes('బీపీ') || rawLower.includes('హైపర్టెన్షన్')) {
      if (isTelugu) {
        return {
          answer: `**రక్తపోటు (Blood Pressure) సాధారణ మార్గదర్శకాలు:**\n\n- **సాధారణ కొలతలు:** ఆరోగ్యవంతమైన పెద్దవారిలో విశ్రాంతి సమయంలో బీపీ సుమారుగా 120/80 mmHg గా ఉండాలి.\n- **హైపర్టెన్షన్ (అధిక రక్తపోటు):** నిరంతరం 130/80 mmHg లేదా అంతకంటే ఎక్కువ ఉండటం.\n- **జీవనశైలి నివారణలు:**\n  - ఆహారంలో ఉప్పు (సోడియం), ప్రాసెస్ చేసిన ఆహారాలు మరియు ఊరగాయలు తగ్గించండి.\n  - పొటాషియం ఎక్కువగా ఉండే అరటిపండ్లు, ఆకుకూరలు ఆహారంలో చేర్చుకోండి.\n  - రోజూ 30 నిమిషాల వ్యాయామం మరియు ఒత్తిడిని తగ్గించే ధ్యానం చేయండి.\n- **వైద్య సలహా:** ఖచ్చితమైన బీపీ పరీక్ష మరియు సరైన చికిత్స కోసం మెడిక్యూలో **కార్డియాలజిస్ట్ లేదా జనరల్ ఫిజిషియన్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'బీపీని తగ్గించే సహజ మార్గాలు ఏమిటి?',
            'ఉప్పు తీసుకోవడం బీపీని ఎలా ప్రభావితం చేస్తుంది?',
            'కార్డియాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Blood Pressure (General Education):**\n\n- **What the Numbers Represent:**\n  - **Systolic (Top Number):** Pressure in arteries during heart muscle contraction.\n  - **Diastolic (Bottom Number):** Pressure in arteries between heart contractions.\n  - **Optimal Range:** Approximately 120/80 mmHg in healthy adults at rest.\n  - **Hypertension:** Persistently at or above 130/80 mmHg.\n- **Why It Matters:** Chronic high BP places strain on your heart, kidneys, and brain blood vessels without producing obvious early symptoms.\n- **Heart-Healthy Habits:**\n  - **Sodium Moderation:** Limit added table salt, pickles, and salty snacks (under 2,000 mg sodium daily).\n  - **DASH Diet:** Include potassium-rich foods (bananas, spinach, beans) and whole grains.\n  - **Stress Relief:** Practice regular slow-paced breathing, aerobic movement, and prioritize 7-8 hours of restful sleep.\n- **Consultation:** Schedule an evaluation with a **Cardiologist or General Physician** on MediQuee for regular blood pressure tracking.`,
        suggestedFollowUps: [
          'What is the DASH diet for blood pressure?',
          'How does sodium intake affect blood pressure?',
          'Consult a Cardiologist on MediQuee'
        ]
      };
    }

    // 9. JOINTS, BACK PAIN, KNEE PAIN, BONES
    if (rawLower.includes('joint') || rawLower.includes('knee') || rawLower.includes('back pain') || rawLower.includes('spine') || rawLower.includes('arthritis') || rawLower.includes('bone') || rawLower.includes('neck pain') || rawLower.includes('shoulder') || rawLower.includes('నడుము') || rawLower.includes('కీళ్ల') || rawLower.includes('మోకాళ్ళ') || rawLower.includes('ఎముక')) {
      if (isTelugu) {
        return {
          answer: `**కీళ్ల నొప్పులు, మోకాళ్ల నొప్పులు & నడుము నొప్పి అవగాహన:**\n\n- **సాధారణ కారణాలు:** సరైన భంగిమలో కూర్చోకపోవడం, ఎక్కువసేపు కూర్చోవడం, విటమిన్ డి మరియు కాల్షియం లోపం, లేదా వయస్సుతో పాటు కీళ్ల అరుగుదల.\n- **నివారణ జాగ్రత్తలు:**\n  - కూర్చునేటప్పుడు వెన్నెముకను నిటారుగా ఉంచండి, సరైన కుర్చీని ఉపయోగించండి.\n  - ప్రతి 45 నిమిషాలకు ఒకసారి లేచి చిన్న విరామం తీసుకోండి.\n  - పాలు, ఆకుకూరలు, బాదం, నువ్వులు వంటి కాల్షియం అధికంగా ఉండే ఆహారం తీసుకోండి.\n  - వాపు ఉంటే ఐస్ ప్యాక్, బిగుతుగా ఉంటే గోరువెచ్చని కాపడం పెట్టండి.\n- **వైద్య సలహా:** నిరంతర నొప్పులు లేదా కీళ్ల వాపు ఉంటే మెడిక్యూలో **ఆర్థోపెడిక్ సర్జన్ లేదా ఫిజియోథెరపిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'ఎముకల బలానికి ఎలాంటి ఆహారం మంచిది?',
            'కూర్చునే భంగిమను ఎలా సరిచేసుకోవాలి?',
            'ఆర్థోపెడిక్ డాక్టర్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Joint, Knee & Back Discomfort (General Education):**\n\n- **Common Triggers:** Poor ergonomic seating posture, prolonged sitting without breaks, weak core and hamstring musculature, or age-related cartilage thinning (osteoarthritis).\n- **Daily Ergonomics & Joint Care:**\n  - **Posture Alignment:** Keep your feet flat on the ground, lower back supported, and computer screens at eye level.\n  - **Gentle Movement:** Avoid sitting stationary for longer than 45 minutes; stand up and do gentle mobility stretches.\n  - **Hot/Cold Application:** Use an ice pack wrapped in a cloth for acute sprains/swelling, and warm compresses for chronic stiffness.\n  - **Bone Nutrition:** Ensure adequate dietary calcium and check your Vitamin D3 levels annually.\n- **When to Consult a Specialist:** For severe swelling, inability to bear weight, or numbness radiating down the legs, consult an **Orthopedic Specialist or Physiotherapist** on MediQuee.`,
        suggestedFollowUps: [
          'What exercises strengthen knees and back?',
          'Importance of Vitamin D for bone health',
          'Consult an Orthopedic Doctor on MediQuee'
        ]
      };
    }

    // 10. SKIN, RASH, ALLERGIES, ACNE
    if (rawLower.includes('skin') || rawLower.includes('rash') || rawLower.includes('acne') || rawLower.includes('pimple') || rawLower.includes('allergy') || rawLower.includes('itch') || rawLower.includes('eczema') || rawLower.includes('hives') || rawLower.includes('దురద') || rawLower.includes('దద్దుర్లు') || rawLower.includes('చర్మం')) {
      if (isTelugu) {
        return {
          answer: `**చర్మ దద్దుర్లు, దురద & మొటిమల గురించి సాధారణ సమాచారం:**\n\n- **కారణాలు:** వాతావరణ మార్పులు, దుమ్ము, సబ్బుల అలెర్జీలు, చెమట లేదా హార్మోన్ల మార్పుల వల్ల చర్మ సమస్యలు వస్తాయి.\n- **తీసుకోవాల్సిన జాగ్రత్తలు:**\n  - చర్మాన్ని గోకవద్దు, ఇది ఇన్ఫెక్షన్‌ను మరింత వ్యాపింపజేస్తుంది.\n  - గాఢమైన సబ్బులకు బదులు సున్నితమైన క్లెన్సర్లను వాడండి.\n  - వదులుగా ఉండే కాటన్ దుస్తులు ధరించండి.\n  - చర్మాన్ని తేమగా ఉంచడానికి మంచి మాయిశ్చరైజర్‌ను వాడండి.\n- **వైద్య సలహా:** దద్దుర్లు ఎక్కువగా ఉన్నా లేదా తగ్గకపోతే మెడిక్యూలో **డెర్మటాలజిస్ట్ (చర్మ నిపుణుడు)** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'చర్మాన్ని ఆరోగ్యంగా ఉంచుకోవడానికి చిట్కాలు',
            'అలెర్జీ దద్దుర్లను ఎలా గుర్తించాలి?',
            'డెర్మటాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Skin Rashes, Allergies & Acne (General Education):**\n\n- **Common Triggers:** Allergic contact with detergents, cosmetic products, insect bites, hot humid weather (heat rashes), fungal overgrowth, or hormonal fluctuations driving excess sebum in acne.\n- **Skin Barrier Care:**\n  - **Avoid Scratching:** Scratching damages the epidermis, inviting secondary bacterial infection.\n  - **Gentle Cleansing:** Wash with lukewarm water and a mild, fragrance-free cleanser.\n  - **Hydrate the Barrier:** Apply a gentle ceramide-based or soothing moisturizer after bathing.\n- **When to See a Specialist:** If rashes spread rapidly, form blisters, develop yellow crusting, or cover sensitive areas, consult a **Dermatologist** on MediQuee.`,
        suggestedFollowUps: [
          'Best everyday skincare tips',
          'How to identify allergic skin reactions',
          'Consult a Dermatologist on MediQuee'
        ]
      };
    }

    // 11. EYE STRAIN & VISION
    if (rawLower.includes('eye') || rawLower.includes('vision') || rawLower.includes('blur') || rawLower.includes('eye strain') || rawLower.includes('dry eye') || rawLower.includes('కంటి')) {
      if (isTelugu) {
        return {
          answer: `**కంటి ఆరోగ్యం & స్క్రీన్ అలసట (Eye Strain) సమాచారం:**\n\n- **కంటి అలసట:** కంప్యూటర్ లేదా మొబైల్ స్క్రీన్లు ఎక్కువసేపు చూడటం వల్ల రెప్పవేయడం తగ్గి కళ్ళు పొడిబారడం, ఎరుపుదనం వస్తాయి.\n- **20-20-20 సూత్రం:** ప్రతి 20 నిమిషాలకు ఒకసారి 20 అడుగుల దూరంలో ఉన్న వస్తువును 20 సెకన్ల పాటు చూడటం ద్వారా కంటి కండరాలు విశ్రాంతి పొందుతాయి.\n- **జాగ్రత్తలు:** చీకటి గదిలో మొబైల్ చూడటం మానుకోండి, తగినంత వెలుతురు ఉండేలా చూసుకోండి.\n- **వైద్య సలహా:** కంటి చూపులో ఆకస్మిక మార్పులు లేదా నొప్పి ఉంటే మెడిక్యూలో **ఆప్తాల్మాలజిస్ట్ (కంటి వైద్యుడు)** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'కంటి వ్యాయామాలు ఏమిటి?',
            'కంటి పరీక్ష ఎప్పుడు చేయించుకోవాలి?',
            'ఆప్తాల్మాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Eye Health & Digital Eye Strain (General Education):**\n\n- **Digital Eye Strain:** Blinking frequency decreases by up to 50% during screen use, resulting in dry eyes, burning, and fatigue.\n- **The 20-20-20 Rule:** Every 20 minutes, take a 20-second break to view an object at least 20 feet away to relax eye focusing muscles.\n- **Everyday Eye Habits:** Position monitors about an arm's length away, keep room illumination balanced (avoid viewing bright screens in total darkness), and stay well hydrated.\n- **When to See an Eye Doctor:** If you experience sudden blurred vision, flashes of light, or persistent eye pain, schedule an appointment with an **Ophthalmologist** on MediQuee.`,
        suggestedFollowUps: [
          'What is the 20-20-20 rule for screen fatigue?',
          'How often should adults get an eye checkup?',
          'Consult an Ophthalmologist on MediQuee'
        ]
      };
    }

    // 12. STRESS, SLEEP, ANXIETY, MENTAL HEALTH
    if (rawLower.includes('stress') || rawLower.includes('sleep') || rawLower.includes('insomnia') || rawLower.includes('anxiety') || rawLower.includes('depression') || rawLower.includes('tension') || rawLower.includes('mental') || rawLower.includes('నిద్ర') || rawLower.includes('ఒత్తిడి')) {
      if (isTelugu) {
        return {
          answer: `**ఒత్తిడి నియంత్రణ & మంచి నిద్ర (Mental Wellness) అవగాహన:**\n\n- **ఒత్తిడి ప్రభావం:** దీర్ఘకాలిక మానసిక ఒత్తిడి జీర్ణక్రియ, రక్తపోటు మరియు రోగనిరోధక శక్తిపై ప్రభావం చూపుతుంది.\n- **మంచి నిద్ర కోసం చిట్కాలు (7-8 గంటలు):**\n  - రోజూ ఒకే సమయానికి పడుకోవడం మరియు నిద్రలేవడం అలవాటు చేసుకోండి.\n  - పడుకోవడానికి 1 గంట ముందు మొబైల్, టీవీ స్క్రీన్లను ఆపివేయండి.\n  - పడుకునే ముందు 5 నిమిషాలు ప్రశాంతంగా ప్రాణాయామం లేదా ధ్యానం చేయండి.\n- **వైద్య సలహా:** ఒత్తిడి లేదా నిద్రలేమి తీవ్రంగా ఉంటే మెడిక్యూలో **సైకియాట్రిస్ట్ లేదా కౌన్సిలర్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'ఒత్తిడిని తగ్గించే శ్వాస వ్యాయామాలు ఏమిటి?',
            'గాఢ నిద్ర కోసం ఉత్తమ అలవాట్లు',
            'కౌన్సిలర్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Stress Management & Restful Sleep (General Education):**\n\n- **Mind-Body Health:** Prolonged stress elevates cortisol levels, disrupting metabolism, cardiovascular health, immunity, and sleep cycles.\n- **Sleep Hygiene Principles (7–8 Hours Daily):**\n  - **Consistent Sleep Schedule:** Retire to bed and wake up at consistent times every day.\n  - **Digital Wind-Down:** Turn off smartphones, laptops, and TVs 45–60 minutes before bed (screen blue light inhibits melatonin secretion).\n  - **Relaxation Ritual:** Engage in deep breathing (4-7-8 breathing) or calming reading prior to sleep.\n- **Professional Support:** If feelings of stress, worry, or sleeplessness affect your daily function, consulting a **Psychiatrist or Counselor** on MediQuee is a proactive, healthy step.`,
        suggestedFollowUps: [
          'What is the 4-7-8 breathing exercise for relaxation?',
          'How does sleep quality affect immune health?',
          'Consult a Mental Health Specialist on MediQuee'
        ]
      };
    }

    // 13. HEART & CHOLESTEROL
    if (rawLower.includes('heart') || rawLower.includes('cholesterol') || rawLower.includes('cardiac') || rawLower.includes('lipid') || rawLower.includes('triglyceride') || rawLower.includes('గుండె') || rawLower.includes('కొలెస్ట్రాల్')) {
      if (isTelugu) {
        return {
          answer: `**గుండె ఆరోగ్యం & కొలెస్ట్రాల్ గురించి అవగాహన:**\n\n- **కొలెస్ట్రాల్ అంటే ఏమిటి:** ఎల్‌డిఎల్ (చెడు కొలెస్ట్రాల్) ధమనులలో కొవ్వు పేరుకుపోయేలా చేస్తుంది; హెచ్‌డిఎల్ (మంచి కొలెస్ట్రాల్) గుండెను కాపాడుతుంది.\n- **గుండెను ఆరోగ్యంగా ఉంచే అలవాట్లు:**\n  - నూనె పదార్థాలు, ప్రాసెస్ చేసిన ఆహారాలు తగ్గించి, నట్స్, ఆలివ్ ఆయిల్, ఆకుకూరలు తీసుకోండి.\n  - వారానికి కనీసం 150 నిమిషాలు వేగంగా నడవడం వల్ల మంచి కొలెస్ట్రాల్ పెరుగుతుంది.\n  - పీచు పదార్థాలు (ఓట్స్, పండ్లు) కొలెస్ట్రాల్‌ను తగ్గించడంలో సహాయపడతాయి.\n- **వైద్య సలహా:** 30 ఏళ్లు దాటిన వారు ఏడాదికి ఒకసారి లిపిడ్ ప్రొఫైల్ పరీక్ష చేయించుకోవడం మరియు **కార్డియాలజిస్ట్** ను సంప్రదించడం మంచిది.`,
          suggestedFollowUps: [
            'మంచి మరియు చెడు కొలెస్ట్రాల్ మధ్య తేడా ఏమిటి?',
            'గుండె ఆరోగ్యానికి ఏ ఆహారం మంచిది?',
            'కార్డియాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Heart Health & Cholesterol (General Education):**\n\n- **Cholesterol Explained:** Cholesterol is an essential waxy fat in cell walls. However, excess LDL ("bad" cholesterol) deposits plaque in arteries, while HDL ("good" cholesterol) shuttles it to the liver for clearance.\n- **Heart-Healthy Lifestyle Essentials:**\n  - **Healthy Fats:** Swap trans fats with unsaturated options like nuts (walnuts, almonds), seeds, and olive or mustard oils.\n  - **Aerobic Conditioning:** 30 minutes of brisk walking 5 days a week boosts protective HDL levels.\n  - **Soluble Fiber:** Beans, oats, and fruits help bind dietary cholesterol and carry it out of the body.\n- **Preventive Screening:** Adults aged 30+ should get an annual Lipid Profile and consult a **Cardiologist** on MediQuee.`,
        suggestedFollowUps: [
          'What is the difference between HDL and LDL cholesterol?',
          'Heart-healthy dietary choices and meal planning',
          'Consult a Cardiologist on MediQuee'
        ]
      };
    }

    // 14. DIET, NUTRITION, WEIGHT LOSS
    if (rawLower.includes('diet') || rawLower.includes('nutrition') || rawLower.includes('weight') || rawLower.includes('obesity') || rawLower.includes('lose weight') || rawLower.includes('food') || rawLower.includes('calorie') || rawLower.includes('protein') || rawLower.includes('fiber') || rawLower.includes('ఆహారం') || rawLower.includes('బరువు')) {
      if (isTelugu) {
        return {
          answer: `**సమతుల్య ఆహారం & బరువు నిర్వహణ (Nutrition & Diet):**\n\n- **సమతుల్య ప్లేట్ విధానం:**\n  - సగం ప్లేట్: తాజా కూరగాయలు, ఆకుకూరలు (ఫైబర్ మరియు విటమిన్లు).\n  - పావు భాగం: పప్పుధాన్యాలు, గుడ్లు, పనీర్ లేదా మొలకెత్తిన గింజలు (ప్రోటీన్).\n  - పావు భాగం: చిరుధాన్యాలు (మిల్లెట్స్), గోధుమలు, బ్రౌన్ రైస్ (సంక్లిష్ట పిండి పదార్థాలు).\n- **ఆరోగ్యకరమైన బరువు తగ్గే నియమాలు:** తీవ్రమైన ఉపవాసాల కంటే రోజూ సరైన ఆహారం మరియు వ్యాయామం అలవాటు చేసుకోవడం స్థిరమైన ఫలితాలనిస్తుంది.\n- **డైటీషియన్ సలహా:** మీ శరీర తత్వానికి తగిన డైట్ చార్ట్ కోసం మెడిక్యూలో **క్లినికల్ న్యూట్రిషనిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'రోజువారీ ప్రోటీన్ అవసరాలు ఎంత?',
            'బరువు తగ్గడానికి ఆరోగ్యకరమైన చిట్కాలు',
            'న్యూట్రిషనిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Balanced Nutrition & Weight Management (General Education):**\n\n- **The Balanced Plate Guide:**\n  - **1/2 Plate:** Colorful seasonal vegetables and fresh greens (fiber, micronutrients).\n  - **1/4 Plate:** Quality protein (lentils, eggs, paneer, sprouts, fish, tofu) for lean tissue preservation.\n  - **1/4 Plate:** Complex, unrefined carbohydrates (millets, whole wheat, brown rice) for sustained energy.\n- **Sustainable Weight Principles:** Avoid crash diets that crash metabolic rate. Focus on mindful eating, a gradual caloric balance, and consistent daily physical activity.\n- **Personalized Planning:** For a diet chart tailored to your body composition, consult a **Clinical Dietitian or Nutritionist** on MediQuee.`,
        suggestedFollowUps: [
          'How much daily protein does an adult need?',
          'Tips for healthy sustainable weight management',
          'Book a Dietitian Consultation on MediQuee'
        ]
      };
    }

    // 15. WATER & HYDRATION
    if (rawLower.includes('water') || rawLower.includes('hydration') || rawLower.includes('drink water') || rawLower.includes('నీరు')) {
      if (isTelugu) {
        return {
          answer: `**శరీర హైడ్రేషన్ & నీరు తాగడం యొక్క ప్రాముఖ్యత:**\n\n- **ఎందుకు ముఖ్యం:** మానవ శరీరంలో సుమారు 60% నీరు ఉంటుంది. శరీర ఉష్ణోగ్రత నియంత్రణ, కీళ్ల కదలికలు మరియు కిడ్నీల పనితీరుకు నీరు అత్యవసరం.\n- **రోజువారీ కొలత:** సాధారణ పెద్దలు రోజుకు 2.5 నుండి 3.5 లీటర్ల నీరు లేదా ద్రవాలు తాగాలి.\n- **గుర్తుంచుకోవలసిన విషయం:** లేత పసుపు రంగు మూత్రం సరైన హైడ్రేషన్‌ను సూచిస్తుంది; ముదురు రంగులో ఉంటే వెంటనే నీరు తాగండి.`,
          suggestedFollowUps: [
            'డీహైడ్రేషన్ సాధారణ లక్షణాలు ఏమిటి?',
            'నీటితో పాటు ఉత్తమ హైడ్రేటింగ్ ద్రవాలు',
            'ఆరోగ్యకరమైన దినచర్య చిట్కాలు'
          ]
        };
      }
      return {
        answer: `**The Essentials of Daily Hydration (General Education):**\n\n- **Why It Matters:** The human body is approximately 60% water. Optimal hydration maintains kidney filtration, lubricates joints, aids nutrient absorption, and stabilizes body temperature.\n- **Daily Benchmark:** Most healthy adults in moderate climates require 2.5 to 3.5 liters of total fluids daily.\n- **Hydration Gauge:** Pale straw-colored urine generally reflects proper hydration; dark amber signals that you need water promptly.\n- **Tip:** Start your morning with a glass of room-temperature water before caffeinated beverages.`,
        suggestedFollowUps: [
          'What are subtle signs of mild dehydration?',
          'Best hydrating beverages besides plain water',
          'Daily healthy fluid intake schedule'
        ]
      };
    }

    // 16. LAB TESTS & HEALTH CHECKUPS
    if (rawLower.includes('lab') || rawLower.includes('test') || rawLower.includes('blood test') || rawLower.includes('urine') || rawLower.includes('cbc') || rawLower.includes('checkup') || rawLower.includes('package') || rawLower.includes('రక్త పరీక్ష') || rawLower.includes('ల్యాబ్')) {
      if (isTelugu) {
        return {
          answer: `**నివారణ ఆరోగ్య పరీక్షలు & ల్యాబ్ టెస్టుల వివరాలు:**\n\n- **పరీక్షల ప్రాముఖ్యత:** అధిక కొలెస్ట్రాల్, ప్రీ-డయాబెటిస్ వంటి సమస్యలు ప్రారంభంలో ఎటువంటి లక్షణాలు చూపించవు. వార్షిక రక్త పరీక్షల ద్వారా వీటిని ముందుగానే గుర్తించవచ్చు.\n- **ముఖ్యమైన పరీక్షలు:**\n  - **CBC (కంప్లీట్ బ్లడ్ కౌంట్):** హిమోగ్లోబిన్ మరియు ఇన్ఫెక్షన్ స్థాయిలను తెలుపుతుంది.\n  - **Fasting Sugar & HbA1c:** రక్తంలో చక్కెర నియంత్రణను తనిఖీ చేస్తుంది.\n  - **లిపిడ్ ప్రొఫైల్:** గుండె ఆరోగ్యానికి కొలెస్ట్రాల్ స్థాయిలు.\n  - **కిడ్నీ & లివర్ ఫంక్షన్ పరీక్షలు (KFT / LFT).**\n- **మెడిక్యూ సేవలు:** మీరు మెడిక్యూ ద్వారా సర్టిఫైడ్ **హోమ్ శాంపిల్ కలెక్షన్** ల్యాబ్ పరీక్షలను ఇంట్లోనే బుక్ చేసుకోవచ్చు!`,
          suggestedFollowUps: [
            'వార్షిక ఆరోగ్య పరీక్షలలో ఏ టెస్టులు ఉంటాయి?',
            'హోమ్ శాంపిల్ కలెక్షన్ ఎలా బుక్ చేయాలి?',
            'CBC రక్త పరీక్ష దేనిని సూచిస్తుంది?'
          ]
        };
      }
      return {
        answer: `**Preventive Health Checkups & Lab Tests (General Education):**\n\n- **The Value of Screening:** Many metabolic issues (such as early diabetes, lipid imbalances, and fatty liver) progress silently without symptoms. Regular tests detect changes while they are readily reversible.\n- **Essential Routine Panels:**\n  - **Complete Blood Count (CBC):** Measures hemoglobin, red/white blood cells, and platelets.\n  - **Fasting Blood Sugar & HbA1c:** Evaluates short and 3-month glycemic trends.\n  - **Lipid Profile:** Assesses heart disease risk through LDL, HDL, and triglycerides.\n  - **Liver & Kidney Panels (LFT / KFT):** Assesses organ filtration and enzyme health.\n- **MediQuee Services:** You can easily book accredited **Home Sample Collection** packages directly through the MediQuee platform!`,
        suggestedFollowUps: [
          'What tests are included in an annual health checkup?',
          'Book Home Sample Collection on MediQuee',
          'What does a Complete Blood Count (CBC) show?'
        ]
      };
    }

    // 17. DOCTOR CONSULTATION & DEPARTMENTS
    if (rawLower.includes('book') || rawLower.includes('doctor') || rawLower.includes('appointment') || rawLower.includes('consult') || rawLower.includes('specialist') || rawLower.includes('op') || rawLower.includes('hospital') || rawLower.includes('క్లినిక్') || rawLower.includes('డాక్టర్')) {
      if (isTelugu) {
        return {
          answer: `**మెడిక్యూలో సరైన డాక్టర్‌ను ఎలా ఎంచుకోవాలి:**\n\n- **జనరల్ మెడిసిన్ (General Physician):** జ్వరం, జలుబు, తలనొప్పి, అలసట, సాధారణ అనారోగ్యం.\n- **కార్డియాలజీ (Cardiology):** గుండె దడ, ఛాతీలో అసౌకర్యం, రక్తపోటు (బీపీ).\n- **ఆర్థోపెడిక్స్ (Orthopedics):** ఎముకలు, కీళ్ళు, మోకాళ్ళు మరియు నడుము నొప్పులు.\n- **పీడియాట్రిక్స్ (Pediatrics):** పిల్లల అనారోగ్యం, టీకాలు మరియు ఎదుగుదల.\n- **డెర్మటాలజీ (Dermatology):** చర్మ దద్దుర్లు, దురద, మొటిమలు, జుట్టు సమస్యలు.\n- **గ్యాస్ట్రోఎంటరాలజీ (Gastroenterology):** కడుపు నొప్పి, ఎసిడిటీ, జీర్ణ సమస్యలు.\n\n*మెడిక్యూ యాప్ ద్వారా మీరు నేరుగా హాస్పిటల్ ఓపీ అపాయింట్‌మెంట్‌లు లేదా వీడియో కన్సల్టేషన్లు బుక్ చేసుకోవచ్చు!*`,
          suggestedFollowUps: [
            'ఓపీ మరియు వీడియో కన్సల్టేషన్ మధ్య తేడా ఏమిటి?',
            'మెడిక్యూలో ఓపీ అపాయింట్‌మెంట్ బుక్ చేయండి',
            'నా లక్షణాలకు ఏ డాక్టర్‌ను సంప్రదించాలి?'
          ]
        };
      }
      return {
        answer: `**Navigating OP Departments & Choosing a Doctor on MediQuee:**\n\n- **General Medicine / Physician:** Best first stop for fever, fatigue, cough, headache, or general unwellness.\n- **Cardiology:** For heart evaluations, chest tightness, palpitations, and hypertension management.\n- **Orthopedics:** For joint inflammation, back/neck pain, fractures, and sports sprains.\n- **Pediatrics:** Specialized healthcare, growth checks, and vaccinations for infants and children.\n- **Dermatology:** For skin rashes, acne, allergic hives, and scalp concerns.\n- **Gastroenterology:** For stomach pain, acid reflux, liver concerns, and chronic indigestion.\n\n*You can book certified in-person OP hospital visits or online Video Consultations directly inside MediQuee!*`,
        suggestedFollowUps: [
          'How do I choose between OP and Video Consultation?',
          'Book an OP Appointment now on MediQuee',
          'Find certified doctors nearby on MediQuee'
        ]
      };
    }

    // 18. DYNAMIC CONTEXTUAL RESPONSE FOR ANY OTHER INQUIRY
    // Extract subject matter from user prompt to formulate a personalized educational breakdown
    const cleanedWords = prompt
      .replace(/[^\w\s\u0C00-\u0C7F]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['what', 'when', 'where', 'which', 'who', 'how', 'why', 'can', 'the', 'and', 'for', 'about', 'with', 'tell', 'explain', 'give', 'please', 'help'].includes(w.toLowerCase()));

    const topicSnippet = cleanedWords.slice(0, 3).join(' ') || (isTelugu ? 'ఆరోగ్య సమాచారం' : 'health inquiry');

    if (isTelugu) {
      return {
        answer: `**${topicSnippet} గురించి ఆరోగ్య అవగాహన:**\n\nమీరు అడిగిన **${topicSnippet}** అంశంపై సాధారణ ఆరోగ్య సూత్రాలు:\n\n- **సాధారణ సూత్రాలు:** సమతుల్య ఆహారం, పుష్కలంగా నీరు తాగడం, క్రమం తప్పకుండా వ్యాయామం మరియు నాణ్యమైన నిద్ర శరీర సహజ రక్షణ వ్యవస్థకు పునాది.\n- **నివారణ పద్ధతులు:** ఏదైనా ఆరోగ్య సమస్యను సమతుల్య జీవనశైలి మరియు ప్రారంభ వైద్య పరీక్షల ద్వారా నియంత్రించవచ్చు.\n- **డాక్టర్ సలహా:** ప్రతి వ్యక్తి ఆరోగ్య స్థితి భిన్నంగా ఉంటుంది. కాబట్టి ఖచ్చితమైన నిర్ధారణ మరియు చికిత్స కోసం మెడిక్యూలో అర్హత కలిగిన సంబంధిత స్పెషలిస్ట్ వైద్యుడిని సంప్రదించండి.\n\n*ఈ అంశంపై మీకు నిర్దిష్ట సందేహాలుంటే నన్ను అడగండి!*`,
        suggestedFollowUps: [
          'ఈ సమస్యకు ఏ డాక్టర్‌ను సంప్రదించాలి?',
          'ఆరోగ్యకరమైన జీవనశైలి మార్పులు ఏమిటి?',
          'మెడిక్యూలో డాక్టర్ కన్సల్టేషన్ బుక్ చేయండి'
        ]
      };
    }

    return {
      answer: `**Understanding ${topicSnippet} (Health Education):**\n\nThank you for asking about **${topicSnippet}**. Here is educational guidance regarding your inquiry:\n\n- **Foundational Health Principles:** Everyday wellness relies on balanced nutrition, consistent hydration, regular physical movement, and 7-8 hours of restful sleep.\n- **Preventive Practice:** When addressing questions about ${topicSnippet}, focusing on evidence-based lifestyle habits and timely screening tests yields the best long-term outcomes.\n- **Doctor Consultation:** Because individual health factors are distinct, for any personal medical evaluation, diagnostic tests, or treatment planning, we recommend consulting a certified specialist on MediQuee via OP Booking or Video Consultation.\n\n*Would you like to learn more about preventive habits or find out which specialist covers this area?*`,
      suggestedFollowUps: [
        'Which OP Department handles this concern?',
        'What preventive lifestyle habits can help?',
        'Find certified doctors on MediQuee'
      ]
    };
  }

  /**
   * Main function to handle health education questions with Gemini API
   */
  static async askHealthEducation(params: {
    prompt: string;
    language?: 'en' | 'te';
    history?: ChatMessage[];
  }): Promise<HealthEducationResponse> {
    const { prompt, language = 'en', history = [] } = params;
    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(prompt);
    const resolvedLang = isTelugu ? 'te' : 'en';
    const isEmergency = this.hasEmergencyWords(prompt);

    const emergencyWarning = isEmergency
      ? (isTelugu
          ? `⚠️ **అత్యవసర హెచ్చరిక (Emergency Warning):** మీరు పేర్కొన్న లక్షణాలు అత్యవసర వైద్య సంరక్షణ అవసరమయ్యే అవకాశం ఉంది. దయచేసి ఆలస్యం చేయకుండా వెంటనే **108 ఎమర్జెన్సీ అంబులెన్స్** కు కాల్ చేయండి లేదా సమీపంలోని హాస్పిటల్ ఎమర్జెన్సీ వార్డుకు వెళ్లండి.\n\n---\n\n`
          : `⚠️ **CRITICAL SAFETY ADVISORY:** Your description mentions symptoms that may indicate an acute medical emergency. Please do not wait for an online response. Immediately call **108 (Emergency Ambulance)** or proceed to the nearest hospital Emergency Room.\n\n---\n\n`)
      : '';

    const standardDisclaimer = isTelugu
      ? 'ఈ సమాచారం సాధారణ ఆరోగ్య అవగాహన కోసం మాత్రమే. ఇది వైద్య సలహా లేదా వ్యాధి నిర్ధారణ కాదు. ఖచ్చితమైన నిర్ధారణ కోసం వైద్యుడిని సంప్రదించండి.'
      : 'This assistant provides general educational information only, not medical diagnosis or treatment. Consult a licensed doctor for personalized medical advice.';

    // Check configuration
    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length < 10) {
      const fallback = this.getEducationalFallback(prompt, resolvedLang);
      return {
        answer: `${emergencyWarning}${fallback.answer}`,
        language: resolvedLang,
        providerConfigured: false,
        model: this.MODEL_NAME,
        disclaimer: standardDisclaimer,
        isEmergencyAlert: isEmergency,
        suggestedFollowUps: fallback.suggestedFollowUps
      };
    }

    // Sanitize user prompt to protect privacy
    const sanitizedPrompt = this.sanitizeText(prompt);

    const systemInstruction = `You are the Mediquee AI Health Education Assistant.
YOUR SOLE PURPOSE is to provide general healthcare literacy, explain common medical terms in simple language, and provide preventive wellness and lifestyle guidance.

CRITICAL HEALTHCARE SAFETY RULES:
1. You are NOT a doctor and do NOT provide medical care.
2. NEVER diagnose diseases, clinical conditions, or provide a clinical diagnosis.
3. NEVER prescribe medications, suggest pharmaceutical dosages, or advise changing medication regimens.
4. NEVER claim certainty regarding any user's personal health status.
5. ALWAYS emphasize that the information is general health education and advise consultation with a qualified medical professional at MediQuee.
6. Support English and Telugu. If the user writes in Telugu or requested language is Telugu, respond in clean, polite Telugu with English medical terminology in parentheses where useful.
7. Keep responses concise, organized with bullet points, and easy for laypersons to understand.
8. If the user mentions emergency signs, clearly reiterate seeking immediate hospital emergency care.`;

    try {
      // Build conversation payload
      const contentsPayload = [];

      for (const h of history.slice(-6)) { // keep recent context
        contentsPayload.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: this.sanitizeText(h.content) }]
        });
      }

      contentsPayload.push({
        role: 'user',
        parts: [{ text: sanitizedPrompt }]
      });

      const response = await fetch(`${this.API_BASE_URL}/${this.MODEL_NAME}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: contentsPayload,
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            maxOutputTokens: 800,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ]
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`[HealthAI] Gemini API returned status ${response.status}: ${errorBody}`);
        const fallback = this.getEducationalFallback(prompt, resolvedLang);
        return {
          answer: `${emergencyWarning}${fallback.answer}`,
          language: resolvedLang,
          providerConfigured: true,
          model: this.MODEL_NAME,
          disclaimer: standardDisclaimer,
          isEmergencyAlert: isEmergency,
          suggestedFollowUps: fallback.suggestedFollowUps
        };
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('No candidate content returned by Gemini');
      }

      return {
        answer: `${emergencyWarning}${generatedText.trim()}`,
        language: resolvedLang,
        providerConfigured: true,
        model: this.MODEL_NAME,
        disclaimer: standardDisclaimer,
        isEmergencyAlert: isEmergency,
        suggestedFollowUps: [
          resolvedLang === 'te' ? 'ఈ సమస్యకు ఏ ఓపీ విభాగాన్ని సంప్రదించాలి?' : 'Which OP Department handles this concern?',
          resolvedLang === 'te' ? 'వైద్యుడిని సంప్రదించే ముందు ఏ వివరాలు సిద్ధం చేసుకోవాలి?' : 'What questions should I ask my doctor?',
          resolvedLang === 'te' ? 'నివారణ కోసం తీసుకోవాల్సిన జీవనశైలి మార్పులు ఏమిటి?' : 'What preventive lifestyle habits can help?'
        ]
      };
    } catch (err: any) {
      console.error('[HealthAI] Error invoking Gemini API:', err.message);
      const fallback = this.getEducationalFallback(prompt, resolvedLang);
      return {
        answer: `${emergencyWarning}${fallback.answer}`,
        language: resolvedLang,
        providerConfigured: true,
        model: this.MODEL_NAME,
        disclaimer: standardDisclaimer,
        isEmergencyAlert: isEmergency,
        suggestedFollowUps: fallback.suggestedFollowUps
      };
    }
  }
}
