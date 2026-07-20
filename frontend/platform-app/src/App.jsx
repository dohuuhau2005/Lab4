import './App.css';
import { Routes, Route } from "react-router-dom";
import { Login } from './pages/loginpage/login';
import AdminLayout from './pages/admin/AdminLayout';
import Categories from './pages/admin/Categories';
import HuntVoucher from './pages/customer/HuntVoucher';
import PriceTable from './pages/admin/PriceTable';
import Voucher from './pages/admin/Voucher';
import ProductList from './pages/customer/ProductList';
import CheckoutPage from './pages/customer/CheckoutPage';
import CustomerLayout from './pages/customer/CustomerLayout';
import ProductDetail from './pages/customer/ProductDetail';
import DeliveryPricePage from './pages/delivery/DeliveryPricePage';
import CartPage from './pages/customer/CartPage';
import ProductAdmin from './pages/admin/ProductAdmin';
import ProductAdminDetail from './pages/admin/ProductAdminDetail';
import ProductAdminAdd from './pages/admin/ProductAdminAdd';
import OrderHistory from './pages/customer/OrderHistory';
import AdminOrderManagement from './pages/admin/AdminOrderManagement';
import DeliveryOrderManagement from './pages/delivery/DeliveryOrderManagement';
function App() {
  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/admin' element={<AdminLayout />}>
        <Route path='categories' element={<Categories />} />
        <Route path='pricetable' element={<PriceTable />} />
        <Route path='voucher' element={<Voucher />} />
        <Route path='products' element={<ProductAdmin />} />
        <Route path='products/:id' element={<ProductAdminDetail />} />
        <Route path='products/add' element={<ProductAdminAdd />} />
        <Route path='orders' element={<AdminOrderManagement />} />
      </Route>

      <Route path='/customer' element={<CustomerLayout />}>
        <Route path='products' element={<ProductList />} />
        <Route path="products/product/:slugId" element={<ProductDetail />} />
        <Route path='cart' element={<CartPage />} />
        <Route path='checkout' element={<CheckoutPage />} />
        <Route path='products/hunt-voucher' element={<HuntVoucher />} />
        <Route path='order-history' element={<OrderHistory />} />
      </Route>
      <Route path='/delivery/offer' element={<DeliveryPricePage />} />
      <Route path='delivery/orders' element={<DeliveryOrderManagement />} />

    </Routes>
  );
}

export default App;