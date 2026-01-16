import ClientDashboard from './pages/ClientDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientDashboard": ClientDashboard,
    "PartnerDashboard": PartnerDashboard,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "ClientDashboard",
    Pages: PAGES,
    Layout: __Layout,
};