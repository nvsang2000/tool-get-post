const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// Đường dẫn đến các thư mục
const dir1 = './new-pdf';
const dir2 = './pdf';
const outputDir = './downloads';

// Đảm bảo thư mục đầu ra tồn tại
fs.ensureDirSync(outputDir);

// Tạo hàm băm (hash) cho nội dung file
async function hashFile(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

async function getPdfFiles(dir) {
  const files = await fs.readdir(dir);
  const pdfFiles = files.filter(file => path.extname(file) === '.pdf');
  return pdfFiles.map(file => path.join(dir, file));
}

async function getUniquePdfFiles(dir1, dir2) {
  const pdfFiles1 = await getPdfFiles(dir1);
  const pdfFiles2 = await getPdfFiles(dir2);

  const fileHashes = new Set();
  const uniquePdfFiles = [];

  // Kiểm tra các file trong dir1
  for (const file of pdfFiles1) {
    const fileHash = await hashFile(file);
    if (!fileHashes.has(fileHash)) {
      fileHashes.add(fileHash);
      uniquePdfFiles.push(file);
    }
  }

  // Kiểm tra các file trong dir2
  for (const file of pdfFiles2) {
    const fileHash = await hashFile(file);
    if (!fileHashes.has(fileHash)) {
      fileHashes.add(fileHash);
      uniquePdfFiles.push(file);
    }
  }

  return uniquePdfFiles;
}

async function copyUniquePdfs() {
  const uniquePdfs = await getUniquePdfFiles(dir1, dir2);

  for (const pdf of uniquePdfs) {
    const dest = path.join(outputDir, path.basename(pdf));
    await fs.copy(pdf, dest);
    console.log(`Copied ${pdf} to ${dest}`);
  }
}

copyUniquePdfs().catch(console.error);
