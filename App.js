import express from 'express';
import puppeteer from 'puppeteer'; 
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

async function searchBooks(query) {
    let browser = null;
    try {
        // Use the bundled Chromium in Puppeteer
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true, // Ensuring Puppeteer runs headless on Render
            executablePath: process.env.NODE_ENV == "production" ? process.env.PUPPETEE_EXECUTABLE_PATH : puppeteer.executablePath(), // Use the executablePath of bundled Chromium
        });
        const page = await browser.newPage();
        const searchUrl = `https://www.pdfdrive.com/search?q=${encodeURIComponent(query)}&pagecount=&pubyear=&searchin=&em=`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        // Scrape the data
        const books = await page.evaluate(() => {
            const books = [];
            document.querySelectorAll('.file-left').forEach(elem => {
                const title = elem.querySelector('img')?.getAttribute('title');
                const image = elem.querySelector('img')?.getAttribute('src');
                const url = elem.querySelector('a')?.getAttribute('href');
                if (title && image && url) {
                    books.push({
                        title: title,
                        image: image,
                        url: `https://www.pdfdrive.com${url}`
                    });
                }
            });
            return books;
        });
        return books;
    } catch (error) {
        console.error('Error searching for books:', error);
        return [];
    } finally {
        if (browser) await browser.close();
    }
}

async function getDirectPDFDownloadLink(bookPageUrl) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(bookPageUrl, { waitUntil: 'networkidle2' });

    // Find the initial download link and click it
    const initialDownloadSelector = '#download-button > a';
    await page.waitForSelector(initialDownloadSelector, { visible: true });
    const initialDownloadLink = await page.$eval(initialDownloadSelector, element => element.href);

    // Navigate to the initial download link page
    await page.goto(initialDownloadLink, { waitUntil: 'networkidle2' });

    // Wait for the final download button to appear and get its link
    const finalDownloadSelector = '.btn-group a[type="button"]';
    await page.waitForSelector(finalDownloadSelector, { visible: true });
    const finalDownloadLink = await page.$eval(finalDownloadSelector, element => element.href);

    return {finalDownloadLink}

    await browser.close();
}
app.get("/searchBooks", async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }
    
    const data = await searchBooks(query);
    res.json(data);
});

app.get("/download", async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Missing query parameter "q"' });
    }
    
    const downloadData = await getDirectPDFDownloadLink(query);
    res.json(downloadData);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
