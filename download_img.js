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

    for (let index = 1; index <= 10; index++) {
        console.log("page", index);
        let url = `https://news.auhs.edu/page/${index}`;
        // Điều hướng đến trang hiện tại
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        // Lấy URL của hình ảnh trên các bài post
        let imageUrls = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.post-content .post-featured-img img')).map(img => img.src);
        });

        console.log("Image URLs: ", imageUrls);
        
        // Tải ảnh xuống và lưu vào thư mục
        for (let imageUrl of imageUrls) {
            if (imageUrl) {
                try {
                    let imageFileName = path.basename(imageUrl);
                    let imageFilePath = path.join(imageDir, imageFileName);
                    const viewSource = await page.goto(imageUrl);
                    fs.writeFileSync(imageFilePath, await viewSource.buffer());
                    console.log(`Downloaded: ${imageUrl}`);
                } catch (error) {
                    console.error(`Error downloading image ${imageUrl}:`, error.message);
                }
            }
        }
    }

    console.log('Quá trình tải hình ảnh hoàn tất.');

    // Đóng trình duyệt
    await browser.close();
})();
