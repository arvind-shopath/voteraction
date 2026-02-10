import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Voteraction | उन्नत चुनाव प्रबंधन',
        short_name: 'Voteraction',
        description: 'MLA उम्मीदवार के लिए चुनावी प्रबंधन प्रणाली',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#2563EB',
        icons: [
            {
                src: '/logo.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
    };
}
