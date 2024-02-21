import axios from 'axios';
import express from 'express';
import cheerio from 'cheerio';
import puppeteer from 'puppeteer';


const app = express();
const PORT = process.env.PORT || 3000;

async function searchBooks(query) {
    try {
        const searchUrl = `https://www.pdfdrive.com/search?q=${encodeURIComponent(query)}&pagecount=&pubyear=&searchin=&em=`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        const books = [];

        $('.file-left').each((i, elem) => {
            const title = $(elem).find('img').attr('title');
            const image = $(elem).find('img').attr('src');
            const url = $(elem).find('a').attr('href');

            books.push({
                title: title,
                image: image,
                url: `https://www.pdfdrive.com${url}`
            });
        });

        return books;
    } catch (error) {
        console.error('Error searching for books:', error);
        return [];
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

    return { "download_url" : finalDownloadLink }

    await browser.close();
}

app.get("/searchBooks", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter "q"' });
        }
        
        const data = await searchBooks(query);
        res.json(data); // No need to stringify when using res.json

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/download", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter "q"' });
        }
        
        const downloadData = await getDirectPDFDownloadLink(query);
        res.json(downloadData); // No need to stringify when using res.json

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
