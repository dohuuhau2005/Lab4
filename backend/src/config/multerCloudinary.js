const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Nhập API keys từ Cloudinary Dashboard của bro
cloudinary.config({
    cloud_name: process.env.Cloudinaryname,
    api_key: process.env.apikeyCloudinary,
    api_secret: process.env.apisecritCloudinary
});

// 2. Setup kho lưu trữ trung gian đẩy thẳng lên Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'Product_Images', // Tên thư mục nó sẽ tạo trên Cloudinary
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const uploadCloud = multer({ storage });

module.exports = uploadCloud;