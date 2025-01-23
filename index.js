const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { connectDB, getPostsInRange } = require("./db");

function formatDate(dateString) {
  const regex = /^(\d{1,2})(?:[-\/](\d{1,2}))?[-\/](\d{4})$/;
  const match = dateString.match(regex);

  if (match) {
    const day = match[1];
    const month = match[2];
    const year = match[3] 
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

(async () => {
  try {
    const pool = await connectDB();
    const posts = await getPostsInRange(pool, 41000, 42119);
    const replacements = await loadReplacements();

    for (const post of posts) {
      const {
        post_id,
        post_title,
        post_sqlyear,
        post_sqlmonth,
        post_sqlday,
        object_name,
        postdata_contentHTML,
      } = post;

      let cleanedText = "";
      let fileName = `${post_title}.txt`;
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
        cleanedText = cleanedText.replace(/([^.])$/, "$1.");
        cleanedText = cleanedText.replace(/\[\d+\]/g, "");
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
        fileName = `[${post_id}]_[FAILD]_${post_title}.txt`;
        cleanedText = "Không thể xử lý HTML.";
      }

      const fileContent = `${url}\n\n${cleanedText}`;
      const dateFolder = path.join(
        __dirname,
        "Content_Blog",
        `${post_sqlyear}`,
        `${post_sqlmonth.toString().padStart(2, "0")}`,
        `${post_sqlday.toString().padStart(2, "0")}`
      );

      if (!fs.existsSync(dateFolder)) {
        fs.mkdirSync(dateFolder, { recursive: true });
      }

      const finalFileName = `[${post_id}]_${
        pdfLinks.length > 0 ? "[Có PDF]_" : ""
      }${fileName}`;
      const filePath = path.join(dateFolder, finalFileName);
      fs.writeFileSync(filePath, fileContent, "utf8");
    }
    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  }
})();
