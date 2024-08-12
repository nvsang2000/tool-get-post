const puppeteer = require('puppeteer');

(async () => {
    // Mở trình duyệt mới với giao diện hiện lên (headless: false)
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Điều hướng đến trang web mà bạn muốn lấy các URL từ thẻ <a>
    let url = 'https://news.auhs.edu/'; // Thay thế bằng URL của trang bạn muốn bắt đầu quét
    let pdfLinks = [];

    while (url) {
        // Điều hướng đến trang hiện tại
        await page.goto(url, { waitUntil: 'load', timeout: 0 });

        // Lấy tất cả các URL từ các thẻ <a> trên trang
        let links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(anchor => anchor.href);
        });


        // Tìm URL của trang tiếp theo
        url = await page.evaluate(() => {
            let nextButton = document.querySelector('a.next'); // Chỉnh sửa selector này để phù hợp với trang của bạn
            return nextButton ? nextButton.href : null;
        });
    }

    // In ra các URL của file PDF đã lấy được
    console.log(pdfLinks);

    // Đóng trình duyệt
    await browser.close();
})();
