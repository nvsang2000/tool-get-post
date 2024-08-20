const fs = require('fs');
const csv = require('csv-parser');
const { JSDOM } = require('jsdom');

let results = [];

// Đọc file CSV
fs.createReadStream('posts_new.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Giả sử cột chứa nội dung HTML có tên là 'content'
    const htmlContent = row['Content'];
    
    // Phân tích nội dung HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Tìm tất cả các thẻ <img> có thuộc tính srcset
    const imagesWithSrcset = [...document.querySelectorAll('img[srcset]')];

    imagesWithSrcset.forEach(img => {
        srcsetList.push(img.getAttribute('srcset'));
      });

    // Đưa vào kết quả
    results.push(...extractedData);
  })
  .on('end', () => {
    fs.writeFileSync('srcsetList.json', JSON.stringify(srcsetList, null, 2), 'utf-8');
    console.log('Các thuộc tính srcset đã được lưu vào srcsetList.json');
  });
