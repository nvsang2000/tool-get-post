const fs = require("fs");

function processAbbreviations(filePath) {
  const abbreviationsSet = new Set();
  const lines = fs.readFileSync(filePath, "utf8").split("\n");

  const result = lines
    .map((line) => {
      const [postId, abbreviations] = line.split(":").map(str => str.trim());

      // Nếu không có từ viết tắt hợp lệ, bỏ qua dòng này
      if (!abbreviations || abbreviations.length === 0) {
        return null;
      }

      // Lọc các từ hợp lệ, loại bỏ khoảng trắng thừa và từ trùng lặp
      const words = abbreviations
        .split(",")
        .map(word => word.trim())  // Loại bỏ khoảng trắng thừa
        .filter(word => word.length > 0 && !abbreviationsSet.has(word)); // Loại bỏ từ rỗng và từ trùng

      if (words.length === 0) {
        return null; // Nếu sau khi lọc không còn từ nào, bỏ qua dòng
      }

      words.forEach(word => abbreviationsSet.add(word)); // Thêm từ vào Set để tránh trùng

      return `${postId} : ${words.join(", ")}`;
    })
    .filter(Boolean); // Lọc bỏ các dòng bị loại

  fs.writeFileSync("check_keyword.txt", result.join("\n"), "utf8");
  console.log("Processing complete. Check 'check_keyword.txt'.");
}

processAbbreviations("keyword.txt");
