import ClientDashboard from './pages/ClientDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClientProjects from './pages/ClientProjects';
import ClientAnalytics from './pages/ClientAnalytics';
import Messages from './pages/Messages';
import ClientDocuments from './pages/ClientDocuments';
import ClientBilling from './pages/ClientBilling';
import ClientSettings from './pages/ClientSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientDashboard": ClientDashboard,
    "PartnerDashboard": PartnerDashboard,
    "AdminDashboard": AdminDashboard,
    "ClientProjects": ClientProjects,
    "ClientAnalytics": ClientAnalytics,
    "Messages": Messages,
    "ClientDocuments": ClientDocuments,
    "ClientBilling": ClientBilling,
    "ClientSettings": ClientSettings,
}

export const pagesConfig = {
    mainPage: "ClientDashboard",
    Pages: PAGES,
    Layout: __Layout,
};