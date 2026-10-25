"""Idempotently insert the Phin & Bean product catalog."""

from datetime import datetime, timedelta

from sqlalchemy import func

from app.core.security import get_password_hash
from app.models.order import Order, OrderItem
from app.db.session import SessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.review import Review
from app.models.user import User

CATEGORIES = [
    {
        "name": "Cà phê hạt rang",
        "slug": "ca-phe-hat-rang",
        "image_url": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
        "sort_order": 1,
    },
    {
        "name": "Cà phê phin/bột",
        "slug": "ca-phe-phin-bot",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
        "sort_order": 2,
    },
    {
        "name": "Cold brew & pha sẵn",
        "slug": "cold-brew-pha-san",
        "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
        "sort_order": 3,
    },
    {
        "name": "Dụng cụ pha chế",
        "slug": "dung-cu-pha-che",
        "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
        "sort_order": 4,
    },
    {
        "name": "Quà tặng",
        "slug": "qua-tang",
        "image_url": "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=900&q=80",
        "sort_order": 5,
    },
]

PRODUCTS = [
    {
        "name": "Hạt Arabica Cầu Đất rang vừa",
        "slug": "hat-arabica-cau-dat-rang-vua",
        "description": "Arabica từ vùng cao Cầu Đất có vị chua thanh của cam chín, độ đắng nhẹ, hương hoa nhài và mật ong. Rang vừa để giữ hậu vị ngọt sạch. Phù hợp pha pour-over, V60 hoặc máy espresso.",
        "price": 185000,
        "sale_price": 165000,
        "stock": 24,
        "category": "ca-phe-hat-rang",
        "image": "photo-1447933601403-0c6688de566e",
    },
    {
        "name": "Hạt Robusta Buôn Ma Thuột",
        "slug": "hat-robusta-buon-ma-thuot",
        "description": "Robusta tuyển chọn từ Buôn Ma Thuột, vị đậm dày, độ đắng rõ, ít chua, thoảng hương cacao và hạt dẻ. Hậu vị kéo dài, rất hợp pha phin truyền thống hoặc espresso sữa.",
        "price": 145000,
        "sale_price": None,
        "stock": 32,
        "category": "ca-phe-hat-rang",
        "image": "photo-1559056199-641a0ac8b55e",
    },
    {
        "name": "Phối trộn Sáng Êm 70/30",
        "slug": "phoi-tron-sang-em-70-30",
        "description": "Phối 70% Arabica và 30% Robusta tạo vị cân bằng, đắng dịu, chua rất nhẹ, hương caramel và chocolate sữa. Dễ uống mỗi sáng, pha ngon bằng máy espresso hoặc phin giấy.",
        "price": 169000,
        "sale_price": None,
        "stock": 28,
        "category": "ca-phe-hat-rang",
        "image": "photo-1498804103079-a6351b050096",
    },
    {
        "name": "Hạt Arabica Honey Sơn La",
        "slug": "hat-arabica-honey-son-la",
        "description": "Arabica sơ chế honey từ Sơn La mang vị chua táo xanh dịu, độ đắng thấp, hương mơ khô và đường nâu. Thể chất mềm mượt, hợp V60, Kalita hoặc French press.",
        "price": 215000,
        "sale_price": 195000,
        "stock": 18,
        "category": "ca-phe-hat-rang",
        "image": "photo-1501339847302-ac426a4a7cbb",
    },
    {
        "name": "Hạt Espresso Đêm Sâu",
        "slug": "hat-espresso-dem-sau",
        "description": "Hạt rang đậm phối Arabica và Robusta với vị đắng mạnh, gần như không chua, hương cacao đen, khói gỗ và caramel cháy. Tạo lớp crema dày cho espresso, cappuccino và bạc xỉu.",
        "price": 175000,
        "sale_price": None,
        "stock": 20,
        "category": "ca-phe-hat-rang",
        "image": "photo-1511920170033-f8396924c348",
    },
    {
        "name": "Hạt Arabica Decaf dịu nhẹ",
        "slug": "hat-arabica-decaf-diu-nhe",
        "description": "Arabica khử caffeine bằng nước, vị dịu ngọt như chocolate sữa, đắng rất nhẹ, chua thấp và thoảng hương hạnh nhân. Thích hợp pour-over hoặc espresso cho buổi tối.",
        "price": 285000,
        "sale_price": None,
        "stock": 11,
        "category": "ca-phe-hat-rang",
        "image": "photo-1509042239860-f550ce710b93",
    },
    {
        "name": "Hạt Culi Robusta rang mộc",
        "slug": "hat-culi-robusta-rang-moc",
        "description": "Hạt Culi tròn tuyển tay, vị đậm, đắng vừa đến mạnh, ít chua, hương ngũ cốc rang và chocolate đen. Rang mộc không tẩm bơ, phù hợp pha phin và máy pha espresso.",
        "price": 158000,
        "sale_price": None,
        "stock": 16,
        "category": "ca-phe-hat-rang",
        "image": "photo-1517701604599-bb29b565090c",
    },
    {
        "name": "Cà phê phin Mộc Bản",
        "slug": "ca-phe-phin-moc-ban",
        "description": "Bột xay cỡ phin từ Robusta và Arabica Việt Nam, vị đậm vừa, đắng tròn, chua thấp, thơm cacao và mạch nha. Không hương liệu, pha phin với nước 92–96°C để có ly cà phê sữa cân bằng.",
        "price": 98000,
        "sale_price": 89000,
        "stock": 40,
        "category": "ca-phe-phin-bot",
        "image": "photo-1495474472287-4d71bcdd2085",
    },
    {
        "name": "Cà phê phin Sữa Đá",
        "slug": "ca-phe-phin-sua-da",
        "description": "Bột rang đậm dành riêng cho cà phê sữa đá, độ đắng rõ để không bị nhạt khi thêm sữa, hầu như không chua, hương chocolate và caramel. Pha phin nhỏ giọt, thêm sữa đặc và đá.",
        "price": 112000,
        "sale_price": None,
        "stock": 35,
        "category": "ca-phe-phin-bot",
        "image": "photo-1509042239860-f550ce710b93",
    },
    {
        "name": "Bột Arabica pha giấy lọc",
        "slug": "bot-arabica-pha-giay-loc",
        "description": "Arabica Cầu Đất xay sẵn cỡ medium, vị chua cam dịu, đắng nhẹ, hương hoa và mật ong. Dùng cho V60, Kalita và bình drip; nên rót nước theo vòng tròn trong khoảng 2 phút rưỡi.",
        "price": 125000,
        "sale_price": None,
        "stock": 26,
        "category": "ca-phe-phin-bot",
        "image": "photo-1442512595331-e89e73853f31",
    },
    {
        "name": "Cà phê bột Bạc Xỉu",
        "slug": "ca-phe-bot-bac-xiu",
        "description": "Bột phối trộn thiên Arabica, vị thơm ngọt, đắng nhẹ và ít chua để kết hợp sữa tươi. Hương vanilla tự nhiên và chocolate sữa. Pha phin đậm đặc rồi thêm sữa, đá theo khẩu vị.",
        "price": 105000,
        "sale_price": None,
        "stock": 22,
        "category": "ca-phe-phin-bot",
        "image": "photo-1498804103079-a6351b050096",
    },
    {
        "name": "Phin giấy Arabica tiện lợi",
        "slug": "phin-giay-arabica-tien-loi",
        "description": "Túi phin giấy chứa Arabica xay tươi, vị chua nhẹ như cam, độ đắng thấp và hương hoa quả chín. Chỉ cần đặt lên cốc, rót nước nóng hai lần; tiện mang đi làm hoặc du lịch.",
        "price": 75000,
        "sale_price": None,
        "stock": 30,
        "category": "ca-phe-phin-bot",
        "image": "photo-1511537190424-bbbab87ac5eb",
    },
    {
        "name": "Cà phê phin rang đậm Tây Nguyên",
        "slug": "ca-phe-phin-rang-dam-tay-nguyen",
        "description": "Robusta rang đậm vùng Tây Nguyên, vị mạnh, đắng sâu, ít chua, hương khói nhẹ và cacao. Xay cỡ phin, hợp với người thích cà phê đen đá đậm hoặc pha cùng sữa đặc.",
        "price": 89000,
        "sale_price": None,
        "stock": 0,
        "category": "ca-phe-phin-bot",
        "image": "photo-1559056199-641a0ac8b55e",
    },
    {
        "name": "Cold brew Cam Mật Ong",
        "slug": "cold-brew-cam-mat-ong",
        "description": "Cold brew Arabica ủ lạnh 16 giờ, vị cam vàng thanh mát, gần như không đắng, chua dịu và hương mật ong. Uống lạnh trực tiếp hoặc thêm lát cam, không cần pha nóng.",
        "price": 65000,
        "sale_price": 55000,
        "stock": 19,
        "category": "cold-brew-pha-san",
        "image": "photo-1517701604599-bb29b565090c",
    },
    {
        "name": "Cold brew Đen Nguyên Bản",
        "slug": "cold-brew-den-nguyen-ban",
        "description": "Arabica và Robusta ủ lạnh chậm 18 giờ, vị chocolate mượt, đắng thấp, chua rất nhẹ và hậu vị ngọt. Dùng ngon khi ướp lạnh, thêm đá hoặc pha cùng tonic.",
        "price": 59000,
        "sale_price": None,
        "stock": 23,
        "category": "cold-brew-pha-san",
        "image": "photo-1509042239860-f550ce710b93",
    },
    {
        "name": "Latte đóng chai Vị Nhà",
        "slug": "latte-dong-chai-vi-nha",
        "description": "Latte pha sẵn từ espresso Arabica, sữa tươi và chút đường mía, vị béo cân bằng, đắng nhẹ, không chua gắt, hương caramel. Lắc đều, uống lạnh và dùng trong ngày sau khi mở nắp.",
        "price": 68000,
        "sale_price": None,
        "stock": 14,
        "category": "cold-brew-pha-san",
        "image": "photo-1461023058943-07fcbe16d735",
    },
    {
        "name": "Cà phê sữa chai mang đi",
        "slug": "ca-phe-sua-chai-mang-di",
        "description": "Cà phê phin Robusta pha cùng sữa tươi, vị đậm ngọt vừa, đắng dịu, ít chua và thơm cacao. Chai tiện mang theo, lắc đều và bảo quản lạnh.",
        "price": 52000,
        "sale_price": None,
        "stock": 0,
        "category": "cold-brew-pha-san",
        "image": "photo-1461023058943-07fcbe16d735",
    },
    {
        "name": "Cold brew Trà Đào Cà Phê",
        "slug": "cold-brew-tra-dao-ca-phe",
        "description": "Cold brew Arabica nhẹ hòa cùng trà đen và đào vàng, vị chua ngọt tươi mát, độ đắng thấp, hương đào chín rõ. Uống lạnh với đá, phù hợp ngày nóng.",
        "price": 72000,
        "sale_price": None,
        "stock": 12,
        "category": "cold-brew-pha-san",
        "image": "photo-1517701604599-bb29b565090c",
    },
    {
        "name": "Phin inox 304 dáng thấp",
        "slug": "phin-inox-304-dang-thap",
        "description": "Phin inox 304 bền chắc gồm thân, nắp, gài và đáy lọc, lỗ lọc đều giúp cà phê nhỏ giọt ổn định. Dùng với bột xay cỡ phin, tráng nóng trước khi pha để giữ nhiệt tốt.",
        "price": 129000,
        "sale_price": 109000,
        "stock": 15,
        "category": "dung-cu-pha-che",
        "image": "photo-1517256064527-09c73fc73e38",
    },
    {
        "name": "Phin nhôm truyền thống",
        "slug": "phin-nhom-truyen-thong",
        "description": "Phin nhôm gọn nhẹ, giữ nhiệt nhanh với nắp gài chắc chắn và đáy lọc nhiều lỗ nhỏ. Hợp pha Robusta rang đậm; ủ bột 30 giây rồi rót nước chậm để chiết xuất đều.",
        "price": 85000,
        "sale_price": None,
        "stock": 20,
        "category": "dung-cu-pha-che",
        "image": "photo-1495474472287-4d71bcdd2085",
    },
    {
        "name": "Bộ pha V60 gốm thủ công",
        "slug": "bo-pha-v60-gom-thu-cong",
        "description": "Bộ dripper gốm V60 kèm bình thủy tinh và muỗng đong, giúp kiểm soát dòng chảy và làm nổi bật vị chua trái cây, đắng nhẹ, hương hoa của Arabica. Dùng giấy lọc cỡ phù hợp.",
        "price": 690000,
        "sale_price": 590000,
        "stock": 8,
        "category": "dung-cu-pha-che",
        "image": "photo-1498804103079-a6351b050096",
    },
    {
        "name": "Bình French press 600ml",
        "slug": "binh-french-press-600ml",
        "description": "Bình French press thủy tinh chịu nhiệt 600ml với lưới lọc inox mịn. Cho cà phê xay thô ngâm 4 phút để có thể chất đầy, vị đắng dịu và hương hạt rang tròn.",
        "price": 420000,
        "sale_price": None,
        "stock": 9,
        "category": "dung-cu-pha-che",
        "image": "photo-1501339847302-ac426a4a7cbb",
    },
    {
        "name": "Ấm rót cổ ngỗng 600ml",
        "slug": "am-rot-co-ngong-600ml",
        "description": "Ấm rót cổ ngỗng inox dung tích 600ml cho dòng nước ổn định, dễ kiểm soát khi pha V60 và Kalita. Vòi dài phù hợp rót chậm theo vòng tròn, khai thác vị ngọt và hương thơm của hạt.",
        "price": 520000,
        "sale_price": None,
        "stock": 7,
        "category": "dung-cu-pha-che",
        "image": "photo-1442512595331-e89e73853f31",
    },
    {
        "name": "Cân điện tử pha cà phê",
        "slug": "can-dien-tu-pha-ca-phe",
        "description": "Cân điện tử nhỏ gọn đo chính xác lượng hạt và nước, có đồng hồ bấm giờ để lặp lại công thức pha. Dùng cho V60, espresso và cân định lượng cà phê phin.",
        "price": 350000,
        "sale_price": None,
        "stock": 13,
        "category": "dung-cu-pha-che",
        "image": "photo-1517701604599-bb29b565090c",
    },
    {
        "name": "Bộ quà Phin & Bean Khởi Đầu",
        "slug": "bo-qua-khoi-dau",
        "description": "Hộp quà khởi đầu gồm cà phê phin Mộc Bản, phin inox 304 và thiệp viết tay. Vị cà phê đậm vừa, đắng tròn, chua thấp, thơm cacao; món quà ấm áp cho người mới tập pha.",
        "price": 299000,
        "sale_price": 269000,
        "stock": 10,
        "category": "qua-tang",
        "image": "photo-1511537190424-bbbab87ac5eb",
    },
    {
        "name": "Hộp quà Cà phê Việt Ba Miền",
        "slug": "hop-qua-ca-phe-viet-ba-mien",
        "description": "Hộp quà ba gói Arabica Cầu Đất, Robusta Buôn Ma Thuột và phối trộn Tây Nguyên. Người nhận khám phá vị chua thanh, vị đắng mạnh và hương chocolate qua cách pha phin hoặc lọc giấy.",
        "price": 485000,
        "sale_price": None,
        "stock": 6,
        "category": "qua-tang",
        "image": "photo-1511920170033-f8396924c348",
    },
    {
        "name": "Set Pour-over Cuối Tuần",
        "slug": "set-pour-over-cuoi-tuan",
        "description": "Set dripper gốm, bình server và một gói Arabica Honey Sơn La. Vị táo xanh và mơ khô, đắng nhẹ, hương mật ong; thích hợp làm quà cho người yêu nghi thức pha cà phê thủ công.",
        "price": 890000,
        "sale_price": 790000,
        "stock": 5,
        "category": "qua-tang",
        "image": "photo-1447933601403-0c6688de566e",
    },
    {
        "name": "Giỏ quà Hương Vị Cao Nguyên",
        "slug": "gio-qua-huong-vi-cao-nguyen",
        "description": "Giỏ quà tuyển chọn gồm hạt Cầu Đất, Robusta Buôn Ma Thuột, phin nhôm và thiệp. Hai hồ sơ vị từ chua thanh, hương hoa đến đắng đậm, cacao, phù hợp gia đình nhiều gu thưởng thức.",
        "price": 1250000,
        "sale_price": None,
        "stock": 4,
        "category": "qua-tang",
        "image": "photo-1501339847302-ac426a4a7cbb",
    },
    {
        "name": "Hộp quà Cold Brew Mát Lành",
        "slug": "hop-qua-cold-brew-mat-lanh",
        "description": "Hộp quà gồm ba chai cold brew Đen Nguyên Bản, Cam Mật Ong và Trà Đào Cà Phê. Vị dịu, ít đắng, có lựa chọn chua thanh hoặc trái cây; bảo quản lạnh và dùng trực tiếp.",
        "price": 259000,
        "sale_price": None,
        "stock": 14,
        "category": "qua-tang",
        "image": "photo-1517701604599-bb29b565090c",
    },
    {
        "name": "Bộ quà Espresso Tại Nhà",
        "slug": "bo-qua-espresso-tai-nha",
        "description": "Bộ quà gồm hạt Espresso Đêm Sâu, ca đánh sữa và cốc sứ đôi. Hạt có vị đắng sâu, chua thấp, hương cacao đen; dành cho người pha espresso, cappuccino hoặc latte tại nhà.",
        "price": 1500000,
        "sale_price": 1350000,
        "stock": 3,
        "category": "qua-tang",
        "image": "photo-1509042239860-f550ce710b93",
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        categories_by_slug: dict[str, Category] = {}
        for values in CATEGORIES:
            category = (
                db.query(Category)
                .filter(Category.slug == values["slug"])
                .one_or_none()
            )
            if category is None:
                category = Category(**values)
                db.add(category)
            else:
                for field, value in values.items():
                    setattr(category, field, value)
            categories_by_slug[values["slug"]] = category

        db.flush()
        for values in PRODUCTS:
            category = categories_by_slug[values["category"]]
            product = (
                db.query(Product)
                .filter(Product.slug == values["slug"])
                .one_or_none()
            )
            product_values = {
                "name": values["name"],
                "slug": values["slug"],
                "description": values["description"],
                "price_cents": values["price"],
                "sale_price_cents": values["sale_price"],
                "stock": values["stock"],
                "images_list": [
                    f"https://images.unsplash.com/{values['image']}?auto=format&fit=crop&w=900&q=80"
                ],
                "category_id": category.id,
                "is_featured": values["slug"] in {
                    "hat-arabica-cau-dat-rang-vua",
                    "ca-phe-phin-moc-ban",
                    "cold-brew-cam-mat-ong",
                    "bo-qua-khoi-dau",
                },
                "is_active": True,
            }
            if product is None:
                product = Product(**product_values)
                db.add(product)
            else:
                for field, value in product_values.items():
                    setattr(product, field, value)

        db.flush()
        customers: list[User] = []
        for index in range(3):
            email = f"khach{index + 1}@phinbean.example"
            customer = db.query(User).filter(User.email == email).one_or_none()
            if customer is None:
                customer = User(
                    full_name=f"Khách hàng mẫu {index + 1}",
                    email=email,
                    password_hash=get_password_hash("PhinBean@123"),
                    phone=f"090000000{index + 1}",
                    address=f"Quận {index + 1}, Thành phố Hồ Chí Minh",
                    role="customer",
                )
                db.add(customer)
            customers.append(customer)

        db.flush()
        products_by_slug = {
            product.slug: product
            for product in db.query(Product).order_by(Product.id.asc()).all()
        }
        products = list(products_by_slug.values())
        if len(products) < 2:
            raise RuntimeError("Cần có ít nhất hai sản phẩm trước khi tạo dữ liệu mẫu.")

        statuses = ["completed"] * 15 + ["pending"] * 4 + ["processing"] * 2 + ["shipping"] * 2 + ["cancelled"] * 2
        review_comments = [
            "Hương thơm dễ chịu, pha buổi sáng rất hợp. Mình sẽ mua lại.",
            "Vị cân bằng, đóng gói cẩn thận và giao hàng nhanh.",
            "Chất lượng đúng như mô tả, hậu vị ngọt và không bị gắt.",
            "Mình dùng pha phin mỗi ngày, nước cà phê thơm và đậm vừa.",
            "Sản phẩm ngon, hướng dẫn pha rõ ràng. Rất đáng thử.",
            "Mùi thơm nổi bật, vị dễ uống; cả nhà đều thích.",
        ]
        purchased_pairs: list[tuple[User, Product, datetime]] = []
        now = datetime.now()
        for index, status in enumerate(statuses):
            customer = customers[index % len(customers)]
            created_at = now - timedelta(days=(index * 7) % 30, hours=index % 9)
            order_code = f"PBSEED{index + 1:04d}"
            order = db.query(Order).filter(Order.code == order_code).one_or_none()
            if order is None:
                order = Order(code=order_code, user_id=customer.id)
                db.add(order)

            order_products = [
                products[(index * 2) % len(products)],
                products[(index * 2 + 1) % len(products)],
            ]
            subtotal = 0
            for product in order_products:
                unit_price = product.sale_price_cents or product.price_cents
                subtotal += unit_price
                if status == "completed":
                    purchased_pairs.append((customer, product, created_at))

            shipping_fee = 0 if subtotal >= 500_000 else 30_000
            payment_method = ("cod", "mock_card", "vietqr")[index % 3]
            order.user_id = customer.id
            order.total_amount_cents = subtotal + shipping_fee
            order.shipping_fee_cents = shipping_fee
            order.status = status
            order.shipping_name = customer.full_name
            order.shipping_phone = customer.phone or "0900000001"
            order.shipping_address = customer.address or "Thành phố Hồ Chí Minh"
            order.payment_method = payment_method
            order.payment_status = (
                "refunded" if status == "cancelled" and payment_method == "mock_card"
                else "paid" if status == "completed" or payment_method == "mock_card"
                else "unpaid"
            )
            order.note = "Đơn hàng dữ liệu mẫu"
            order.created_at = created_at
            if not order.items:
                for product in order_products:
                    unit_price = product.sale_price_cents or product.price_cents
                    order.items.append(
                        OrderItem(
                            product_id=product.id,
                            product_name=product.name,
                            unit_price_cents=unit_price,
                            quantity=1,
                        )
                    )

        db.flush()
        for index, (customer, product, purchased_at) in enumerate(purchased_pairs):
            review = (
                db.query(Review)
                .filter(
                    Review.product_id == product.id,
                    Review.user_id == customer.id,
                )
                .one_or_none()
            )
            if review is None:
                review = Review(product_id=product.id, user_id=customer.id)
                db.add(review)
            review.rating = 4 + (index % 2)
            review.comment = review_comments[index % len(review_comments)]
            if review.created_at is None:
                review.created_at = purchased_at + timedelta(days=1)

        for product in products:
            average = (
                db.query(func.avg(Review.rating))
                .filter(Review.product_id == product.id)
                .scalar()
            )
            product.avg_rating = round(float(average or 0), 2)

        db.commit()
        print(
            f"Seeded {len(CATEGORIES)} categories, {len(PRODUCTS)} products, "
            f"{len(customers)} customers, {len(statuses)} orders, "
            f"{len(purchased_pairs)} eligible sample reviews."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
