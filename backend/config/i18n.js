// Internationalization Configuration for AthleteAI
// Multi-language support with region-specific content and formatting

const i18nConfig = {
  // Supported Languages
  supportedLanguages: {
    en: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      direction: 'ltr',
      default: true
    },
    es: {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      direction: 'ltr'
    },
    fr: {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      direction: 'ltr'
    },
    de: {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      direction: 'ltr'
    },
    it: {
      code: 'it',
      name: 'Italian',
      nativeName: 'Italiano',
      flag: '🇮🇹',
      direction: 'ltr'
    },
    pt: {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇵🇹',
      direction: 'ltr'
    },
    zh: {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      direction: 'ltr'
    },
    ja: {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      direction: 'ltr'
    },
    ko: {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
      direction: 'ltr'
    },
    ar: {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      direction: 'rtl'
    }
  },

  // Regional Settings
  regions: {
    'us-east': { name: 'US East', timezone: 'America/New_York', currency: 'USD', locale: 'en-US' },
    'us-west': { name: 'US West', timezone: 'America/Los_Angeles', currency: 'USD', locale: 'en-US' },
    'eu-west': { name: 'Europe West', timezone: 'Europe/London', currency: 'EUR', locale: 'en-GB' },
    'eu-central': { name: 'Europe Central', timezone: 'Europe/Berlin', currency: 'EUR', locale: 'de-DE' },
    'asia-east': { name: 'Asia East', timezone: 'Asia/Tokyo', currency: 'JPY', locale: 'ja-JP' },
    'asia-south': { name: 'Asia South', timezone: 'Asia/Kolkata', currency: 'INR', locale: 'hi-IN' },
    'americas-south': { name: 'South America', timezone: 'America/Sao_Paulo', currency: 'BRL', locale: 'pt-BR' },
    'oceania': { name: 'Oceania', timezone: 'Australia/Sydney', currency: 'AUD', locale: 'en-AU' }
  },

  // Content Categories for Translation
  contentCategories: {
    ui: 'User Interface',
    coaching: 'AI Coaching',
    performance: 'Performance Analytics',
    social: 'Social Features',
    gamification: 'Achievements & Rewards',
    commerce: 'E-commerce',
    legal: 'Legal & Compliance'
  },

  // Translation File Structure
  translationStructure: {
    common: {
      loading: '',
      error: '',
      success: '',
      cancel: '',
      confirm: '',
      save: '',
      delete: '',
      edit: '',
      view: '',
      search: '',
      filter: ''
    },
    navigation: {
      dashboard: '',
      profile: '',
      training: '',
      analytics: '',
      community: '',
      store: '',
      settings: ''
    },
    coaching: {
      askQuestion: '',
      getAdvice: '',
      watchVideo: '',
      startDrill: '',
      trackProgress: ''
    }
  },

  // Date/Time Formatting
  dateTimeFormats: {
    short: { date: 'MM/dd/yyyy', time: 'HH:mm' },
    medium: { date: 'MMM dd, yyyy', time: 'HH:mm:ss' },
    long: { date: 'MMMM dd, yyyy', time: 'HH:mm:ss zzz' }
  },

  // Number Formatting
  numberFormats: {
    decimal: { minimumFractionDigits: 0, maximumFractionDigits: 2 },
    currency: { style: 'currency', minimumFractionDigits: 2 },
    percent: { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 1 }
  },

  // Measurement Units (with conversions)
  units: {
    weight: {
      metric: 'kg',
      imperial: 'lbs',
      conversion: (kg) => kg * 2.20462
    },
    height: {
      metric: 'cm',
      imperial: 'inches',
      conversion: (cm) => cm / 2.54
    },
    distance: {
      metric: 'km',
      imperial: 'miles',
      conversion: (km) => km * 0.621371
    },
    speed: {
      metric: 'km/h',
      imperial: 'mph',
      conversion: (kmh) => kmh * 0.621371
    }
  },

  // Sports-specific terminology
  sportsTerms: {
    football: {
      positions: {
        quarterback: '',
        runningback: '',
        widereceiver: '',
        tightend: '',
        offensiveline: '',
        linebacker: '',
        defensiveback: '',
        kicker: ''
      },
      plays: {
        pass: '',
        run: '',
        kick: '',
        punt: '',
        fieldgoal: ''
      }
    }
  },

  // Compliance and Legal
  compliance: {
    gdpr: {
      consentRequired: true,
      dataRetention: '2 years',
      dataProcessing: 'EU-based servers'
    },
    ccpa: {
      optOutAvailable: true,
      dataSales: false,
      dataSharing: 'minimal'
    },
    pipeda: {
      consentRequired: true,
      dataRetention: '2 years',
      crossBorderTransfer: 'allowed'
    }
  }
};

module.exports = i18nConfig;