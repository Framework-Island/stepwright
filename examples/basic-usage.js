const { runScraper } = require('../dist/index');

async function basicExample() {
    const templates = [{
        tab: 'example',
        steps: [{
                id: 'navigate',
                action: 'navigate',
                value: 'http://example.com'
            },
            {
                id: 'wait_for_page',
                action: 'wait',
                value: '2000'
            },
            {
                id: 'get_title',
                action: 'data',
                object_type: 'tag',
                object: 'h1',
                key: 'title',
                data_type: 'text'
            },
            {
                id: 'wait_after_title',
                action: 'wait',
                wait: 1000
            },
            {
                id: 'get_description',
                action: 'data',
                object_type: 'xpath',
                object: '/html/body/div/p[1]',
                key: 'description',
                data_type: 'text'
            }
        ]
    }];

    try {
        console.log('🚀 Starting scraper...');
        const results = await runScraper(templates, {
            browser: {
                headless: true,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });
        console.log('✅ Scraping completed!');
        console.log('📊 Results:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the example
basicExample();