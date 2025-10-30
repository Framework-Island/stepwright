import { runScraper, TabTemplate } from '../src/index';

async function basicExample() {
  const templates: TabTemplate[] = [
    {
      tab: 'example',
      steps: [
                 {
           id: 'navigate',
           action: 'navigate',
           value: 'http://example.com/'
         },
         {
           id: 'wait_for_page',
           action: 'scroll',
           value: '100',
           wait: 2000
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
          id: "reload",
          action: 'reload',
          value: 'load',
          wait: 2000
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
    }
  ];

  try {
         console.log('🚀 Starting scraper...');
     const results = await runScraper(templates, {
       browser: {
         headless: false,
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
     // if you want headful browser.
     // const results = await runScraper(templates, {
     //   browser: {
     //     headless: false
     //   }
     // });
    console.log('✅ Scraping completed!');
    console.log('📊 Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
basicExample();
