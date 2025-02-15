import { Command } from 'commander';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { AxiosResponse } from 'axios';
import { ScrapedOutput } from '..';
import { formatJson, formatPlainText } from '../utils';

export async function processHTML(response: AxiosResponse, options: {
    selector: string;
    attribute?: string;
    format?: string;
}): Promise<void> {
    const output: ScrapedOutput = {
        count: 0,
        items: []
    };

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

const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
};

export const scrapeCommand = new Command('scrape')
    .argument('<url>', 'URL of the website to scrape')
    .option('-s, --selector <selector>', 'CSS selector for HTML filtering', 'html')
    .option('-a, --attribute <attribute>', 'HTML attribute to extract')
    .option('-f, --format <format>', 'Output format (plain/json)', 'plain')
    .option('-H, --headers <headers>', 'Custom headers in JSON format')
    .action(async (url, options) => {
        try {
            const customHeaders = options.headers ? JSON.parse(options.headers) : {};
            const response = await axios.get(url, {
                headers: {
                    ...defaultHeaders,
                    ...customHeaders,
                    'Referer': new URL(url).origin
                }
            });
            await processHTML(response, options);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
                process.exit(1);
            }
        }
    });