const config = {
    HARDCODED_DOMAIN: "simplynaturalhome.com.au",
    API_URL: process.env.STRAPI_API_URL || 'http://139.84.197.191:1337/api/articles?pagination[pageSize]=100&filters[Domain][$eq]=simplynaturalhome.com.au',
    API_TOKEN: process.env.STRAPI_API_TOKEN || '64ccc8b987d378833c66684e4b3be46beb9fd151290ef861e8bc5e57209fa82eb47168de1c4a04cda7b97f9cf0776c34f9a990e0f613e218e20f534ae8829fee00ae6acec6230e0a8cb507cbdf8a9d2239a6c2c6584d485e44e24821f5947ac368888de5df904c292ae7adb8ed380bb10c6b27ddd6db0d3e2930a24333224f4a',
    STRAPI_MENU_API: process.env.STRAPI_MENU_API || 'http://139.84.197.191:1337/api/menu2s',
    UNSPLASH_ACCESS_KEY: 'vzF962E8esPr6AEg3eKD8aaEykwkTZllyvGz250xN6s'
};

export default config;
