#!/usr/bin/env node
import { Command } from 'commander';
import axios, { AxiosResponse } from 'axios';
import { JSDOM } from 'jsdom';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

interface ScrapedOutput {
    count: number;
    items: string[];
    error?: string;
}

function formatPlainText(output: ScrapedOutput): string {
    if (output.error) return output.error;
    return output.items.join('\n');
}

function formatJson(output: ScrapedOutput): string {
    return JSON.stringify(output, null, 2);
}

async function processHTML(response: AxiosResponse<any, any>, options: {
    selector: string;
    attribute?: string;
    format?: string;
}): Promise<void> {
    const output: ScrapedOutput = {
        count: 0,
        items: []
    };

    if (!options.selector) {
        output.error = 'Please provide a CSS selector using the --selector option.';
        console.error(formatPlainText(output));
        process.exit(1);
    }

    const dom = new JSDOM(response.data);
    const elements = dom.window.document.querySelectorAll(options.selector);

    output.count = elements.length;

    if (elements.length > 0) {
        elements.forEach((element) => {
            let value: string;
            if (options.attribute === 'text') {
                value = element.textContent?.trim() || '';
            } else if (options.attribute) {
                value = element.getAttribute(options.attribute) || '';
            } else {
                value = element.outerHTML;
            }
            output.items.push(value);
        });
    }

    const formatted = options.format === 'json'
        ? formatJson(output)
        : formatPlainText(output);

    process.stdout.write(formatted);
}

async function processJSON(response: AxiosResponse<any, any>, options: { key: string; }) {
    console.log('Detected JSON response');
    if (!options.key) {
        console.error('Please provide a key using the --key option.');
        process.exit(1);
    }

    const jsonData = response.data;
    const value = options.key.split('.').reduce((obj: { [x: string]: any; }, key: string | number) => obj?.[key], jsonData);

    if (value !== undefined) {
        console.log(`Value for key "${options.key}":`, value);
    } else {
        console.log(`Key "${options.key}" not found in JSON response.`);
    }
}

async function downloadImage(url: string, outputDir: string): Promise<void> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const fileName = path.basename(url).split('?')[0]; // Remove query params
        const filePath = path.join(outputDir, fileName);
        await fs.promises.writeFile(filePath, response.data);
        console.log(`Downloaded: ${fileName}`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Failed to download ${url}: ${error.message}`);
        }
    }
}

async function processDownloads(urls: string[], outputDir: string): Promise<void> {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true });
    }

    // Download all images concurrently
    await Promise.all(urls.map(url => downloadImage(url, outputDir)));
}

program
    .name('cli-scrape')
    .description('A CLI tool for scraping websites')
    .version('1.0.0');

program
    .command('scrape')
    .argument('<url>', 'URL of the website to scrape')
    .option('-s, --selector <selector>', 'CSS selector for HTML filtering')
    .option('-k, --key <key>', 'Key to select a value from JSON response')
    .option('-a, --attribute <attribute>', 'HTML attribute to extract (e.g., href, src) or use "text" for text content')
    .option('-f, --format <format>', 'Output format (plain/json)', 'plain')
    .action(async (url, options) => {
        try {
            console.log(`Fetching data from: ${url}`);
            const response = await axios.get(url);

            if (response.headers['content-type'].includes('html')) {
                await processHTML(response, options);
            } else if (response.headers['content-type'].includes('json')) {
                await processJSON(response, options);
            } else {
                console.error('Unsupported content type. Only HTML and JSON are supported.');
                process.exit(1);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error fetching data:', error.message);
            }
        }
    });

program
    .command('download')
    .description('Download images from URLs (accepts piped input)')
    .option('-o, --output <dir>', 'Output directory', './downloads')
    .action(async (options) => {
        // Check if we have piped input
        if (!process.stdin.isTTY) {
            const urls: string[] = [];
            process.stdin.setEncoding('utf8');

            process.stdin.on('data', (data) => {
                urls.push(...data.toString().trim().split('\n'));
            });

            process.stdin.on('end', async () => {
                await processDownloads(urls, options.output);
            });
        } else {
            console.error('No input provided. Pipe URLs to this command.');
            process.exit(1);
        }
    });

program.parse(process.argv);
