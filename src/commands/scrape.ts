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

export const scrapeCommand = new Command('scrape')
    .argument('<url>', 'URL of the website to scrape')
    .option('-s, --selector <selector>', 'CSS selector for HTML filtering', 'html')
    .option('-a, --attribute <attribute>', 'HTML attribute to extract')
    .option('-f, --format <format>', 'Output format (plain/json)', 'plain')
    .action(async (url, options) => {
        try {
            const response = await axios.get(url);
            await processHTML(response, options);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
                process.exit(1);
            }
        }
    });