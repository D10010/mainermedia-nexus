/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AccountSetup from './pages/AccountSetup';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminClients from './pages/AdminClients';
import AdminCommissions from './pages/AdminCommissions';
import AdminContent from './pages/AdminContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminLeads from './pages/AdminLeads';
import AdminPackages from './pages/AdminPackages';
import AdminPartners from './pages/AdminPartners';
import AdminPayouts from './pages/AdminPayouts';
import AdminProjects from './pages/AdminProjects';
import AdminSettings from './pages/AdminSettings';
import AwaitingRole from './pages/AwaitingRole';
import ClientAnalytics from './pages/ClientAnalytics';
import ClientBilling from './pages/ClientBilling';
import ClientDashboard from './pages/ClientDashboard';
import ClientDocuments from './pages/ClientDocuments';
import ClientProjects from './pages/ClientProjects';
import ClientSettings from './pages/ClientSettings';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import PackageBuilder from './pages/PackageBuilder';
import PartnerCommissions from './pages/PartnerCommissions';
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerLeads from './pages/PartnerLeads';
import PartnerPayouts from './pages/PartnerPayouts';
import PartnerResources from './pages/PartnerResources';
import PartnerSettings from './pages/PartnerSettings';
import OwnerDashboard from './pages/OwnerDashboard';
import OwnerUsers from './pages/OwnerUsers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AccountSetup": AccountSetup,
    "AdminAnalytics": AdminAnalytics,
    "AdminClients": AdminClients,
    "AdminCommissions": AdminCommissions,
    "AdminContent": AdminContent,
    "AdminDashboard": AdminDashboard,
    "AdminLeads": AdminLeads,
    "AdminPackages": AdminPackages,
    "AdminPartners": AdminPartners,
    "AdminPayouts": AdminPayouts,
    "AdminProjects": AdminProjects,
    "AdminSettings": AdminSettings,
    "AwaitingRole": AwaitingRole,
    "ClientAnalytics": ClientAnalytics,
    "ClientBilling": ClientBilling,
    "ClientDashboard": ClientDashboard,
    "ClientDocuments": ClientDocuments,
    "ClientProjects": ClientProjects,
    "ClientSettings": ClientSettings,
    "Home": Home,
    "Messages": Messages,
    "Notifications": Notifications,
    "PackageBuilder": PackageBuilder,
    "PartnerCommissions": PartnerCommissions,
    "PartnerDashboard": PartnerDashboard,
    "PartnerLeads": PartnerLeads,
    "PartnerPayouts": PartnerPayouts,
    "PartnerResources": PartnerResources,
    "PartnerSettings": PartnerSettings,
    "OwnerDashboard": OwnerDashboard,
    "OwnerUsers": OwnerUsers,
}

export const pagesConfig = {
    mainPage: "ClientDashboard",
    Pages: PAGES,
    Layout: __Layout,
};