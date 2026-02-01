const BASE_PARTY_CONFIG = {
    'भाजपा (BJP)': { color: '#FF9933', logo: '/logos/bjp.png', nameEn: 'BJP' },
    'सपा (SP)': { color: '#FF0000', logo: '/logos/sp.png', nameEn: 'SP' },
    'बसपा (BSP)': { color: '#0000FF', logo: '/logos/bsp.avif', nameEn: 'BSP' },
    'कांग्रेस (INC)': { color: '#00FF00', logo: '/logos/inc.png', nameEn: 'INC' },
    'रालोद (RLD)': { color: '#006400', logo: '/logos/rld.png', nameEn: 'RLD' },
    'आप (AAP)': { color: '#00ADEF', logo: '/logos/aap.png', nameEn: 'AAP' },
    'सुभासपा (SBSP)': { color: '#FFFF00', logo: '/logos/sbsp.png', nameEn: 'SBSP' },
    'निर्दलीय (IND)': { color: '#666666', logo: '/logos/ind.png', nameEn: 'IND' },
    'अन्य (Others)': { color: '#94A3B8', logo: '/logos/other.png', nameEn: 'Others' }
};

export const PARTY_CONFIG: Record<string, { color: string; logo: string; nameEn: string }> = {
    ...BASE_PARTY_CONFIG,
    // Add short name aliases for better mapping from historical data
    'भाजपा': BASE_PARTY_CONFIG['भाजपा (BJP)'],
    'सपा': BASE_PARTY_CONFIG['सपा (SP)'],
    'बसपा': BASE_PARTY_CONFIG['बसपा (BSP)'],
    'कांग्रेस': BASE_PARTY_CONFIG['कांग्रेस (INC)'],
    'रालोद': BASE_PARTY_CONFIG['रालोद (RLD)'],
    'आप': BASE_PARTY_CONFIG['आप (AAP)'],
    'सुभासपा': BASE_PARTY_CONFIG['सुभासपा (SBSP)'],
    'निर्दलीय': BASE_PARTY_CONFIG['निर्दलीय (IND)'],
    'अन्य': BASE_PARTY_CONFIG['अन्य (Others)']
};

export const PARTIES = Object.keys(BASE_PARTY_CONFIG);
