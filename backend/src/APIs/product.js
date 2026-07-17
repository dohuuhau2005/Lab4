const express = require('express');
const router = express.Router();
const sql = require('mssql');
const db = require('../Config/DBConnection');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const uploadCloud = require("../config/multerCloudinary")
const cloudinary = require('cloudinary').v2;
const redisClient = require("../config/redisClient");
router.post("/product", uploadCloud.fields([
    { name: 'images', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 }]), async (req, res) => {

        const { name_product, quantities, description, price, meta_title, categories, weight } = req.body;

        try {
            const pool = await db.GetManh1DBPool();
            const request = pool.request();

            const uploadList = req.files['images'] ? req.files['images'].map(file => file.path) : [];
            const thumbnailUrl = req.files['thumbnail'] ? req.files['thumbnail'][0].path : '';
            const listImageUrls = JSON.stringify(uploadList);

            let parsedCategories = categories;
            if (typeof categories === 'string') {
                parsedCategories = JSON.parse(categories);
            }
            const jsonString = JSON.stringify(parsedCategories);

            // FIX 2 & 3: Ép kiểu INT tường minh bằng parseInt() + khai báo type sql.Int
            // Bổ sung thêm "old_price" bị thiếu

            request.input("name_product", sql.NVarChar(100), name_product)
                .input("quantities", sql.Int, parseInt(quantities))
                .input("description", sql.NVarChar(255), description)
                .input("new_price", sql.Int, parseInt(price))
                .input("weight", sql.Int, parseInt(weight))
                .input("thumbnail", sql.VarChar(255), thumbnailUrl)

                .input("meta_title", sql.NVarChar(200), meta_title)
                .input("ListCategoriesId", sql.NVarChar(sql.MAX), jsonString)
                .input("ListUrls", sql.NVarChar(sql.MAX), listImageUrls);

            // Thực thi Store Procedure
            // Thực thi Store Procedure
            const result = await request.execute('sp_InsertProduct');

            // Giả sử SP của bro có trả về ID của sản phẩm mới tạo qua recordset
            // Nếu không dùng recordset, bro tự điều chỉnh lại chỗ lấy newProductId này nhé
            const newProductId = result.recordset && result.recordset.length > 0
                ? result.recordset[0].NewProductId
                : null;

            if (newProductId) {
                try {
                    // 1. Tạo object data y hệt như cấu trúc query DB trả ra
                    const newProductCache = {
                        id_product: newProductId,
                        name_product: name_product,
                        old_price: null, // Sản phẩm mới thường chưa có giá cũ
                        new_price: parseInt(price),
                        thumbnail: thumbnailUrl,
                        quantities: parseInt(quantities)
                    };

                    // 2. Lặp qua các danh mục mà sản phẩm này vừa được thêm vào (mảng [1, 3]...)
                    for (const catId of parsedCategories) {
                        const redisKey = `Product:${catId}:all`;

                        // Kéo mảng cache hiện tại của danh mục này lên
                        const existingCacheStr = await redisClient.get(redisKey);

                        if (existingCacheStr) {
                            let productsArray = JSON.parse(existingCacheStr);

                            // 3. Đẩy sản phẩm mới lên ĐẦU mảng (Tương đương ORDER BY DESC)
                            productsArray.unshift(newProductCache);

                            // 4. Cắt đuôi để giữ đúng giới hạn TOP 60 giống logic DB
                            if (productsArray.length > 60) {
                                productsArray.pop(); // Đá văng thằng cũ nhất ở cuối mảng
                            }

                            // 5. Lưu lại xuống Redis
                            await redisClient.set(redisKey, JSON.stringify(productsArray));

                            console.log(`✅ Đã chèn thẳng SP ${newProductId} vào cache ${redisKey} (Không cần query DB)`);
                        }
                        // Lưu ý: Nếu existingCacheStr bị null (cache chưa được tạo bao giờ), 
                        // ta cứ bỏ qua. Lần đầu tiên có user vào danh mục đó, API GET sẽ tự query DB và set cache.
                    }
                } catch (cacheError) {
                    console.error("Lỗi cập nhật cache Redis sau khi insert: ", cacheError);
                }
            }


            console.log(`Đã insert thành công sản phẩm`);
            res.status(200).json({ message: "đã insert thành công" });

        } catch (error) {
            console.error("Lỗi insert danh mục: ", error);
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    })
//lấy danh sách product của admin
router.get("/AdminProduct", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = ` select distinct p.id_product,
                        p.name_product,
                        p.old_price,
                        p.new_price,
                        p.thumbnail,
                        p.quantities,
                        p.status
                    FROM Product p
                    INNER JOIN CategoriesDetails cd
                        ON p.id_product = cd.id_product
             
                    ORDER BY p.id_product DESC `
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
//phải join vào 1 list img customer
router.get("/products/:id", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `exec sp_select_particular_product @id`
        request.input("id", sql.Int, parseInt(req.params.id));
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})

//phải join vào 1 list img Admin
router.get("/productsAdmin/:id", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `exec sp_select_particular_product_admin @id`
        request.input("id", sql.Int, parseInt(req.params.id));
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
router.get("/products", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select * from Product`
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})


router.get("/TablePriceProducts", async (req, res) => {
    try {
        const pool = await db.GetManh1DBPool();
        const request = pool.request();
        const query = `select distinct Product.id_product, Product.name_product, Product.new_price, Product.quantities, Product.thumbnail from Product   where Product.status=1 `
        const result = await request.query(query)
        res.status(200).json({ message: "đã lấy danh sách product thành công", products: result.recordsets })
    } catch (error) {
        console.error("lỗi lấy danh sách san pham ", error);
    }
})
router.delete("/product/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool()
        const request = pool.request()
        const query = `update Product set status = -1 where id_product=@id`
        request.input("id", sql.Int, parseInt(id))
        const result = await request.query(query)
        res.status(200).json({ message: `đã xóa product ${id} thành công` })
    } catch (error) {
        console.error("lỗi lấy danh sách product ", error);
    }
})




//check lại => chia làm 2 phần update product và update image product và categories

router.put("/product/:id", uploadCloud.fields([{ name: 'thumbnail', maxCount: 1 }]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, quantities, meta_title, weight } = req.body;

        // 1. Xử lý an toàn các biến text/number (tránh lỗi NaN)
        const safeName = name ? name : null;
        const safeDescription = description ? description : null;
        const safePrice = price ? parseInt(price) : null;
        const safeQuantities = quantities ? parseInt(quantities) : null;
        const safeMetaTitle = meta_title ? meta_title : null;
        const safeWeight = weight ? parseFloat(weight) : null;
        const safeId = parseInt(id);

        // Lấy link ảnh mới nếu người dùng có upload
        const newThumbnailUrl = req.files['thumbnail'] ? req.files['thumbnail'][0].path : null;

        const pool = await db.GetManh1DBPool();
        const request = pool.request();

        // 2. LOGIC XÓA ẢNH CŨ (Nếu có up ảnh mới)
        if (newThumbnailUrl) {
            // Lấy URL ảnh cũ từ DB
            const checkPicReq = pool.request();
            checkPicReq.input("id", sql.Int, safeId);
            const oldData = await checkPicReq.query(`SELECT thumbnail FROM Product WHERE id_product = @id`);

            const oldThumbnailUrl = oldData.recordset[0]?.thumbnail;

            if (oldThumbnailUrl) {
                // Tách public_id từ URL của Cloudinary (Ví dụ: tách 'folder_name/abc123' từ URL)
                // Thường URL có dạng: https://res.cloudinary.com/ten/image/upload/v1234/folder/file.jpg
                const urlParts = oldThumbnailUrl.split('/');
                const fileNameWithExt = urlParts[urlParts.length - 1]; // Lấy "file.jpg"
                const publicId = fileNameWithExt.split('.')[0]; // Cắt đuôi ".jpg" lấy "file"

                // Nếu bro có cấu hình folder trên Cloudinary, public_id có thể cần nối thêm tên folder.
                // Hàm xóa file trên Cloudinary:
                await cloudinary.uploader.destroy(publicId).catch(err => {
                    console.error("Lỗi xóa ảnh cũ trên Cloudinary:", err);
                });
            }
        }

        // 3. CẬP NHẬT DATABASE (Thêm cột thumbnail vào COALESCE)
        const query = `
            UPDATE Product 
            SET 
                name_product = COALESCE(@name, name_product), 
                description  = COALESCE(@description, description), 
                new_price    = COALESCE(@new_price, new_price), 
                quantities   = COALESCE(@quantities, quantities), 
                meta_title   = COALESCE(@meta_title, meta_title), 
                weight       = COALESCE(@weight, weight),
                thumbnail    = COALESCE(@thumbnail, thumbnail) -- Thêm dòng này
            WHERE id_product = @id
        `;

        request.input("name", sql.NVarChar(100), safeName)
            .input("description", sql.NVarChar(255), safeDescription)
            .input("new_price", sql.Int, safePrice)
            .input("quantities", sql.Int, safeQuantities)
            .input("meta_title", sql.NVarChar(200), safeMetaTitle)
            .input("weight", sql.Decimal(10, 2), safeWeight)
            .input("thumbnail", sql.NVarChar(255), newThumbnailUrl) // Sẽ gán null nếu ko có ảnh mới, COALESCE sẽ giữ ảnh cũ
            .input("id", sql.Int, safeId);

        const result = await request.query(query);
        if (result.rowsAffected[0] > 0) {
            try {
                // 1. Lấy data mới nhất của sản phẩm từ DB
                const getNewDataReq = pool.request();
                getNewDataReq.input("id", sql.Int, parseInt(id));
                const newDataResult = await getNewDataReq.query(`exec sp_select_particular_product @id`);

                if (newDataResult.recordset && newDataResult.recordset.length > 0) {
                    const updatedProduct = newDataResult.recordset[0];

                    // 2. Dùng Redis KEYS để gom toàn bộ các mảng cache danh mục
                    // Kết quả sẽ trả về ví dụ: ['Product:1:all', 'Product:2:all', 'Product:3:all']
                    const allCategoryKeys = await redisClient.keys('Product:*:all');

                    // 3. Quét qua từng danh mục để cập nhật ngầm
                    for (const key of allCategoryKeys) {
                        const cachedListStr = await redisClient.get(key);

                        if (cachedListStr) {
                            let productsArray = JSON.parse(cachedListStr);

                            // Tìm xem sản phẩm có tồn tại trong mảng của danh mục này không
                            const index = productsArray.findIndex(p => p.id_product == id);

                            if (index !== -1) {
                                // Nếu có, ốp data mới vào và lưu lại
                                productsArray[index] = { ...productsArray[index], ...updatedProduct };
                                await redisClient.set(key, JSON.stringify(productsArray));

                                console.log(`✅ Đã cập nhật ngầm SP ${id} bên trong ${key}`);
                            }
                        }
                    }

                    // 4. (Tùy chọn) Xóa cache của trang chi tiết sản phẩm nếu bro có lưu
                    const detailCacheKey = `ProductDetail:${id}`;
                    await redisClient.del(detailCacheKey);
                }
            } catch (error) {
                console.error("Lỗi khi update mảng Redis Cache nhiều categories:", error);
            }
        }
        res.status(200).json({ message: `Đã thay đổi product ${id} thành công` });

    } catch (error) {
        console.error("Lỗi cập nhật product:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật sản phẩm" });
    }
});










//Active product
router.patch("/product/:id", async (req, res) => {
    try {
        const { id } = req.params
        const pool = await db.GetManh1DBPool();
        const request = pool.request()
        const query = `update Product set status=1 where id_product=@id`
        request.input("id", sql.Int, parseInt(id))
        const result = await request.query(query)
        res.status(200).json({ message: `đã active product ${id} thành công` })
    } catch (error) {
        console.error("lỗi active product ", error);
    }
})
module.exports = router;