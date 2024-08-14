const cheerio = require('cheerio');
const xlsx = require('xlsx');

(async () => {
    let posts = [];

    for (let index = 1; index <= 2; index++) {
        console.log("page", index);
        let url = `https://news.auhs.edu/page/${index}`;
        
        // Fetch HTML content from the URL
        const response = await fetch(url);
        const html = await response.text();
        
        // Load HTML content into cheerio
        const $ = cheerio.load(html);
        
        // Extract post information
        let postsOnPage = $('.post-content').map((i, post) => {
            let title = $(post).find('.post-header .title').text();
            let link = $(post).find('.img-link').attr('href');
            let category = $(post).find('.meta-category a').text();
            let time =  $(post).find('.post-header span').text();
            let image = $(post).find('.post-featured-img img').attr('src') || null;
            return { title, link, time, image, category };
        }).get();

        console.log("postsOnPage: ", postsOnPage);

        for (let post of postsOnPage) {
            try {
                // Fetch the HTML content of the post detail page
                const postResponse = await fetch(post.link);
                const postHtml = await postResponse.text();
                
                // Load the post detail HTML into cheerio
                const post$ = cheerio.load(postHtml);
                
                // Extract post content
                post.content = post$('.post-content .content-inner').html() || '';
                
                posts.push(post);
            } catch (error) {
                console.error(`Error fetching post content from ${post.link}:`, error.message);
            }
        }
    }

    console.log('Quá trình quét và cập nhật hoàn tất.');
})();
