const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

(async () => {
  try {
    const url =
      "https://thuvienhoasen.org/p27a11736/a-di-da-phat-hay-a-mi-da-phat";
    const response = await axios.get(url);

    const $ = cheerio.load(response.data);

    let description = $(".pd_description");
    let htmlContent = description.html();
    htmlContent = htmlContent.replace(/<img[^>]*>/g, ""); // Loại bỏ tất cả thẻ <img>
    description.html(htmlContent);

    const title = $("#dltp_name").text().trim();
    const date = $(".pd_date").text().trim();

    if (description.length === 0) {
      console.log("Element not found!");
      return;
    }

    description.find("a, audio, script").each((_, el) => {
      $(el).remove();
    });

    let cleanedText = description.text().trim();
    console.log("Cleaned Text Content:", cleanedText);
    cleanedText = cleanedText.replace(/([^.])$/, "$1.");
    const lines = cleanedText.split("\n").filter((line) => line.trim() !== "");
    let processedText = lines.join(" ");

    const minChars = 2000;
    const maxChars = 2500;
    let resultArray = [];
    let currentText = "";
    let currentLength = 0;

    processedText.split(" ").forEach((word, index, array) => {
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

        // Check if the current word ends with a period and the next word exists
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

    const [day, month, year] = date.split("/");

    const dirPath = path.join(__dirname, year, month, day);
    fs.mkdirSync(dirPath, { recursive: true });

    const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, "-");
    const fileName = `${sanitizedTitle}.txt`;

    fs.writeFileSync(
      path.join(dirPath, fileName),
      resultArray.join("\n\n"),
      "utf8"
    );

    console.log(
      `Processed Text Content written to ${path.join(dirPath, fileName)}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
})();
