const axios = require("axios");
class GetPostSite {
  constructor() {
    (this.url = "https://www.naturalreaders.com/"),
      (this.headers = {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language":
          "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
        "Content-Type": "application/json",
        Origin: "https://web.pinai.tech",
        Referer: "https://www.naturalreaders.com/",
        "Sec-Ch-Ua":
          '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Linux"',
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        Lang: "vi",
        authorization:
          "eyJraWQiOiJKbUo4RmpWa1J5dUo3NnFBZ0RrdFk5UVNlckJLdVBXeG1ISGtLZmRYZXhZPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJjMTM5ZTRjZS05YzVhLTQ0N2UtYjZhMC1iZjJiYzNiYjc4YTQiLCJjb2duaXRvOmdyb3VwcyI6WyJjb21tZXJjaWFsX3VzZXJzIiwicHdfdXNlcnMiXSwiZW1haWxfdmVyaWZpZWQiOnRydWUsImNvZ25pdG86cHJlZmVycmVkX3JvbGUiOiJhcm46YXdzOmlhbTo6MDA1MDUyNDYwMDE1OnJvbGVcL2NvbW1lcmNpYWxfdXNlcnMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9jSXNrakdvSmciLCJjb2duaXRvOnVzZXJuYW1lIjoiYzEzOWU0Y2UtOWM1YS00NDdlLWI2YTAtYmYyYmMzYmI3OGE0IiwiY3VzdG9tOmVtYWlsX3N1YnNjcmlwdGlvbiI6IjEiLCJwaWN0dXJlIjoiZGVmYXVsdC5wbmciLCJjb2duaXRvOnJvbGVzIjpbImFybjphd3M6aWFtOjowMDUwNTI0NjAwMTU6cm9sZVwvY29tbWVyY2lhbF91c2VycyJdLCJhdWQiOiIybzJsdGNxOHRubWUyZmlkazM1ZnJrMmt0NCIsImV2ZW50X2lkIjoiZWEzZjU4MGUtOTVmZS00YWRkLWJkZWQtYjlmZjIzYzZmODkzIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3MzcwOTQzOTUsIm5pY2tuYW1lIjoibGFycnkiLCJleHAiOjE3MzcxMDE5NzUsImlhdCI6MTczNzA5ODM3NSwiZW1haWwiOiJsYXJyeUBhdmR0di5jb20ifQ.Klf4ACPtKa5fdSoIeNoSXua26sgsvL4_RDQzZsdtBIUVwnza8MLYk-U0o3A58A3RHaf--vlcapiiLMaDc5V6TjMsiE7Wy9qUCSmcovwqdai4uFiNWrplgOl9TvajD3U7kopysoSLUBrL38tOzxZ1Mqaxigm1zsXTal-dhG07Gy6kQ1rFMLDd7vNh-0MnsMpQpNu6yHzbD28PteROIk6ewUaA9RDRDVcumjKV-Uf5xaKqOflVJ1BTKUWduZZc-7UjTWjO5ZD1YnPGx5VqbHREwuOxbBzDPvi5n79K0KRlaRSmIz9Zj2k0LfLd6JONXzHEcuOa4_s6cL_QjRaDSv3tzg",
      });
  }

  async axiosRequest(method, url, data = null, customHeaders = {}) {
    const headers = {
      ...this.headers,
      ...customHeaders,
    };

    try {
      const response = await this.axiosInstance({
        method,
        url,
        data,
        headers,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }


  async main() {
    let url = `https://www.naturalreaders.com/commercial/`;
    const response = await this.axiosRequest("post", url, payload);

    console.log('html',html)

    const $ = cheerio.load(html);
  }
}

(async () => {
  try {
    const app = new GetPostSite();
    await app.main();
  } catch (error) {
    console.error(error);
    process.exit();
  }
})();
