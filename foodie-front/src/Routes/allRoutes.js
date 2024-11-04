import { Navigate } from "react-router-dom";




import DashboardProject from "../pages/DashboardProject";



//Invoices
import InvoiceList from "../pages/Invoices/InvoiceList";
import InvoiceCreate from "../pages/Invoices/InvoiceCreate";
import InvoiceDetails from "../pages/Invoices/InvoiceDetails";

// Support Tickets
import ListView from '../pages/SupportTickets/ListView';
import TicketsDetails from '../pages/SupportTickets/TicketsDetails';


import BasicPasswCreate from "../pages/AuthenticationInner/PasswordCreate/BasicPasswCreate";
import CoverPasswCreate from "../pages/AuthenticationInner/PasswordCreate/CoverPasswCreate";
import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";


import Login from "../pages/Authentication/Login";
import ForgetPasswordPage from "../pages/Authentication/ForgetPassword";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";




// Landing Index

import NFTLanding from "../pages/Landing/NFTLanding";


import JobLanding from "../pages/Job_Landing/Job";


import Pos from "../pages/Pos/Pos";
import SettingTables from "../pages/SettingsTables/SettingTables";
import UnitMeasure from "../pages/UnitMeasure/UnitMeasure";
import Codiva from "../pages/Codiva/Codiva";
import Tavoli from "../pages/Tavoli/Tavoli";
import Articoli from "../pages/Articoli/Articoli";
import Clienti from "../pages/Clienti/Clienti";
import Fornitori from "../pages/Fornitori/Fornitori";
import Movimenti from "../pages/Movimenti/Movimenti";
import MenuMobilePhone from "../pages/MenuMobilePhone.js/MenuMobilePhone";
import Pagamenti from "../pages/Pagamenti/Pagamenti";
import Banche from "../pages/Banche/Banche"
import Reparti from "../pages/Reparti/Reparti";
import InvoiceEdit from "../pages/Invoices/InvoiceEdit";
import Inventario from "../pages/Inventario/Inventario";
import Sezionali from "../pages/Sezionali/Sezionali";
import Varianti from "../pages/Varianti/Varianti";
import Ingredienti from "../pages/Ingredienti/Ingredienti";
import Settings from "../pages/Pages/Profile/Settings/Settings";
import Shops from "../pages/Shops/Shops";
import Turns from "../pages/Turns/Turns";
import Orari from "../pages/Orari/Orari";
import ReservationSala from "../pages/ReservationSala/ReservationSala";
import Reservations from "../pages/ReservationSala/Reservations";
import Festivita from "../pages/Festivita/Festivita";
import { getLoggedinUser } from "../helpers/api_helper";
import DashboardReservations from "../pages/DashboardReservations/DashboardReservations";
import Users from "../pages/Users/Users";
import Datatable from "../pages/Datatable/Datatable";

const authProtectedRoutes = [
 

  { path: "/dashboard", component: <DashboardProject /> },
  {path: "/dashboard-reservations", component: <DashboardReservations />},

  //POS 
  { path: "/apps-pos", component: <Pos />},

  //Mobile Menu
  { path: "/apps-menu-mobile", component: <MenuMobilePhone />},

  // Setting Tables
  {path: "/categorie", component: <SettingTables />},
  {path: "/codiva", component : <Codiva />},
  {path: "/um", component : <UnitMeasure />},
  {path: "/tavoli", component : <Tavoli />},
  {path: "/pagamenti", component: <Pagamenti />},
  {path: "/banche", component: <Banche />},
  {path: "/reparti", component: <Reparti />},
  {path: "/sezionali", component: <Sezionali />},

  

  //Invoices
  { path: "/fatture", component: <InvoiceList /> },
  { path: "/fatture/dettaglio", component: <InvoiceDetails /> },
  { path: "/fatture/nuova", component: <InvoiceCreate /> },
  { path: "/fattura/edit", component: <InvoiceEdit />},

  //Supports Tickets
  { path: "/apps-tickets-list", component: <ListView /> },
  { path: "/apps-tickets-details", component: <TicketsDetails /> },

  
  // Reservations routes

  {path: "/negozi", component: <Shops />},
  {path:'/turni', component: <Turns />},
  {path: '/orari', component: <Orari />},
  {path: "/sala", component: <ReservationSala />},
  {path: "/prenotazioni", component: <Reservations />},
  {path: "/festivita", component: <Festivita />},
 

  
 

  // Magazzino
  {path: "/articoli", component: <Articoli />},
  {path: "/varianti", component: <Varianti />},
  {path: "/ingredienti", component: <Ingredienti />},
  {path: "/movimenti-magazzino", component: <Movimenti />},
  {path: "magazzino/inventario", component: <Inventario />},

  {path: "/datatable", component: <Datatable /> },
  



  // Anagrafiche

  {path: "/clienti", component: <Clienti />},
  {path: "/Fornitori", component: <Fornitori />},


  //User Profile
  { path: "/profile", component: <Settings /> },
  {path: "/users", component: <Users />},

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },

  { path: "*", component: <Navigate to="/dashboard" /> },
  
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPasswordPage /> },
  { path: "/register", component: <Register /> },

  //AuthenticationInner pages
  
  
  

  { path: "/nft-landing", component: <NFTLanding /> },
  { path: "/job-landing", component: <JobLanding /> },

  { path: "/auth-pass-change-basic", component: <BasicPasswCreate /> },
  { path: "/auth-pass-change-cover", component: <CoverPasswCreate /> },
  { path: "/auth-offline", component: <Offlinepage /> },
  


 


];



export { authProtectedRoutes, publicRoutes };