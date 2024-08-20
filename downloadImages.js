const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

// Đọc file JSON chứa srcset
const srcsetList = JSON.parse(fs.readFileSync('cleanedUrls.json', 'utf-8'));
console.log("srcsetList", srcsetList)

// Hàm tải ảnh từ URL và lưu vào thư mục tương ứng
async function downloadImage(url) {
  try {
    // Lấy đường dẫn đầy đủ của ảnh từ URL
    const urlPath = new URL(url).pathname;
    
    // Tạo đường dẫn lưu file (ví dụ: ./wp-content/uploads/2024/08/4.jpg)
    const savePath = path.join(__dirname, urlPath);
    
    // Tạo thư mục nếu chưa tồn tại
    await fs.ensureDir(path.dirname(savePath));

    // Tải ảnh và lưu vào file
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    // Lưu ảnh vào thư mục đã tạo
    response.data.pipe(fs.createWriteStream(savePath));
    console.log(`Đã tải: ${url} vào ${savePath}`);
  } catch (error) {
    console.error(`Lỗi khi tải ảnh từ ${url}:`, error.message);
  }
}

// Hàm xử lý tải tất cả ảnh từ srcsetList
async function downloadAllImages() {
  for (const srcset of srcsetList) {
    // Mỗi srcset có thể chứa nhiều đường dẫn, thường phân tách bằng dấu phẩy
    const urls = srcset.split(',').map(src => src.trim().split(' ')[0]);

    for (const url of urls) {
      await downloadImage(url);
    }
  }
}

// Thực hiện tải tất cả ảnh
downloadAllImages();


// let cleanedUrls = [];

// // Hàm lọc ra các URL đúng định dạng từ srcset
// function extractUrlsFromSrcset(srcset) {
//   // Tách các URL dựa trên dấu phẩy
//   const urls = srcset.split(',').map(src => src.trim().split(' ')[0]);

//   // Lọc ra các URL có định dạng hợp lệ
//   return urls.filter(url => {
//     try {
//       // Kiểm tra nếu URL có định dạng hợp lệ
//       new URL(url);
//       return true;
//     } catch (e) {
//       return false;
//     }
//   });
// }

// // Xử lý srcsetList và lọc các URL
// srcsetList.forEach(srcset => {
//   const urls = extractUrlsFromSrcset(srcset);
//   cleanedUrls.push(...urls);
// });

// Lưu danh sách URL đã lọc vào file JSON
// fs.writeFileSync('cleanedUrls.json', JSON.stringify(cleanedUrls, null, 2), 'utf-8');
// console.log('Các URL đã được lọc và lưu vào cleanedUrls.json');