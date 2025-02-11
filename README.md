# cli-web-fetch

A command-line tool for web scraping and image downloading with piping support.

## Features

- Extract content using CSS selectors
- Download images from websites
- JSON output format
- Pipeline support for chaining commands
- Concurrent image downloads

## Installation

```bash
# Install globally
npm install -g cli-web-fetch

# Or use with npx
npx cli-web-fetch
```

## Quick Start

```bash
# Extract all links
cli-web-fetch scrape https://example.com -s "a" -a "href"

# Download all images
cli-web-fetch scrape https://example.com -s "img" -a "src" | cli-web-fetch download -o ./images
```

## Command Reference

### scrape

```bash
cli-web-fetch scrape <url> [options]

Options:
  -s, --selector <selector>     CSS selector for filtering
  -a, --attribute <attribute>   Attribute to extract (href/src/text)
  -f, --format <format>        Output format (plain/json)
```

### download

```bash
cli-web-fetch download [options]

Options:
  -o, --output <dir>           Output directory (default: ./downloads)
```

## More examples

```bash
# Get text from paragraphs
cli-web-fetch scrape https://example.com -s "p" -a "text"

# Get JSON output
cli-web-fetch scrape https://example.com -s "h1" -f json
```
