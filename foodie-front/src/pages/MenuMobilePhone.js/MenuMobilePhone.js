import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Label,
  Modal,
  Nav,
  NavItem,
  NavLink,
  Row,
  TabContent,
  TabPane,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  
} from "reactstrap";

import { APIClient } from "../../helpers/api_helper";

import classnames from "classnames";
import { loadAnimation } from "lottie-web";
import { defineElement } from "lord-icon-element";
import TavoliSelect from "../Tavoli/TavoliSelect";
import { v4 as uuidv4 } from 'uuid';
import Select from "react-select";
import { useWebSocket } from '../../Components/WebSocketProvider/WebSocketcontext';

// register lottie and define custom element
defineElement(loadAnimation);

const MenuMobilePhone = () => {
  const [activeVerticalTab, setactiveVerticalTab] = useState(7);
  const [passedverticalSteps, setPassedverticalSteps] = useState([1]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articlesByCategory, setArticlesByCategory] = useState({});
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editIngredients, setEditIngredients] = useState([]);
  const [editVariantiOptions, setEditVariantiOptions] = useState([])
  const [editVarianti, setEditVarianti] = useState([])
  const [ingredientiOptions, setIngredientiOptions] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);  // Track the article being edited
  const tablesFetched = useRef(false);
  const [mezzaPorzione, setMezzaPorzione] = useState(false)
  const [noteArticolo, setNoteArticolo] = useState('')

  const apiClient = new APIClient();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
  };

  const fetchTables = async () => {
    try {
      const response = await apiClient.get('/tavoli'); // Adjust endpoint as needed
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  
  const authUserString = sessionStorage.getItem("authUser");
  let token;
  if (authUserString) {
    const authUser = JSON.parse(authUserString);
    token = authUser.token;
  } else {
    console.log('No authUser found in sessionStorage');
  }

 

  function toggleVerticalTab(tab) {
    if (activeVerticalTab !== tab) {
      var modifiedSteps = [...passedverticalSteps, tab];
      if (tab >= 7 && tab <= 11) {
        setactiveVerticalTab(tab);
        setPassedverticalSteps(modifiedSteps);
      }
    }
  }

  const [customActiveTab, setcustomActiveTab] = useState("1");
  const toggleCustom = (tab) => {
    if (customActiveTab !== tab) {
      setcustomActiveTab(tab);
      fetchArticles(tab);
    }
  };

  const handleTableChange = (table) => {
    setSelectedTable(table);
    document.body.style.zoom = "100%";
  };


  const handleEditVarianti = (variante) => {
    
    setEditVarianti(variante)
    setEditIngredients(variante.ingredienti || []);
  }

  const fetchDataIngredienti = async () => {
    try {
      const response = await apiClient.get('/ingredienti'); // Adjust the endpoint as needed
      if (response && response.data && Array.isArray(response.data)) {
        const options = response.data.map(iva => ({
          value: iva.id.toString(),
          label: iva.description,
        }));
        setIngredientiOptions(options);
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {      
    fetchDataIngredienti();
  }, []);

  const handleEditIngredients = (selectedOptions) => {
    setEditIngredients(selectedOptions || []);
  };

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
                    const firstCategoryId = sortedCategories[0].id.toString();
                    setcustomActiveTab(firstCategoryId);

                    // Fetch articles for each category
                    const fetchArticlesPromises = sortedCategories.map(category =>
                        fetchArticles(category.id.toString())
                    );
                    await Promise.all(fetchArticlesPromises);
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

  const fetchArticles = async (categoryId) => {
    try {
      const response = await apiClient.create('/products', { "id": categoryId });
      if (response && response.data && Array.isArray(response.data)) {
        setArticlesByCategory(prevState => ({
          ...prevState,
          [categoryId]: response.data
        }));
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const [activeItem, setActiveItem] = useState(null);
  const renderArticlesButtons = (categoryId) => {
    const articles = articlesByCategory[categoryId] || [];
    
    
    const handleArticleClick = (article) => {
      if (article.varianti.length <= 0 ) {
      handleArticleButtonClick(article);
     
      setActiveItem(article.id);
      setTimeout(() => {
        setActiveItem(null);
      }, 150);

    } else {
      alert('Selezionare prima una variante')
    }
    };



    const handleEdit = (article) => {

      
      // Check if varianti is not empty, and append the default option at the beginning
      let varianti = article.varianti && article.varianti.length > 0 
        ? article.varianti 
        : [{ value: 0, label: 'Nessuna variante' }];
    
      // Prepend "Selezionare una variante" as the first option
      varianti = [{ value: '', label: 'Selezionare la variante' }, ...varianti];
    
      // Default ingredients to the first real variant's ingredients (second item in the list)
      const ingredients = varianti.length > 1 && varianti[0].ingredienti 
        ? varianti[0].ingredienti 
        : article.ingredienti;
    
      setEditIngredients(ingredients);  // Set ingredients based on the first real variant
      setEditVariantiOptions(varianti); // Set the varianti options, including "Selezionare una variante"
      setEditVarianti(varianti[0]);     // Set "Selezionare una variante" as the default selected value
      setCurrentArticle(article);       // Track the article being edited
      toggleEditModal();                // Open the modal
    };
    
    
    
    

    return (
      <ul className="list-group mb-3 fs-6" style={{ minHeight: "250px" }}>
        {articles.map((article) => (
          <li
            key={article.id}
            className="list-group-item d-flex justify-content-between align-items-center lh-sm"
            role="presentation"
            style={{
              backgroundColor: activeItem === article.id ? '#435590' : 'transparent',
              transition: 'background-color 0.3s ease'
            }}
          >
            <div
              onClick={() => handleArticleClick(article)}
              style={{ cursor: 'pointer' }}
              className="d-flex justify-content-between w-100"
            >
              <div className="my-0">
                <span>{article.description}</span>
                <small className="text-muted d-block">
                  {article.ingredienti && Array.isArray(article.ingredienti) ? 
                    article.ingredienti.map((ing) => ing.label).join(', ') : 
                    ''}
                </small>
               
                <small className="text-muted d-block mt-1">
                  {article.blocco_giacenze ? `Disponibili: ${article.giacenza}` : 'Disponibili'}
                </small>
            
              </div>
              
              <div className="mt-auto mb-auto">
                {formatPrice(article.price)}
              </div>
            </div>
            <Button onClick={() => handleEdit(article)} className="ms-3">+/-</Button>
          </li>
        ))}
      </ul>
    );
  };

  const handleArticleButtonClick = (article) => {
    if (selectedTable === null) {
        alert('Selezionare prima un tavolo.');
        return;
    }
    console.log(cart);
    console.log(article);
    
    const existingItemIndex = cart.findIndex(item => 
        item.id === article.id &&
        item.tableId === selectedTable &&
        JSON.stringify(item.ingredienti) === JSON.stringify(article.ingredienti) &&
        item.variante === article.variante // Check if variante matches
    );
  
    if (existingItemIndex !== -1) {
        const updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity++;
        setCart(updatedCart);
    } else {
        setCart(prevCart => [
            ...prevCart,
            {
                tempId: uuidv4(),
                id: article.id,
                title: article.description,
                price: article.prezzo_varianti ? article.prezzo_variante : article.price, // Use variant price if applicable
                iva: article.iva,
                category: article.category,
                tableId: selectedTable,
                comandaId: article.comandaId,
                quantity: 1,
                ingredienti: article.ingredienti,
                variante: article.variante,
                prezzo_varianti: article.prezzi_varianti ? article.prezzo_variante : article.price, // Use the variant price
                prezzi_varianti: article.prezzi_varianti,
                giacenzaId: article.giacenza_id,
                mezzaPorzione: mezzaPorzione,
                noteArticolo: noteArticolo
            }
        ]);
        setMezzaPorzione(false);
        setNoteArticolo('');
    }
};

  


  const handleRemoveArticle = (tempId) => {
    setCart(prevCart => prevCart.filter(item => item.tempId !== tempId));
  };

  const handleSaveButtonClick = async () => {
    if (selectedTable === null) {
      alert('Please select a table first.');
      return;
    }

    try {
      const articlesForSelectedTable = cart.filter(item => item.tableId === selectedTable);

      const total = articlesForSelectedTable.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
      }, 0);

      const data = {
        tableId: selectedTable.value,
        comandaId: articlesForSelectedTable.length > 0 ? articlesForSelectedTable[0].comandaId : null,
        pos: false,
        note: note,
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
          note: item.noteArticolo,
          mezza: item.mezzaPorzione
        })),
        total: total,
      };
      console.log(data)

      const response = await apiClient.create('/comande/save', data);

      setSelectedTable(0);
      setCart([]);
      setNote(null);
      toggleVerticalTab(7);
    } catch (error) {
      console.error('Error saving command:', error);
      alert('Error saving command. Please try again.');
    }
  };

  const toggleEditModal = () => {
    setEditModal(!editModal);
  };

  const handleModalArticleClick = () => {
    console.log(editVarianti)
    if (currentArticle && editIngredients) {
      const updatedArticle = {
        ...currentArticle,
        ingredienti: editIngredients,
        variante: editVarianti,
        prezzo_variante: editVarianti.prezzo ? editVarianti.prezzo.prezzo : currentArticle.price, // Safeguard in case prezzo is missing
        prezzi_varianti: currentArticle.prezzi_varianti,
        price: editVarianti.prezzi_varianti ? editVarianti.prezzo.prezzo : currentArticle.price, // Safeguard in case prezzo is missing
      };
      console.log(updatedArticle);
      handleArticleButtonClick(updatedArticle);
      toggleEditModal(); // Close the modal after adding to the cart
    }
  };
 

  const customStyles = {
    multiValue: (styles, { data }) => {
        return {
          ...styles,
          backgroundColor: "#3762ea",
        };
      },
      multiValueLabel: (styles, { data }) => ({
        ...styles,
        backgroundColor : "#405189" ,
        color: "white",
      }),
      multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: "white",
        backgroundColor : "#405189" ,
        ':hover': {
          backgroundColor: "#405189" ,
          color: 'white',
        },
      }),
  }

document.title ="Sala | DgnsDesk";
  return (
    <React.Fragment>
      <div className="page-content">        
        <Container fluid>
          
          
          <Row>
            <Col xl={12}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Ordinazione</h4>
                </CardHeader>
                <CardBody>
                  <form className="vertical-navs-step form-steps">
                    <Row className="gy-5">
                      <Col lg={3}>
                        <Nav
                          className="flex-column custom-nav nav-pills"
                        >
                          <NavItem>
                            <NavLink
                            href="#"
                              className={
                                (classnames({
                                  active: activeVerticalTab === 7,
                                  done: (activeVerticalTab <= 11 && activeVerticalTab > 7)
                                }))
                              }
                              onClick={() => {
                                toggleVerticalTab(7);
                              }}
                            >
                              <span className="step-title me-2">
                                <i className="ri-close-circle-fill step-icon me-2"></i>
                                Step 1
                              </span>
                              Tavolo/Cliente
                            </NavLink>
                          </NavItem>
                          <NavItem>
                            <NavLink
                            href="#"
                              className={
                                (classnames({
                                  active: activeVerticalTab === 8,
                                  done: (activeVerticalTab <= 11 && activeVerticalTab >= 8)
                                }))
                              }
                              onClick={() => {
                                toggleVerticalTab(8);
                              }}
                            >
                              <span className="step-title me-2">
                                <i className="ri-close-circle-fill step-icon me-2"></i>
                                Step 2
                              </span>
                              Menu
                            </NavLink>
                          </NavItem>
                          <NavItem>
                            <NavLink
                            href="#"
                              className={classnames({
                                active: activeVerticalTab === 9,
                                done: (activeVerticalTab <= 11 && activeVerticalTab >= 9)
                              })}
                              onClick={() => {
                                toggleVerticalTab(9);
                              }}
                            >
                              <span className="step-title me-2">
                                <i className="ri-close-circle-fill step-icon me-2"></i>
                                Step 3
                              </span>
                              Conferma Comanda
                            </NavLink>
                          </NavItem>
                          
                        </Nav>
                      </Col>
                      <Col lg={6}>
                        <div className="px-lg-4">
                          <TabContent activeTab={activeVerticalTab}>
                            <TabPane tabId={7}>
                              <div>
                                <h5>Tavolo/Cliente</h5>
                                <p className="text-muted">
                                  Seleziona un tavolo:
                                </p>
                              </div>

                              <div>
                                <Row className="g-3">
                                                                   
                                 

                                  <Col xs={12}>
                                    <TavoliSelect onTableChange={handleTableChange} selectedTable={ selectedTable} />
                                  </Col>

                                  
                                </Row>
                              </div>

                              <div className="d-flex align-items-start gap-3 mt-4">
                                <button
                                  type="button"
                                  className="btn btn-success btn-label right ms-auto nexttab nexttab"
                                  onClick={() => {
                                    toggleVerticalTab(activeVerticalTab + 1);
                                  }}
                                >
                                  <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                  Avanti
                                </button>
                              </div>
                            </TabPane>

                            <TabPane tabId={8}>
                              <div>
                                <h5>Menu</h5>
                                <p className="text-muted">
                                  Seleziona i piatti.
                                </p>
                              </div>

                              <div>
                              <Row>
                        <Col xxl={12}>
                            
                            <Card>
                                <CardBody>
                                   
                                <div
                                  style={{
                                    overflowX: 'auto',         // Enables horizontal scrolling
                                    whiteSpace: 'nowrap',      // Prevents wrapping of items
                                    WebkitOverflowScrolling: 'touch' // Smooth scrolling on touch devices
                                  }}
                                >
                                  <Nav
                                    tabs
                                    className="nav nav-tabs nav-tabs-custom nav-success mb-3 gap-0"
                                    style={{
                                      display: 'flex',          // Flexbox layout to keep items in a row
                                      flexWrap: 'nowrap',       // Prevents wrapping to a new row
                                      whiteSpace: 'nowrap'      // Ensures all items stay on a single line
                                    }}
                                  >
                                    {categories.map((category) => (
                                      <NavItem
                                        key={category.id}
                                        style={{
                                          display: 'inline-block' // Ensures each item is displayed inline
                                        }}
                                      >
                                        <NavLink
                                          style={{ cursor: 'pointer' }}
                                          className={classnames({
                                            active: customActiveTab === category.id.toString(),
                                          })}
                                          onClick={() => toggleCustom(category.id.toString())}
                                        >
                                          {category.description}
                                        </NavLink>
                                       
                                      </NavItem>
                                    ))}
                                  </Nav>
                                </div>
                                  <TabContent
                                      activeTab={customActiveTab}
                                      className="text-muted"
                                  >
                                      {categories.map((category) => (
                                                  <TabPane tabId={category.id.toString()} id={category.description} key={category.id}>
                                                      <div className="mb-3">
                                                          {renderArticlesButtons(category.id)}
                                                      </div>
                                                  </TabPane>
                                              ))}
                                      
                                  </TabContent>
                                </CardBody>
                            </Card>
                        </Col>

                        
                    </Row>
                              </div>
                              <div className="d-flex align-items-start gap-3 mt-4">
                                <button
                                  type="button"
                                  className="btn btn-light btn-label previestab"
                                  onClick={() => {
                                    toggleVerticalTab(activeVerticalTab - 1);
                                  }}
                                >
                                  <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                  Indietro
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-success btn-label right ms-auto nexttab"
                                  onClick={() => {
                                    toggleVerticalTab(activeVerticalTab + 1);
                                  }}
                                >
                                  <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>
                                  Avanti
                                </button>
                              </div>
                            </TabPane>

                            <TabPane tabId={9}>
                              <div>
                                <h5>Conferma Comanda</h5>
                                <p className="text-muted">
                                  Controlla che l'ordine sia corretto.
                                </p>
                              </div>

                              <div>
                                

                                <Row className="gy-3">
                                <Col lg={12}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h5 className="fs-14 text-primary mb-0">
                                        <i className="ri-shopping-cart-fill align-middle me-2"></i>{" "}
                                        La tua comanda
                                      </h5>
                                      <span className="badge bg-danger rounded-pill">
                                      {cart.filter(item => item.tableId === selectedTable).length}
                                      </span>
                                    </div>
                                    <ul className="list-group mb-3">
                                      {cart.filter(item => item.tableId === selectedTable).map(item => (
                                        <li className="list-group-item d-flex justify-content-between lh-sm" key={item.tempId} data-id={item.tempId}>
                                          <div>
                                            <div className="d-flex"> 
                                              <button
                                                  type="button"
                                                  className="btn btn-icon btn-sm btn-ghost-secondary remove-item-btn"
                                                  onClick={() => handleRemoveArticle(item.tempId)}>
                                                  <i className="ri-close-fill fs-16"></i>
                                              </button>
                                              <div>            
                                                <h6 className="my-0">
                                                  {item.variante && item.variante["label"] === "Selezionare la variante" 
                                                    ? item.title 
                                                    : `${item.title} ${item.variante ? item.variante['label'].toUpperCase() : ""}`}
                                                </h6>
                                                <small className="text-muted">
                                                  {item.ingredienti && Array.isArray(item.ingredienti)
                                                    ? item.ingredienti.map(ing => ing.label).join(', ')
                                                    : ''}
                                                </small>
                                                <small className="text-muted">
                                                 
                                                {item.noteArticolo  
                                                    ? item.noteArticolo 
                                                    : ""}
                                                </small>
                                                
                                              </div>
                                            </div>
                                          </div> 
                                          <span className="text-muted mt-auto mb-auto">
                                            {item.quantity} x {item.prezzi_varianti ? formatPrice(item.variante.prezzo.prezzo) : formatPrice(item.price)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>

   
                                    <div>
                                        <Label htmlFor="exampleFormControlTextarea5" className="form-label">Note</Label>
                                        <textarea
                                          className="form-control"
                                          id="exampleFormControlTextarea5"
                                          rows="5"
                                          value={note || ''}  // Provide a default value of '' if note is undefined or null
                                          onChange={(e) => setNote(e.target.value)}
                                        ></textarea>

                                    </div>                            
                            
                         
                                </Col>
                                </Row>
                              </div>

                              <div className="d-flex align-items-start gap-3 mt-4">
                                <button
                                  type="button"
                                  className="btn btn-light btn-label previestab"
                                  onClick={() => {
                                    toggleVerticalTab(activeVerticalTab - 1);
                                  }}
                                >
                                  <i className="ri-arrow-left-line label-icon align-middle fs-16 me-2"></i>{" "}
                                  Indietro
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-success btn-label right ms-auto nexttab"
                                  onClick={() => {
                                    handleSaveButtonClick(); // Call handleSaveButtonClick first
                                    toggleVerticalTab(activeVerticalTab + 1); // Then call toggleVerticalTab
                                  }}
                                >
                                  <i className="ri-arrow-right-line label-icon align-middle fs-16 ms-2"></i>{" "}
                                  Conferma
                                </button>

                              </div>
                            </TabPane>

                            <TabPane tabId={10}>
                              <div className="text-center pt-4 pb-2">
                                <div className="mb-4">
                                  <lord-icon
                                    src="https://cdn.lordicon.com/lupuorrc.json"
                                    trigger="loop"
                                    colors="primary:#0ab39c,secondary:#405189"
                                    style={{ width: "120px", height: "120px" }}
                                  ></lord-icon>
                                </div>
                                <h5>Grazie per aver ordinato!</h5>
                                <p className="text-muted">
                                  Il tuo ordine sarà preparato al più presto.
                                </p>
                              </div>
                            </TabPane>
                          </TabContent>
                        </div>
                      </Col>

                     
                    </Row>
                  </form>

                  
                </CardBody>
                <Modal isOpen={editModal} toggle={toggleEditModal} centered={true}>
                  <ModalHeader toggle={toggleEditModal}></ModalHeader>
                  <ModalBody>
                  <div>
                    <Label for="varianti">Tipo:</Label>
                    <Select                      
                      name="varianti"
                      options={editVariantiOptions}
                      value={editVarianti}
                      onChange={handleEditVarianti}
                      placeholder="Tipo..."                    
                      
                    />
                    </div>
                    <div className="mt-4">
                    <Label for="ingredienti">Ingredienti:</Label>
                    <Select
                      isMulti
                      name="ingredienti"
                      options={ingredientiOptions}
                      value={editIngredients}
                      onChange={handleEditIngredients}
                      classNamePrefix="js-example-basic-multiple mb-0"
                      styles={customStyles}
                      placeholder="Ingredienti..."
                    />
                    </div>
                    <Col lg={1}>
                      <div className="mt-5">
                        <div className="form-check form-check-inline">
                            <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={mezzaPorzione }checked={mezzaPorzione}  onChange={(e) => setMezzaPorzione(e.target.checked)}/>                                          
                            <Label className="form-check-label" id="menu-edit" htmlFor="inlineCheckbox6">Mezza Porzione</Label>
                        </div>
                      </div>

                    </Col>

                    <div>
                      <Label htmlFor="exampleFormControlTextarea5" className="form-label">Note</Label>
                      <textarea
                        className="form-control"
                        id="exampleFormControlTextarea5"
                        rows="5"
                        value={noteArticolo || ''}  // Provide a default value of '' if note is undefined or null
                        onChange={(e) => setNoteArticolo(e.target.value)}
                      ></textarea>
                  </div>                    
                    
                  </ModalBody>
                  <ModalFooter>
                    <div className="hstack gap-2 justify-content-end">
                      <button type="button" className="btn btn-light" onClick={toggleEditModal}>Chiudi</button>
                      <button type="button" className="btn btn-primary" onClick={handleModalArticleClick}>Aggiungi</button>
                    </div>
                  </ModalFooter>
                </Modal>

         
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default MenuMobilePhone;
