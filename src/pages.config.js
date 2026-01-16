import ClientDashboard from './pages/ClientDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClientProjects from './pages/ClientProjects';
import ClientAnalytics from './pages/ClientAnalytics';
import Messages from './pages/Messages';
import ClientDocuments from './pages/ClientDocuments';
import ClientBilling from './pages/ClientBilling';
import ClientSettings from './pages/ClientSettings';
import PartnerLeads from './pages/PartnerLeads';
import PartnerCommissions from './pages/PartnerCommissions';
import PartnerPayouts from './pages/PartnerPayouts';
import PartnerResources from './pages/PartnerResources';
import PartnerSettings from './pages/PartnerSettings';
import AdminClients from './pages/AdminClients';
import AdminProjects from './pages/AdminProjects';
import AdminPartners from './pages/AdminPartners';
import AdminLeads from './pages/AdminLeads';
import AdminPayouts from './pages/AdminPayouts';
import AdminContent from './pages/AdminContent';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminSettings from './pages/AdminSettings';
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
    "PartnerLeads": PartnerLeads,
    "PartnerCommissions": PartnerCommissions,
    "PartnerPayouts": PartnerPayouts,
    "PartnerResources": PartnerResources,
    "PartnerSettings": PartnerSettings,
    "AdminClients": AdminClients,
    "AdminProjects": AdminProjects,
    "AdminPartners": AdminPartners,
    "AdminLeads": AdminLeads,
    "AdminPayouts": AdminPayouts,
    "AdminContent": AdminContent,
    "AdminAnalytics": AdminAnalytics,
    "AdminSettings": AdminSettings,
}

export const pagesConfig = {
    mainPage: "ClientDashboard",
    Pages: PAGES,
    Layout: __Layout,
};