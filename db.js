const sql = require("mssql");

const config = {
  user: "sa",
  password: "Sang123>",
  server: "localhost",
  database: "Thuvienhoasen",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

/**
 * Hàm kết nối tới cơ sở dữ liệu SQL Server.
 * @returns {Object} - Đối tượng kết nối SQL Server (pool).
 * @throws {Error} - Lỗi nếu không thể kết nối.
 */
async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server");
    return pool;
  } catch (err) {
    console.error("Database connection error:", err);
    throw err;
  }
}

/**
 * Hàm lấy các bài viết trong phạm vi `post_id`, nối với bảng `vnvn_object` theo `post_id` = `object_id`.
 * @param {Object} pool - Đối tượng kết nối SQL đã được mở.
 * @param {Number} startId - `post_id` bắt đầu.
 * @param {Number} endId - `post_id` kết thúc.
 * @returns {Array} - Danh sách các bài viết với dữ liệu từ cả hai bảng `vnvn_post` và `vnvn_object`.
 * @throws {Error} - Lỗi nếu không thể truy vấn cơ sở dữ liệu.
 */
async function getPostsInRange(pool, startId, endId) {
  try {
    const query = `
      SELECT 
        p.post_id, 
        p.post_title, 
        p.post_style, 
        p.post_isActive, 
        p.post_sqlyear, 
        p.post_sqlmonth, 
        p.post_sqlday, 
        p.post_isBook, 
        o.object_name, 
        o.object_title, 
        o.object_author,
        pd.postdata_contentHTML  -- Lấy trường postdata_contentHTML từ bảng vnvn_postdata
      FROM vnvn_post p
      LEFT JOIN vnvn_object o ON p.post_id = o.object_id
      LEFT JOIN vnvn_postdata pd ON p.post_id = pd.postdata_postid  -- Thêm join với bảng vnvn_postdata
      WHERE p.post_id BETWEEN @startId AND @endId
        AND p.post_isActive = 1 AND p.post_style = 'post'
      ORDER BY p.post_id DESC
    `;
    
    const result = await pool
      .request()
      .input("startId", sql.Int, startId) 
      .input("endId", sql.Int, endId)  
      .query(query);

    if (result.recordset.length === 0) {
      console.log(`No active posts found between post_id ${startId} and ${endId}`);
    }

    return result.recordset;
  } catch (err) {
    console.error("SQL error:", err);
    throw err;
  }
}


/**
 * Hàm lấy nội dung `postdata_contentHTML` từ bảng `vnvn_postdata` dựa trên `postdata_postid`.
 * @param {Object} pool - Đối tượng kết nối SQL đã được mở.
 * @param {Number} postId - ID bài viết cần lấy nội dung.
 * @returns {String} - Nội dung HTML của bài viết.
 * @throws {Error} - Lỗi nếu không thể truy vấn cơ sở dữ liệu.
 */
async function getPostData(pool, postId) {
  try {
    const result =
      await pool.query`SELECT postdata_contentHTML FROM vnvn_postdata WHERE postdata_postid = ${postId}`;
    return result.recordset[0].postdata_contentHTML; // Trả về nội dung HTML
  } catch (err) {
    console.error("SQL error", err);
    throw err;
  }
}

module.exports = {
  connectDB,
  getPostData,
  getPostsInRange,
};
