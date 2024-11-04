import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedinUser } from "../helpers/api_helper";

const Navdata = () => {
    const history = useNavigate();
    const [iscurrentState, setIscurrentState] = useState('Dashboard');
    
    const [isDashboard, setIsDashboard] = useState(false);
    const [isPrenotazioni, setIsPrenotazioni] = useState(false);
    const [isSalaPrenotazioni, setIsSalaPrenotazioni] = useState(false);
    const [isAnagrafiche, setIsAnagrafiche] = useState(false);
    const [isInvoices, setIsInvoices] = useState(false);
    const [isWarehouse, setIsWarehouse] = useState(false);
    const [isSettingTables, setIsSettingTables] = useState(false);
    
    function updateIconSidebar(e) {
        if (e && e.target && e.target.getAttribute("subitems")) {
            const ul = document.getElementById("two-column-menu");
            const iconItems = ul.querySelectorAll(".nav-icon.active");
            iconItems.forEach((item) => {
                item.classList.remove("active");
                const id = item.getAttribute("subitems");
                if (document.getElementById(id))
                    document.getElementById(id).classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState === 'Widgets') {
            history("/widgets");
            document.body.classList.add('twocolumn-panel');
        }
    }, [history, iscurrentState]);

    const userProfileSession = getLoggedinUser();
    const isAdmin = userProfileSession.data.ruolo === "admin";
    const hasPos = userProfileSession.data.azienda.pos;
    const menuItems = hasPos ? [
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Dashboards",
            icon: "ri-dashboard-3-line",
            link: "/dashboard-projects",
            stateVariables: isDashboard,
            click: (e) => {
                e.preventDefault();
                setIsDashboard(!isDashboard);
                setIscurrentState('Dashboard');
                updateIconSidebar(e);
            },
        },
        {
            id: "pos",
            label: "Negozio",
            icon: "ri-cup-line",
            link: "/apps-pos"
        },
        {
            id: "sala",
            label: "Sala",
            icon: "ri-restaurant-line",
            link: "/apps-menu-mobile"
        },
        {
            id: "anagrafiche",
            label: "Anagrafiche",
            icon: "ri-team-fill",
            link: "/#",
            click: (e) => {
                e.preventDefault();
                setIsAnagrafiche(!isAnagrafiche);
                setIscurrentState('Anagrafiche');
                updateIconSidebar(e);
            },
            stateVariables: isAnagrafiche,
            subItems: [
                { id: "clienti", label: "Clienti", link: "/clienti", parentId: "anagrafiche" },
                { id: "fornitori", label: "Fornitori", link: "/fornitori", parentId: "anagrafiche" }
            ]
        },
        {
            id: 'invoices',
            label: "Fatture",
            icon: "ri-bill-line",
            link: "&#",
            click: (e) => {
                e.preventDefault();
                setIsInvoices(!isInvoices);
                setIscurrentState('Invoices');
                updateIconSidebar(e);
            },
            stateVariables: isInvoices,
            subItems: [
                { id: "fatture", label: "Nuova", link: "/fatture/nuova", parentId: "invoices" },
                { id: "fatture", label: "Elenco Fatture", link: "/fatture", parentId: "invoices" }
            ]
        },
        {
            id: "warehouse",
            label: "Magazzino",
            icon: "ri-building-line",
            link: "/#",
            click: (e) => {
                e.preventDefault();
                setIsWarehouse(!isWarehouse);
                setIscurrentState('Warehouse');
                updateIconSidebar(e);
            },
            stateVariables: isWarehouse,
            subItems: [
                { id: "articoli", label: "Articoli", link: "/articoli", parentId: "warehouse" },
                { id: "ingredienti", label: "Ingredienti", link: "/ingredienti", parentId: "warehouse" },
                { id: "varianti", label: "Varianti", link: "/varianti", parentId: "warehouse" },
                { id: "magazzino", label: "Movimenti", link: "/movimenti-magazzino", parentId: "warehouse" },
                { id: "inventario", label: "Inventario", link: "/magazzino/inventario", parentId: "warehouse" }
            ]
        },
        {
            id: "setting-tables",
            label: "Tabelle",
            icon: "ri-settings-3-fill",
            link: "/#",
            click: (e) => {
                e.preventDefault();
                setIsSettingTables(!isSettingTables);
                setIscurrentState('SettingTables');
                updateIconSidebar(e);
            },
            stateVariables: isSettingTables,
            subItems: [
                { id: "categories", label: "Categorie", link: "/categorie", parentId: "setting-tables" },
                { id: "um", label: "Unità di misura", link: "/um", parentId: "setting-tables" },
                { id: "codiva", label: "Codici Iva", link: "/codiva", parentId: "setting-tables" },
                { id: "tavoli", label: "Tavoli", link: "/tavoli", parentId: "setting-tables" },
                { id: "banche", label: "Banche", link: "/banche", parentId: "setting-tables" },
                { id: "pagamenti", label: "Pagamenti", link: "/pagamenti", parentId: "setting-tables" },
                { id: "reparti", label: "Reparti", link: "/reparti", parentId: "setting-tables" },
                { id: "reparti", label: "Numerazioni", link: "/sezionali", parentId: "setting-tables" },
               
            ]
        }
    ] : isAdmin ? [
        // Menu items for users without the `pos` property can go here (similar to above).
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Dashboards",
            icon: "ri-dashboard-3-line",
            link: "/dashboard-reservations",
            stateVariables: isDashboard,
            click: (e) => {
                e.preventDefault();
                setIsDashboard(!isDashboard);
                setIscurrentState('Dashboard');
                updateIconSidebar(e);
            },
        },
        {
            id: "prenotazioni",
            label: "Prenotazioni",
            icon: "ri-calendar-2-line",
            link: "/prenotazioni",
            stateVariables: isPrenotazioni,
            click: (e) => {
                e.preventDefault();
                setIsPrenotazioni(!isPrenotazioni);
                setIscurrentState('Prenotazioni');
                updateIconSidebar(e);
            },
        },
        {
            id: "sala-prenotazioni",
            label: "Sala",
            icon: "ri-restaurant-line",
            link: "/sala",
            stateVariables: isSalaPrenotazioni,
            click: (e) => {
                e.preventDefault();
                setIsSalaPrenotazioni(!isSalaPrenotazioni);
                setIscurrentState('Sala');
                updateIconSidebar(e);
            },
        },
        {
            id: "anagrafiche",
            label: "Anagrafiche",
            icon: "ri-team-fill",
            link: "/#",
            click: (e) => {
                e.preventDefault();
                setIsAnagrafiche(!isAnagrafiche);
                setIscurrentState('Anagrafiche');
                updateIconSidebar(e);
            },
            stateVariables: isAnagrafiche,
            subItems: [
                { id: "clienti", label: "Clienti", link: "/clienti", parentId: "anagrafiche" },
                
            ]
        },
        
        {
            id: "setting-tables",
            label: "Tabelle",
            icon: "ri-settings-3-fill",
            link: "/#",
            click: (e) => {
                e.preventDefault();
                setIsSettingTables(!isSettingTables);
                setIscurrentState('SettingTables');
                updateIconSidebar(e);
            },
            stateVariables: isSettingTables,
            subItems: [ 
                { id: "negozi", label: "Negozi", link: "/negozi", parentId: "setting-tables" },               
                { id: "tavoli", label: "Tavoli", link: "/tavoli", parentId: "setting-tables" },
                { id: "orari", label: "Orari", link: "/orari", parentId: "setting-tables" },
                { id: "turni", label: "Turni", link: "/turni", parentId: "setting-tables" },
                { id: "festivita", label: "Festività", link: "/festivita", parentId: "setting-tables" },                   
                
            ]
        }
    ]: [
        {
            id: "prenotazioni",
            label: "Prenotazioni",
            icon: "ri-calendar-2-line",
            link: "/prenotazioni",
            stateVariables: isPrenotazioni,
            click: (e) => {
                e.preventDefault();
                setIsPrenotazioni(!isPrenotazioni);
                setIscurrentState('Prenotazioni');
                updateIconSidebar(e);
            },
        },
        {
            id: "sala-prenotazioni",
            label: "Sala",
            icon: "ri-restaurant-line",
            link: "/sala",
            stateVariables: isSalaPrenotazioni,
            click: (e) => {
                e.preventDefault();
                setIsSalaPrenotazioni(!isSalaPrenotazioni);
                setIscurrentState('Sala');
                updateIconSidebar(e);
            },
        },

    ]

    return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
