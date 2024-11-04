import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Nav, NavLink, NavItem, TabPane, TabContent, Button, ListGroup, ListGroupItem, CardFooter, Modal, ModalBody, ModalHeader, Input } from 'reactstrap';
import classnames from "classnames";
import { APIClient } from '../../helpers/api_helper';
import SimpleBar from 'simplebar-react';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from '../../Components/WebSocketProvider/WebSocketcontext';

import ClientiSelect from '../Clienti/ClientiSelect';
import NewCliente from '../Clienti/NewCliente';
import CalculatorWrapper from '../Calculator/CalculatorWrapper';
import Screen from '../Calculator/Screen';
import ButtonBox from '../Calculator/ButtonBox';
import CalculatorButton from '../Calculator/CalculatorButton';
import Scontrini from '../Scontrini/Scontrini';





 

const toLocaleString = (num) =>
  String(num).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, "$1 ");

const removeSpaces = (num) => num.toString().replace(/\s/g, "");



const Pos = () => {
    const [activeMainTab, setActiveMainTab] = useState("1");
    const [activeNestedTab, setActiveNestedTab] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    
    
    const [articlesByCategory, setArticlesByCategory] = useState({});
    const [tables, setTables] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedTable, setSelectedTable] = useState(1);
    const [selectedNumber, setSelectedNumber] = useState("Banco")
    const [total, setTotal] = useState(0);
    const [modalList, setModalList] = useState(false);
    const apiClient = new APIClient();
    const tablesFetched = useRef(false);
    const [modalDelete, setModalDelete] = useState(null);
    const [data, setData] = useState([]);
    const [tableBanco, setTableBanco] = useState(null)
    const [modalVarianti, setModalVarianti] = useState(false)
    const [variantiOpt, setVariantiOpt] = useState([])
    const [articleForVarianti, setArticleForVarianti] = useState([])
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [buttonDisabled, setButtonDisabled] = useState(false)
    
    const [modalPrint, setModalPrint] = useState(false)

    const [dataScontrini, setDataScontrini] = useState([]);

    const fetchDataScontrini = async () => {
        try {
            const response = await apiClient.get('/scontrini');
            if (response && response.data && Array.isArray(response.data)) {
                setDataScontrini(response.data);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchDataScontrini();
    }, []);



    const { socket } = useWebSocket();

    const [calc, setCalc] = useState({
        sign: "",
        num: 0,
        res: 0,
      });

      const handleRestoButtonClick = (value) => {
        if (value === 0) {
            // Reset `pagato` and `resto`
            setPagato(0);
            setResto(0);
        } else {
            const newPagato = pagato + value;
            setPagato(newPagato);
            setResto(newPagato - total); // Calculate change due
        }
    };
    
    const btnValues = [
        ["C", "+-", "%", "/"],
        [7, 8, 9, "X"],
        [4, 5, 6, "-"],
        [1, 2, 3, "+"],
        [0, ".", "="],
      ];
    
    const restoValues = [100, 50, 20, 10, 5, 2, 1, 0.5, 0]
    const [pagato,setPagato] = useState(0)
    const [resto, setResto] = useState(0)

    const renderRestoButtons = () => {
        return restoValues.map((value, index) => {
            const isLargeValue = value >= 10;
            const isSmallValue = value < 1;
    
            return (
                <Button
                    key={index}
                    color={"info"}
                    className="m-2"
                    style={{ 
                        width: '100px', 
                        height: '100px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Shadow
                        borderRadius: '6px'  // Rounded corners
                    }}
                    onClick={() => handleRestoButtonClick(value)}
                >
                    <div className='d-flex flex-column ' style={{ height: '100px' }}>
                        <div style={{ fontSize: "25px", margin: "auto" }}>
                            {`€ ${value}`}
                        </div>
                        
                    </div>
                </Button>
            );
        });
    };

    

      const numClickHandler = (e) => {
        e.preventDefault();
        const value = e.target.innerHTML;
    
        if (removeSpaces(calc.num).length < 16) {
          setCalc({
            ...calc,
            num:
              calc.num === 0 && value === "0"
                ? "0"
                : removeSpaces(calc.num) % 1 === 0
                ? toLocaleString(Number(removeSpaces(calc.num + value)))
                : toLocaleString(calc.num + value),
            res: !calc.sign ? 0 : calc.res,
          });
        }
      };
    
      const commaClickHandler = (e) => {
        e.preventDefault();
        const value = e.target.innerHTML;
    
        setCalc({
          ...calc,
          num: !calc.num.toString().includes(".") ? calc.num + value : calc.num,
        });
      };
    
      const signClickHandler = (e) => {
        e.preventDefault();
        const value = e.target.innerHTML;
    
        setCalc({
          ...calc,
          sign: value,
          res: !calc.res && calc.num ? calc.num : calc.res,
          num: 0,
        });
      };
    
      const equalsClickHandler = () => {
        if (calc.sign && calc.num) {
          const math = (a, b, sign) =>
            sign === "+"
              ? a + b
              : sign === "-"
              ? a - b
              : sign === "X"
              ? a * b
              : a / b;
    
          setCalc({
            ...calc,
            res:
              calc.num === "0" && calc.sign === "/"
                ? "Can't divide with 0"
                : toLocaleString(
                    math(
                      Number(removeSpaces(calc.res)),
                      Number(removeSpaces(calc.num)),
                      calc.sign
                    )
                  ),
            sign: "",
            num: 0,
          });
        }
      };
    
      const invertClickHandler = () => {
        setCalc({
          ...calc,
          num: calc.num ? toLocaleString(removeSpaces(calc.num) * -1) : 0,
          res: calc.res ? toLocaleString(removeSpaces(calc.res) * -1) : 0,
          sign: "",
        });
      };
    
      const percentClickHandler = () => {
        let num = calc.num ? parseFloat(removeSpaces(calc.num)) : 0;
        let res = calc.res ? parseFloat(removeSpaces(calc.res)) : 0;
    
        setCalc({
          ...calc,
          num: (num /= Math.pow(100, 1)),
          res: (res /= Math.pow(100, 1)),
          sign: "",
        });
      };
    
      const resetClickHandler = () => {
        setCalc({
          ...calc,
          sign: "",
          num: 0,
          res: 0,
        });
      };

      const calculateResult = () => {
        // Perform your calculation here and return the result
        const result = calc.num ? calc.num : calc.res;

        return result;

    };

    const toggleDelete = () => {
        setModalDelete(!modalDelete);
    };

    const togglePrint = () => {
        if (total !== 0) {
        setModalPrint(!modalPrint);
        }
    };

    const handleVariantiModal = (article) => {
        
        setArticleForVarianti(article)
        setVariantiOpt(article.varianti)
        toggleModalVarianti()

    }

    const handleQuantityChange = (tempId, field, value) => {
        const newCart = cart.map(item => {
          if (item.tempId === tempId) {
            // Update the specified field (quantity in this case)
            return { ...item, [field]: value };
          }
          return item; // return other items unchanged
        });
        setCart(newCart); // Assuming you're using setCart to update the state
      };
      


    const toggleModalVarianti = () => {

        setModalVarianti(!modalVarianti);
    };

    useEffect(() => {
        if (socket) {
          socket.on('tables_updated', (data) => {
            
            handleTablesUpdate(data.data);
          });
    
          return () => {
            if (socket) {
              socket.off('tables_updated');
            }
          };
        }
      }, [socket]);

      


    

      useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/categories');
                if (response && response.data && Array.isArray(response.data)) {
                    // Sort the categories by the `ordinamento` field
                    const sortedCategories = response.data.sort((a, b) => a.ordinamento - b.ordinamento);
    
                    // Set the sorted categories
                    setCategories(sortedCategories);
    
                    if (sortedCategories.length > 0) {
                        const categoryIds = sortedCategories.map(category => category.id.toString());
                        setActiveNestedTab(categoryIds[0]); // Set first category as active
                        // Fetch articles for all categories in parallel
                        await fetchArticlesForAllCategories(categoryIds);
                    }
                } else {
                    console.error('Invalid response structure:', response);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
    
        fetchCategories();
    }, []);
    
    const fetchArticlesForAllCategories = async (categoryIds) => {
        setLoadingArticles(true); // Set loading state to true before fetching
        try {
            const promises = categoryIds.map(categoryId =>
                apiClient.create('/products', { "id": categoryId })
            );
    
            const results = await Promise.all(promises);
            
            results.forEach((response, index) => {
                if (response && response.data && Array.isArray(response.data)) {
                    const categoryId = categoryIds[index];
                    setArticlesByCategory(prevState => ({
                        ...prevState,
                        [categoryId]: response.data
                    }));
                } else {
                    console.error('Invalid response structure:', response);
                }
            });
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoadingArticles(false); // Reset loading state after fetching
        }
    };
    
    
    useEffect(() => {
        if (!tablesFetched.current) {
            fetchTables();
            tablesFetched.current = true;
        }
    }, [apiClient]);



    const toggleList = () => {
        setModalList(!modalList);
    };
    const fetchTables = async () => {
        try {
            const response = await apiClient.get('/tavoli');            
    
            // Check if response is valid and contains an array of tables
            if (response && response.data && Array.isArray(response.data)) {
                const updatedTables = response.data;
    
                // Find the table with banco: true
                const tableWithBanco = updatedTables.find(table => table.banco === true);
    
                // Set the selectedTable to the one with banco: true, if it exists
                if (tableWithBanco) {
                    setSelectedTable(tableWithBanco.id);
                    setTableBanco(tableWithBanco.id)
                }
    
                // Call handleTablesUpdate with the updated tables list
                handleTablesUpdate(updatedTables);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };
    

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/clienti');
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    
    const handleCustomerChange = (customer) => {
        setSelectedCustomer(customer);
        // You can do other things with the selected customer here
        
    };

    const handleOpenDrawer = async () => {
        try {
            const response = await apiClient.get('/open/drawer');
            
        } catch (error) {
            console.error('Error fetching data:', error);
        }

    }
     
    
   
   
  

    const handleTablesUpdate = (newTables) => {
        setTables(newTables);
        preloadArticlesForTables(newTables);
    };




    const preloadArticlesForTables = (tables) => {
        const newCart = [];
    
        tables.forEach(table => {
            if (table.comande && Array.isArray(table.comande) && table.comande.length > 0) {
                table.comande.forEach(comanda => {
                    if (comanda.details && Array.isArray(comanda.details)) {
                        const comandaId = comanda.id;
    
                        comanda.details.forEach(detail => {
                            // Include variante in the unique key identification
                            const existingItemIndex = newCart.findIndex(item =>
                                item.id === detail.id &&
                                item.tableId === table.id &&
                                JSON.stringify(item.ingredienti) === JSON.stringify(detail.ingredienti) &&
                                (item.variante ? item.variante.value === detail.variante.value : !detail.variante) // Check variante
                            );
    
                            console.log(detail);
    
                            if (existingItemIndex !== -1) {
                                // If the same article with the same ingredients and variant exists, increment the quantity
                                newCart[existingItemIndex].quantity += detail.quantity;
                            } else {
                                // If it's a new combination of article, ingredients, and variant, add it to the cart
                                newCart.push({
                                    tempId: uuidv4(),  // Ensure each item in the cart has a unique temporary ID
                                    id: detail.id,
                                    title: detail.title,
                                    price: detail.price,
                                    iva: detail.iva,
                                    category: detail.category,
                                    tableId: table.id,
                                    comandaId: comandaId,
                                    quantity: detail.quantity,
                                    ingredienti: detail.ingredienti,  // Include ingredients in the cart item
                                    variante: detail.variante,
                                    note: detail.note
                                });
                            }
                        });
                    }
                });
            }
        });
    
        setCart(newCart);
    };
    
    

    const toggleMainTab = (tab) => {
        if (activeMainTab !== tab) {
            setActiveMainTab(tab);
        }
    };

    const toggleNestedTab = (tab) => {
        if (activeNestedTab !== tab) {
            setActiveNestedTab(tab);
            fetchArticles(tab);
        }
    };

    const renderTableButtons = () => {
        return tables.map((table) => {
            const hasArticles = cart.some(item => item.tableId === table.id);
            const buttonColor = hasArticles ? "danger" : "success";

            return (
                <Button
                    key={table.id}
                    color={buttonColor}
                    className="m-2"
                    style={{ width: '120px', height: '120px', fontSize:"20px" }}
                    onClick={() => handleTableButtonClick(table.id, table.number)}
                >
                    {table.description} {table.number}
                </Button>
            );
        });
    };

    const renderArticlesButtons = (categoryId) => {
        const articles = articlesByCategory[categoryId] || [];
    
        return articles.map((article) => {
            const isBloccoGiacenze = article.blocco_giacenze;
            const isPrezziVarianti = article.prezzi_varianti;
    
            return (
                <Button
                    key={article.id}
                    color={
                        isBloccoGiacenze && article.giacenza === 0 
                            ? "danger" 
                            : isBloccoGiacenze && article.giacenza > 0 
                            ? "warning" 
                            : "primary"
                    }
                    className="m-2"
                    style={{ 
                        width: '140px', 
                        height: '120px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Add shadow
                        borderRadius: '6px'  // Optional: rounded corners for a softer look
                    }}
                    onClick={() => handleArticleButtonClick(article)}
                >
                    <div className='d-flex flex-column' style={{ height: '100px' }}>
                        <div style={{ fontSize: "16px" }}>
                            {truncateString(article.description, 30)}
                        </div>
                        {!isPrezziVarianti ? (
                            <div className='mt-auto mb-1' style={{ fontSize: "25px" }}>
                                {formatPrice(article.price)}
                            </div>
                        ) : (
                            " "
                        )}
                        {isBloccoGiacenze && (
                            <div className='mt-auto mb-1' style={{ fontSize: "14px", color: "white" }}>
                                Disponibili: {article.giacenza}
                            </div>
                        )}
                    </div>
                </Button>
            );
        });
    };
    


    
    const handleTableButtonClick = (tableId, tableN) => {

        
        setSelectedTable(tableId);
        setSelectedNumber(tableN)
    };
    const handleArticleButtonClick = (article) => {


        
        if (selectedTable === null) {
            alert('Please select a table first.');
            return;
        }

        if (!article.varianti.length) {
    
        // Compare articles by id and ingredienti to determine if they should be treated as separate items
        const existingItemIndex = cart.findIndex(item => 
            item.id === article.id &&
            item.tableId === selectedTable &&
            JSON.stringify(item.ingredienti) === JSON.stringify(article.ingredienti) &&
            item.variante === article.variante // Check if variante matches
        );
    
        if (existingItemIndex !== -1) {
            // If the same article with the same ingredients exists, just increment the quantity
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity++;
            setCart(updatedCart);
        } else {
            // If it's a new combination of article and ingredients, add it as a new item in the cart
            setCart(prevCart => [
                ...prevCart,
                {
                    tempId: uuidv4(),  // Ensure each item in the cart has a unique temporary ID
                    id: article.id,
                    title: article.description,
                    price: article.price,
                    iva: article.iva,
                    category: article.category,
                    tableId: selectedTable,
                    comandaId: article.comandaId,
                    quantity: 1,
                    ingredienti: article.ingredienti,
                    variante: article.variante,
                    giacenzaId: article.giacenza_id
                }
            ]);
            
        }} else {

            handleVariantiModal(article)
        }
        console.log(cart)
    };


   
    const handleVariantiButtonClick = (variante) => {
        
    
        // Check if a table is selected
        if (selectedTable === null) {
            alert('Please select a table first.');
            return;
        }
    
        // Find existing item in the cart
        const existingItemIndex = cart.findIndex(item => 
            item.id === articleForVarianti.id &&
            item.tableId === selectedTable &&
            JSON.stringify(item.ingredienti) === JSON.stringify(articleForVarianti.ingredienti)
        );
    
        // Determine the price based on whether the variant has specific pricing
        const prezzoVariante = articleForVarianti.prezzi_varianti 
            ? variante.prezzo.prezzo 
            : articleForVarianti.price; // Corrected to "price" for consistency
    
        if (existingItemIndex !== -1) {
            // If the same article with the same ingredients exists, increment the quantity
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity++;
            setCart(updatedCart);
        } else {
            console.log(articleForVarianti)
            // If it's a new combination of article and ingredients, add it as a new item in the cart
            setCart(prevCart => [
                ...prevCart,
                {
                    tempId: uuidv4(),  // Ensure each item in the cart has a unique temporary ID
                    id: articleForVarianti.id,
                    title: articleForVarianti.description,
                    price: prezzoVariante,
                    iva: articleForVarianti.iva,
                    category: articleForVarianti.category,
                    tableId: selectedTable,
                    comandaId: articleForVarianti.comandaId,
                    quantity: 1,
                    ingredienti: variante.ingredienti,
                    variante: variante,
                    giacenzaId: articleForVarianti.giacenza_id
                }
            ]);
    
            toggleModalVarianti(prevState => !prevState); // Toggle modal with previous state
        }
        
    };
    
    const handleRemoveArticle = (tempId) => {
        setCart(prevCart => prevCart.filter(item => item.tempId !== tempId));
    };

    const calculateTotalForSelectedTable = () => {
        const articlesForSelectedTable = cart.filter(item => item.tableId === selectedTable);
        return articlesForSelectedTable.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    useEffect(() => {
        setTotal(calculateTotalForSelectedTable());
    }, [cart, selectedTable]);

    const handleSaveButtonClick = async () => {
        if (total !== 0) {
            setButtonDisabled(true)
        if (selectedTable === null) {
            alert('Please select a table first.');
            return;
        }
    
        try {
            const articlesForSelectedTable = cart.filter(item => item.tableId === selectedTable);
            console.log(articlesForSelectedTable)

    
            const data = {
                customer: selectedCustomer,
                tableId: selectedTable,
                comandaId: articlesForSelectedTable.length > 0 ? articlesForSelectedTable[0].comandaId : null,
                pos: true,
                articles: articlesForSelectedTable.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    iva: item.iva,
                    category: item.category,
                    quantity: item.quantity,
                    ingredienti: item.ingredienti,
                    variante: item.variante,
                    giacenzaId: item.giacenzaId,
                    note: item.note,
                    mezza: item.mezza
                })),
                totale: total,
            };
            
            
            const response = await apiClient.create('/comande/save', data);

            
    
            // Reset the selected table, number, and cart
            setSelectedTable(tableBanco);
            setSelectedNumber("Banco");
            setCart([]);
    
            // Fetch the generico customer after saving
            const fetchGenericoCustomer = async () => {
                try {
                    const response = await apiClient.get('/clienti');
                    if (response && response.data && Array.isArray(response.data)) {
                        const genericoCustomer = response.data.find(customer => customer.generico === true);
                        if (genericoCustomer) {
                            // Set the "generico" customer as the default selected customer
                            setSelectedCustomer({
                                value: genericoCustomer.id,
                                label: genericoCustomer.denominazione || `${genericoCustomer.cognome} ${genericoCustomer.nome}`,
                                ...genericoCustomer
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching generico customer:', error);
                }
            };
    
            // Call the function to set the generico customer
            await fetchGenericoCustomer();
    
            toggleMainTab("1");
    
            fetchTables();
            setButtonDisabled(false)
    
        } catch (error) {
            console.error('Error saving command:', error);
            setButtonDisabled(false)
            
        }}
    };
    
    const handlePrintButtonClick = async (parameter) => {
        
        if (selectedTable === null) {
            alert('Please select a table first.');
            return;
        }
    
        try {
            setButtonDisabled(true)
            const articlesForSelectedTable = cart.filter(item => item.tableId === selectedTable);
    
            const data = {
                customer: selectedCustomer,
                tableId: selectedTable,
                comandaId: articlesForSelectedTable.length > 0 ? articlesForSelectedTable[0].comandaId : null,
                articles: articlesForSelectedTable.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    iva: item.iva,
                    category: item.category,
                    quantity: item.quantity
                })),
                total: total,
                payment: parameter
            };
            
            const response = await apiClient.create('/scontrino/print', data);
    
            // Reset after saving
            setSelectedTable(tableBanco);
            setSelectedNumber("Banco");
            setCart([]);
    
            // Fetch the generico customer after saving
            const fetchGenericoCustomer = async () => {
                try {
                    const response = await apiClient.get('/clienti');
                    if (response && response.data && Array.isArray(response.data)) {
                        const genericoCustomer = response.data.find(customer => customer.generico === true);
                        if (genericoCustomer) {
                            // Set the "generico" customer as the default selected customer
                            setSelectedCustomer({
                                value: genericoCustomer.id,
                                label: genericoCustomer.denominazione || `${genericoCustomer.cognome} ${genericoCustomer.nome}`,
                                ...genericoCustomer
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error fetching generico customer:', error);
                }
            };
    
            // Call the function to set the generico customer
            await fetchGenericoCustomer();
    
            toggleMainTab("1");
            fetchDataScontrini();
    
            fetchTables();
            togglePrint();
            setButtonDisabled(false)
            resetClickHandler()
            setResto(0)
    
        } catch (error) {
            console.error('Error saving command:', error);
            setButtonDisabled(false)
            
        }
    };
    
    const handleScreenClick = (result) => {
        
        const newArt = {
            id: uuidv4(),  // Create a unique fake ID
            description: 'Articolo Generico',  // Provide a fake description
            price: result,  // Use the result as the price
            category: {'description': 'Generico', 'id': 99999},  // Set a fake category
            comandaId: 'fake-comanda',  // Set a fake comandaId
            varianti : []
        };

        handleArticleButtonClick(newArt)
        resetClickHandler()



    
    };

    const handleDeleteCart = async () => {
        // Assuming selectedTable is the identifier used to filter the cart
        const current_cart_to_delete = cart.filter(item => item.tableId === selectedTable);
    
        if (current_cart_to_delete.length > 0) {
            try {
                const response = await apiClient.delete('/comande/delete', {
                    ids: current_cart_to_delete[0].comandaId
                });

                fetchTables()
                toggleDelete()
            } catch (error) {
                console.error('Error deleting command:', error);
            }
        } else {
            console.warn('No items found for the selected table.');
        }
    };
    
    
    

    const formatPrice = (price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };


    function truncateString(str, maxLength) {
        if (str.length > maxLength) {
          return str.slice(0, maxLength) + '...';
        }
        return str;
      }

    document.title = "Negozio | DgnsDesk";
  

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={7}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Negozio</h4>
                                </CardHeader>
                                <CardBody>
                                <Nav tabs className="nav-tabs mb-3">
                                    <NavItem style={{ minHeight: "80px", width: "120px", textAlign: "center", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", borderRadius: "4px" }}>
                                        <NavLink 
                                        style={{ 
                                            cursor: "pointer", 
                                            minHeight: "80px", 
                                            width: "120px", 
                                            margin: "auto", 
                                            display: "flex", 
                                            justifyContent: "center",  // Center horizontally
                                            alignItems: "center"       // Center vertically
                                        }} 
                                        className={classnames({ active: activeMainTab === "1" })} 
                                        onClick={() => toggleMainTab("1")}
                                        >
                                        Cassa
                                        </NavLink>
                                    </NavItem>

                                    <NavItem style={{ minHeight: "80px", width: "120px", textAlign: "center", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", borderRadius: "4px" }}>
                                        <NavLink 
                                        style={{ 
                                            cursor: "pointer", 
                                            minHeight: "80px", 
                                            width: "120px", 
                                            margin: "auto", 
                                            display: "flex", 
                                            justifyContent: "center",  // Center horizontally
                                            alignItems: "center"       // Center vertically
                                        }} 
                                        className={classnames({ active: activeMainTab === "2" })} 
                                        onClick={() => toggleMainTab("2")}
                                        >
                                        Tavoli
                                        </NavLink>
                                    </NavItem>

                                    <NavItem style={{ minHeight: "80px", width: "120px", textAlign: "center", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", borderRadius: "4px" }}>
                                        <NavLink 
                                        style={{ 
                                            cursor: "pointer", 
                                            minHeight: "80px", 
                                            width: "120px", 
                                            margin: "auto", 
                                            display: "flex", 
                                            justifyContent: "center",  // Center horizontally
                                            alignItems: "center"       // Center vertically
                                        }} 
                                        className={classnames({ active: activeMainTab === "3" })} 
                                        onClick={() => toggleMainTab("3")}
                                        >
                                        Scontrini
                                        </NavLink>
                                    </NavItem>
                                    </Nav>

                                    <TabContent activeTab={activeMainTab} className="text-muted">
                                    <TabPane tabId="1" id="home">
                                        <Nav tabs className='nav-tabs categories'>
                                            {categories.map((category) => (
                                                <NavItem
                                                    key={category.id}
                                                    style={{
                                                        minHeight: "80px",
                                                        width: "120px",
                                                        textAlign: "center",
                                                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                                        borderRadius: "4px"
                                                    }}
                                                >
                                                    <NavLink
                                                        style={{
                                                            cursor: "pointer",
                                                            minHeight: "80px",
                                                            width: "120px",
                                                            margin: "auto",
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center"
                                                        }}
                                                        className={classnames({ active: activeNestedTab === category.id.toString() })}
                                                        onClick={() => toggleNestedTab(category.id.toString())}
                                                    >
                                                        {category.description}
                                                    </NavLink>
                                                </NavItem>
                                            ))}
                                        </Nav>
                                        <TabContent activeTab={activeNestedTab} className="text-muted">
                                            {categories.map((category) => (
                                                <TabPane tabId={category.id.toString()} id={category.description} key={category.id}>
                                                    <div className="mb-3 mt-3">
                                                        {loadingArticles ? (
                                                            <div className='w-100 text-center'>
                                                            <h3>Caricamento Articoli...</h3>
                                                            </div>
                                                        ) : (
                                                            renderArticlesButtons(category.id)
                                                        )}
                                                    </div>
                                                </TabPane>
                                            ))}
                                        </TabContent>
                                    </TabPane>
                                        
                                        <TabPane tabId="2" id="tables">
                                            <div className="mb-3">
                                                {renderTableButtons()}
                                            </div>
                                        </TabPane>
                                        <TabPane tabId="3" id="scontrini">
                                            <div className="mb-3">
                                                <Scontrini data={dataScontrini} fetchData={fetchDataScontrini} />
                                            </div>

                                        </TabPane>
                                    </TabContent>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col lg={5}>
                            <Card>
                                <CardHeader>
                                    <div>
                                        <Row>
                                            <Col lg={4}><h4 style={{fontSize:"30px", verticalAlign: "center"}} className="card-title mb-0 text-primary">                                         
                                                {selectedNumber !== null && (
                                                    <div>
                                                    {selectedNumber === "Banco" ? (
                                                        <p>Banco</p>
                                                    ) : (
                                                        <p>Tavolo {selectedNumber}</p>
                                                    )}
                                                    </div>
                                                )}
                                                </h4>
                                            </Col>
                                            <Col lg={7}>
                                            
                                            </Col>
                                            

                                        </Row>
                                    
                                    <div>
                                        <Row>
                                        
                                        
                                        <Col lg={10}>
                                            <ClientiSelect onCustomerChange={handleCustomerChange} selectedCustomer={selectedCustomer} />
                                        </Col>
                                        <Col lg={2}>
                                       
                                            <Button color="success" className="add-btn" onClick={toggleList} id="create-btn"><i className="ri-add-line align-bottom"></i></Button>
                                            <NewCliente
                                            modalList={modalList} 
                                            toggleList={toggleList} 
                                            fetchData={fetchData} 
                                            />  
                                        </Col>
                                        </Row>
                                    </div>

                                    </div>
                                </CardHeader>
                                <CardBody>
                                    <div id="users">
                                        <Row className="mb-2">
                                            <Col lg={6}>
                                                <div>
                                                    <h5>Descrizione</h5>
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className='text-end'>
                                                    <h5>QT</h5>
                                                </div>
                                            </Col>
                                            <Col lg={3}>
                                                <div className='text-end'>
                                                    <h5>Prezzo</h5>
                                                </div>
                                            </Col>
                                        </Row>

                                        <SimpleBar style={{ height: '350px' }} className="mx-n3">
                                            <ListGroup className="list mb-0" flush>
                                                {cart.filter(item => item.tableId === selectedTable).map(item => (
                                                    <ListGroupItem key={item.tempId} data-id={item.tempId}>
                                                        <Row>
                                                            <Col lg={1}>
                                                                <div className="flex-shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"
                                                                        onClick={() => handleRemoveArticle(item.tempId)}
                                                                    >
                                                                        <i className="ri-close-fill fs-16"></i>
                                                                    </button>
                                                                </div>
                                                            </Col>
                                                            <Col lg={5}>
                                                                <div>
                                                                    <h5 className="fs-13 mb-1">{item.variante && item.variante["label"] === "Selezionare la variante"
                                                            ? item.title 
                                                            : `${item.title} ${item.variante ? item.variante['label'].toUpperCase() : ""}`}</h5>
                                                                    
                                                                    <small className="text-muted">
                                                                        {item.ingredienti && Array.isArray(item.ingredienti)
                                                                            ? item.ingredienti.map(ing => ing.label).join(', ')
                                                                            : ''}
                                                                    </small>
                                                                    <small className="text-muted">
                                                                        {item.note 
                                                                            ? item.note
                                                                            : ''}
                                                                    </small>
                                                                </div>
                                                            </Col>
                                                            <Col lg={3} className='text-end'>
                                                                <div>
                                                                <div className="input-step">
                                                                <button
                                                                type="button"
                                                                className="minus"
                                                                onClick={() => handleQuantityChange(item.tempId, 'quantity', item.quantity > 0 ? item.quantity - 1 : item.quantity)}
                                                                >
                                                                –
                                                                </button>
                                                                <Input
                                                                    type="number"
                                                                    className="product-quantity "
                                                                    id={`product-qty-${item.tempId}`}
                                                                    value={item.quantity}                                                                    
                                                                />                                                                    
                                                                <button
                                                                type="button"
                                                                className="plus"
                                                                onClick={() => handleQuantityChange(item.tempId, 'quantity', item.quantity + 1)}
                                                            >
                                                                +
                                                            </button>
                                                            </div>
                                                                </div>
                                                            </Col>
                                                            <Col lg={3} className='text-end'>
                                                                <div>
                                                                    <h5 className="fs-20 mb-1">{formatPrice(item.price)}</h5>
                                                                </div>
                                                            </Col>
                                                            
                                                        </Row>
                                                    </ListGroupItem>
                                                ))}
                                            </ListGroup>
                                        </SimpleBar>
                                    </div>
                                </CardBody>                                
                                <CardFooter>
                                    <Row>
                                        <Col lg={9}><h4>Totale</h4></Col>
                                        <Col lg={3}><h4 className='text-end'>{formatPrice(total)}</h4></Col>
                                    </Row>
                                </CardFooter>
                                <CardFooter>
                                    <Row>
                                    <Col lg={9}>    
                                    <CalculatorWrapper >
                                    <Screen value={calc.num ? calc.num : calc.res} onClick={() => handleScreenClick(calculateResult())} />


                                    <ButtonBox>
                                        {
                                        btnValues.flat().map((btn, i) => {
                                            return (
                                            <CalculatorButton
                                            key={i}
                                            className={btn === "=" ? "equals" : "button-calc"}
                                            value={btn}
                                            onClick={
                                              btn === "C"
                                                ? resetClickHandler
                                                : btn === "+-"
                                                ? invertClickHandler
                                                : btn === "%"
                                                ? percentClickHandler
                                                : btn === "="
                                                ? equalsClickHandler
                                                : btn === "/" || btn === "X" || btn === "-" || btn === "+"
                                                ? signClickHandler
                                                : btn === "."
                                                ? commaClickHandler
                                                : numClickHandler
                                            }
                                            />
                                            );
                                        })
                                        }
                                    </ButtonBox>
                                    </CalculatorWrapper>
                                    </Col>
                                    <Col lg={3}>                                    
                                        <div className='d-flex flex-column h-100'>
                                        <Button color="secondary" style={{ minWidth: "100px", minHeight: "45px", marginBottom: "5px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={handleOpenDrawer} ><i className="ri-cash-line"></i></Button>
                                            <Button color="warning" style={{ minWidth: "100px", minHeight: "45px", marginBottom: "5px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={handleSaveButtonClick} disabled={buttonDisabled}><i className="ri-save-line"></i></Button>
                                            <Button color="danger" style={{ minWidth: "100px", minHeight: "90px", marginBottom: "5px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={toggleDelete}><i className="ri-delete-bin-line" ></i></Button>
                                            <Button color="success" style={{ minWidth: "100px", minHeight: "90px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={togglePrint}><i className="ri-printer-line" ></i></Button>
                                        </div>                                   
                                    
                                    </Col>
                                    </Row>
                                
                                    
                                </CardFooter>
                            </Card>
                        </Col>
                    </Row>
                    <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                        <ModalHeader toggle={toggleDelete}></ModalHeader>
                        <ModalBody>
                            <div className="mt-2 text-center">                                
                                <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                                    <h4>Sei sicuro?</h4>
                                    <p className="text-muted mx-4 mb-0">Sei sicuro di voler procedere con l'eliminazione dei record selezionati?</p>
                                </div>
                            </div>
                            <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                                <button type="button" className="btn w-sm btn-light" onClick={toggleDelete}>Annulla</button>
                                <button type="button" className="btn w-sm btn-danger" onClick={handleDeleteCart}>Si, Elimina!</button>
                            </div>
                        </ModalBody>
                    </Modal>
                    <Modal  size="xl" isOpen={modalPrint} toggle={togglePrint} centered>
                        <ModalHeader toggle={togglePrint}>Seleziona il metodo di pagamento</ModalHeader>
                        <ModalBody>
                            <div className="mt-2 text-end">
                                <Row>
                                    <Col className='d-flex justify-content-between'>
                                    <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'><h1 className='text-end'>TOTALE: {formatPrice(total)}</h1></div>
                                    <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'><h1 className='text-start'>PAGATO:  {formatPrice(pagato)}</h1></div>
                                    <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'><h1 className='text-start'>RESTO:  {formatPrice(resto)}</h1></div>

                                    </Col>
                                    
                                </Row>
                                <Row>
                                <Col className='d-flex justify-content-between'>
                                        <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'><h3 className='text-end'>Selezionare l'importo pagato</h3></div>
                                        <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'><h3 className='text-end'>Seleziona il metodo di pagamento:</h3></div>
                                    </Col>
                                </Row>
                                                                
                                <div className='d-flex flex-row'>
                                <div className="mt-4 pt-2 fs-15">
                                    {renderRestoButtons()}
                                </div>
                                <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5 d-flex flex-row">                                
                                <Button color="primary" style={{ minWidth: "200px", minHeight: "200px", marginBottom: "5px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={() => handlePrintButtonClick(1)} disabled={buttonDisabled} ><div ><i className="ri-money-euro-box-line"></i></div><div style={{ fontSize: "30px" }}>Contanti</div></Button>
                                <Button color="primary" style={{ minWidth: "200px", minHeight: "200px", marginBottom: "5px", fontSize: "50px" }} className='flex-grow-1 mx-1' onClick={() => handlePrintButtonClick(2)} disabled={buttonDisabled}><div><i className="ri-bank-card-fill"></i></div><div style={{ fontSize: "30px" }}>Carta</div></Button>    
                                <Button color="outline-danger" style={{ minWidth: "200px", minHeight: "200px", marginBottom: "5px", fontSize: "30px" }} className='flex-grow-1 mx-1' onClick={() => handlePrintButtonClick(0)} disabled={buttonDisabled}><div style={{ fontSize: "20px" }}>Non Pagato</div></Button>
                                </div>
                                
                                
                                </div>
                                
                                </div>
                            <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                                <button type="button" style={{ fontSize: "20px" }} className="btn w-sm btn-light" onClick={togglePrint}>Annulla</button>
                                
                            </div>
                        </ModalBody>
                    </Modal>
                    <Modal isOpen={modalVarianti} size="lg" toggle={toggleModalVarianti} centered>
                        <ModalHeader toggle={toggleModalVarianti}>Seleziona la variante:</ModalHeader>
                        <ModalBody>
                            <div className="mt-2 text-start">
                            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            {variantiOpt.map((varOP) => {
                                // Check conditions for button color
                                const buttonColor = articleForVarianti.blocco_giacenze && varOP.giacenza === 0 
                                    ? "danger" 
                                    : articleForVarianti.blocco_giacenze && varOP.giacenza > 0 
                                    ? "warning" 
                                    : "primary";

                                return (
                                    <Button
                                        key={varOP.value}
                                        color={buttonColor}
                                        className="m-2"
                                        style={{ width: '140px', height: '140px' }} // Adjust button dimensions as needed
                                        onClick={() => handleVariantiButtonClick(varOP)}
                                    >
                                        <div className='d-flex flex-column' style={{ height: '120px' }}>
                                            <div style={{ fontSize: "16px" }}>
                                                {truncateString(varOP.label.toUpperCase(), 30)}
                                            </div>
                                            {articleForVarianti.prezzi_varianti && (
                                                <div className='mt-auto' style={{ fontSize: "25px" }}>
                                                    {formatPrice(varOP.prezzo.prezzo)} {/* Ensure to access the price correctly */}
                                                </div>
                                            )}
                                            {articleForVarianti.giacenza_varianti && varOP.giacenza > 0 ? (
                                                <div className='mt-auto' style={{ fontSize: '16px', color: 'white', marginTop: "40px" }}>
                                                    {`Disponibili: ${varOP.giacenza}`} {/* Display availability if > 0 */}
                                                </div>
                                            ) : null}
                                        </div>
                                    </Button>
                                );
                            })}


                            </div>

                            </div>
                            <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                                <button
                                    type="button"
                                    className="btn w-sm btn-light"
                                    onClick={toggleModalVarianti}
                                >
                                    Annulla
                                </button>
                            </div>
                        </ModalBody>
                    </Modal>

                    
                </Container>



                


            </div>
        </React.Fragment>
    );
}


export default Pos;
