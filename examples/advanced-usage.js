const { runScraper, runScraperWithCallback } = require('../dist/index');

async function advancedExample() {
    const templates = [{
        tab: 'news_scraper',
        initSteps: [{
                id: 'navigate_to_news',
                action: 'navigate',
                value: 'https://news.ycombinator.com'
            },
            {
                id: 'wait_for_page',
                action: 'scroll',
                value: '100',
                wait: 3000
            }
        ],
        perPageSteps: [{
            id: 'get_articles',
            action: 'foreach',
            object_type: 'xpath',
            object: '//tr[contains(@class, "athing")]',
            subSteps: [{
                    id: 'get_title',
                    action: 'data',
                    object_type: 'class',
                    object: 'titleline',
                    key: 'title',
                    data_type: 'text'
                },
                {
                    id: 'get_link',
                    action: 'data',
                    object_type: 'xpath',
                    object: './/span[@class="titleline"]/a',
                    key: 'link',
                    data_type: 'value'
                },
                {
                    id: 'get_score',
                    action: 'data',
                    object_type: 'xpath',
                    object: 'following-sibling::tr[1]//span[@class="score"]',
                    key: 'score',
                    data_type: 'text'
                },
                {
                    id: 'get_author',
                    action: 'data',
                    object_type: 'xpath',
                    object: 'following-sibling::tr[1]//a[@class="hnuser"]',
                    key: 'author',
                    data_type: 'text'
                },
                {
                    id: 'get_comments',
                    action: 'data',
                    object_type: 'xpath',
                    object: 'following-sibling::tr[1]//a[contains(text(), "comment")]',
                    key: 'comments',
                    data_type: 'text'
                }
            ]
        }],
        pagination: {
            strategy: 'next',
            nextButton: {
                object_type: 'class',
                object: 'morelink',
                wait: 2000
            },
            maxPages: 3
        }
    }];

    try {
        console.log('🚀 Starting advanced scraper...');

        // Option 1: Get all results at once
        const results = await runScraper(templates, {
            browser: {
                headless: true,
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
        console.log(`📊 Found ${results.length} articles`);
        console.log(JSON.stringify(results, null, 2));

        // Option 2: Stream results as they come (uncomment to use)
        /*
        await runScraperWithCallback(templates, (result, index) => {
          console.log(`📰 Article ${index + 1}:`, result.title);
        });
        */

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the example
advancedExample();