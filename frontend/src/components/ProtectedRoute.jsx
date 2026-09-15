import { Navigate, Outlet } from 'react-router-dom';
import { toast } from '../utils/toast';

const ProtectedRoute = () => {
  const userStr = localStorage.getItem('paw_pass_user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user) {
    toast.warning('로그인이 필요한 서비스입니다.');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
