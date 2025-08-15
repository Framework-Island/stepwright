# StepWright

A powerful web scraping library built with Playwright that provides a declarative, step-by-step approach to web automation and data extraction.

## Features

- 🚀 **Declarative Scraping**: Define scraping workflows using JSON templates
- 🔄 **Pagination Support**: Built-in support for next button and scroll-based pagination
- 📊 **Data Collection**: Extract text, HTML, values, and files from web pages
- 🔗 **Multi-tab Support**: Handle multiple tabs and complex navigation flows
- 📄 **PDF Generation**: Save pages as PDFs or trigger print-to-PDF actions
- 📥 **File Downloads**: Download files with automatic directory creation
- 🔁 **Looping & Iteration**: ForEach loops for processing multiple elements
- 📡 **Streaming Results**: Real-time result processing with callbacks
- 🎯 **Error Handling**: Graceful error handling with configurable termination
- 🔧 **Flexible Selectors**: Support for ID, class, tag, and XPath selectors

## Installation

```bash
# Using pnpm (recommended)
pnpm add stepwright

# Using npm
npm install stepwright

# Using yarn
yarn add stepwright
```

## Quick Start

### Basic Usage

```typescript
import { runScraper } from 'stepwright';

const templates = [
  {
    tab: 'example',
    steps: [
      {
        id: 'navigate',
        action: 'navigate',
        value: 'https://example.com'
      },
      {
        id: 'get_title',
        action: 'data',
        object_type: 'tag',
        object: 'h1',
        key: 'title',
        data_type: 'text'
      }
    ]
  }
];

const results = await runScraper(templates);
console.log(results);
```

## Examples

### Basic Examples

The repository includes basic examples demonstrating core functionality:

- **Basic Usage (TypeScript)**: `examples/basic-usage.ts` - Simple navigation and data extraction
- **Basic Usage (JavaScript)**: `examples/basic-usage.js` - Same example in JavaScript

Run the examples:
```bash
# Run all examples
./examples/run-examples.sh

# Or run individual examples
node examples/basic-usage.js
npx tsx examples/basic-usage.ts
```

### Advanced Examples

For more complex scenarios, check out:

- **Advanced Usage (TypeScript)**: `examples/advanced-usage.ts` - Pagination, file downloads, and multi-tab handling
- **Advanced Usage (JavaScript)**: `examples/advanced-usage.js` - Same advanced features in JavaScript

## API Reference

### Core Functions

#### `runScraper(templates, options?)`

Main function to execute scraping templates.

**Parameters:**
- `templates`: Array of `TabTemplate` objects
- `options`: Optional `RunOptions` object

**Returns:** Promise<Record<string, any>[]>

#### `runScraperWithCallback(templates, onResult, options?)`

Execute scraping with streaming results via callback.

**Parameters:**
- `templates`: Array of `TabTemplate` objects
- `onResult`: Callback function for each result
- `options`: Optional `RunOptions` object

### Types

#### `TabTemplate`

```typescript
interface TabTemplate {
  tab: string;
  initSteps?: BaseStep[];      // Steps executed once before pagination
  perPageSteps?: BaseStep[];   // Steps executed for each page
  steps?: BaseStep[];          // Legacy single steps array
  pagination?: PaginationConfig;
}
```

#### `BaseStep`

```typescript
interface BaseStep {
  id: string;
  description?: string;
  object_type?: SelectorType;  // 'id' | 'class' | 'tag' | 'xpath'
  object?: string;
  action: 'navigate' | 'input' | 'click' | 'data' | 'scroll' | 'download' | 'foreach' | 'open' | 'savePDF' | 'printToPDF';
  value?: string;
  key?: string;
  data_type?: DataType;        // 'text' | 'html' | 'value' | 'default'
  wait?: number;
  terminateonerror?: boolean;
  subSteps?: BaseStep[];
}
```

#### `RunOptions`

```typescript
interface RunOptions {
  browser?: LaunchOptions;
  onResult?: (result: Record<string, any>, index: number) => void | Promise<void>;
}
```

## Step Actions

### Navigate
Navigate to a URL.

```typescript
{
  id: 'go_to_page',
  action: 'navigate',
  value: 'https://example.com'
}
```

### Input
Fill form fields.

```typescript
{
  id: 'search',
  action: 'input',
  object_type: 'id',
  object: 'search-box',
  value: 'search term'
}
```

### Click
Click on elements.

```typescript
{
  id: 'submit',
  action: 'click',
  object_type: 'class',
  object: 'submit-button'
}
```

### Data Extraction
Extract data from elements.

```typescript
{
  id: 'get_title',
  action: 'data',
  object_type: 'tag',
  object: 'h1',
  key: 'title',
  data_type: 'text'
}
```

### ForEach Loop
Process multiple elements.

```typescript
{
  id: 'process_items',
  action: 'foreach',
  object_type: 'class',
  object: 'item',
  subSteps: [
    // Steps to execute for each item
  ]
}
```

### File Operations

#### Download
```typescript
{
  id: 'download_file',
  action: 'download',
  object_type: 'class',
  object: 'download-link',
  value: './downloads/file.pdf',
  key: 'downloaded_file'
}
```

#### Save PDF
```typescript
{
  id: 'save_pdf',
  action: 'savePDF',
  value: './output/page.pdf',
  key: 'pdf_file'
}
```

#### Print to PDF
```typescript
{
  id: 'print_pdf',
  action: 'printToPDF',
  object_type: 'id',
  object: 'print-button',
  value: './output/printed.pdf',
  key: 'printed_file'
}
```

## Pagination

### Next Button Pagination
```typescript
pagination: {
  strategy: 'next',
  nextButton: {
    object_type: 'class',
    object: 'next-page',
    wait: 2000
  },
  maxPages: 10
}
```

### Scroll Pagination
```typescript
pagination: {
  strategy: 'scroll',
  scroll: {
    offset: 800,
    delay: 1500
  },
  maxPages: 5
}
```

## Advanced Features

### Proxy Support
```typescript
const results = await runScraper(templates, {
  browser: {
    proxy: {
      server: 'http://proxy-server:8080',
      username: 'user',
      password: 'pass'
    }
  }
});
```

### Custom Browser Options
```typescript
const results = await runScraper(templates, {
  browser: {
    headless: false,
    slowMo: 1000,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});
```

### Streaming Results
```typescript
await runScraperWithCallback(templates, async (result, index) => {
  console.log(`Result ${index}:`, result);
  // Process result immediately
}, {
  browser: { headless: true }
});
```

### Data Placeholders
Use collected data in subsequent steps:

```typescript
{
  id: 'save_with_title',
  action: 'savePDF',
  value: './output/{{meeting_title}}.pdf',
  key: 'meeting_pdf'
}
```

## Error Handling

Steps can be configured to terminate on error:

```typescript
{
  id: 'critical_step',
  action: 'click',
  object_type: 'id',
  object: 'important-button',
  terminateonerror: true
}
```

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test scraper.test.ts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support
- 🐛 Issues: [GitHub Issues](https://github.com/framework-Island/stepwright/issues)
