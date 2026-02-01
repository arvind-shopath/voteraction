// Available Features in VoterAction App
export const APP_FEATURES = {
    VOTER_MANAGEMENT: {
        key: 'voter_management',
        name: 'मतदाता प्रबंधन (Voter Management)',
        description: 'मतदाताओं की सूची देखना, खोजना, और अपडेट करना',
        icon: '👥',
        category: 'core'
    },
    BOOTH_MANAGEMENT: {
        key: 'booth_management',
        name: 'बूथ प्रबंधन (Booth Management)',
        description: 'बूथ-वार डेटा, विश्लेषण और प्रबंधन',
        icon: '🏢',
        category: 'core'
    },
    WORKER_MANAGEMENT: {
        key: 'worker_management',
        name: 'कार्यकर्ता प्रबंधन (Worker Management)',
        description: 'कार्यकर्ताओं को जोड़ना, प्रबंधित करना और ट्रैक करना',
        icon: '👷',
        category: 'core'
    },
    PANNA_PRAMUKH: {
        key: 'panna_pramukh',
        name: 'पन्ना प्रमुख सिस्टम (Panna Pramukh)',
        description: 'पन्ना प्रमुख व्यवस्था और मतदाता असाइनमेंट',
        icon: '📊',
        category: 'advanced'
    },
    TASK_MANAGEMENT: {
        key: 'task_management',
        name: 'कार्य प्रबंधन (Task Management)',
        description: 'कार्यकर्ताओं को कार्य सौंपना और ट्रैक करना',
        icon: '✅',
        category: 'core'
    },
    ISSUE_TRACKING: {
        key: 'issue_tracking',
        name: 'समस्या ट्रैकिंग (Issue Tracking)',
        description: 'क्षेत्र की समस्याओं की रिपोर्टिंग और निगरानी',
        icon: '⚠️',
        category: 'core'
    },
    SOCIAL_MEDIA: {
        key: 'social_media',
        name: 'सोशल मीडिया टीम (Social Media)',
        description: 'सोशल मीडिया कंटेंट और टीम प्रबंधन',
        icon: '📱',
        category: 'marketing'
    },
    JAN_SAMPARK: {
        key: 'jan_sampark',
        name: 'जनसंपर्क (Jan Sampark)',
        description: 'जनसंपर्क रूट्स, विज़िट्स और रिपोर्टिंग',
        icon: '🚶',
        category: 'fieldwork'
    },
    PUBLIC_RELATIONS: {
        key: 'public_relations',
        name: 'जनसंपर्क गतिविधियाँ (Public Relations)',
        description: 'सार्वजनिक कार्यक्रम और गतिविधियों का रिकॉर्ड',
        icon: '🤝',
        category: 'fieldwork'
    },
    ELECTION_HISTORY: {
        key: 'election_history',
        name: 'चुनावी इतिहास (Election History)',
        description: 'पिछले चुनावों का डेटा और विश्लेषण',
        icon: '📈',
        category: 'analytics'
    },
    VOTER_IMPORT: {
        key: 'voter_import',
        name: 'मतदाता आयात (CSV Import)',
        description: 'CSV/Excel फाइलों से मतदाता डेटा आयात करना',
        icon: '📥',
        category: 'tools'
    },
    CAMPAIGN_MANAGEMENT: {
        key: 'campaign_management',
        name: 'अभियान प्रबंधन (Campaign Management)',
        description: 'अभियान बनाना और प्रबंधित करना',
        icon: '🎯',
        category: 'marketing'
    },
    ANALYTICS_DASHBOARD: {
        key: 'analytics_dashboard',
        name: 'एनालिटिक्स डैशबोर्ड (Analytics)',
        description: 'विस्तृत रिपोर्ट्स और डेटा विश्लेषण',
        icon: '📊',
        category: 'analytics'
    }
};

// Default features for new candidates (all enabled by default)
export const DEFAULT_ENABLED_FEATURES = Object.keys(APP_FEATURES).map(
    key => (APP_FEATURES as any)[key].key
);

// Feature categories for grouping
export const FEATURE_CATEGORIES = {
    core: 'मुख्य सुविधाएँ (Core Features)',
    advanced: 'उन्नत सुविधाएँ (Advanced)',
    marketing: 'मार्केटिंग (Marketing)',
    fieldwork: 'फील्ड वर्क (Field Work)',
    analytics: 'विश्लेषण (Analytics)',
    tools: 'उपकरण (Tools)'
};

// Helper function to check if a feature is enabled for an assembly
export function isFeatureEnabled(assembly: any, featureKey: string): boolean {
    if (!assembly.enabledFeatures) return true; // If not set, all features enabled
    try {
        const features = JSON.parse(assembly.enabledFeatures);
        return features.includes(featureKey);
    } catch {
        return true; // If parsing fails, assume all enabled
    }
}

// Helper to get enabled features list
export function getEnabledFeatures(assembly: any): string[] {
    if (!assembly.enabledFeatures) return DEFAULT_ENABLED_FEATURES;
    try {
        return JSON.parse(assembly.enabledFeatures);
    } catch {
        return DEFAULT_ENABLED_FEATURES;
    }
}
