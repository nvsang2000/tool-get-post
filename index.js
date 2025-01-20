const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

(async () => {
  try {
    // Fetch the HTML content of the page
    const url = "https://thuvienhoasen.org/p27a11736/a-di-da-phat-hay-a-mi-da-phat";
    const response = await axios.get(url);

    // Load the HTML into Cheerio
    const $ = cheerio.load(response.data);

    // Select the content inside .pd_description
    const element = $(".pd_description");
    const title = $("#dltp_name").text().trim();

    if (element.length === 0) {
      console.log("Element not found!");
      return;
    }

    // Remove unwanted tags
    element.find("a, img, audio, script").remove();

    // Get the cleaned text content
    let cleanedText = element.text().trim();

    // Add newline after any Chinese characters
    cleanedText = cleanedText.replace(/([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]+)/g, '$1\n');

    // Replace periods with periods followed by a newline, except for "v.v…"
    cleanedText = cleanedText.replace(/v\.v…/g, '###'); // Temporarily replace "v.v…" with a placeholder
    cleanedText = cleanedText.replace(/\./g, '.\n');
    cleanedText = cleanedText.replace(/###/g, 'v.v…'); // Restore "v.v…"

    // Split the text into lines and filter out empty lines
    const lines = cleanedText.split('\n').filter(line => line.trim() !== '');

    // Join the lines back into a single string
    let processedText = lines.join('\n');

    // Split the text into chunks of less than 3000 characters
    const maxChars = 2000;
    let resultArray = [];
    let currentLine = [];
    let currentLength = 0;

    processedText.split('\n').forEach(line => {
      if (currentLength + line.length + 1 > maxChars) {
        resultArray.push(currentLine);
        currentLine = [];
        currentLength = 0;
      }
      currentLine.push(line);
      currentLength += line.length + 1;
    });

    if (currentLine.length > 0) {
      resultArray.push(currentLine);
    }

    // Create the blog object
    const blog = {
      title: title,
      url: url,
      line: resultArray.reduce((acc, curr, index) => {
        acc[index] = curr;
        return acc;
      }, {})
    };

    // Write the blog object to a file
    fs.writeFileSync("cleaned_text.json", JSON.stringify(blog, null, 2), "utf8");

    console.log("Processed Text Content written to cleaned_text.json");
  } catch (error) {
    console.error("Error:", error);
  }
})();
