const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const slug = require("slug").default;
const { connectDB, getPostsInRange } = require("./db");

function formatDate(dateString) {
  const regex = /^(\d{1,2})(?:[-\/](\d{1,2}))?[-\/](\d{4})$/;
  const match = dateString.match(regex);

  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const date = ` ${day}, tháng ${month}, năm ${year} `;
    return date;
  } else {
    return dateString;
  }
}

async function loadReplacements() {
  const replacements = JSON.parse(fs.readFileSync("replacements.json", "utf8"));
  return replacements;
}

function addLineBreakForChineseInBrackets(text) {
  const regex =
    /\([^\u0000-\u00FF]*([\u4e00-\u9fa5\u3400-\u4DBF\uF900-\uFAFF]+)[^\u0000-\u00FF]*\)/g;
  return text.replace(regex, (match) => `\n${match.trim()}\n`);
}

function insertBreaks(text, minWords = 300, maxWords = 350) {
  const words = text.split(" "); // Tách văn bản thành mảng các từ
  let result = "";
  let wordCount = 0;

  for (let i = 0; i < words.length; i++) {
    result += words[i] + " "; // Thêm từ vào kết quả
    wordCount++;

    // Kiểm tra số từ và dấu chấm
    if (
      wordCount >= minWords &&
      wordCount <= maxWords &&
      words[i].endsWith(".")
    ) {
      result += "<break time='1000ms'/> ";
      wordCount = 0;
    }
  }

  return result;
}

const abbreviationRegex = /(?:\s)([A-Z]{2,})(?=\s|[.:/,-])(?=\s|$)/g;

(async () => {
  try {
    const pool = await connectDB();
    const posts = await getPostsInRange(pool, 139, 42119);
    const replacements = await loadReplacements();

    const abbreviationMap = new Map(); // 🔹 Định nghĩa abbreviationMap ở đây

    for (const post of posts) {
      const {
        post_id,
        post_title,
        post_sqlyear,
        post_sqlmonth,
        post_sqlday,
        object_name,
        post_style,
        post_isBook,
        postdata_contentHTML,
      } = post;

      console.log("Processing posts...", post_id, post_style, post_isBook);

      let cleanedText = "";
      // Giới hạn độ dài title và chuyển thành slug
      let fileName = `[${post_id}]_${slug(post_title).slice(0, 200)}.txt`; // Giới hạn tên file ở 150 ký tự
      const pdfLinks = [];
      const url = `https://thuvienhoasen.org/a${post_id}/${object_name}`;

      try {
        if (typeof postdata_contentHTML !== "string") {
          throw new Error("HTML content is not a string");
        }

        const $ = cheerio.load(postdata_contentHTML);
        $(".nw_image_caption").remove();

        const unwantedTags = ["img", "audio", "script"];
        unwantedTags.forEach((tag) => {
          $(tag).each((_, el) => {
            $(el).remove();
          });
        });

        $("a").each((_, el) => {
          const href = $(el).attr("href");
          if (href && href.endsWith(".pdf")) {
            const absolutePdfUrl = href.startsWith("http")
              ? href
              : `https://thuvienhoasen.org${href}`;
            pdfLinks.push(absolutePdfUrl);
          }
        });

        cleanedText = $.text().trim();

        const matches = cleanedText.match(abbreviationRegex);
        if (matches) {
          console.log("Found abbreviations:", matches);
          const uniqueAbbreviations = [
            ...new Set(matches.map((match) => match.trim())),
          ];
          abbreviationMap.set(post_id, uniqueAbbreviations);
        }
        // Trong phần xử lý văn bản
        cleanedText = insertBreaks(cleanedText);
        cleanedText = cleanedText.replace(/([^.])$/, "$1.");
        cleanedText = cleanedText.replace(/\[\d+\]/g, "");
        cleanedText = cleanedText.replace(/\*/g, "");
        cleanedText = cleanedText.replace("(trích đoạn)", "");
        cleanedText = cleanedText.replace(
          /(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{4}))?/g,
          formatDate
        ); // Cập nhật regex cho ngày

        cleanedText = addLineBreakForChineseInBrackets(cleanedText);

        Object.keys(replacements).forEach((key) => {
          const value = replacements[key];
          const regex = new RegExp(key, "g");
          cleanedText = cleanedText.replace(regex, value);
        });

        const lines = cleanedText
          .split("\n")
          .filter((line) => line.trim() !== "");
        const processedText = lines.join(" ");

        const minChars = 2500;
        const maxChars = 3000;
        let resultArray = [];
        let currentText = "";
        let currentLength = 0;

        const chineseCharRegex = /[\u4E00-\u9FFF]/;

        processedText.split(" ").forEach((word, index, array) => {
          if (chineseCharRegex.test(word)) {
            if (currentText.length > 0) {
              resultArray.push(currentText.trim());
              currentText = "";
              currentLength = 0;
            }
            resultArray.push(word);
            return;
          }

          if (
            currentLength + word.length + 1 > maxChars ||
            (currentLength + word.length + 1 > minChars && word.endsWith("."))
          ) {
            if (!currentText.endsWith(".")) {
              const lastPeriodIndex = currentText.lastIndexOf(".");
              if (lastPeriodIndex !== -1) {
                currentText = currentText.slice(0, lastPeriodIndex + 1);
              }
            }
            resultArray.push(currentText.trim());
            currentText = "";
            currentLength = 0;
          } else {
            currentText += word + " ";
            currentLength += word.length + 1;
            if (word.endsWith(".") && array[index + 1]) {
              if (currentLength >= minChars) {
                resultArray.push(currentText.trim());
                currentText = "";
                currentLength = 0;
              }
            }
          }
        });

        if (currentText.length > 0) {
          resultArray.push(currentText.trim());
        }

        cleanedText = resultArray.join("\n\n");
      } catch (error) {
        console.error(`Error processing post ${post_id}:`, error.message);
        fileName = `[FAILD]_${slug(post_title).slice(0, 150)}.txt`; // Nếu lỗi, sử dụng slug
        cleanedText = "Không thể xử lý HTML.";
      }

      const fileContent = `${url}\n\n${cleanedText}`;
      const dateFolder = path.join(
        __dirname,
        "Post_Content",
        `${post_sqlyear}`,
        `${post_sqlmonth.toString().padStart(2, "0")}`,
        `${post_sqlday.toString().padStart(2, "0")}`
      );

      if (!fs.existsSync(dateFolder)) {
        fs.mkdirSync(dateFolder, { recursive: true });
      }

      const filePath = path.join(dateFolder, fileName);
      fs.writeFileSync(filePath, fileContent, "utf8");
    }

    const abbreviationText = Array.from(abbreviationMap)
      .map(
        ([postId, abbreviations]) => `${postId} : ${abbreviations.join(", ")}`
      )
      .join("\n");

    fs.writeFileSync("abbreviations.txt", abbreviationText, "utf8");
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  }
})();
