import AdminAnalytics from './pages/AdminAnalytics';
import AdminClients from './pages/AdminClients';
import AdminCommissions from './pages/AdminCommissions';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminLeads from './pages/AdminLeads';
import AdminPartners from './pages/AdminPartners';
import AdminPayouts from './pages/AdminPayouts';
import AdminProjects from './pages/AdminProjects';
import AdminSettings from './pages/AdminSettings';
import ClientAnalytics from './pages/ClientAnalytics';
import ClientBilling from './pages/ClientBilling';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocuments from './pages/ClientDocuments';
import ClientProjects from './pages/ClientProjects';
import ClientSettings from './pages/ClientSettings';
import Home from './pages/Home';
import Messages from './pages/Messages';
import PartnerCommissions from './pages/PartnerCommissions';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerLeads from './pages/PartnerLeads';
import PartnerPayouts from './pages/PartnerPayouts';
import PartnerResources from './pages/PartnerResources';
import PartnerSettings from './pages/PartnerSettings';
import AccountSetup from './pages/AccountSetup';
import AwaitingRole from './pages/AwaitingRole';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAnalytics": AdminAnalytics,
    "AdminClients": AdminClients,
    "AdminCommissions": AdminCommissions,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminLeads": AdminLeads,
    "AdminPartners": AdminPartners,
    "AdminPayouts": AdminPayouts,
    "AdminProjects": AdminProjects,
    "AdminSettings": AdminSettings,
    "ClientAnalytics": ClientAnalytics,
    "ClientBilling": ClientBilling,
    "ClientDashboard": ClientDashboard,
    "ClientDocuments": ClientDocuments,
    "ClientProjects": ClientProjects,
    "ClientSettings": ClientSettings,
    "Home": Home,
    "Messages": Messages,
    "PartnerCommissions": PartnerCommissions,
    "PartnerDashboard": PartnerDashboard,
    "PartnerLeads": PartnerLeads,
    "PartnerPayouts": PartnerPayouts,
    "PartnerResources": PartnerResources,
    "PartnerSettings": PartnerSettings,
    "AccountSetup": AccountSetup,
    "AwaitingRole": AwaitingRole,
}

export const pagesConfig = {
    mainPage: "ClientDashboard",
    Pages: PAGES,
    Layout: __Layout,
};