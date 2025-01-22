const fs = require('fs');
const csv = require('csv-parser');
const { JSDOM } = require('jsdom');

let urlList = [];

// Hàm để trích xuất URL từ srcset
function extractUrlsFromSrcset(srcset) {
  return srcset.split(',')
    .map(item => item.trim())
    .map(item => item.split(' ')[0]);
}

// Đọc file CSV
fs.createReadStream('posts_new_1.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Giả sử cột chứa nội dung HTML có tên là 'Content'
    const htmlContent = row['Content'];
    
    // Phân tích nội dung HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Tìm tất cả các thẻ <img> có thuộc tính srcset
    const imagesWithSrcset = [...document.querySelectorAll('img[srcset]')];

    imagesWithSrcset.forEach(img => {
      const srcset = img.getAttribute('srcset');
      const urls = extractUrlsFromSrcset(srcset);
      urlList.push(...urls);
    });
  })
  .on('end', () => {
    fs.writeFileSync('urlList.json', JSON.stringify(urlList, null, 2), 'utf-8');
    console.log('Các URL đã được lưu vào urlList.json');
  });
