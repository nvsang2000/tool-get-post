const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const xlsx = require('xlsx');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    let posts = [];

    const imageDir = path.join(__dirname, 'images');
    fs.ensureDirSync(imageDir);

    for (let index = 1; index <= 3; index++) {
        console.log(" page", index);
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
            if (post.image) {
                let imageFileName = path.basename(post.image);
                const newSrc = `/wp-content/uploads/2024/08/${imageFileName}`;
                let imageFilePath = path.join(imageDir, imageFileName);
                const viewSource = await page.goto(post.image);
                fs.writeFileSync(imageFilePath, await viewSource.buffer());
                post.image = newSrc;
            } else {
                post.image = null;
            }

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
