const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://thuvienhoasen.org";
const visitedLinks = new Set();

// Mảng các mục lục cần quét
const categories = [
  "/p27a11736/a-di-da-phat-hay-a-mi-da-phat",
  "/p27a11737/loi-phat-day",
  "/p27a11738/kinh-dien",
];

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return cheerio.load(response.data);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    return null;
  }
}

async function processArticle($, url) {
  const description = $(".pd_description");
  if (description.length === 0) {
    console.log(`No content found at ${url}`);
    return;
  }

  const title = $("#dltp_name").text().trim();
  const date = $(".pd_date").text().trim();

  let htmlContent = description.html();
  htmlContent = htmlContent.replace(/<img[^>]*>/g, ""); // Remove all <img> tags
  description.html(htmlContent);

  description.find("a, audio, script").each((_, el) => {
    $(el).remove();
  });

  let cleanedText = description.text().trim();
  cleanedText = cleanedText.replace(/([^.])$/, "$1.");
  const lines = cleanedText.split("\n").filter((line) => line.trim() !== "");
  const processedText = lines.join(" ");

  const [day, month, year] = date.split("/");
  const dirPath = path.join(__dirname, year, month, day);
  fs.mkdirSync(dirPath, { recursive: true });

  const sanitizedTitle = title.replace(/[\/\\?%*:|"<>]/g, "-");
  const fileName = `${sanitizedTitle}.txt`;

  fs.writeFileSync(path.join(dirPath, fileName), processedText, "utf8");

  console.log(`Article saved: ${path.join(dirPath, fileName)}`);
}

async function processCategory(url) {
  if (visitedLinks.has(url)) {
    return; // Skip if the link is already visited
  }

  visitedLinks.add(url);

  const $ = await fetchPage(url);
  if (!$) return;

  // Process articles if available
  if ($(".pd_description").length > 0) {
    await processArticle($, url);
  }

  // Find links within this category
  const links = $("a")
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter((link) => link && link.startsWith("/"));

  for (const link of links) {
    const absoluteUrl = baseUrl + link;
    await processCategory(absoluteUrl);
  }
}

(async () => {
  for (const category of categories) {
    const categoryUrl = baseUrl + category;
    console.log(`Processing category: ${categoryUrl}`);
    await processCategory(categoryUrl);
  }
  console.log("All categories processed!");
})();
