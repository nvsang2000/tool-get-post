const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const xlsx = require('xlsx');

(async () => {
    // Mở trình duyệt với giao diện hiện lên
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // URL của trang cần quét
    let url = 'https://news.auhs.edu/'; 
    let posts = [];

    // Tạo thư mục để lưu ảnh nếu chưa có
    const imageDir = path.join(__dirname, 'images');
    fs.ensureDirSync(imageDir);

    while (url) {
        // Điều hướng đến trang hiện tại
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        // Lấy thông tin cơ bản của các bài post
        let postsOnPage = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.post-content')).map(post => {
                let title = post.querySelector('.post-header .title').innerText;
                let link = post.querySelector('.img-link').href;
                let category = post.querySelector('.meta-category a').textContent
                let image = post.querySelector('.post-featured-img img') ? post.querySelector('img').src : null;
                return { title, link, image, category };
            });
        });

        // Tải ảnh nếu có và lưu thông tin vào mảng posts
        for (let post of postsOnPage) {
            if (post.image) {
                let imageFileName = path.basename(post.image);
                let imageFilePath = path.join(imageDir, imageFileName);
                const viewSource = await page.goto(post.image);
                fs.writeFileSync(imageFilePath, await viewSource.buffer());
                post.imagePath = imageFilePath;
            } else {
                post.imagePath = null;
            }

            // Điều hướng đến trang chi tiết của bài post để lấy nội dung
            await page.goto(post.link, { waitUntil: 'load', timeout: 0 });
            post.content = await page.evaluate(() => {
                return document.querySelector('.entry-content') ? document.querySelector('.entry-content').innerText : '';
            });

            posts.push(post);
        }

        // Tìm URL của trang tiếp theo
        url = await page.evaluate(() => {
            let nextButton = document.querySelector('a.next');
            return nextButton ? nextButton.href : null;
        });
    }

    // Tạo file Excel và cập nhật thông tin các bài post
    let workbook = xlsx.utils.book_new();
    let worksheetData = posts.map(post => ({
        'Title': post.title,
        'Link': post.link,
        'Image Path': post.imagePath,
        'Summary': post.summary,
        'Content': post.content
    }));
    let worksheet = xlsx.utils.json_to_sheet(worksheetData);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Posts');
    xlsx.writeFile(workbook, 'posts.xlsx');

    console.log('Quá trình quét và cập nhật hoàn tất.');

    // Đóng trình duyệt
    await browser.close();
})();
