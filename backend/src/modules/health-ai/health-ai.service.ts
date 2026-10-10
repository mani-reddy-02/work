import { env } from '../../config/env';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface HealthEducationResponse {
  answer: string;
  language: 'en' | 'te';
  providerConfigured: boolean;
  provider: string;
  model: string;
  disclaimer: string;
  isEmergencyAlert: boolean;
  suggestedFollowUps?: string[];
  diagnostics?: string;
}

export interface ProviderStatusInfo {
  provider: string;
  model: string;
  configured: boolean;
  activeProvider: string;
  availableProviders: string[];
  lastError?: string;
}

export class HealthEducationService {
  private static lastDiagnosticError: string | null = null;
  private static activeProviderName: string = 'Clinical Knowledge Engine';
  private static activeModelName: string = 'mediquee-clinical-v2';

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
   * Checks if any AI provider is configured
   */
  static isConfigured(): boolean {
    const hasGemini = !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10);
    const hasGroq = !!(env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 10);
    const hasOpenRouter = !!(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 10);
    const hasOpenAI = !!(env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 10);
    return hasGemini || hasGroq || hasOpenRouter || hasOpenAI;
  }

  /**
   * Returns current active provider details and diagnostics
   */
  static getProviderStatus(): ProviderStatusInfo {
    const available: string[] = [];
    if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 10) available.push('Groq');
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10) available.push('Google Gemini');
    if (env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 10) available.push('OpenRouter');
    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 10) available.push('OpenAI Compatible');

    return {
      provider: this.activeProviderName,
      model: this.activeModelName,
      configured: this.isConfigured(),
      activeProvider: this.activeProviderName,
      availableProviders: available,
      lastError: this.lastDiagnosticError || undefined
    };
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
      'uncontrolled bleeding', 'severe head injury', 'severe burns',
      'anaphylaxis', 'choking', 'convulsion', 'active seizure'
    ];
    return emergencyTriggers.some(t => lower.includes(t));
  }

  /**
   * Calls Groq API (Super fast & free at https://console.groq.com/keys)
   */
  private static async callGroq(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const apiKey = env.GROQ_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) return null;

    const model = env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({
        role: h.role === 'model' ? 'assistant' : (h.role as 'user' | 'assistant'),
        content: this.sanitizeText(h.content)
      })),
      { role: 'user', content: this.sanitizeText(userMessage) }
    ];

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 900
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[HealthAI] Groq API returned status ${res.status}: ${errText}`);
        this.lastDiagnosticError = `Groq API HTTP ${res.status}: ${errText.substring(0, 100)}`;
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        this.activeProviderName = 'Groq Cloud';
        this.activeModelName = model;
        return content.trim();
      }
      return null;
    } catch (err: any) {
      console.warn('[HealthAI] Groq API invocation failed:', err.message);
      this.lastDiagnosticError = `Groq network error: ${err.message}`;
      return null;
    }
  }

  /**
   * Calls OpenRouter API (Supports free-tier models: https://openrouter.ai/keys)
   */
  private static async callOpenRouter(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) return null;

    const model = env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({
        role: h.role === 'model' ? 'assistant' : (h.role as 'user' | 'assistant'),
        content: this.sanitizeText(h.content)
      })),
      { role: 'user', content: this.sanitizeText(userMessage) }
    ];

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://mediquee.com',
          'X-Title': 'MediQuee Health AI'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 900
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[HealthAI] OpenRouter API status ${res.status}: ${errText}`);
        this.lastDiagnosticError = `OpenRouter HTTP ${res.status}: ${errText.substring(0, 100)}`;
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        this.activeProviderName = 'OpenRouter';
        this.activeModelName = model;
        return content.trim();
      }
      return null;
    } catch (err: any) {
      console.warn('[HealthAI] OpenRouter error:', err.message);
      this.lastDiagnosticError = `OpenRouter network error: ${err.message}`;
      return null;
    }
  }

  /**
   * Calls Google Gemini API with model cascading
   */
  private static async callGemini(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) return null;

    // Cascade of candidate Gemini models to try in Google Cloud
    const preferredModel = env.GEMINI_MODEL || 'gemini-3.8-flash';
    const candidateModels = Array.from(new Set([
      preferredModel,
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-3.1-flash-lite',
      'gemini-pro-latest'
    ]));

    const contentsPayload = [
      ...history.slice(-6).map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: this.sanitizeText(h.content) }]
      })),
      {
        role: 'user',
        parts: [{ text: this.sanitizeText(userMessage) }]
      }
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
          },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contentsPayload,
            generationConfig: {
              temperature: 0.3,
              topP: 0.8,
              maxOutputTokens: 900
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            this.activeProviderName = 'Google Gemini';
            this.activeModelName = model;
            return generatedText.trim();
          }
        } else {
          const errBody = await res.text();
          if (res.status === 403) {
            this.lastDiagnosticError = 'Google Cloud 403: Project denied access. Attach a Cloud Billing account at https://console.cloud.google.com/billing to activate Pay-As-You-Go.';
            console.warn(`[HealthAI] Gemini 403 for model ${model}: ${errBody}`);
            break;
          } else if (res.status === 429) {
            this.lastDiagnosticError = 'Google Cloud 429: Quota exceeded. Attach a Cloud Billing account at https://console.cloud.google.com/billing for unlimited Pay-As-You-Go usage.';
            console.warn(`[HealthAI] Gemini 429 quota exceeded for model ${model}`);
            break;
          } else {
            console.warn(`[HealthAI] Gemini ${model} returned status ${res.status}: ${errBody.substring(0, 100)}`);
          }
        }
      } catch (err: any) {
        console.warn(`[HealthAI] Gemini fetch error for model ${model}:`, err.message);
      }
    }

    return null;
  }

  /**
   * Calls custom OpenAI compatible endpoint
   */
  private static async callOpenAI(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string | null> {
    const apiKey = env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey.length < 10) return null;

    const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = env.OPENAI_MODEL || 'gpt-4o-mini';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(h => ({
        role: h.role === 'model' ? 'assistant' : (h.role as 'user' | 'assistant'),
        content: this.sanitizeText(h.content)
      })),
      { role: 'user', content: this.sanitizeText(userMessage) }
    ];

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 900
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[HealthAI] OpenAI API status ${res.status}: ${errText}`);
        this.lastDiagnosticError = `OpenAI API HTTP ${res.status}: ${errText.substring(0, 100)}`;
        return null;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        this.activeProviderName = 'OpenAI Compatible';
        this.activeModelName = model;
        return content.trim();
      }
      return null;
    } catch (err: any) {
      console.warn('[HealthAI] OpenAI API error:', err.message);
      return null;
    }
  }

  /**
   * Comprehensive Clinical Health Knowledge Engine
   * Provides verified medical literacy, lifestyle education, home care guidelines,
   * red flag detection, and hospital department routing in English & Telugu.
   */
  private static getEducationalFallback(
    prompt: string,
    language: 'en' | 'te'
  ): { answer: string; suggestedFollowUps: string[] } {
    const rawLower = prompt.toLowerCase().trim();
    const isTelugu = language === 'te' || /[\u0C00-\u0C7F]/.test(prompt);

    // 1. GREETINGS & INTRODUCTIONS
    if (
      /^(hi|hey|hello|namaste|vanakkam|good\s*(morning|afternoon|evening)|howdy|greetings|help|start)\b/i.test(rawLower) ||
      rawLower.includes('who are you') || rawLower.includes('what can you do') || rawLower.includes('what are you') ||
      rawLower.includes('హలో') || rawLower.includes('నమస్కారం') || rawLower.includes('హాయ్') || rawLower.includes('బాగున్నారా')
    ) {
      if (isTelugu) {
        return {
          answer: `**నమస్కారం! నేను మెడిక్యూ AI (MediQuee AI), మీ 24/7 ఆరోగ్య అవగాహన సహాయకుడిని.** 👋\n\nమీరు ఏ ఆరోగ్య సమస్య లేదా సమాచారం గురించి అడిగినా స్పష్టమైన మార్గదర్శకత్వం అందించగలను:\n\n- **లక్షణాల అవగాహన:** జ్వరం, దగ్గు, కడుపు నొప్పి, కాళ్ల వాపులు, తలనొప్పి, గ్యాస్ మొదలైన లక్షణాల కారణాలు & జాగ్రత్తలు.\n- **దీర్ఘకాలిక వ్యాధుల నిర్వహణ:** మధుమేహం (షుగర్), రక్తపోటు (బీపీ), కొలెస్ట్రాల్, థైరాయిడ్ నియంత్రణ పద్ధతులు.\n- **ఆరోగ్యకరమైన జీవనశైలి:** సమతుల్య పోషకాహారం, శరీర హైడ్రేషన్, మంచి నిద్ర మరియు వ్యాయామ చిట్కాలు.\n- **ల్యాబ్ పరీక్షలు & వైద్యుల ఎంపిక:** రక్త పరీక్షల విశ్లేషణ మరియు మెడిక్యూలో ఏ స్పెషలిస్ట్ వైద్యుడిని సంప్రదించాలో మార్గదర్శనం.\n\n*మీరు ఈరోజు ఏ ఆరోగ్య విషయం గురించి తెలుసుకోవాలనుకుంటున్నారు? మీ సందేహాన్ని ఇక్కడ రాయండి.*`,
          suggestedFollowUps: [
            'జ్వరం వచ్చినప్పుడు తీసుకోవాల్సిన జాగ్రత్తలు?',
            'గ్యాస్ మరియు ఎసిడిటీ నివారణ ఎలా?',
            'ఆరోగ్యకరమైన రక్తపోటు (బీపీ) స్థాయిలు ఎంత?'
          ]
        };
      }
      return {
        answer: `**Hello! I am MediQuee AI, your 24/7 personal healthcare & wellness education assistant.** 👋\n\nI can help you navigate everyday health questions with verified medical guidance:\n\n- **Understanding Symptoms:** Common causes, home care measures, and safety alerts for fever, cough, acidity, swelling, headache, or body pain.\n- **Chronic Condition Management:** Evidence-based lifestyle tips for Diabetes, Blood Pressure, Cholesterol, and Thyroid balance.\n- **Preventive Wellness:** Nutrition, hydration benchmarks, sleep hygiene, and daily fitness routines.\n- **Specialist & Lab Navigation:** Guidance on which OP department or diagnostic test fits your needs on MediQuee.\n\n*How are you feeling today, or what health topic would you like to explore?*`,
        suggestedFollowUps: [
          'What causes sudden leg or feet swelling?',
          'Tips to manage acidity and indigestion',
          'How do I book an OP appointment on MediQuee?'
        ]
      };
    }

    // 2. GRATITUDE / THANKS
    if (rawLower.includes('thank') || rawLower.includes('dhanyavad') || rawLower.includes('ధన్యవాదాలు')) {
      if (isTelugu) {
        return {
          answer: `**చాలా ధన్యవాదాలు!** 😊\n\nమీరు మరియు మీ కుటుంబ సభ్యులు ఎల్లప్పుడూ సంపూర్ణ ఆరోగ్యంతో ఉండాలని కోరుకుంటున్నాము.\n\nగుర్తుంచుకోండి: ఆరోగ్యకరమైన సమతుల్య ఆహారం, పుష్కలంగా నీరు తాగడం, మరియు కనీసం సంవత్సరానికి ఒకసారి పూర్తి శరీర పరీక్షలు చేయించుకోవడం ఉత్తమ రక్షణ.\n\nమీకు వైద్యుల అపాయింట్‌మెంట్ లేదా హోమ్ శాంపిల్ కలెక్షన్ ల్యాబ్ టెస్టులు అవసరమైనప్పుడు మెడిక్యూ మీకు ఎల్లప్పుడూ సహాయంగా ఉంటుంది!`,
          suggestedFollowUps: [
            'వార్షిక ఆరోగ్య పరీక్షల వివరాలు',
            'ఆరోగ్యకరమైన జీవనశైలి చిట్కాలు',
            'మెడిక్యూలో డాక్టర్ బుకింగ్ ఎలా చేయాలి?'
          ]
        };
      }
      return {
        answer: `**You're very welcome!** 😊\n\nWishing you and your family vibrant health. Remember that proactive preventive habits—balanced nutrition, staying well-hydrated, and periodic wellness checkups—are the best health investment.\n\nWhenever you need to consult a verified doctor or arrange home lab tests, MediQuee is right at your service. Let me know if you have any other questions!`,
        suggestedFollowUps: [
          'What tests are recommended in an annual checkup?',
          'Tips for daily energy and vitality',
          'How to book a specialist on MediQuee'
        ]
      };
    }

    // 3. SWELLING / EDEMA (FEET, ANKLES, LEGS, HANDS, FACE)
    if (
      rawLower.includes('swell') || rawLower.includes('edema') || rawLower.includes('puffy') ||
      rawLower.includes('swollen') || rawLower.includes('fluid retention') || rawLower.includes('వాపు') ||
      rawLower.includes('కాళ్ల వాపు') || rawLower.includes('పాదాల వాపు')
    ) {
      if (isTelugu) {
        return {
          answer: `**పాదాలు, కాళ్లు లేదా ముఖం వాపుల (Edema / Swelling) గురించి సమగ్ర సమాచారం:**\n\n- **సాధారణ కారణాలు:**\n  - **రక్తప్రసరణ మందగించడం:** ఎక్కువసేపు నిల్చోవడం లేదా కూర్చోవడం వల్ల కాళ్లలో ద్రవాలు పేరుకుపోతాయి (గ్రావిటీ ఎడిమా).\n  - **అధిక ఉప్పు (సోడియం):** ఆహారంలో ఉప్పు ఎక్కువైతే శరీరంలో నీరు నిల్వ ఉండిపోతుంది.\n  - **రక్తనాళాల సమస్యలు (వీనస్ ఇన్‌సఫిషియన్సీ):** కాళ్లలోని సిరల్లో రక్తం పైకి చేరడం నెమ్మదించడం.\n  - **అంతర్గత అవయవాల పనితీరు:** గుండె పంపింగ్ బలహీనపడటం, మూత్రపిండాల (కిడ్నీ) ఫిల్ట్రేషన్ లోపం లేదా కాలేయ (లివర్) సమస్యలు.\n  - **మందుల ప్రభావం:** బీపీ తగ్గించే కొన్ని మందులు (కాల్షియం ఛానల్ బ్లాకర్స్), పెయిన్ కిల్లర్స్ లేదా హార్మోన్ ట్యాబ్లెట్ల వల్ల కూడా వాపు రావచ్చు.\n\n- **సురక్షితమైన ఇంటి జాగ్రత్తలు & ఉపశమనం:**\n  - **కాళ్లను ఎత్తుగా ఉంచడం:** పడుకున్నప్పుడు కాళ్ల కింద 1-2 దిండ్లు ఉంచి గుండె స్థాయి కంటే కొద్దిగా ఎత్తుగా పెట్టండి.\n  - **ఉప్పు తగ్గించండి:** ప్రాసెస్ చేసిన ఆహారాలు, ఊరగాయలు మరియు అధిక ఉప్పును నివారించండి.\n  - **చిన్నపాటి కదలికలు:** ఎక్కువసేపు ఒకే చోట కూర్చోకుండా ప్రతి 45 నిమిషాలకు కాసేపు నడవండి.\n  - **సడలైన దుస్తులు:** కాళ్లను బిగుతుగా నొక్కే సాక్సులు లేదా బ్యాండ్లు వాడకండి.\n\n- **ముఖ్యమైన హెచ్చరికలు (ఎప్పుడు వెంటనే డాక్టర్‌ను సంప్రదించాలి):**\n  - ఒక్క కాలులోనే ఆకస్మిక వాపు, ఎరుపుదనం మరియు తీవ్ర నొప్పి ఉంటే (రక్తం గడ్డకట్టడం / DVT ప్రమాదం).\n  - వాపుతో పాటు శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా ఛాతీలో బరువుగా అనిపిస్తే (వెంటనే 108 లేదా ఎమర్జెన్సీ వార్డును సంప్రదించండి).\n\n- **సంప్రదించాల్సిన నిపుణులు:** మెడిక్యూలో **జనరల్ ఫిజిషియన్, కార్డియాలజిస్ట్ లేదా నెఫ్రాలజిస్ట్ (కిడ్నీ స్పెషలిస్ట్)** ను సంప్రదించి అవసరమైన రక్త/మూత్ర పరీక్షలు చేయించుకోవడం మంచిది.`,
          suggestedFollowUps: [
            'కాళ్ల వాపులకు ఏ రక్త పరీక్షలు చేయించుకోవాలి?',
            'డీప్ వీన్ థ్రాంబోసిస్ (DVT) సంకేతాలు ఏమిటి?',
            'జనరల్ ఫిజిషియన్ అపాయింట్‌మెంట్ బుక్ చేయండి'
          ]
        };
      }
      return {
        answer: `**Understanding Swelling & Fluid Retention (Peripheral Edema):**\n\n- **Common Physiological Causes:**\n  - **Prolonged Immobility:** Gravity causes dependent fluid accumulation in lower extremities during extended sitting or standing.\n  - **Excess Dietary Sodium:** High salt intake triggers vascular water retention.\n  - **Venous Insufficiency:** Sluggish return of blood from lower leg veins back up to the heart.\n  - **Systemic Organ Conditions:** Congestive heart failure, reduced kidney filtration, or liver disease leading to decreased albumin protein levels.\n  - **Medication Side Effects:** Antihypertensives (calcium channel blockers like amlodipine), corticosteroids, and NSAID pain relievers.\n\n- **Safe Supportive Home Care:**\n  - **Leg Elevation:** Elevate legs on pillows above heart level for 20-30 minutes, 2-3 times daily.\n  - **Reduce Sodium Intake:** Restrict pickles, processed snacks, and added table salt (aim for <2,000 mg/day).\n  - **Active Mobility:** Perform ankle pumps, heel-toe raises, and take short walking breaks every 45 minutes.\n  - **Avoid Restrictive Garments:** Steer clear of tight elastic bands around ankles or calves.\n\n- **Critical Red-Flag Warning Signs:**\n  - **Unilateral Swelling:** Sudden swelling restricted to one leg with warmth and calf tenderness (requires urgent ultrasound to rule out DVT blood clots).\n  - **Breathlessness:** Swelling accompanied by difficulty breathing when lying flat or chest heaviness requires immediate emergency care.\n\n- **Recommended Specialists on MediQuee:** Consult a **General Physician, Cardiologist, or Nephrologist** for baseline kidney/liver function panels and clinical evaluation.`,
        suggestedFollowUps: [
          'What lab tests evaluate leg swelling causes?',
          'What are early signs of Deep Vein Thrombosis (DVT)?',
          'Book a General Physician consultation on MediQuee'
        ]
      };
    }

    // 4. THROAT INFECTION, SORE THROAT, TONSILLITIS, PHARYNGITIS
    if (
      rawLower.includes('throat') || rawLower.includes('thorat') || rawLower.includes('thraot') ||
      rawLower.includes('troat') || rawLower.includes('tonsil') || rawLower.includes('pharyng') ||
      rawLower.includes('laryng') || rawLower.includes('sore throat') || rawLower.includes('గొంతు')
    ) {
      if (isTelugu) {
        return {
          answer: `**గొంతు ఇన్ఫెక్షన్ (Throat Infection / Tonsillitis) కారణాలు & సంరక్షణ:**\n\n- **సాధారణ కారణాలు:**\n  - **వైరల్ ఇన్ఫెక్షన్ (Viral Pharyngitis):** దాదాపు 85% గొంతు ఇన్ఫెక్షన్లు సాధారణ వైరస్‌ల వల్ల వస్తాయి. ఇవి 3 నుండి 5 రోజులలో క్రమంగా తగ్గుతాయి.\n  - **బాక్టీరియల్ ఇన్ఫెక్షన్ (Strep Throat / Tonsillitis):** స్ట్రెప్టోకోకస్ బాక్టీరియా వల్ల టాన్సిల్స్ వాపు, తీవ్రమైన నొప్పి మరియు తెల్లటి మచ్చలు ఏర్పడవచ్చు.\n  - **ఎసిడిటీ రిఫ్లక్స్ (GERD):** కడుపులోని యాసిడ్ రాత్రి వేళ గొంతులోకి రావడం వల్ల గొంతు మంట, గరగర వస్తాయి.\n\n- **ఇంటి జాగ్రత్తలు & ఉపశమనం:**\n  - **గోరువెచ్చని ఉప్పు నీటి పుక్కిలింత:** రోజుకు 3-4 సార్లు గోరువెచ్చని నీటిలో కొద్దిగా ఉప్పు వేసి పుక్కిలించండి (ఇది వాపు మరియు నొప్పిని తగ్గిస్తుంది).\n  - **గోరువెచ్చని ద్రవాలు:** అల్లం-తులసి టీ, తేనెతో కూడిన గోరువెచ్చని నీరు, లేదా సూప్‌లు గొంతుకు సాంత్వన చేకూరుస్తాయి.\n  - **ఆవిరి పట్టడం:** గొంతు మరియు శ్వాసనాళాల పొడిబారడాన్ని తగ్గిస్తుంది.\n  - **చల్లని ఆహారాలు నివారించండి:** ఫ్రిడ్జ్ నీరు, ఐస్‌క్రీమ్‌లు, మరియు అధిక కారం పదార్థాలు తీసుకోకండి.\n\n- **ముఖ్య గమనిక:** సొంతంగా యాంటీబయాటిక్స్ వాడకండి. వైద్యుడిని సంప్రదించిన తర్వాతే సరైన మందులు వాడాలి.\n- **వైద్యుడిని ఎప్పుడు కలవాలి:** ఆహారం లేదా లాలాజలం మింగలేకపోవడం, 101°F దాటిన జ్వరం, లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే మెడిక్యూలో **ఈఎన్‌టీ (ENT) స్పెషలిస్ట్ లేదా జనరల్ ఫిజిషియన్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'గొంతు నొప్పికి సహజ నివారణలు ఏమిటి?',
            'టాన్సిల్స్ వాపుకు ఏ జాగ్రత్తలు తీసుకోవాలి?',
            'ఈఎన్‌టీ (ENT) డాక్టర్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Throat Infections & Sore Throat (Clinical Education):**\n\n- **Common Underlying Causes:**\n  - **Viral Pharyngitis:** Over 85% of acute throat infections are viral (rhinovirus, adenovirus, or influenza) and resolve naturally within 3 to 7 days.\n  - **Bacterial Tonsillitis (Strep Throat):** Bacterial infection (Group A Streptococcus) causing significant pain, tonsillar enlargement, and white exudate patches.\n  - **Acid Reflux Irritation:** Stomach acid regurgitating into the pharynx causing morning throat scratchiness and throat clearing.\n\n- **Evidence-Based Home Care:**\n  - **Warm Saline Gargles:** Dissolve 1/2 teaspoon of salt in 200ml warm water; gargle for 30 seconds 3–4 times daily to reduce tissue inflammation.\n  - **Warm Demulcent Fluids:** Sip warm broths, ginger tea, or warm water with a teaspoon of honey to coat and soothe irritated nerve endings.\n  - **Airway Humidification:** Gentle steam inhalation twice daily eases airway dryness and loosens secretions.\n  - **Avoid Irritants:** Avoid iced/chilled beverages, smoking, and excessively spicy or acidic foods.\n\n- **Critical Medication Safety:** Avoid self-medicating with antibiotics. Viral throat infections do not respond to antibiotics and require supportive rest.\n- **When to Seek Immediate Medical Evaluation:** Inability to swallow fluids or saliva, breathing difficulty, severe one-sided swelling, or high fever over 101°F requires prompt examination by an **ENT Specialist (Otolaryngologist) or General Physician** on MediQuee.`,
        suggestedFollowUps: [
          'What is the difference between viral and bacterial throat infection?',
          'Safe home remedies for throat infection relief',
          'Book an ENT Specialist on MediQuee'
        ]
      };
    }

    // 5. COLD, COUGH, FLU, SINUS CONGESTION
    if (
      rawLower.includes('cough') || rawLower.includes('cold') || rawLower.includes('flu') ||
      rawLower.includes('sneez') || rawLower.includes('phlegm') || rawLower.includes('congestion') ||
      rawLower.includes('sinus') || rawLower.includes('runny nose') || rawLower.includes('దగ్గు') ||
      rawLower.includes('జలుబు') || rawLower.includes('ముక్కు')
    ) {
      if (isTelugu) {
        return {
          answer: `**దగ్గు, జలుబు మరియు శ్వాసకోశ సమస్యల గురించి సాధారణ అవగాహన:**\n\n- **కారణాలు:** 90% పైగా దగ్గు మరియు జలుబు వైరల్ ఇన్ఫెక్షన్ల వల్ల వస్తాయి. ఇవి సాధారణంగా 5 నుండి 7 రోజులలో సహజంగా తగ్గుతాయి.\n- **ఇంటి జాగ్రత్తలు & ఉపశమనం:**\n  - **గోరువెచ్చని ద్రవాలు:** గోరువెచ్చని నీరు, అల్లం-తులసి కషాయం, లేదా వేడి సూప్‌లు శ్లేష్మాన్ని పలుచగా చేస్తాయి.\n  - **ఆవిరి పట్టడం:** ముక్కు దిబ్బడ మరియు ఛాతీ బిగుతు తగ్గడానికి రోజుకు 1-2 సార్లు పసుపు లేదా తులసి ఆకులతో కూడిన ఆవిరి పట్టండి.\n- **ముఖ్య గమనిక:** వైరల్ జలుబులకు యాంటీబయాటిక్స్ పనిచేయవు; సొంతంగా మందులు వాడకూడదు.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:** దగ్గు 10-14 రోజుల కంటే ఎక్కువ ఉన్నా, రక్తంతో కూడిన కఫం వచ్చినా లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే మెడిక్యూలో **జనరల్ ఫిజిషియన్ లేదా పల్మనాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'దగ్గు ఎన్ని రోజుల్లో సాధారణంగా తగ్గుతుంది?',
            'జలుబు ఉన్నప్పుడు తీసుకోవాల్సిన ఆహారం ఏమిటి?',
            'జనరల్ ఫిజిషియన్ కన్సల్టేషన్ బుక్ చేయండి'
          ]
        };
      }
      return {
        answer: `**Understanding Cough, Cold & Respiratory Congestion (General Education):**\n\n- **Underlying Causes:** Most acute upper respiratory infections are viral and self-limiting over 5 to 7 days.\n- **Supportive Home Measures:**\n  - **Steam Inhalation:** Gentle steam helps moisten inflamed bronchial airways and clear nasal passages.\n  - **Fluid Intake:** Warm broths, herbal teas, and plenty of water thin respiratory secretions.\n  - **Rest:** Immune defense relies heavily on cellular energy conserved during quality sleep.\n- **Safety Note:** Viral illnesses do not respond to antibiotics. Avoid starting antibiotics without a physician prescription.\n- **When to Consult a Doctor:** If symptoms persist beyond 10 days, produce thick discolored phlegm, or cause shortness of breath, consult a **General Physician or Pulmonologist** on MediQuee.`,
        suggestedFollowUps: [
          'When does a persistent cough require a chest X-ray?',
          'What are safe home remedies for chest congestion?',
          'Consult a General Physician on MediQuee'
        ]
      };
    }

    // 5. FEVER & TEMPERATURE
    if (
      rawLower.includes('fever') || rawLower.includes('temperature') || rawLower.includes('chills') ||
      rawLower.includes('high temp') || rawLower.includes('జ్వరం') || rawLower.includes('చలిజ్వరం')
    ) {
      if (isTelugu) {
        return {
          answer: `**జ్వరం (Fever) కారణాలు మరియు తీసుకోవాల్సిన జాగ్రత్తలు:**\n\n- **జ్వరం అంటే ఏమిటి:** శరీర ఉష్ణోగ్రత 100.4°F (38°C) లేదా అంతకంటే ఎక్కువ పెరిగినప్పుడు దానిని జ్వరంగా పరిగణిస్తారు. ఇది వైరస్ లేదా బాక్టీరియాతో రోగనిరోధక వ్యవస్థ పోరాడుతున్నప్పుడు వచ్చే సహజ రక్షణ స్పందన.\n- **ఇంటి సంరక్షణ చిట్కాలు:**\n  - పుష్కలంగా ద్రవాలు తీసుకోండి: కొబ్బరి నీళ్ళు, ఓఆర్‌ఎస్ (ORS), గంజి లేదా సూప్‌లు తాగడం ద్వారా డీహైడ్రేషన్‌ను నివారించండి.\n  - నుదురు మరియు మెడపై గోరువెచ్చని తడి గుడ్డతో అద్దడం ద్వారా శరీర వేడిని తగ్గించవచ్చు (చల్లని మంచు నీరు వాడకండి).\n  - విశ్రాంతి తీసుకోండి మరియు తేలికపాటి కాటన్ దుస్తులు ధరించండి.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:**\n  - ఉష్ణోగ్రత 102°F దాటినా లేదా 3 రోజుల కంటే ఎక్కువ కాలం కొనసాగినా.\n  - విపరీతమైన తలనొప్పి, మెడ బిగుసుకుపోవడం, శరీరంపై దద్దుర్లు లేదా శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే వెంటనే మెడిక్యూలో **జనరల్ ఫిజిషియన్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'జ్వరం ఉన్నప్పుడు ఎలాంటి ఆహారం తీసుకోవాలి?',
            'డెంగ్యూ లేదా మలేరియా పరీక్షలు ఎప్పుడు చేయించాలి?',
            'జనరల్ ఫిజిషియన్ అపాయింట్‌మెంట్ బుక్ చేయండి'
          ]
        };
      }
      return {
        answer: `**Understanding Fever & Temperature Management (General Education):**\n\n- **Physiology:** A core temperature of 100.4°F (38.0°C) or higher is classified as fever. It represents the immune system generating a thermoregulatory defense against viral or bacterial pathogens.\n- **Supportive Care:**\n  - **Hydration is Critical:** Fever speeds up evaporative fluid loss. Consume electrolyte solutions, coconut water, and clear broths.\n  - **Lukewarm Sponging:** Use lukewarm (not cold) water washcloths on forehead and neck to safely dissipate excess body heat.\n  - **Restful Environment:** Rest in a well-ventilated room wearing light, breathable fabrics.\n- **When to Seek Immediate Medical Evaluation:**\n  - Core temperature exceeds 102°F (38.9°C) or does not remit after 72 hours.\n  - Presence of red flags: stiff neck, photophobia, confusion, petechial rash, or difficulty breathing.\n- **Consultation:** Book an evaluation with a **General Physician or Pediatrician** on MediQuee for complete blood count (CBC) or infectious screening.`,
        suggestedFollowUps: [
          'What fluids are best for recovery during fever?',
          'What are red-flag fever symptoms that require urgent care?',
          'Book an OP General Physician appointment on MediQuee'
        ]
      };
    }

    // 6. STOMACH PAIN, ACIDITY, GAS, GERD, INDIGESTION
    if (
      rawLower.includes('stomach') || rawLower.includes('acid') || rawLower.includes('gas') ||
      rawLower.includes('gastric') || rawLower.includes('indigestion') || rawLower.includes('bloat') ||
      rawLower.includes('heartburn') || rawLower.includes('gerd') || rawLower.includes('belly') ||
      rawLower.includes('కడుపు') || rawLower.includes('ఎసిడిటీ') || rawLower.includes('గ్యాస్') ||
      rawLower.includes('అజీర్ణం') || rawLower.includes('మంట')
    ) {
      if (isTelugu) {
        return {
          answer: `**కడుపు నొప్పి, ఎసిడిటీ & గ్యాస్ సమస్యల అవగాహన:**\n\n- **సాధారణ కారణాలు:** అధిక కారం, నూనె పదార్థాలు, టీ/కాఫీలు ఎక్కువగా తాగడం, సకాలంలో భోజనం చేయకపోవడం, లేదా తిన్న వెంటనే పడుకోవడం వల్ల యాసిడ్ రిఫ్లక్స్ మరియు గ్యాస్ ఏర్పడతాయి.\n- **ఆరోగ్యకరమైన అలవాట్లు:**\n  - ఒకేసారి ఎక్కువగా తినకుండా, తక్కువ పరిమాణంలో క్రమబద్ధమైన సమయాల్లో తినండి.\n  - భోజనం చేసిన తర్వాత కనీసం 2 గంటల వరకు పడుకోకండి.\n  - రోజూ 2.5 నుండి 3 లీటర్ల నీరు తాగండి (భోజనం మధ్యలో తాగడం కంటే భోజనానికి ముందు లేదా తర్వాత తాగడం మంచిది).\n  - పీచు పదార్థాలు (ఫైబర్) ఉన్న పండ్లు మరియు ఆకుకూరలు ఎక్కువగా చేర్చుకోండి.\n- **వైద్యుడిని ఎప్పుడు సంప్రదించాలి:** తీవ్రమైన కడుపు నొప్పి, నల్లటి మలం రావడం, లేదా మలంలో రక్తం కనిపిస్తే ఆలస్యం చేయకుండా మెడిక్యూలో **గ్యాస్ట్రోఎంటరాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'ఎసిడిటీని తగ్గించే ఆహార నియమాలు ఏమిటి?',
            'జీర్ణక్రియ మెరుగుపడటానికి ఏం చేయాలి?',
            'గ్యాస్ట్రోఎంటరాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Acidity, Gas & Digestive Discomfort (General Education):**\n\n- **Mechanisms:** Acid reflux (GERD) happens when gastric acid back-flows into the esophagus. Bloating and gas result from swallowed air or bacterial fermentation of slow-moving food.\n- **Common Triggers:** Deep-fried, heavily spiced meals, erratic meal timings, carbonated sodas, high caffeine, and lying supine immediately after dinner.\n- **Evidence-Based Digestive Habits:**\n  - **Portion Control:** Eat smaller, measured meals to avoid stomach overdistention.\n  - **Post-Meal Posture:** Stay upright or take a gentle 15-minute walk after eating; wait at least 2 hours before bedtime.\n  - **Hydration Routine:** Sip room-temperature water throughout the day; avoid chugging iced liquids during meals.\n- **When to See a Specialist:** Unexplained weight loss, difficulty swallowing (dysphagia), vomiting blood, or dark tarry stools warrant immediate evaluation by a **Gastroenterologist** on MediQuee.`,
        suggestedFollowUps: [
          'What foods naturally reduce gastric acidity?',
          'How does stress affect gut digestion?',
          'Consult a Gastroenterologist on MediQuee'
        ]
      };
    }

    // 7. DIABETES, BLOOD SUGAR, HbA1c
    if (
      rawLower.includes('diabetes') || rawLower.includes('sugar') || rawLower.includes('glucose') ||
      rawLower.includes('hba1c') || rawLower.includes('insulin') || rawLower.includes('hypoglycemia') ||
      rawLower.includes('మధుమేహం') || rawLower.includes('షుగర్') || rawLower.includes('గ్లూకోజ్')
    ) {
      if (isTelugu) {
        return {
          answer: `**మధుమేహం (డయాబెటిస్) & రక్తంలో చక్కెర స్థాయిల నిర్వహణ:**\n\n- **లక్ష్య స్థాయిలు (సాధారణ కొలతలు):**\n  - **ఖాళీ కడుపుతో (Fasting):** 70–99 mg/dL సాధారణం; 100–125 mg/dL ప్రీ-డయాబెటిస్; 126 mg/dL కంటే ఎక్కువ ఉంటే మధుమేహం.\n  - **భోజనం తర్వాత (Post Prandial):** 140 mg/dL కంటే తక్కువగా ఉండటం మంచిది.\n  - **HbA1c (గత 3 నెలల సగటు):** 5.7% కంటే తక్కువ సాధారణం; 6.5% దాటితే మధుమేహం.\n- **జీవనశైలి మార్పులు:**\n  - తృణధాన్యాలు (మిల్లెట్స్, రాగులు, జొన్నలు), తాజా కూరగాయలు, నట్స్ ఆహారంలో చేర్చండి.\n  - స్వీట్లు, శీతల పానీయాలు, తెల్ల బియ్యం, మైదా పదార్థాలను పరిమితం చేయండి.\n  - వారానికి కనీసం 150 నిమిషాలు వేగంగా నడవడం ఇన్సులిన్ సున్నితత్వాన్ని మెరుగుపరుస్తుంది.\n- **వైద్య సంప్రదింపు:** మధుమేహం అదుపులో లేకపోతే కంటి చూపు, కిడ్నీలు మరియు గుండెపై ప్రభావం పడుతుంది. సరైన చికిత్స ప్రణాళిక కోసం మెడిక్యూలో **ఎండోక్రినాలజిస్ట్ లేదా డయాబెటాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'HbA1c పరీక్షను ఎంత కాలానికి ఒకసారి చేయించుకోవాలి?',
            'రక్తంలో చక్కెర అకస్మాత్తుగా పడిపోతే (హైపోగ్లైసీమియా) ఏం చేయాలి?',
            'ఎండోక్రినాలజిస్ట్ కన్సల్టేషన్ బుక్ చేయండి'
          ]
        };
      }
      return {
        answer: `**Understanding Diabetes & Glycemic Control (General Education):**\n\n- **Diagnostic Benchmarks:**\n  - **Fasting Glucose:** 70–99 mg/dL (Normal); 100–125 mg/dL (Prediabetes); ≥126 mg/dL (Diabetes).\n  - **Post-Prandial (2-Hour):** <140 mg/dL (Normal); 140–199 mg/dL (Prediabetes); ≥200 mg/dL (Diabetes).\n  - **HbA1c (3-Month Mean):** <5.7% (Normal); 5.7–6.4% (Prediabetes); ≥6.5% (Diabetes).\n- **Nutritional & Fitness Interventions:**\n  - **Complex Carbohydrates:** Emphasize high-fiber millets, legumes, greens, and lean proteins to flatten glucose spikes.\n  - **Eliminate Added Sugars:** Avoid fruit juices, sodas, and ultra-processed refined snacks.\n  - **Physical Conditioning:** 150 minutes of weekly aerobic exercise enhances peripheral muscle insulin sensitivity.\n- **Specialist Care:** Regular screening protects vision (retinopathy), kidneys (nephropathy), and nerves. Book an appointment with an **Endocrinologist or Diabetologist** on MediQuee.`,
        suggestedFollowUps: [
          'What are subtle signs of hypoglycemia (low blood sugar)?',
          'How does dietary fiber lower post-meal glucose spikes?',
          'Consult an Endocrinologist on MediQuee'
        ]
      };
    }

    // 8. BLOOD PRESSURE, HYPERTENSION
    if (
      rawLower.includes('blood pressure') || rawLower.includes('bp') || rawLower.includes('hypertension') ||
      rawLower.includes('hypotension') || rawLower.includes('రక్తపోటు') || rawLower.includes('బీపీ')
    ) {
      if (isTelugu) {
        return {
          answer: `**రక్తపోటు (Blood Pressure) సాధారణ మార్గదర్శకాలు & రక్షణ:**\n\n- **ఆరోగ్యకరమైన స్థాయిలు:** విశ్రాంతి సమయంలో బీపీ 120/80 mmHg గా ఉండటం అత్యుత్తమం. నిరంతరం 130/80 mmHg కంటే ఎక్కువ ఉంటే దానిని హైపర్టెన్షన్ అంటారు.\n- **నియంత్రణకు ముఖ్యమైన సూత్రాలు:**\n  - **ఉప్పు తగ్గించండి:** రోజుకు 5 గ్రాముల (ఒక చిన్న చెంచా) కంటే తక్కువ ఉప్పు మాత్రమే వాడండి. ఊరగాయలు, నిల్వ ఉంచిన పదార్థాలు నివారించండి.\n  - **DASH ఆహార నియమాలు:** అరటిపండ్లు, పాలకూర, బాదం వంటి పొటాషియం అధికంగా ఉండే ఆహారాలు బీపీని నియంత్రించడంలో సహాయపడతాయి.\n  - **ఒత్తిడి నివారణ & నడక:** ప్రతిరోజూ 30 నిమిషాల వ్యాయామం మరియు లోతైన శ్వాస పద్ధతులు (ప్రాణాయామం) రక్తనాళాలను విశ్రాంతపరుస్తాయి.\n- **వైద్య సలహా:** అధిక బీపీ ఏ విధమైన లక్షణాలు లేకుండా నిశ్శబ్దంగా గుండె మరియు కిడ్నీలపై భారం మోపుతుంది. నిరంతర పర్యవేక్షణ కోసం మెడిక్యూలో **కార్డియాలజిస్ట్ లేదా జనరల్ ఫిజిషియన్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'బీపీని తగ్గించే సహజ మార్గాలు ఏమిటి?',
            'ఉప్పు తీసుకోవడం బీపీని ఎలా ప్రభావితం చేస్తుంది?',
            'కార్డియాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Blood Pressure & Hypertension (General Education):**\n\n- **Target Categories:**\n  - **Optimal BP:** Under 120/80 mmHg at rest.\n  - **Elevated BP:** Systolic 120–129 mmHg and diastolic <80 mmHg.\n  - **Hypertension (Stage 1):** Systolic 130–139 mmHg or diastolic 80–89 mmHg.\n- **Why It Matters:** Chronic hypertension is a silent vascular condition that damages the arterial endothelium, increasing long-term heart and kidney workload without noticeable symptoms.\n- **Heart-Healthy Lifestyle Measures:**\n  - **Sodium Restriction:** Limit salt to under 2,000 mg of sodium daily; avoid preserved foods and chips.\n  - **Potassium & Magnesium Intake:** Include leafy greens, bananas, lentils, and nuts to balance vascular tone.\n  - **Aerobic Movement:** Daily brisk walking for 30 minutes lowers systemic arterial stiffness.\n- **Medical Check:** Have your blood pressure checked regularly and consult a **Cardiologist or General Physician** on MediQuee for personalized care.`,
        suggestedFollowUps: [
          'What is the DASH diet for blood pressure control?',
          'What lifestyle factors elevate diastolic blood pressure?',
          'Book a Cardiologist consultation on MediQuee'
        ]
      };
    }

    // 9. HEADACHE, MIGRAINE, DIZZINESS
    if (
      rawLower.includes('headache') || rawLower.includes('migraine') || rawLower.includes('head pain') ||
      rawLower.includes('dizziness') || rawLower.includes('vertigo') || rawLower.includes('తలనెప్పి') ||
      rawLower.includes('తలనొప్పి') || rawLower.includes('తలతిరగడం')
    ) {
      if (isTelugu) {
        return {
          answer: `**తలనొప్పి మరియు మైగ్రేన్ కారణాలు & ఉపశమనం:**\n\n- **సాధారణ రకాలు:**\n  - **టెన్షన్ తలనొప్పి:** కంప్యూటర్/మొబైల్ స్క్రీన్లు ఎక్కువసేపు చూడటం, నిద్రలేమి, లేదా ఒత్తిడి వల్ల తల చుట్టూ బిగుతుగా అనిపించడం.\n  - **మైగ్రేన్:** తలలో ఒకవైపు మాత్రమే తీవ్రమైన నొప్పితో పాటు వెలుతురు, శబ్దాలకు ఇబ్బందిగా అనిపించడం లేదా వికారం కలగడం.\n- **ఇంటి సంరక్షణ:**\n  - వెంటనే ఒక పెద్ద గ్లాసు నీరు తాగండి (డీహైడ్రేషన్ తలనొప్పికి అత్యంత సాధారణ కారణం).\n  - చీకటిగా, ప్రశాంతంగా ఉన్న గదిలో 20-30 నిమిషాలు విశ్రాంతి తీసుకోండి.\n  - స్క్రీన్లు చూసేటప్పుడు 20-20-20 సూత్రాన్ని పాటించండి (ప్రతి 20 నిమిషాలకు 20 అడుగుల దూరంలోని వస్తువును 20 సెకన్ల పాటు చూడటం).\n- **తీవ్ర హెచ్చరిక:** తలనొప్పి ఆకస్మికంగా మరియు అత్యంత తీవ్రంగా వస్తే (థండర్‌క్లాప్ హెడేక్) లేదా చూపు మసకబారడం, మాట్లాడటంలో తేడా వస్తే వెంటనే ఎమర్జెన్సీ వార్డును లేదా మెడిక్యూలో **న్యూరాలజిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'మైగ్రేన్ లక్షణాలు ఎలా ఉంటాయి?',
            'స్క్రీన్ టైమ్ తలనొప్పి నివారణ చిట్కాలు',
            'న్యూరాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Headaches & Migraines (General Education):**\n\n- **Primary Classes:**\n  - **Tension Headaches:** Bilateral pressure across forehead or occipital neck muscles, sparked by stress, posture, or screen fatigue.\n  - **Migraines:** Unilateral throbbing, episodic headache frequently accompanied by nausea, aura, photophobia, or phonophobia.\n- **Immediate Supportive Steps:**\n  - **Rapid Hydration:** Dehydration is a very common trigger; drink 500ml of room-temperature water.\n  - **Sensory Rest:** Rest quietly in a dark, cool room with a cold compress placed over the forehead.\n  - **Ocular Ergonomics:** Observe the 20-20-20 rule during computer and smartphone usage.\n- **Emergency Red Flags:** Sudden 'worst headache of life' (thunderclap), numbness, slurred speech, or weakness requires immediate emergency room evaluation.\n- **Specialist Care:** Consult a **Neurologist or General Physician** on MediQuee for chronic recurrent headache management.`,
        suggestedFollowUps: [
          'What are the most common migraine dietary triggers?',
          'When does a headache require brain imaging (MRI/CT)?',
          'Consult a Neurologist on MediQuee'
        ]
      };
    }

    // 10. JOINTS, BACK PAIN, KNEE PAIN, ARTHRITIS
    if (
      rawLower.includes('joint') || rawLower.includes('knee') || rawLower.includes('back pain') ||
      rawLower.includes('spine') || rawLower.includes('arthritis') || rawLower.includes('bone') ||
      rawLower.includes('neck pain') || rawLower.includes('shoulder') || rawLower.includes('నడుము') ||
      rawLower.includes('కీళ్ల') || rawLower.includes('మోకాళ్ళ') || rawLower.includes('ఎముక')
    ) {
      if (isTelugu) {
        return {
          answer: `**కీళ్ల నొప్పులు, మోకాళ్ల నొప్పులు & నడుము నొప్పి నిర్వహణ:**\n\n- **కారణాలు:** ఎక్కువసేపు తప్పు భంగిమలో కూర్చోవడం, విటమిన్ డి3 మరియు కాల్షియం లోపం, శరీర బరువు పెరగడం, లేదా వయస్సుతో పాటు కీళ్ల గుజ్జు (కార్టిలేజ్) అరిగిపోవడం.\n- **ఉపశమన పద్ధతులు:**\n  - **సరైన భంగిమ:** కంప్యూటర్ వద్ద కూర్చున్నప్పుడు వెన్నుముకను నిటారుగా ఉంచి, పాదాలు నేలకు ఆనేలా కూర్చోండి.\n  - **కదలికలు:** ప్రతి 45 నిమిషాలకు లేచి చిన్న స్ట్రెచింగ్ వ్యాయామాలు చేయండి.\n  - **వేడి / చల్లని కాపడం:** వాపు ఉన్నప్పుడు ఐస్ ప్యాక్, బిగుతుగా ఉన్నప్పుడు గోరువెచ్చని కాపడం పెట్టండి.\n  - **ఎముకల పోషణ:** పాలు, పెరుగు, ఆకుకూరలు, బాదం, నువ్వులు ఆహారంలో చేర్చండి; ఎండలో రోజూ 15 నిమిషాలు గడపడం మంచిది.\n- **వైద్య సలహా:** నడుము నొప్పి కాళ్ల వరకు పాకుతున్నా (సయాటికా) లేదా మోకాళ్ల వాపు తగ్గకపోతే మెడిక్యూలో **ఆర్థోపెడిక్ సర్జన్ లేదా ఫిజియోథెరపిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'ఎముకల బలానికి ఎలాంటి ఆహారం మంచిది?',
            'విటమిన్ డి లోపం వల్ల వచ్చే సమస్యలు ఏమిటి?',
            'ఆర్థోపెడిక్ డాక్టర్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Joint, Knee & Back Pain (General Education):**\n\n- **Contributing Factors:** Poor desk ergonomics, core muscular deconditioning, excessive joint load, or age-associated degenerative cartilage thinning (osteoarthritis).\n- **Self-Care & Ergonomics:**\n  - **Ergonomic Alignment:** Ensure lower back lumbar support, knees at 90-degree angles, and monitor at horizontal eye level.\n  - **Thermal Therapy:** Apply ice packs for acute sprains/swelling; use warm heating pads for chronic muscle tightness.\n  - **Active Breaks:** Change postures every 45 minutes; perform gentle hamstring and hip flexor stretches.\n  - **Nutritional Support:** Ensure adequate calcium intake and verify serum 25-hydroxy Vitamin D3 levels.\n- **When to Seek Evaluation:** Inability to bear weight, locking joints, or radiating numbness into legs (sciatica) calls for consultation with an **Orthopedic Specialist or Physiotherapist** on MediQuee.`,
        suggestedFollowUps: [
          'What daily exercises protect knees and spine?',
          'What lab tests evaluate bone mineral density?',
          'Consult an Orthopedic Specialist on MediQuee'
        ]
      };
    }

    // 11. SKIN, RASH, ALLERGIES, ACNE
    if (
      rawLower.includes('skin') || rawLower.includes('rash') || rawLower.includes('acne') ||
      rawLower.includes('pimple') || rawLower.includes('allergy') || rawLower.includes('itch') ||
      rawLower.includes('eczema') || rawLower.includes('fungal') || rawLower.includes('దురద') ||
      rawLower.includes('దద్దుర్లు') || rawLower.includes('చర్మం')
    ) {
      if (isTelugu) {
        return {
          answer: `**చర్మ దద్దుర్లు, దురద & మొటిమల సంరక్షణ:**\n\n- **కారణాలు:** వాతావరణ తేమ, సబ్బులు/రసాయనాల అలెర్జీలు, చెమట వల్ల ఫంగల్ ఇన్ఫెక్షన్లు, లేదా హార్మోన్ల సమతుల్యత లోపించడం వల్ల చర్మ సమస్యలు వస్తాయి.\n- **తీసుకోవాల్సిన జాగ్రత్తలు:**\n  - గోకవద్దు: దురద ఉన్న చోట గోకడం వల్ల ఇన్ఫెక్షన్ ఇతర భాగాలకు వ్యాపిస్తుంది.\n  - గాఢమైన సువాసనలు గల సబ్బులను నివారించి, సున్నితమైన క్లెన్సర్లు వాడండి.\n  - వదులుగా ఉండే కాటన్ దుస్తులు ధరించి, చర్మాన్ని పొడిగా ఉంచుకోండి.\n  - స్నానం చేసిన వెంటనే తేమను కాపాడే మాయిశ్చరైజర్‌ను వాడండి.\n- **వైద్య సలహా:** దద్దుర్లు వేగంగా వ్యాపిస్తున్నా లేదా చీము పడుతున్నా మెడిక్యూలో **డెర్మటాలజిస్ట్ (చర్మ నిపుణుడు)** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'చర్మాన్ని ఆరోగ్యంగా ఉంచుకోవడానికి చిట్కాలు',
            'అలెర్జీ దద్దుర్లను ఎలా గుర్తించాలి?',
            'డెర్మటాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Skin Rashes, Allergies & Acne (General Education):**\n\n- **Common Drivers:** Contact allergens, fungal overgrowth in moist skin folds, eczema barrier impairment, or sebum overproduction in acne.\n- **Skin Barrier Protection:**\n  - **Do Not Scratch:** Scratching breaks the stratum corneum and introduces secondary bacterial pathogens.\n  - **Gentle Cleansing:** Use fragrance-free, soap-free cleansers with lukewarm water.\n  - **Barrier Hydration:** Apply ceramide-based moisturizers immediately following a bath while skin is damp.\n  - **Breathable Fabrics:** Wear loose-fitting, breathable cotton clothing.\n- **When to See a Specialist:** Blistering, rapidly spreading hives, facial swelling, or yellow crusted lesions require evaluation by a **Dermatologist** on MediQuee.`,
        suggestedFollowUps: [
          'What ingredients are safest for sensitive skin?',
          'How to differentiate fungal infection from allergic eczema?',
          'Book a Dermatologist consultation on MediQuee'
        ]
      };
    }

    // 12. KIDNEY, URINARY TRACT (UTI), BURNING
    if (
      rawLower.includes('urine') || rawLower.includes('uti') || rawLower.includes('burning urination') ||
      rawLower.includes('kidney') || rawLower.includes('stone') || rawLower.includes('మూత్రం') ||
      rawLower.includes('కిడ్నీ')
    ) {
      if (isTelugu) {
        return {
          answer: `**మూత్ర నాళాల ఇన్ఫెక్షన్ (UTI) & కిడ్నీ ఆరోగ్యం:**\n\n- **సాధారణ సంకేతాలు:** మూత్ర విసర్జన సమయంలో మంట, తరచుగా మూత్రం రావడం, లేదా మూత్రం రంగు మారడం.\n- **తీసుకోవాల్సిన జాగ్రత్తలు:**\n  - రోజుకు కనీసం 3 నుండి 3.5 లీటర్ల నీరు తాగడం ద్వారా బ్యాక్టీరియా మూత్ర నాళాల నుండి బయటకు వెళ్లిపోతుంది.\n  - మూత్ర విసర్జనను ఎక్కువసేపు ఆపుకోవద్దు.\n  - వ్యక్తిగత పరిశుభ్రతను పాటించండి.\n- **వైద్య సలహా:** నడుము వెనుక భాగంలో తీవ్రమైన నొప్పి (కిడ్నీ స్టోన్ సంకేతం) లేదా మూత్రంలో రక్తం కనిపిస్తే ఆలస్యం చేయకుండా మెడిక్యూలో **యూరాలజిస్ట్ లేదా నెఫ్రాలజిస్ట్** ను సంప్రదించి కంప్లీట్ యూరిన్ టెస్ట్ (CUE) చేయించుకోండి.`,
          suggestedFollowUps: [
            'యూరినరీ ఇన్ఫెక్షన్ రాకుండా తీసుకోవాల్సిన జాగ్రత్తలు?',
            'కిడ్నీ స్టోన్ సంకేతాలు ఎలా ఉంటాయి?',
            'యూరాలజిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Urinary Tract Health & Kidney Wellness (General Education):**\n\n- **Common Symptoms:** Burning sensation during urination (dysuria), increased frequency, cloudy urine, or lower pelvic pressure.\n- **Supportive Preventive Care:**\n  - **High Fluid Volume:** Drink 3 to 3.5 liters of clean water daily to naturally flush urinary pathways.\n  - **Avoid Holding Urine:** Empty the bladder regularly without delay.\n  - **Personal Hygiene:** Maintain proper hygiene and avoid irritating scented feminine washes.\n- **Red Flags:** Severe flank/lower back pain, fever with chills, or visible hematuria (blood in urine) warrant urgent evaluation by a **Urologist or Nephrologist** on MediQuee.`,
        suggestedFollowUps: [
          'What tests identify a urinary tract infection?',
          'How can kidney stones be prevented through diet?',
          'Book a Urologist consultation on MediQuee'
        ]
      };
    }

    // 13. STRESS, ANXIETY, SLEEP, MENTAL HEALTH
    if (
      rawLower.includes('stress') || rawLower.includes('sleep') || rawLower.includes('insomnia') ||
      rawLower.includes('anxiety') || rawLower.includes('depression') || rawLower.includes('tension') ||
      rawLower.includes('mental') || rawLower.includes('నిద్ర') || rawLower.includes('ఒత్తిడి')
    ) {
      if (isTelugu) {
        return {
          answer: `**ఒత్తిడి నియంత్రణ & మంచి నిద్ర (Mental Wellness) మార్గదర్శకాలు:**\n\n- **ఒత్తిడి ప్రభావం:** నిరంతర మానసిక ఒత్తిడి వల్ల శరీరంలో కార్టిసాల్ హార్మోన్ పెరిగి జీర్ణక్రియ, రక్తపోటు మరియు గుండె పనితీరుపై ప్రభావం చూపుతుంది.\n- **గాఢ నిద్ర కోసం సూత్రాలు (7–8 గంటలు):**\n  - రోజూ ఒకే సమయానికి పడుకోవడం మరియు నిద్రలేవడం అలవాటు చేసుకోండి.\n  - పడుకోవడానికి ఒక గంట ముందే మొబైల్ ఫోన్లు, టీవీలు ఆపివేయండి (బ్లూ లైట్ నిద్ర హార్మోన్‌ను అడ్డుకుంటుంది).\n  - పడుకునే ముందు 5-10 నిమిషాలు నెమ్మదిగా శ్వాస తీసుకోవడం (4-7-8 ప్రాణాయామం) లేదా ధ్యానం చేయండి.\n- **వైద్య సలహా:** నిరంతర ఆందోళన, నిరాశ లేదా నిద్రలేమి మీ రోజువారీ జీవితాన్ని ప్రభావితం చేస్తుంటే మెడిక్యూలో **సైకియాట్రిస్ట్ లేదా క్లినికల్ కౌన్సిలర్** ను సంప్రదించడం ధైర్యమైన, ఆరోగ్యకరమైన అడుగు.`,
          suggestedFollowUps: [
            'ఒత్తిడిని తగ్గించే శ్వాస వ్యాయామాలు ఏమిటి?',
            'నిద్ర నాణ్యతను పెంచే పద్ధతులు ఏమిటి?',
            'కౌన్సిలర్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Stress Management & Restful Sleep (General Education):**\n\n- **Mind-Body Physiology:** Chronic psychological stress stimulates cortisol, elevating blood pressure and impairing metabolic homeostasis.\n- **Sleep Hygiene Framework (7–8 Hours Daily):**\n  - **Circadian Consistency:** Maintain fixed bedtimes and wake times throughout the week.\n  - **Digital Wind-Down:** Avoid digital screens for 60 minutes before bed; blue wavelengths disrupt melatonin synthesis.\n  - **Relaxation Protocol:** Practice 4-7-8 diaphragmatic breathing or light reading before sleep.\n- **Professional Support:** If feelings of anxiety, persistent low mood, or severe sleep disruption interfere with your daily life, consulting a **Psychiatrist or Counselor** on MediQuee is a proactive, positive step.`,
        suggestedFollowUps: [
          'What is the 4-7-8 breathing relaxation technique?',
          'How does chronic lack of sleep impact metabolic health?',
          'Consult a Mental Health Specialist on MediQuee'
        ]
      };
    }

    // 14. NUTRITION, DIET, WEIGHT LOSS
    if (
      rawLower.includes('diet') || rawLower.includes('nutrition') || rawLower.includes('weight') ||
      rawLower.includes('obesity') || rawLower.includes('lose weight') || rawLower.includes('food') ||
      rawLower.includes('calorie') || rawLower.includes('protein') || rawLower.includes('fiber') ||
      rawLower.includes('ఆహారం') || rawLower.includes('బరువు')
    ) {
      if (isTelugu) {
        return {
          answer: `**సమతుల్య ఆహారం & ఆరోగ్యకరమైన బరువు నిర్వహణ:**\n\n- **సమతుల్య ప్లేట్ విధానం:**\n  - సగం ప్లేట్: తాజా కూరగాయలు, ఆకుకూరలు (విటమిన్లు మరియు ఫైబర్ కోసం).\n  - పావు భాగం: పప్పుధాన్యాలు, గుడ్లు, పనీర్ లేదా మొలకెత్తిన గింజలు (ప్రోటీన్ కోసం).\n  - పావు భాగం: చిరుధాన్యాలు (మిల్లెట్స్), గోధుమలు, బ్రౌన్ రైస్ (సంక్లిష్ట పిండి పదార్థాలు).\n- **ఆరోగ్యకరమైన నియమాలు:** వేగంగా బరువు తగ్గించే క్రాష్ డైట్‌ల కంటే రోజూ సరైన ఆహారం మరియు 30 నిమిషాల వ్యాయామం స్థిరమైన ఫలితాలనిస్తాయి.\n- **నిపుణుల సలహా:** మీ శరీర తత్వానికి తగిన వ్యక్తిగత డైట్ చార్ట్ కోసం మెడిక్యూలో **క్లినికల్ న్యూట్రిషనిస్ట్** ను సంప్రదించండి.`,
          suggestedFollowUps: [
            'రోజువారీ ప్రోటీన్ అవసరాలు ఎంత?',
            'బరువు తగ్గడానికి ఉత్తమ జీవనశైలి చిట్కాలు',
            'న్యూట్రిషనిస్ట్‌ను సంప్రదించండి'
          ]
        };
      }
      return {
        answer: `**Understanding Balanced Nutrition & Weight Management (General Education):**\n\n- **The Healthy Plate Blueprint:**\n  - **1/2 Plate:** Colorful seasonal vegetables and greens (fiber, minerals, micronutrients).\n  - **1/4 Plate:** Quality lean protein (lentils, paneer, eggs, sprouts, fish, tofu) for muscle preservation.\n  - **1/4 Plate:** Unrefined complex grains (millets, oats, whole wheat) for sustained energy.\n- **Sustainable Habits:** Steer clear of severe crash diets that degrade resting metabolic rate. Emphasize mindful portion sizes and consistent daily movement.\n- **Professional Guidance:** For an individualized meal regimen tailored to your health profile, consult a **Clinical Dietitian or Nutritionist** on MediQuee.`,
        suggestedFollowUps: [
          'How much daily protein does an adult require?',
          'What are high-fiber foods for gut health?',
          'Book a Dietitian consultation on MediQuee'
        ]
      };
    }

    // 15. LAB TESTS & HEALTH CHECKUPS
    if (
      rawLower.includes('lab') || rawLower.includes('test') || rawLower.includes('blood test') ||
      rawLower.includes('checkup') || rawLower.includes('package') || rawLower.includes('cbc') ||
      rawLower.includes('రక్త పరీక్ష') || rawLower.includes('ల్యాబ్')
    ) {
      if (isTelugu) {
        return {
          answer: `**నివారణ ఆరోగ్య పరీక్షలు & ల్యాబ్ టెస్టుల ప్రాముఖ్యత:**\n\n- **ఎందుకు ముఖ్యం:** కొలెస్ట్రాల్, ప్రీ-డయాబెటిస్, థైరాయిడ్ సమస్యలు ప్రారంభంలో ఎటువంటి లక్షణాలు చూపించవు. వార్షిక రక్త పరీక్షల ద్వారా వీటిని ముందుగానే గుర్తించవచ్చు.\n- **ముఖ్యమైన ప్రాథమిక పరీక్షలు:**\n  - **CBC (కంప్లీట్ బ్లడ్ కౌంట్):** హిమోగ్లోబిన్ మరియు ఇన్ఫెక్షన్ స్థాయిలను తెలుపుతుంది.\n  - **Fasting Sugar & HbA1c:** రక్తంలో చక్కెర నియంత్రణను తనిఖీ చేస్తుంది.\n  - **లిపిడ్ ప్రొఫైల్:** గుండె ఆరోగ్యానికి కొలెస్ట్రాల్ స్థాయిలు.\n  - **కిడ్నీ & లివర్ ఫంక్షన్ పరీక్షలు (KFT / LFT).**\n- **మెడిక్యూ సేవలు:** మీరు మెడిక్యూ ద్వారా సర్టిఫైడ్ **హోమ్ శాంపిల్ కలెక్షన్** ల్యాబ్ పరీక్షలను ఇంట్లోనే సులభంగా బుక్ చేసుకోవచ్చు!`,
          suggestedFollowUps: [
            'వార్షిక ఆరోగ్య పరీక్షలలో ఏ టెస్టులు ఉంటాయి?',
            'హోమ్ శాంపిల్ కలెక్షన్ ఎలా బుక్ చేయాలి?',
            'CBC రక్త పరీక్ష దేనిని సూచిస్తుంది?'
          ]
        };
      }
      return {
        answer: `**Preventive Health Checkups & Diagnostic Tests (General Education):**\n\n- **Value of Early Screening:** Many metabolic issues (early dyslipidemia, impaired fasting glucose, fatty liver) progress silently without symptoms.\n- **Essential Routine Panels:**\n  - **Complete Blood Count (CBC):** Measures hemoglobin, platelets, and white blood cell immunity markers.\n  - **Glycemic Panel (Fasting Glucose + HbA1c):** Evaluates short and long-term sugar trends.\n  - **Lipid Profile:** Measures heart health via LDL, HDL, and triglycerides.\n  - **Liver & Kidney Panels (LFT / KFT):** Monitors organ filtration and metabolic clearance.\n- **MediQuee Services:** You can easily schedule verified **Home Sample Collection** packages directly through MediQuee!`,
        suggestedFollowUps: [
          'What tests should be included in an annual health checkup?',
          'How to book Home Sample Collection on MediQuee',
          'What do elevated triglycerides mean?'
        ]
      };
    }

    // 16. DOCTOR CONSULTATION & OP NAVIGATION
    if (
      rawLower.includes('book') || rawLower.includes('doctor') || rawLower.includes('appointment') ||
      rawLower.includes('consult') || rawLower.includes('specialist') || rawLower.includes('op') ||
      rawLower.includes('hospital') || rawLower.includes('డాక్టర్') || rawLower.includes('ఆసుపత్రి')
    ) {
      if (isTelugu) {
        return {
          answer: `**మెడిక్యూలో సరైన డాక్టర్‌ను ఎలా ఎంచుకోవాలి:**\n\n- **జనరల్ మెడిసిన్ (General Physician):** జ్వరం, జలుబు, తలనొప్పి, అలసట మరియు సాధారణ అనారోగ్యం.\n- **కార్డియాలజీ (Cardiology):** ఛాతీలో అసౌకర్యం, గుండె దడ, రక్తపోటు (బీపీ) సమస్యలు.\n- **ఆర్థోపెడిక్స్ (Orthopedics):** ఎముకలు, కీళ్ళు, మోకాళ్ళు మరియు నడుము నొప్పులు.\n- **పీడియాట్రిక్స్ (Pediatrics):** పిల్లల అనారోగ్యం, టీకాలు మరియు ఎదుగుదల.\n- **డెర్మటాలజీ (Dermatology):** చర్మ దద్దుర్లు, దురద, మొటిమలు, జుట్టు సమస్యలు.\n- **గ్యాస్ట్రోఎంటరాలజీ (Gastroenterology):** కడుపు నొప్పి, ఎసిడిటీ, కాలేయ సమస్యలు.\n\n*మెడిక్యూ యాప్ ద్వారా మీరు నేరుగా హాస్పిటల్ ఓపీ అపాయింట్‌మెంట్‌లు లేదా ఆన్‌లైన్ వీడియో కన్సల్టేషన్లు బుక్ చేసుకోవచ్చు!*`,
          suggestedFollowUps: [
            'ఓపీ మరియు వీడియో కన్సల్టేషన్ మధ్య తేడా ఏమిటి?',
            'మెడిక్యూలో ఓపీ అపాయింట్‌మెంట్ బుక్ చేయండి',
            'నా లక్షణాలకు ఏ డాక్టర్‌ను సంప్రదించాలి?'
          ]
        };
      }
      return {
        answer: `**Navigating Hospital Departments & Choosing a Doctor on MediQuee:**\n\n- **General Medicine:** Ideal first evaluation for fever, cough, fatigue, or general body unwellness.\n- **Cardiology:** For heart wellness, chest heaviness, palpitations, and hypertension management.\n- **Orthopedics:** For joint inflammation, back/neck pain, sprains, and fractures.\n- **Pediatrics:** Specialized healthcare and vaccinations for infants, children, and teens.\n- **Dermatology:** For skin rashes, eczema, hives, acne, and scalp conditions.\n- **Gastroenterology:** For stomach pain, acid reflux, chronic constipation, and liver concerns.\n\n*You can book verified hospital Outpatient (OP) visits or online Video Consultations directly inside MediQuee!*`,
        suggestedFollowUps: [
          'How do I choose between OP and Video Consultation?',
          'Book an OP Appointment on MediQuee',
          'Find verified doctors near me'
        ]
      };
    }

    // 17. INTELLIGENT CLINICAL ANALYZER (FOR ALL OTHER QUERIES)
    // Extract clinical symptom concepts and anatomy from query
    let detectedAnatomy = 'General Health';
    let recommendedDept = 'General Physician';
    let suggestedSpecialistEn = 'General Physician';
    let suggestedSpecialistTe = 'జనరల్ ఫిజిషియన్';

    if (rawLower.includes('chest') || rawLower.includes('heart') || rawLower.includes('pulse')) {
      detectedAnatomy = 'Cardiovascular System';
      recommendedDept = 'Cardiology';
      suggestedSpecialistEn = 'Cardiologist';
      suggestedSpecialistTe = 'కార్డియాలజిస్ట్';
    } else if (rawLower.includes('breath') || rawLower.includes('lung') || rawLower.includes('asthma') || rawLower.includes('wheez')) {
      detectedAnatomy = 'Respiratory System';
      recommendedDept = 'Pulmonology';
      suggestedSpecialistEn = 'Pulmonologist';
      suggestedSpecialistTe = 'పల్మనాలజిస్ట్';
    } else if (rawLower.includes('head') || rawLower.includes('nerve') || rawLower.includes('brain') || rawLower.includes('seizure')) {
      detectedAnatomy = 'Neurological System';
      recommendedDept = 'Neurology';
      suggestedSpecialistEn = 'Neurologist';
      suggestedSpecialistTe = 'న్యూరాలజిస్ట్';
    } else if (rawLower.includes('bone') || rawLower.includes('joint') || rawLower.includes('leg') || rawLower.includes('arm') || rawLower.includes('spine')) {
      detectedAnatomy = 'Musculoskeletal System';
      recommendedDept = 'Orthopedics';
      suggestedSpecialistEn = 'Orthopedic Specialist';
      suggestedSpecialistTe = 'ఆర్థోపెడిక్ సర్జన్';
    } else if (rawLower.includes('stomach') || rawLower.includes('liver') || rawLower.includes('bowel') || rawLower.includes('stool')) {
      detectedAnatomy = 'Gastrointestinal System';
      recommendedDept = 'Gastroenterology';
      suggestedSpecialistEn = 'Gastroenterologist';
      suggestedSpecialistTe = 'గ్యాస్ట్రోఎంటరాలజిస్ట్';
    } else if (rawLower.includes('skin') || rawLower.includes('hair') || rawLower.includes('nail')) {
      detectedAnatomy = 'Dermatological System';
      recommendedDept = 'Dermatology';
      suggestedSpecialistEn = 'Dermatologist';
      suggestedSpecialistTe = 'డెర్మటాలజిస్ట్';
    } else if (rawLower.includes('eye') || rawLower.includes('vision')) {
      detectedAnatomy = 'Visual & Ophthalmic System';
      recommendedDept = 'Ophthalmology';
      suggestedSpecialistEn = 'Ophthalmologist';
      suggestedSpecialistTe = 'కంటి వైద్యుడు';
    } else if (rawLower.includes('ear') || rawLower.includes('nose') || rawLower.includes('throat') || rawLower.includes('thorat') || rawLower.includes('tonsil') || rawLower.includes('sore throat')) {
      detectedAnatomy = 'ENT (Ear, Nose & Throat)';
      recommendedDept = 'ENT';
      suggestedSpecialistEn = 'ENT Specialist';
      suggestedSpecialistTe = 'ఈఎన్‌టీ నిపుణుడు';
    } else if (rawLower.includes('child') || rawLower.includes('baby') || rawLower.includes('infant')) {
      detectedAnatomy = 'Pediatric Health';
      recommendedDept = 'Pediatrics';
      suggestedSpecialistEn = 'Pediatrician';
      suggestedSpecialistTe = 'పీడియాట్రీషియన్';
    } else if (rawLower.includes('period') || rawLower.includes('pregnan') || rawLower.includes('pcos')) {
      detectedAnatomy = "Women's Health & Gynecology";
      recommendedDept = 'Gynecology';
      suggestedSpecialistEn = 'Gynecologist';
      suggestedSpecialistTe = 'గైనకాలజిస్ట్';
    }

    if (isTelugu) {
      return {
        answer: `**ఆరోగ్య అవగాహన & మార్గదర్శకత్వం:**\n\nమీరు అడిగిన ఆరోగ్య అంశంపై సాధారణ వైద్య అవగాహన మరియు జాగ్రత్తలు:\n\n- **పరిశీలించవలసిన అంశాలు:** ఏదైనా శారీరక అసౌకర్యం లేదా లక్షణం కనిపించినప్పుడు అది శరీరం ఇచ్చే ఒక సహజ హెచ్చరిక. తగినంత విశ్రాంతి, శరీరానికి తగినంత నీరు అందించడం మరియు ఒత్తిడి లేని వాతావరణం రోగనిరోధక శక్తికి చాలా ముఖ్యం.\n- **సురక్షితమైన జీవనశైలి నియమాలు:** సమతుల్య పోషకాహారం తీసుకోవడం, శరీర పరిశుభ్రత పాటించడం మరియు అనవసరమైన మందులు సొంతంగా వేసుకోకుండా ఉండటం ఉత్తమ నివారణ చర్యలు.\n- **ముఖ్య గమనిక:** లక్షణాలు నిరంతరం కొనసాగుతున్నా లేదా తీవ్రమవుతున్నా ఆలస్యం చేయకుండా వైద్యుడిని సంప్రదించాలి.\n- **సంప్రదించవలసిన విభాగం:** ఈ ఆరోగ్య విషయానికి మెడిక్యూలో **${suggestedSpecialistTe} లేదా జనరల్ ఫిజిషియన్** ను సంప్రదించి అవసరమైన క్లినికల్ పరీక్షలు చేయించుకోవడం మంచిది.`,
        suggestedFollowUps: [
          `${suggestedSpecialistTe} అపాయింట్‌మెంట్ బుక్ చేయండి`,
          'ఈ సమస్యకు తీసుకోవాల్సిన జీవనశైలి జాగ్రత్తలు ఏమిటి?',
          'మెడిక్యూలో సమీప వైద్యులను చూడండి'
        ]
      };
    }

    return {
      answer: `**Health Literacy & Educational Guidance (${detectedAnatomy}):**\n\nHere is medical literacy guidance regarding your inquiry:\n\n- **Underlying Principles:** Any physical symptom is your body's communication signal. Adequate cellular hydration, balanced nutrition, restful sleep, and temporary reduction of physical strain provide the optimal baseline for immune recovery.\n- **Safe Supportive Practices:** Monitor your symptoms carefully, avoid unprescribed over-the-counter medications, and note down the exact duration, frequency, and severity of what you feel.\n- **When to Seek Evaluation:** If symptoms persist for more than 48–72 hours, interfere with daily activity, or steadily escalate in intensity, a licensed medical evaluation is necessary.\n- **Recommended Department on MediQuee:** We suggest booking a consultation with a **${suggestedSpecialistEn}** (or General Physician) via Outpatient (OP) Hospital Booking or online Video Consultation for dedicated clinical diagnosis and targeted care.`,
      suggestedFollowUps: [
        `Book a consultation with a ${suggestedSpecialistEn}`,
        'What preventive lifestyle measures can help?',
        'Find verified doctors near me on MediQuee'
      ]
    };
  }

  /**
   * Main function to handle health education questions with provider waterfall
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

    const systemInstruction = `You are the MediQuee AI Health Education Assistant, a compassionate, accurate, and professional medical literacy companion.
YOUR PURPOSE is to provide verified healthcare education, explain medical concepts in lay terms, guide users on healthy lifestyle practices, and direct them to appropriate hospital specialists on MediQuee.

CRITICAL HEALTHCARE SAFETY COMPLIANCE:
1. You are NOT a doctor and do NOT diagnose diseases.
2. NEVER prescribe medications, calculate pharmaceutical dosages, or tell users to stop prescribed treatments.
3. If red flag symptoms appear, emphasize seeking emergency hospital care immediately.
4. Support English and Telugu. If the user writes in Telugu or requested language is 'te', respond in clear, polite Telugu with English medical terms in parentheses where helpful.
5. Format answers clearly with bullet points and bold headings so they are easy to read on mobile devices.
6. Conclude by suggesting which MediQuee OP department or doctor specialist to consult if symptoms persist.`;

    // 1. Google Gemini / Google Cloud (Primary Provider)
    // 2. Groq (if configured)
    // 3. OpenRouter (if configured)
    // 4. OpenAI (if configured)
    // 5. High-quality Clinical Knowledge Engine (offline / fallback)

    let generatedText: string | null = null;

    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 10) {
      generatedText = await this.callGemini(systemInstruction, history, prompt);
    }

    if (!generatedText && env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 10) {
      generatedText = await this.callGroq(systemInstruction, history, prompt);
    }

    if (!generatedText && env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.trim().length > 10) {
      generatedText = await this.callOpenRouter(systemInstruction, history, prompt);
    }

    if (!generatedText && env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 10) {
      generatedText = await this.callOpenAI(systemInstruction, history, prompt);
    }

    if (generatedText) {
      return {
        answer: `${emergencyWarning}${generatedText.trim()}`,
        language: resolvedLang,
        providerConfigured: true,
        provider: this.activeProviderName,
        model: this.activeModelName,
        disclaimer: standardDisclaimer,
        isEmergencyAlert: isEmergency,
        suggestedFollowUps: [
          resolvedLang === 'te' ? 'ఈ సమస్యకు ఏ ఓపీ విభాగాన్ని సంప్రదించాలి?' : 'Which OP Department handles this concern?',
          resolvedLang === 'te' ? 'వైద్యుడిని సంప్రదించే ముందు ఏ వివరాలు సిద్ధం చేసుకోవాలి?' : 'What questions should I ask my doctor?',
          resolvedLang === 'te' ? 'నివారణ కోసం తీసుకోవాల్సిన జీవనశైలి మార్పులు ఏమిటి?' : 'What preventive lifestyle habits can help?'
        ]
      };
    }

    // High quality clinical knowledge engine fallback
    const fallback = this.getEducationalFallback(prompt, resolvedLang);
    return {
      answer: `${emergencyWarning}${fallback.answer}`,
      language: resolvedLang,
      providerConfigured: this.isConfigured(),
      provider: 'Clinical Knowledge Engine',
      model: 'mediquee-clinical-v2',
      disclaimer: standardDisclaimer,
      isEmergencyAlert: isEmergency,
      suggestedFollowUps: fallback.suggestedFollowUps,
      diagnostics: this.lastDiagnosticError || undefined
    };
  }
}
