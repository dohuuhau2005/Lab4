import './App.css';
import { Routes, Route } from "react-router-dom";
import { Login } from './pages/loginpage/login';
import AdminLayout from './pages/admin/AdminLayout';
import Categories from './pages/admin/Categories';

function App() {
  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/admin' element={<AdminLayout />}>
        <Route path='categories' element={<Categories />} />
      </Route>
    </Routes>
  );
}

export default App;