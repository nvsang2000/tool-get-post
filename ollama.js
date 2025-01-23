import fs from "fs";
import path from "path";

const contentSystem = `
Hãy kiểm tra các từ viết tắt và liệt kê ra khi người dùng gửi yêu cầu: 
Hãy luôn tuân thủ quy tắc sau: 
- Luôn trả lời theo Form: "Từ viết tắt" : "Nghĩa theo AI".
- Có thể tìm các từ viết tắt không có trong ví dụ tôi đưa ra.
- Ví dụ: "TS." : "Tiến Sĩ", "GHPGVN" : "Gia Hội Phật Giáo Việt Nam", "HT." : "Hòa thượng", "TT." : "Trụ trì", "AL": "Âm lịch" . "NXB": "Nhà Xuất Bản"          
`;

function readQuestionsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");
  lines.shift();
  return lines;
}

async function generateAndSaveResponses(questions) {
  const url = "http://localhost:11434/api/chat";
  const results = [];

  for (const question of questions) {
    try {
      const body = {
        model: "llama3.2",
        stream: false,
        messages: [
          {
            role: "system",
            content: contentSystem,
          },
          {
            role: "user",
            content: `Kiểm tra đoạn văn sau: ${question}`,
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) continue;

      const text = await response.text();
      const data = JSON.parse(text);
      const content = data?.message?.content;

      console.log("Raw response:", content);
      results.push(`${content}\n\n`);
    } catch (error) {
      console.error("Error generating response:", error);
    }
  }

  fs.writeFileSync("responses.txt", results.join(""), "utf8");
}


function traverseDirectory(directoryPath, fileList = []) {
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const fullPath = path.join(directoryPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      traverseDirectory(fullPath, fileList);
    } else if (file.endsWith(".txt")) {
      fileList.push(fullPath);
    }
  });
  console.log("fileList" , fileList.length);  

  return fileList;
}

(async () => {
  try {
    const directoryPath = "./Content_Blog";
    const txtFiles = traverseDirectory(directoryPath, []);
    
    for (const filePath of txtFiles) {
      console.log(`Reading file: ${filePath}`);
      const questions = readQuestionsFromFile(filePath);
      await generateAndSaveResponses(questions);
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
