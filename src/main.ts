#!/usr/bin/env node
import { Command } from 'commander';
import { scrapeCommand } from './commands/scrape';
import { downloadCommand } from './commands/download';

const program = new Command();

program
    .name('webscrape-fetch-cli')
    .description('CLI tool for web scraping and image downloading')
    .version('1.0.0')
    .addCommand(scrapeCommand)
    .addCommand(downloadCommand);

program.parse(process.argv);
