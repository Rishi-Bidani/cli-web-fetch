import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import { processHTML } from '../src/commands/scrape';
import { processDownloads } from '../src/commands/download';

describe('webscrape-fetch-cli', () => {
    let axiosStub: sinon.SinonStub;
    let fsStub: sinon.SinonStub;

    beforeEach(() => {
        axiosStub = sinon.stub(axios, 'get');
        fsStub = sinon.stub(fs.promises, 'writeFile');
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('Scraping Command', () => {
        it('should extract links from HTML', async () => {
            const mockHtml = `
                <html>
                    <body>
                        <a href="http://test1.com">Test1</a>
                        <a href="http://test2.com">Test2</a>
                    </body>
                </html>
            `;

            axiosStub.resolves({ data: mockHtml });

            const stdoutSpy = sinon.spy(process.stdout, 'write');

            await processHTML({ data: mockHtml } as any, {
                selector: 'a',
                attribute: 'href',
                format: 'json'
            });

            expect(stdoutSpy.calledOnce).to.be.true;
            const output = JSON.parse(stdoutSpy.firstCall.args[0] as any);
            expect(output.items).to.deep.equal([
                'http://test1.com',
                'http://test2.com'
            ]);
        });

        it('should handle empty results', async () => {
            const mockHtml = '<html><body></body></html>';
            axiosStub.resolves({ data: mockHtml });

            const stdoutSpy = sinon.spy(process.stdout, 'write');

            await processHTML({ data: mockHtml } as any, {
                selector: 'a',
                attribute: 'href'
            });

            expect(stdoutSpy.calledOnce).to.be.true;
            expect(stdoutSpy.firstCall.args[0]).to.equal('');
        });
    });

    describe('Download Command', () => {
        it('should download images from URLs', async () => {
            const urls = ['http://test.com/image1.jpg', 'http://test.com/image2.jpg'];
            const outputDir = './test-downloads';

            fsStub.resolves();
            axiosStub.resolves({ data: Buffer.from('fake-image-data') });

            await processDownloads(urls, outputDir);

            expect(axiosStub.calledTwice).to.be.true;
            expect(fsStub.calledTwice).to.be.true;
        });

        it('should handle download errors', async () => {
            const urls = ['http://invalid-url.com/image.jpg'];
            const outputDir = './test-downloads';

            axiosStub.rejects(new Error('Network error'));

            const consoleErrorSpy = sinon.spy(console, 'error');

            await processDownloads(urls, outputDir);

            expect(consoleErrorSpy.calledWith(sinon.match(/Failed to download/))).to.be.true;
        });
    });
});