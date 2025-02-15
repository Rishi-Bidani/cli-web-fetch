import { ScrapedOutput } from '.';

export function formatPlainText(output: ScrapedOutput): string {
    if (output.error) return output.error;
    return output.items.join('\n');
}

export function formatJson(output: ScrapedOutput): string {
    return JSON.stringify(output, null, 2);
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}