create database lab4
use lab4
-- =============================================
-- 1. TẠO CÁC BẢNG ĐỘC LẬP / BẢNG GỐC TRƯỚC
-- =============================================

CREATE TABLE [User] (
    id_user VARCHAR(26) PRIMARY KEY,
    password varchar(255),
    salt VARCHAR(8),
    role VARCHAR(30),
    id_google VARCHAR(26),
	email VARCHAR(255),
	is_locked bit
);
insert into [User]  (id_user,password,salt,role,email) values ('Admin123','db129917eea2087d0d5865394ab68f2da182f7b274a4d4822f8ac545b707ba5fac4bb8afee9bf2929d7f49a51850ae75a38871fd8ef6c16be9a494f3dfd71aa5','ABCDef','STAFF','admin@gmail.com');--pass 123456
insert into Staff ( id_staff,id_user,first_name,last_name ,position) values ( 'Admin1235','Admin123','Admin','system','ADMIN')
alter table [User] add is_locked bit default 0

--company
insert into [User]  (id_user,password,salt,role,email) values ('company123','db129917eea2087d0d5865394ab68f2da182f7b274a4d4822f8ac545b707ba5fac4bb8afee9bf2929d7f49a51850ae75a38871fd8ef6c16be9a494f3dfd71aa5','ABCDef','COMPANY','company1@gmail.com');--pass 123456
insert into company (Name,id_user,id_tax) values (N'Công ty ABC','company123','651256455')
select * from categories
select * from Product
CREATE TABLE categories (
    id_categories INT PRIMARY KEY IDENTITY(1,1), -- Tự tăng
    name NVARCHAR(30) 
);

CREATE TABLE Voucher (
    id_voucher VARCHAR(10) PRIMARY KEY,
    quantities INT,
    time_deploy DATETIME,
    time_end DATETIME,
    name NVARCHAR(30),
    discount INT,
    type VARCHAR(20),
    is_Locked BIT
);

-- =============================================
-- 2. TẠO CÁC BẢNG THỰC THỂ CẤP 1 (Tham chiếu đến User)
-- =============================================

CREATE TABLE Customer (
    id_user VARCHAR(26) PRIMARY KEY,
    first_name NVARCHAR(20),
    last_name NVARCHAR(20),
    point INT,
    grade VARCHAR(20),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE Staff (
    id_staff VARCHAR(10) PRIMARY KEY,
    id_user VARCHAR(26),
    first_name NVARCHAR(20),
    last_name NVARCHAR(20),
    position VARCHAR(30),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE company (
    id_company INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(25),
    id_user VARCHAR(26),
    id_tax VARCHAR(50),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE DeliverySystem (
    id_delivery_system INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(30),
    id_tax VARCHAR(20),
    id_user VARCHAR(26),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE InfoDelivery (
    id_Info BIGINT PRIMARY KEY IDENTITY(1,1),
    id_user VARCHAR(26),
    address NVARCHAR(255),
    phone VARCHAR(10),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE payment (
    id_payment VARCHAR(30) PRIMARY KEY,
    id_user VARCHAR(26),
    total_price INT,
    status BIT,
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE Cart (
    id_user VARCHAR(26)PRIMARY KEY ,
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE VoucherHunting (
    id_user VARCHAR(26),
    id_voucher VARCHAR(10),
    PRIMARY KEY (id_user, id_voucher),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user),
    FOREIGN KEY (id_voucher) REFERENCES Voucher(id_voucher)
);

-- =============================================
-- 3. TẠO CÁC BẢNG CẤP 2 VÀ CẤP 3
-- =============================================

CREATE TABLE DeliveryPrice (
    id_offer INT PRIMARY KEY IDENTITY(1,1),
    min_weight INT,
    max_weight INT,
    over_weight_price INT,
    external_price INT,
    internal_price INT,
    id_delivery_system INT,
    time_delivery VARCHAR(20),
    FOREIGN KEY (id_delivery_system) REFERENCES DeliverySystem(id_delivery_system)
);

CREATE TABLE Product (
    id_product BIGINT PRIMARY KEY IDENTITY(1,1),
    name_product VARCHAR(100),
    quantities INT,
    description NVARCHAR(255),
    old_price INT,
    new_price INT,
 
    id_company INT,
    meta_title NVARCHAR(200),
	thumbnail varchar(255),
    id_chunk VARCHAR(100),
    FOREIGN KEY (id_company) REFERENCES company(id_company)
);
alter table Product add status bit default 0
CREATE TABLE images (
    id_img BIGINT PRIMARY KEY IDENTITY(1,1),
    image_url varchar(255),
    id_product BIGINT,
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
);

CREATE TABLE CategoriesDetails (
    id_product BIGINT,
    id_categories INT,
    PRIMARY KEY (id_product, id_categories),
    FOREIGN KEY (id_product) REFERENCES Product(id_product),
    FOREIGN KEY (id_categories) REFERENCES categories(id_categories)
);

CREATE TABLE CartDetails (
    id_cart_detail BIGINT PRIMARY KEY IDENTITY(1,1),
    id_cart VARCHAR(26),
    id_product BIGINT,
    quantities INT,
    FOREIGN KEY (id_cart) REFERENCES Cart(id_user),
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
);

CREATE TABLE [Order] (
    id_order INT PRIMARY KEY IDENTITY(1,1),
    id_user VARCHAR(26),
    total_price INT,
    status BIT,
    id_payment VARCHAR(30),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user),
    FOREIGN KEY (id_payment) REFERENCES payment(id_payment)
);

CREATE TABLE Order_details (
    id_order_detail BIGINT PRIMARY KEY IDENTITY(1,1),
    id_order INT,
    id_user VARCHAR(26),
    name_product VARCHAR(100),
    img1 varchar(255),
    price INT,
    measure NVARCHAR(10),
    FOREIGN KEY (id_order) REFERENCES [Order](id_order)
);


	
	CREATE PROCEDURE sp_InsertProduct
    @name_product VARCHAR(100),
    @quantities INT,
    @description NVARCHAR(255),
    
    @new_price INT,
	@thumbnail varchar(255),
    @id_company INT,
    @meta_title NVARCHAR(200),

    @ListUrls NVARCHAR(MAX), -- Chuỗi JSON chứa list link ảnh từ Node.js gửi xuống
	@ListCategoriesId NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Khai báo biến để hứng ID sản phẩm mới
        DECLARE @new_id_product BIGINT;

        -- 2. Insert vào bảng Product
        INSERT INTO Product (name_product, quantities, description, new_price, id_company, meta_title,thumbnail)
        VALUES (@name_product, @quantities, @description, @new_price, @id_company, @meta_title,@thumbnail);

        -- 3. Bắt lấy ID tự tăng vừa sinh ra gán vào biến
        SET @new_id_product = SCOPE_IDENTITY();

        -- 4. Bóc tách JSON để insert toàn bộ list ảnh vào bảng images
        IF @ListUrls IS NOT NULL AND ISJSON(@ListUrls) = 1
        BEGIN
            INSERT INTO images (id_product, image_url)
            SELECT @new_id_product, value 
            FROM OPENJSON(@ListUrls);
        END
      -- 5. Bóc tách JSON để insert toàn bộ list categories vào bảng CategoriesDetails
        IF @ListCategoriesId IS NOT NULL AND ISJSON(@ListCategoriesId) = 1
        BEGIN
            INSERT INTO CategoriesDetails (id_product, id_categories)
            SELECT @new_id_product, CAST(value AS INT) 
            FROM OPENJSON(@ListCategoriesId);
        END
        -- Nếu mọi thứ ngon lành thì commit
        COMMIT TRANSACTION;

        -- Trả về ID vừa tạo để Backend nhận bài làm dữ liệu phản hồi
        SELECT @new_id_product AS NewProductId;

    END TRY
    BEGIN CATCH
        -- Có biến cố xảy ra thì hoàn tác toàn bộ
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
