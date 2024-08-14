const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

// Đọc tệp JSON
async function readJsonFile(filePath) {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

// Tải xuống tệp PDF
async function downloadPdf(url, folderPath) {
    const response = await axios.get(url, { responseType: 'stream' });
    const fileName = path.basename(url);
    const filePath = path.join(folderPath, fileName);
    
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    console.log(`Đã tải xuống ${url}`);
}

// Chạy quá trình tải xuống
(async () => {
    const jsonFilePath = 'result.json'; // Đường dẫn đến tệp JSON chứa các URL và liên kết PDF
    const downloadFolder = './downloads'; // Thư mục lưu các tệp PDF

    // Đọc dữ liệu từ tệp JSON
    const urlsWithPdfs = await readJsonFile(jsonFilePath);


    // Duyệt qua các URL và liên kết PDF
    for (const [url, pdfLinks] of Object.entries(urlsWithPdfs)) {
        for (const pdfLink of pdfLinks) {
            try {
                await downloadPdf(pdfLink, downloadFolder);
            } catch (error) {
                console.error(`Lỗi khi tải xuống ${pdfLink}: ${error.message}`);
            }
        }
    }

    console.log('Quá trình tải xuống hoàn tất.');
})();
