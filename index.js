var express = require('express');
var bodyparser = require('body-parser');
var puppeteer = require('puppeteer');
var app = express();
var port = (process.env.PORT || 3000);

app.use(bodyparser.json());

app.use(express.static(__dirname + '/public'));
app.post('/get', async (req, res) => {
    var url = req.body.url;
    // Use puppeteer to get the page, and fetch the content at (body > a#f > Text Content)
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();

    await page.goto(url);
    const magnetBtnSelector = '#app > div.content > div > div > div > div:nth-child(1) > div > div.card > div.card-body.header > div > a.btn.magnet-uri.my-btn-link.magnet-uri';
    await page.waitForSelector(magnetBtnSelector);
    await page.click(magnetBtnSelector);

    // Locate the full title with a unique string
    const textSelector = await page.waitForSelector(
        '#magnet-uri-modal___BV_modal_body_ > textarea'
    );
    const MAGNET_LINK = await textSelector?.evaluate(el => el.value);

    const dlSelector = await page.waitForSelector( // 2nd child of the mediaelementwrapper is a <video> and has the link. But, there are 2 video elements.
        '.mejs__mediaelement > mediaelementwrapper > video:nth-child(2)'
    );
    const DL_LINK = await dlSelector?.evaluate(el => el.src);
    const startIndex = DL_LINK.indexOf("~vod");
    const endIndex = DL_LINK.indexOf(".m3u8") + 5;

    // Remove the specified portion from the URL
    const DownloadLink = DL_LINK.slice(0, startIndex) + url.slice(endIndex);

    await browser.close();
    res.end(JSON.stringify({ magnet:MAGNET_LINK, dl:DownloadLink }));
})
app.listen(port, ()=>{
    console.log("App listening on port " + port);
});