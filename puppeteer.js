const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    let posts = [];

    for (let index = 1; index <= 69; index++) {
        console.log("page", index);
        let url = `https://news.auhs.edu/page/${index}`;
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        let postsOnPage = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.post-content')).map(post => {
                let title = post.querySelector('.post-header .title').innerText;
                let link = post.querySelector('.img-link').href;
                let category = post.querySelector('.meta-category a').textContent;
                let image = post.querySelector('.post-featured-img img') ? post.querySelector('img').src : null;
                return { title, link, image, category };
            });
        });

        console.log("postsOnPage: ", postsOnPage);
        for (let post of postsOnPage) {
            const check = await page.waitForSelector('.post-content .content-inner', { timeout: 5000 }); 
            if(!check) continue;

            await page.goto(post.link, { waitUntil: 'load', timeout: 0 });
            post.content = await page.evaluate(() => {
                return document.querySelector('.post-content .content-inner') ? document.querySelector('.post-content .content-inner').outerHTML : '';
            });

            posts.push(post);
        }
    }

    let workbook = xlsx.utils.book_new();
    let worksheetData = posts.map(post => ({
        'Title': post.title,
        'Link': post.link,
        'Thumnail': post.image,
        'Category': post.category,
        'Content': post.content
    }));
    let worksheet = xlsx.utils.json_to_sheet(worksheetData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Posts');
    xlsx.writeFile(workbook, 'posts.csv');

    console.log('Quá trình quét và cập nhật hoàn tất.');
    await browser.close();
})();
