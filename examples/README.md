# Stepwright Examples

This folder contains examples demonstrating how to use the Stepwright web scraping library.

## Examples

### Basic Usage
- `basic-usage.ts` - Simple TypeScript example scraping example.com
- `basic-usage.js` - Simple JavaScript example scraping example.com

### Advanced Usage
- `advanced-usage.ts` - Advanced TypeScript example with pagination and foreach loops
- `advanced-usage.js` - Advanced JavaScript example with pagination and foreach loops

## How to Run

### Prerequisites
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

### Running TypeScript Examples

```bash
# Run basic TypeScript example
npx ts-node examples/basic-usage.ts

# Run advanced TypeScript example
npx ts-node examples/advanced-usage.ts
```

### Running JavaScript Examples

```bash
# Run basic JavaScript example
node examples/basic-usage.js

# Run advanced JavaScript example
node examples/advanced-usage.js
```

### Alternative: Using tsx (faster TypeScript execution)

```bash
# Install tsx globally
npm install -g tsx

# Run TypeScript examples directly
tsx examples/basic-usage.ts
tsx examples/advanced-usage.ts
```

## What Each Example Does

### Basic Usage
- Navigates to example.com
- Extracts the main heading (h1)
- Extracts the first paragraph
- Returns the scraped data

### Advanced Usage
- Navigates to Hacker News (news.ycombinator.com)
- Uses pagination to go through multiple pages
- Uses foreach loops to extract data from each article
- Extracts title, link, and score for each article
- Demonstrates both batch and streaming result handling

## Expected Output

### Basic Usage
```json
[
  {
    "title": "Example Domain",
    "description": "This domain is for use in illustrative examples..."
  }
]
```

### Advanced Usage
```json
[
  {
    "title": "Article Title 1",
    "link": "https://example.com/article1",
    "score": "123 points"
  },
  {
    "title": "Article Title 2", 
    "link": "https://example.com/article2",
    "score": "456 points"
  }
  // ... more articles
]
```

## Troubleshooting

1. **Browser not found**: Make sure you have the required browsers installed:
   ```bash
   npx playwright install
   ```

2. **TypeScript errors**: Make sure you're using the correct TypeScript version:
   ```bash
   npm install typescript@latest
   ```

3. **Module not found**: Ensure you've built the project:
   ```bash
   npm run build
   ```
