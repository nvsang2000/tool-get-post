const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

(async () => {
    // Mở trình duyệt với giao diện hiện lên
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Tạo thư mục để lưu ảnh nếu chưa có
    const imageDir = path.join(__dirname, 'images');
    fs.ensureDirSync(imageDir);

    for (let index = 10; index <= 20; index++) {
        console.log(" page", index);
        let url = `https://news.auhs.edu/page/${index}`
        // Điều hướng đến trang hiện tại
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        // Lấy thông tin cơ bản của các bài post
        let postsOnPage = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.post-content')).map(post => {
                let title = post.querySelector('.post-header .title').innerText;
                let link = post.querySelector('.img-link').href;
                let category = post.querySelector('.meta-category a').textContent;
                let time =  post.querySelector('.post-header span').textContent;
                let image = post.querySelector('.post-featured-img img') ? post.querySelector('img').src : null;
                return { title, link, image, time, category };
            });
        });

        console.log("postsOnPage: ", postsOnPage);
        // Tải ảnh nếu có và lưu thông tin vào mảng posts
        for (let post of postsOnPage) {
            if (post.image) {
                let imageFileName = path.basename(post.image);
                let imageFilePath = path.join(imageDir, imageFileName);
                const viewSource = await page.goto(post.image);
                console.log("ddowwnload: ", imageFilePath);
                fs.writeFileSync(imageFilePath, await viewSource.buffer());
            }

            // Điều hướng đến trang chi tiết của bài post để lấy nội dung và hình ảnh trong bài post
            await page.goto(post.link, { waitUntil: 'load', timeout: 0 });
            post.content = await page.evaluate(() => {
                return document.querySelector('.post-content .content-inner') ? document.querySelector('.post-content .content-inner').outerHTML : '';
            });

            // Tìm và tải xuống tất cả các hình ảnh trong nội dung bài viết
            post.content = await page.evaluate(async (imageDir) => {
                const images = document.querySelectorAll('.post-content .content-inner img');
                const downloadedImages = [];

                for (let img of images) {
                    let imageUrl = img.src;
                    let imageFileName = imageUrl.split('/').pop();
                    downloadedImages.push({ imageUrl, imageFileName });
                }

                return { htmlContent: document.querySelector('.post-content .content-inner').outerHTML, downloadedImages };
            }, imageDir);

            // Tải xuống tất cả các hình ảnh đã được tìm thấy
            for (let img of post.content.downloadedImages) {
                const imageFilePath = path.join(imageDir, img.imageFileName);
                const viewSource = await page.goto(img.imageUrl);
                console.log("ddowwnload: ", imageFilePath);
                fs.writeFileSync(imageFilePath, await viewSource.buffer());
            }
        }
    }

    // Đóng trình duyệt
    await browser.close();
})();