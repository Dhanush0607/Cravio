import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CustomerLayout } from './components/layout/CustomerLayout.jsx';
import { PageLoader } from './components/common/Feedback.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AdminRoute } from './routes/AdminRoute.jsx';

const HomePage = lazy(() => import('./pages/Home/HomePage.jsx'));
const RestaurantsPage = lazy(() => import('./pages/Restaurants/RestaurantsPage.jsx'));
const SearchPage = lazy(() => import('./pages/Search/SearchPage.jsx'));
const ExplorePage = lazy(() => import('./pages/Explore/ExplorePage.jsx'));
const RestaurantDetailsPage = lazy(
  () => import('./pages/RestaurantDetails/RestaurantDetailsPage.jsx')
);
const CartPage = lazy(() => import('./pages/Cart/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage.jsx'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccess/OrderSuccessPage.jsx'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage.jsx'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage.jsx'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage.jsx'));
const InfoPage = lazy(() => import('./pages/Info/InfoPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage.jsx'));

const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage.jsx'));
const AdminRestaurantsPage = lazy(() => import('./pages/Admin/AdminRestaurantsPage.jsx'));
const AdminMenuPage = lazy(() => import('./pages/Admin/AdminMenuPage.jsx'));
const AdminOrdersPage = lazy(() => import('./pages/Admin/AdminOrdersPage.jsx'));
const AdminCustomersPage = lazy(() => import('./pages/Admin/AdminCustomersPage.jsx'));
const AdminCouponsPage = lazy(() => import('./pages/Admin/AdminCouponsPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader label="Loading Cravio…" />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="restaurants" element={<RestaurantsPage />} />
          <Route path="restaurants/:slug" element={<RestaurantDetailsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="info/:page" element={<InfoPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="menu" element={<AdminMenuPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
