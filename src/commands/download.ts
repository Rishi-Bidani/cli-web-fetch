import { Command } from 'commander';
import { isValidUrl } from '../utils';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export async function downloadImage(url: string, outputDir: string): Promise<void> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const fileName = path.basename(url).split('?')[0];
        const filePath = path.join(outputDir, fileName);
        await fs.promises.writeFile(filePath, response.data);
        console.log(`Downloaded: ${fileName}`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Failed to download ${url}: ${error.message}`);
        }
    }
}

export async function processDownloads(urls: string[], outputDir: string): Promise<void> {
    if (!fs.existsSync(outputDir)) {
        await fs.promises.mkdir(outputDir, { recursive: true });
    }
    await Promise.all(urls.map(url => downloadImage(url, outputDir)));
}

async function handlePipedInput(options: { output: string }): Promise<void> {
    return new Promise((resolve, reject) => {
        const urls: string[] = [];

        process.stdin
            .setEncoding('utf8')
            .on('data', (data) => {
                urls.push(...data.toString().trim().split('\n').filter(url => url));
            })
            .on('end', async () => {
                try {
                    if (urls.length === 0) {
                        console.error('No valid URLs received from pipe');
                        process.exit(1);
                    }
                    await processDownloads(urls, options.output);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

export const downloadCommand = new Command('download')
    .description('Download images from URLs (accepts direct URL or piped input)')
    .argument('[url]', 'Direct URL to download')
    .option('-o, --output <dir>', 'Output directory', './downloads')
    .action(async (url, options) => {
        try {
            if (url) {
                if (!isValidUrl(url)) {
                    console.error('Invalid URL provided');
                    process.exit(1);
                }
                await processDownloads([url], options.output);
            } else {
                await handlePipedInput(options);
            }
        } catch (error) {
            console.error('Download failed:', error);
            process.exit(1);
        }
    });