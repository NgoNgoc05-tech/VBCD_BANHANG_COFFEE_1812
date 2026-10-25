import { cn } from "../lib/utils"

export default function Footer() {
  return (
    <footer className="bg-amber-50 text-zinc-600 border-t border-amber-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
            <h4 className="font-bold text-zinc-800 mb-3">Phin & Bean</h4>
            <p className="text-sm">
              Thương mại điện tử bán cà phê hạt rang, cà phê phin và dụng cụ pha chế.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-zinc-800 mb-3">Hỗ trợ</h5>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="hover:text-amber-600 transition-colors">Hỗ trợ khách hàng</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">Chính sách bảo mật</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-zinc-800 mb-3">Công thức</h5>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="hover:text-amber-600 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">Chính sách vận chuyển</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">Điều kiện trả hàng</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-zinc-800 mb-3">Thanh toán</h5>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="hover:text-amber-600 transition-colors">COD</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">Thẻ Visa/Master</a></li>
              <li><a href="#" className="hover:text-amber-600 transition-colors">VietQR</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-4 border-t border-amber-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
          <p>2026 Phin & Bean. Được làm bằng tình yêu ở Việt Nam.</p>
          <div>
            {/* Placeholder cho icon social - SVG hoặc icon font */}
            <span className="flex gap-2">
              {/* <a href="#" aria-label="Facebook" className="hover:text-blue-500">...</a> */}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}