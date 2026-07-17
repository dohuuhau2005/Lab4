create database lab
use lab
-- =============================================
-- 1. TẠO CÁC BẢNG ĐỘC LẬP / BẢNG GỐC TRƯỚC
-- =============================================

CREATE TABLE [User]
(
    id_user VARCHAR(26) PRIMARY KEY,
    password varchar(255),
    salt VARCHAR(8),
    role VARCHAR(30),
    id_google VARCHAR(26),
    email VARCHAR(255),
    is_locked bit
);
insert into [User]
    (id_user,password,salt,role,email)
values
    ('Admin123', 'db129917eea2087d0d5865394ab68f2da182f7b274a4d4822f8ac545b707ba5fac4bb8afee9bf2929d7f49a51850ae75a38871fd8ef6c16be9a494f3dfd71aa5', 'ABCDef', 'STAFF', 'admin@gmail.com');--pass 123456
insert into Staff
    ( id_staff,id_user,first_name,last_name ,position)
values
    ( 'Admin1235', 'Admin123', 'Admin', 'system', 'ADMIN')
alter table [User] add is_locked bit default 0

insert into [User]
    (id_user,password,salt,role,email)
values
    ('Cus1', 'db129917eea2087d0d5865394ab68f2da182f7b274a4d4822f8ac545b707ba5fac4bb8afee9bf2929d7f49a51850ae75a38871fd8ef6c16be9a494f3dfd71aa5', 'ABCDef', 'CUSTOMER', 'cus@gmail.com');--pass 123456
insert into Customer
    ( id_user,first_name,last_name )
values
    ( 'Cus1', N'Lê ', N'Văn Lâm')
insert into Cart
(id_user) values ('Cus1')
UPDATE [User] SET role='CUSTOMER' , email = 'cus@gmail.com' where id_user='Cus1'
select *
from categories
select *
from Product
select * from Voucher
alter table voucher add voucher_status int
insert into [User]
    (id_user,password,salt,role,email)
values
    ('Del1', 'db129917eea2087d0d5865394ab68f2da182f7b274a4d4822f8ac545b707ba5fac4bb8afee9bf2929d7f49a51850ae75a38871fd8ef6c16be9a494f3dfd71aa5', 'ABCDef', 'DELIVERY', 'dev@gmail.com');--pass 123456
insert into DeliverySystem
    ( id_user,name,id_tax )
values
    ( 'Del1', N'Công Ty Vận Chuyển Nhật', 'ABC123')
	delete DeliverySystem
CREATE TABLE categories
(
    id_categories INT PRIMARY KEY IDENTITY(1,1),
    -- Tự tăng
    name NVARCHAR(30)
);

CREATE TABLE Voucher
(
    id_voucher VARCHAR(10) PRIMARY KEY,
    quantities INT,
    time_deploy DATETIME,
    time_end DATETIME,
    name NVARCHAR(30),
    discount INT,
    type VARCHAR(20),
    voucher_status int
);

-- =============================================
-- 2. TẠO CÁC BẢNG THỰC THỂ CẤP 1 (Tham chiếu đến User)
-- =============================================

CREATE TABLE Customer
(
    id_user VARCHAR(26) PRIMARY KEY,
    first_name NVARCHAR(20),
    last_name NVARCHAR(20),
    point INT,
    grade VARCHAR(20),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE Staff
(
    id_staff VARCHAR(10) PRIMARY KEY,
    id_user VARCHAR(26),
    first_name NVARCHAR(20),
    last_name NVARCHAR(20),
    position VARCHAR(30),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);


CREATE TABLE DeliverySystem
(
    id_delivery_system INT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(30),
    id_tax VARCHAR(20),
    id_user VARCHAR(26),
    FOREIGN KEY (id_user) REFERENCES [User](id_user)
);

CREATE TABLE InfoDelivery
(
    id_Info BIGINT PRIMARY KEY IDENTITY(1,1),
    id_user VARCHAR(26),
    address NVARCHAR(255),
    phone VARCHAR(10),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE payment
(
    id_payment VARCHAR(30) PRIMARY KEY,
    id_user VARCHAR(26),
    total_price INT,
    status BIT,
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE Cart
(
    id_user VARCHAR(26)PRIMARY KEY ,
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user)
);

CREATE TABLE VoucherHunting
(
    id_user VARCHAR(26),
    id_voucher VARCHAR(10),
    PRIMARY KEY (id_user, id_voucher),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user),
    FOREIGN KEY (id_voucher) REFERENCES Voucher(id_voucher)
);

-- =============================================
-- 3. TẠO CÁC BẢNG CẤP 2 VÀ CẤP 3
-- =============================================

CREATE TABLE DeliveryPrice
(
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

CREATE TABLE Product
(
    id_product BIGINT PRIMARY KEY IDENTITY(1,1),
    name_product VARCHAR(100),
    quantities INT,
    description NVARCHAR(255),
    old_price INT,
    new_price INT,
	status int,

    meta_title NVARCHAR(200),
    thumbnail varchar(255),
    id_chunk VARCHAR(100),
	weight int
);
select * from Product
alter table Product add weight int default 0
alter table Product drop constraint DF__Product__status__5535A963
CREATE TABLE images
(
    id_img BIGINT PRIMARY KEY IDENTITY(1,1),
    image_url varchar(255),
    id_product BIGINT,
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
);

CREATE TABLE CategoriesDetails
(
    id_product BIGINT,
    id_categories INT,
    PRIMARY KEY (id_product, id_categories),
    FOREIGN KEY (id_product) REFERENCES Product(id_product),
    FOREIGN KEY (id_categories) REFERENCES categories(id_categories)
);

CREATE TABLE CartDetails
(
    id_cart_detail BIGINT PRIMARY KEY IDENTITY(1,1),
    id_cart VARCHAR(26),
    id_product BIGINT,
    quantities INT,
    FOREIGN KEY (id_cart) REFERENCES Cart(id_user),
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
);
ALTER TABLE CartDetails
ADD CONSTRAINT UQ_Cart_Product
UNIQUE(id_cart, id_product);
select * from CartDetails
CREATE TABLE [Order]
(
    id_order INT PRIMARY KEY IDENTITY(1,1),
    id_user VARCHAR(26),
    total_price INT,
    status BIT,
    id_payment VARCHAR(30),
    FOREIGN KEY (id_user) REFERENCES [Customer](id_user),
    FOREIGN KEY (id_payment) REFERENCES payment(id_payment)
);

CREATE TABLE Order_details
(
    id_order_detail BIGINT PRIMARY KEY IDENTITY(1,1),
    id_order INT,
    id_user VARCHAR(26),
    name_product VARCHAR(100),
    img1 varchar(255),
    price INT,
    measure NVARCHAR(10),
    FOREIGN KEY (id_order) REFERENCES [Order](id_order)
);

go
drop procedure if exists sp_InsertProduct;
go
CREATE PROCEDURE sp_InsertProduct
    @name_product VARCHAR(100),
    @quantities INT,
    @description NVARCHAR(255),

    @new_price INT,
    @thumbnail varchar(255),
	@weight int,
    @meta_title NVARCHAR(200),

    @ListUrls NVARCHAR(MAX),
    -- Chuỗi JSON chứa list link ảnh từ Node.js gửi xuống
    @ListCategoriesId NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Khai báo biến để hứng ID sản phẩm mới
        DECLARE @new_id_product BIGINT;

        -- 2. Insert vào bảng Product
        INSERT INTO Product
        (name_product, quantities, description, new_price, meta_title,thumbnail,weight)
    VALUES
        (@name_product, @quantities, @description, @new_price, @meta_title, @thumbnail,@weight);

        -- 3. Bắt lấy ID tự tăng vừa sinh ra gán vào biến
        SET @new_id_product = SCOPE_IDENTITY();

        -- 4. Bóc tách JSON để insert toàn bộ list ảnh vào bảng images
        IF @ListUrls IS NOT NULL AND ISJSON(@ListUrls) = 1
        BEGIN
        INSERT INTO images
            (id_product, image_url)
        SELECT @new_id_product, value
        FROM OPENJSON(@ListUrls);
    END
      -- 5. Bóc tách JSON để insert toàn bộ list categories vào bảng CategoriesDetails
        IF @ListCategoriesId IS NOT NULL AND ISJSON(@ListCategoriesId) = 1
        BEGIN
        INSERT INTO CategoriesDetails
            (id_product, id_categories)
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

go
--khi select các sản phẩm thì nó insert vào sau đó tới đúng ngày thì auto update sản phẩm theo tên giá 
create table PriceTable
(
    id_table bigint PRIMARY KEY IDENTITY(1,1),
    day_set datetime default GETDATE(),
    day_apply datetime ,
    now_price int,
    new_price int,
    id_product BIGINT,
    FOREIGN KEY (id_product) REFERENCES Product(id_product)
)
create index id_apply on PriceTable (day_apply)
select *
from Product
select *
from PriceTable

go
create proc sp_select_particular_product @id_product BIGINT
as
begin
SELECT
    P.id_product,
    P.name_product,
    P.new_price,
    P.old_price,
    P.quantities,
    P.thumbnail,
    P.status,
    P.description,
    P.meta_title,
    P.id_chunk,
    STRING_AGG(I.id_img, ',') AS List_id_img,
    STRING_AGG(I.image_url, ',') AS list_images
-- Gom các ảnh lại thành 1 chuỗi cách nhau bằng dấu phẩy
FROM Product P
    JOIN images I ON P.id_product = I.id_product
WHERE P.status = 1 and P.id_product=@id_product
GROUP BY 
    P.id_product, P.name_product, P.new_price, P.old_price, 
    P.quantities, P.thumbnail, P.status, P.description, 
    P.meta_title, P.id_chunk
end


exec sp_select_particular_product 4

drop proc sp_select_particular_product_admin
go
create PROC sp_select_particular_product_admin
    @id_product BIGINT
AS
BEGIN

    SELECT
        P.id_product,
        P.name_product,
        P.new_price,
        P.old_price,
        P.quantities,
        P.thumbnail,
        P.status,
        P.description,
        P.meta_title,
        P.id_chunk,
		P.weight,
        Img.List_id_img,
        Img.list_images,

        Cat.list_id_categories,
        Cat.list_name_categories

    FROM Product P

    OUTER APPLY
    (
        SELECT
            STRING_AGG(
                CAST(I.id_img AS VARCHAR(MAX)),
                ','
            ) AS List_id_img,

            STRING_AGG(
                I.image_url,
                ','
            ) AS list_images

        FROM Images I
        WHERE I.id_product = P.id_product

    ) Img

    OUTER APPLY
    (
        SELECT
            STRING_AGG(
                CAST(CA.id_categories AS VARCHAR(MAX)),
                ','
            ) AS list_id_categories,

            STRING_AGG(
                CA.name,
                ','
            ) AS list_name_categories

        FROM CategoriesDetails CD
        JOIN Categories CA
            ON CA.id_categories =
               CD.id_categories

        WHERE CD.id_product =
              P.id_product

    ) Cat

    WHERE P.id_product = @id_product
      

END
GO


select * from Product
go
create trigger tr_update_price 
on Product
after update
as
begin 
    SET NOCOUNT ON;

    -- Chỉ xử lý khi cột new_price được cập nhật
    IF UPDATE(new_price)
    BEGIN
        UPDATE p
        SET p.old_price = d.new_price
        FROM Product p
        INNER JOIN inserted i
            ON p.id_product = i.id_product
        INNER JOIN deleted d
            ON p.id_product = d.id_product
        WHERE ISNULL(i.new_price, -1) <> ISNULL(d.new_price, -1);
    END
end
go

CREATE PROCEDURE sp_ApplyPriceTable
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE p
    SET p.new_price = pt.new_price
    FROM Product p
    JOIN PriceTable pt
        ON p.id_product = pt.id_product
    WHERE pt.day_apply <= GETDATE()
      AND pt.new_price <> p.new_price;

END;
GO
ALTER PROCEDURE sp_GetUserByEmail
    @Email VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        U.id_user AS IdUser,
        U.email AS Email,
        U.password AS PasswordHash,
        U.salt AS Salt,
        U.role AS Role,
        U.id_google AS GoogleId,
        U.is_locked AS IsLocked,

        -- Staff
        S.id_staff AS StaffId,
        S.position AS Position,

        -- Delivery
        D.id_delivery_system AS DeliverySystemId,
        D.name AS DeliveryName,
        D.id_tax AS TaxCode,

        -- Tên hiển thị
        ISNULL(
            S.first_name,
            ISNULL(C.first_name, D.name)
        ) AS FirstName,

        ISNULL(
            S.last_name,
            ''
        ) AS LastName,

        -- Customer
        C.point AS Point,
        C.grade AS Grade,

        CASE
            WHEN S.id_staff IS NOT NULL THEN 'STAFF'
            WHEN D.id_delivery_system IS NOT NULL THEN 'DELIVERY'
            WHEN C.id_user IS NOT NULL THEN 'CUSTOMER'
            ELSE 'USER'
        END AS AccountType

    FROM [User] U
    LEFT JOIN Staff S
        ON U.id_user = S.id_user

    LEFT JOIN Customer C
        ON U.id_user = C.id_user

    LEFT JOIN DeliverySystem D
        ON U.id_user = D.id_user

    WHERE U.email = @Email;
END
GO

exec sp_GetUserByEmail 'dev@gmail.com'
select * from DeliverySystem
exec sp_select_particular_product_admin 4
select * from Product
update Product set name_product=N'Áo sơ mi'where id_product=4