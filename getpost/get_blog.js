const cheerio = require('cheerio');
const xlsx = require('xlsx');

class PostWordpress {
    constructor() {
        this.baseUrl = "https://news.auhs.edu";
        this.element = {
            contentPost: ".post-content",
            linkPost: ".img-link",
            titlePost: ".post-header .title",
            categoryPost: ".meta-category a",
            timePost: ".post-header span",
            thumnailPost: ".post-featured-img img",
            content: ".post-content .content-inner",
        }
    }

    async main() {
        let posts = [];

        for (let index = 1; index <= 2; index++) {
            console.log("page", index);
            let url = `${this.baseUrl}/page/${index}`;
            const response = await fetch(url);
            const html = await response.text();

            // Load HTML content into cheerio
            const $ = cheerio.load(html);

            // Extract post information
            let postsOnPage = $(this.element.contentPost).map((i, post) => {
                let title = $(post).find(this.element.titlePost).text();
                let link = $(post).find(this.element.linkPost).attr('href');
                let category = $(post).find(this.element.categoryPost).text();
                let time = $(post).find(this.element.timePost).text();
                let image = $(post).find(this.element.thumnailPost).attr('src') || null;
                return { title, link, time, image, category };
            }).get();
            for (let post of postsOnPage) {
                try {
                    // Fetch the HTML content of the post detail page
                    const postResponse = await fetch(post.link);
                    const postHtml = await postResponse.text();
                    // Load the post detail HTML into cheerio
                    const post$ = cheerio.load(postHtml);
                    // Extract post content
                    post.content = post$(this.element.contentPost).html() || '';
                    posts.push(post);
                } catch (error) {
                    console.error(`Error fetching post content from ${post.link}:`, error.message);
                }
            }
        }
        // Save posts data to an Excel file
        let workbook = xlsx.utils.book_new();
        let worksheetData = posts.map(post => ({
            'Title': post.title,
            'Link': post.link,
            'Thumnail': post.image,
            'Category': post.category,
            'Time publish': post.time,
            'Content': post.content
        }));
        let worksheet = xlsx.utils.json_to_sheet(worksheetData);
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Posts');
        xlsx.writeFile(workbook, 'posts_new_1.csv');
    }
}

(async () => {
    try {
        const app = new PostWordpress();
        await app.main();
    } catch (error) {
        console.error(error);
        process.exit();
    }
})();
