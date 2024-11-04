import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, UncontrolledTooltip } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';
import Select from "react-select";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWheatAwn, faCheese, faLeaf } from '@fortawesome/free-solid-svg-icons';



const Articoli = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [newCode, setNewCode] = useState('');
    const [categorySelected, setCategorySelected] = useState('');
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [umSelected, setUmSelected] = useState('');
    const [umOptions, setUmOptions] = useState([]);
    
    const [newPrice, setNewPrice] = useState('');
    const [newImg, setNewImg] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    const [editDescription, setEditDescription] = useState(''); // State to store the new description for editing
    const [ivaSelected, setIvaSelected] = useState('');
    const [ivaOptions, setIvaOptions] = useState([]);

    const [editCode, setEditCode] = useState('')
    const [editCategory, setEditCategory] = useState('')
    const [editUm, setEditUm] = useState('')
    const [editIva, setEditIva] = useState('')
    const [editPrice, setEditPrice] = useState('')
    const [editImg, setEditImg] = useState('')
    const [ingredientiOptions, setIngredientiOptions] = useState([]);
    const [variantiOptions, setVariantiOptions] = useState([])
    const [newVarianti, setNewVarianti] = useState([])
    const [editVarianti, setEditVarianti] = useState([])
    const [newIngredients, setNewIngredients] = useState([])
    const [editIngredients, setEditIngredients] = useState([])

    const [newVegetariano, setNewVegetariano] = useState(false)
    const [newVegano, setNewVegano] = useState(false)
    const [newGluten, setNewGluten] = useState(false)
    const [newMenu, setNewMenu] = useState(false)
    const [newGiacenze, setNewGiacenze] = useState(false)
    const [newGiacenzeVarianti, setNewGiacenzeVarianti] = useState(false)
    const [newPrezziVarianti, setNewPrezziVarianti] = useState(false)

    const [editVegetariano, setEditVegetariano] = useState(false)
    const [editVegano, setEditVegano] = useState(false)
    const [editGluten, setEditGluten] = useState(false)
    const [editMenu, setEditMenu] = useState(false)
    const [editGiacenze, setEditGiacenze] = useState(false)
    const [editGiacenzeVarianti, setEditGiacenzeVarianti] = useState(false)
    const [editPrezziVarianti, setEditPrezziVarianti] = useState(false)





  

    const toggleList = () => {
        setModalList(!modalList);
    };

    const toggleDelete = () => {
        setModalDelete(!modalDelete);
    };

    const toggleEditModal = () => {
        setEditModal(!editModal);
    };

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/products');
            if (response && response.data && Array.isArray(response.data)) {
              console.log(response)
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

    const fetchDataCategory = async () => {
      try {
        const response = await apiClient.get('/categories');
        if (response && response.data && Array.isArray(response.data)) {
          const options = response.data.map(category => ({
            value: category.id.toString(),
            label: category.description,
          }));
          setCategoryOptions(options);
        } else {
          console.error('Invalid response structure:', response);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    useEffect(() => {
      fetchDataCategory();
    }, []);

    const fetchDataUM = async () => {
      try {
        const response = await apiClient.get('/um'); // Adjust the endpoint as needed
        if (response && response.data && Array.isArray(response.data)) {
          const options = response.data.map(unit => ({
            value: unit.id.toString(),
            label: unit.description,
          }));
          setUmOptions(options);
        } else {
          console.error('Invalid response structure:', response);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    useEffect(() => {      
      fetchDataUM();
    }, []);
    
    const fetchDataIVA = async () => {
      try {
        const response = await apiClient.get('/codiva'); // Adjust the endpoint as needed
        if (response && response.data && Array.isArray(response.data)) {
          const options = response.data.map(iva => ({
            value: iva.id.toString(),
            label: iva.description, // Adjust the label as needed
          }));
          setIvaOptions(options);
        } else {
          console.error('Invalid response structure:', response);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    useEffect(() => {      
      fetchDataIVA();
    }, []);


    const fetchDataIngredienti = async () => {
      try {
        const response = await apiClient.get('/ingredienti'); // Adjust the endpoint as needed
        if (response && response.data && Array.isArray(response.data)) {
          const options = response.data.map(iva => ({
            value: iva.id.toString(),
            label: iva.description, // Adjust the label as needed
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

    const fetchDataVarianti = async () => {
      try {
        const response = await apiClient.get('/varianti'); // Adjust the endpoint as needed
        if (response && response.data && Array.isArray(response.data)) {
          const options = response.data.map(iva => ({
            value: iva.id.toString(),
            label: iva.description, // Adjust the label as needed
            ingredienti : iva.ingredienti
          }));
          setVariantiOptions(options);
        } else {
          console.error('Invalid response structure:', response);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    useEffect(() => {      
      fetchDataVarianti();
    }, []);



    const handleAddCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/products/add', {
                code: newCode,
                description: newDescription,
                category : categorySelected,
                um : umSelected,
                iva : ivaSelected,
                price : newPrice,
                img : "standard",
                ingredients: newIngredients,
                vegetariano : newVegetariano,
                vegano: newVegano,
                celiaco : newGluten,
                menu : newMenu,
                varianti : newVarianti,
                giacenze : newGiacenze,
                giacenza_varianti : newGiacenzeVarianti,
                prezzi_varianti: newPrezziVarianti

            });
            if (response.success) {
                fetchData();
                setNewDescription('');
                setNewCode('');
                setCategorySelected("");
                setUmSelected("");
                setIvaSelected("");
                setNewPrice("");
                setNewImg("")
                setNewIngredients([])
                setNewVegano(false);
                setNewVegetariano(false);
                setNewGluten(false)
                setNewMenu(false)
                setNewGiacenze(false)
                setNewGiacenzeVarianti(false)
                setNewVarianti([])



                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleEdit = (article) => {
      console.log(article)
        setEditId(article.id);
        setEditCode(article.code)
        setEditDescription(article.description);
        setEditCategory(article.category.id);
        setEditUm(article.um.id);
        setEditIva(article.iva.id);
        setEditPrice(article.price);
        setEditImg(article.img);
        handleEditIngredients(article.ingredienti)
        setEditVegetariano(article.vegetariano)
        setEditVegano(article.vegano)
        setEditGluten(article.celiaco)
        setEditMenu(article.menu)
        setEditVarianti(article.varianti)
        setEditGiacenze(article.blocco_giacenze)
        setEditGiacenzeVarianti(article.giacenza_varianti)
        setEditPrezziVarianti(article.prezzi_varianti)        
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/products/edit', {
                id: editId,
                code: editCode,
                description: editDescription,
                category : editCategory,
                um: editUm,
                iva: editIva,
                price: editPrice,
                img: editImg,
                ingredients : editIngredients,
                vegetariano : editVegetariano,
                vegano: editVegano,
                celiaco : editGluten,
                menu : editMenu,
                varianti : editVarianti,
                giacenze: editGiacenze,
                giacenza_varianti: editGiacenzeVarianti,
                prezzi_varianti: editPrezziVarianti

            });
            if (response.success) {
                fetchData(); // Fetch updated data
                setEditModal(false); // Close the edit modal
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing category:', error);
        }
    };

    const handleRowSelect = (row) => {
        const selectedIndex = selectedRows.indexOf(row.id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedRows, row.id];
        } else {
            newSelected = selectedRows.filter(id => id !== row.id);
        }

        setSelectedRows(newSelected);
    };

    const handleMultipleDelete = () => {
        if (selectedRows.length === 0) {
            console.error('No rows selected for deletion');
            return;
        }

        toggleDelete();
    };

    const confirmMultipleDelete = async () => {
        const idsToDelete = selectedRows;
        console.log(idsToDelete)

        try {
            const response = await apiClient.delete('/products/delete', { ids: idsToDelete });
            
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleDelete();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting products:', error);
        }
    };

    
    const handleNewIngredients = (selectedOptions) => {
      setNewIngredients(selectedOptions || []); // Handle null when no options are selected
    };

    const handleNewVarianti = (selectedOptions) => {
      setNewVarianti(selectedOptions || []); // Handle null when no options are selected
    };

const handleEditIngredients = (selectedOptions) => {
  setEditIngredients(selectedOptions || []);
}

const handleEditVarianti = (selectedOptions) => {
  setEditVarianti(selectedOptions || []);
}
    
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

    

    

    document.title = "Articoli | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Articoli</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className="col-sm-auto">
                                        <div>
                                            <Button color="success" className="add-btn me-1" onClick={toggleList} id="create-btn"><i className="ri-add-line align-bottom me-1"></i> Aggiungi</Button>
                                            <Button className="btn btn-soft-danger" onClick={handleMultipleDelete}><i className="ri-delete-bin-2-line"></i></Button>
                                        </div>
                                    </Col>
                                    <SearchTable
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        onEdit={handleEdit}
                                        onDelete={(id) => { setIdToDelete(id); toggleDelete(); }}
                                        toggleDelete={toggleDelete}
                                        setSelectedRows={setSelectedRows}
                                        
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            <Modal size='xl' isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Articolo</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddCategory}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <Row>
                          <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="code-field" className="form-label">Codice</label>
                            <input
                                type="text"
                                id="code-field"
                                className="form-control"
                                placeholder="Inserisci un codice"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value)}
                                required
                            />
                        </div>
                        </Col>
                        <Col lg={9}>
                        <div className="mb-3">
                            <label htmlFor="description-field" className="form-label">Descrizione</label>
                            <input
                                type="text"
                                id="description-field"
                                className="form-control"
                                placeholder="Inserisci una descrizione"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                required
                            />
                       
                        </div>
                        </Col>
                        </Row>
                        <Row>
                          <Col lg= {6}>
                          <label htmlFor="category-field" className="form-label">Categoria</label>
                          <select
                            id='category-field'
                            className='form-select'
                            value={categorySelected}
                            onChange={(e) => setCategorySelected(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Categoria</option>
                            {categoryOptions.map((categoryOption) => (
                              <option key={categoryOption.value} value={categoryOption.value}>
                                {categoryOption.label}
                              </option>
                            ))}
                          </select>
                          </Col>
                          <Col lg={3}>
                          <div className="mb-3">
                          <label htmlFor="um-field" className="form-label">Unità di Misura</label>
                          <select
                            id='um-field'
                            className='form-select'
                            value={umSelected}
                            onChange={(e) => setUmSelected(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona U.M.</option>
                            {umOptions.map((umOption) => (
                              <option key={umOption.value} value={umOption.value}>
                                {umOption.label}
                              </option>
                            ))}
                          </select>
                            </div>

                          </Col>
                          <Col lg={3}>
                          <div className="mb-3">
                          <label htmlFor="iva-field" className="form-label">Codice Iva</label>
                          <select
                            id='iva-field'
                            className='form-select'
                            value={ivaSelected}
                            onChange={(e) => setIvaSelected(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Cod.Iva</option>
                            {ivaOptions.map((ivaOption) => (
                              <option key={ivaOption.value} value={ivaOption.value}>
                                {ivaOption.label}
                              </option>
                            ))}
                          </select>
                            </div>

                          </Col>
                          
                        </Row>
                        <Row>
                          <Col lg={4}>
                            <div className="mb-3">
                              <label htmlFor="price-field" className="form-label">Prezzo</label>
                              <input
                                  type="text"
                                  id="price-field"
                                  className="form-control"
                                  placeholder="Inserisci un prezzo"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(e.target.value)}
                                  required
                              />
                        
                          </div>

                          </Col>
                          <Col lg = {8}>
                          <div className="mb-3">
                              <label htmlFor="img-field" className="form-label">Immagine</label>
                              <input
                                  type="text"
                                  id="img-field"
                                  className="form-control"
                                  placeholder="Inserisci un'Immagine"
                                  value={newImg}
                                  onChange={(e) => setNewImg(e.target.value)}
                                  
                              />
                        
                          </div>


                          </Col>                          
                        </Row>
                        <Row>
                          <Col lg={9}>
                          <div className="mb-3">
                          <label htmlFor="ing-field" className="form-label">Ingredienti</label>
                            <Select
                          isMulti={true}
                          value={newIngredients}
                          onChange={handleNewIngredients}
                          options={ingredientiOptions}
                          placeholder="Ingredienti..."
                          classNamePrefix="js-example-basic-multiple mb-0"
                          styles={customStyles}
                        />
                        </div>
                          </Col>
                          <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={newMenu}  onChange={(e) => setNewMenu(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox6">Menù</Label>
                              </div>
                            </div>

                          </Col>
                          <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={newGiacenze}  onChange={(e) => setNewGiacenze(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox6">Giacenze</Label>
                              </div>
                            </div>

                          </Col>

                          <Row>
                            <Col lg={3}>
                            <label htmlFor="check-fields" className="form-label">Tipo</label>                              
                              <div className="mt-2 mt-lg-2">
                             
                                      <div className="form-check form-check-inline me-4">
                                          <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={newVegetariano}  onChange={(e) => setNewVegetariano(e.target.checked)}/>
                                          <UncontrolledTooltip placement='top' target="cheese-icon-new">Vegetariano</UncontrolledTooltip>
                                          <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6"><FontAwesomeIcon icon={faCheese} className='text-warning fs-4' /></Label>
                                      </div>
                                      <div className="form-check form-check-inline me-4">
                                          <Input className="form-check-input" type="checkbox" id="inlineCheckbox7" value={newVegano} onChange={(e) => setNewVegano(e.target.checked)}/>
                                          <UncontrolledTooltip placement='top' target="veg-icon-new">Vegano</UncontrolledTooltip>
                                          <Label className="form-check-label" id="veg-icon-new" htmlFor="inlineCheckbox7"><FontAwesomeIcon icon={faLeaf} className='text-success fs-4' /></Label>
                                      </div>
                                      <div className="form-check form-check-inline">
                                          <Input className="form-check-input" type="checkbox" id="inlineCheckbox8" value={newGluten} onChange={(e) => setNewGluten(e.target.checked)} />
                                          <UncontrolledTooltip placement='top' target="gluten-icon-new">Gluten Free</UncontrolledTooltip>
                                          <Label className="form-check-label" id='gluten-icon-new' htmlFor="inlineCheckbox8"><FontAwesomeIcon icon={faWheatAwn} className='text-danger fs-4' /></Label>
                                      </div>
                                  </div>
                              </Col>
                              <Col lg={5}>
                          <div className="mb-3">
                          <label htmlFor="ing-field" className="form-label">Varianti</label>
                            <Select
                          isMulti={true}
                          value={newVarianti}
                          onChange={handleNewVarianti}
                          options={variantiOptions}
                          placeholder="Varianti..."
                          classNamePrefix="js-example-basic-multiple mb-0"
                          styles={customStyles}
                        />
                        </div>
                          </Col>
                          <Col lg={2}>
                          
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox36" value={newGiacenzeVarianti}  onChange={(e) => setNewGiacenzeVarianti(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox36">Giacenze Varianti</Label>
                              </div>
                            </div>

                          
                            </Col> 
                            <Col lg={2}>
                          
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox16" value={newPrezziVarianti}  onChange={(e) => setNewPrezziVarianti(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox16">Prezzi Varianti</Label>
                              </div>
                            </div>

                          
                            </Col>                                
                            </Row>


                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleList}>Chiudi</button>
                            <button type="submit" className="btn btn-success" id="add-btn">Aggiungi Articolo</button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>
            <Modal  isOpen={modalDelete} toggle={toggleDelete} centered>
                <ModalHeader toggle={toggleDelete}></ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
                            colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Sei sicuro?</h4>
                            <p className="text-muted mx-4 mb-0">Sei sicuro di voler procedere con l'eliminazione dei record selezionati?</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={toggleDelete}>Annulla</button>
                        <button type="button" className="btn w-sm btn-danger" onClick={confirmMultipleDelete}>Si, Elimina!</button>
                    </div>
                </ModalBody>
            </Modal>
            <Modal size="xl" isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Articolo</ModalHeader>
                <form className="tablelist-form" onSubmit={handleEditCategory}>
                    <ModalBody>
                    <Row>
                          <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="code-field" className="form-label">Codice</label>
                            <input
                                type="text"
                                id="code-field"
                                className="form-control"
                                placeholder="Inserisci una codice"
                                value={editCode}
                                onChange={(e) => setEditCode(e.target.value)}
                                required
                            />
                        </div>
                        </Col>
                        <Col>
                        <div className="mb-3">

                            <label htmlFor="edit-description-field" className="form-label">Nuova Descrizione</label>
                            <input
                                type="text"
                                id="edit-description-field"
                                className="form-control"
                                placeholder="Inserisci la nuova descrizione"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                required
                            />
                        </div>
                        </Col>
                        </Row>
                        <Row>
                          <Col lg= {6}>
                          <label htmlFor="category-field" className="form-label">Categoria</label>
                          <select
                            id='category-field'
                            className='form-select'
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Categoria</option>
                            {categoryOptions.map((categoryOption) => (
                              <option key={categoryOption.value} value={categoryOption.value}>
                                {categoryOption.label}
                              </option>
                            ))}
                          </select>
                          </Col>
                          <Col lg={3}>
                          <div className="mb-3">
                          <label htmlFor="um-field" className="form-label">Unità di Misura</label>
                          <select
                            id='um-field'
                            className='form-select'
                            value={editUm}
                            onChange={(e) => setEditUm(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona U.M.</option>
                            {umOptions.map((umOption) => (
                              <option key={umOption.value} value={umOption.value}>
                                {umOption.label}
                              </option>
                            ))}
                          </select>
                            </div>

                          </Col>
                          <Col lg={3}>
                          <div className="mb-3">
                          <label htmlFor="iva-field" className="form-label">Codice Iva</label>
                          <select
                            id='iva-field'
                            className='form-select'
                            value={editIva}
                            onChange={(e) => setEditIva(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Cod.Iva</option>
                            {ivaOptions.map((ivaOption) => (
                              <option key={ivaOption.value} value={ivaOption.value}>
                                {ivaOption.label}
                              </option>
                            ))}
                          </select>
                            </div>

                          </Col>
                          
                        </Row>
                        <Row>
                          <Col lg={4}>
                            <div className="mb-3">
                              <label htmlFor="price-field" className="form-label">Prezzo</label>
                              <input
                                  type="text"
                                  id="price-field"
                                  className="form-control"
                                  placeholder="Inserisci un prezzo"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  required
                              />
                        
                          </div>

                          </Col>
                          <Col lg = {8}>
                          <div className="mb-3">
                              <label htmlFor="img-field" className="form-label">Immagine</label>
                              <input
                                  type="text"
                                  id="img-field"
                                  className="form-control"
                                  placeholder="Inserisci un'Immagine"
                                  value={editImg}
                                  onChange={(e) => setEditImg(e.target.value)}
                                  
                              />
                        
                          </div>


                          </Col>
                          <Col lg={9}>
                          <div className="mb-3">
                          <label htmlFor="ing-field" className="form-label">Ingredienti</label>
                          <Select
                            isMulti={true}
                            value={editIngredients}
                            onChange={handleEditIngredients}
                            options={ingredientiOptions}
                            placeholder="Ingredienti..."
                            classNamePrefix="js-example-basic-multiple mb-0"
                            styles={customStyles}
                          />
                          </div>
                          </Col>
                          <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={editMenu }checked={editMenu}  onChange={(e) => setEditMenu(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-edit" htmlFor="inlineCheckbox6">Menù</Label>
                              </div>
                            </div>

                          </Col>
                          <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox11" value={editGiacenze} checked={editGiacenze}  onChange={(e) => setEditGiacenze(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="giacenze-edit" htmlFor="inlineCheckbox11">Giacenze</Label>
                              </div>
                            </div>

                          </Col>
                          
                        </Row>

                        <Row>
      <Col lg={3}>
      <label htmlFor="check-fields" className="form-label">Tipo</label>   
      <div className="mt-2 mt-lg-2">
          <div className="form-check form-check-inline me-4">
            <Input
              className="form-check-input"
              type="checkbox"
              id="inlineCheckbox6"
              checked={editVegetariano} // Utilizza checked per gestire lo stato del checkbox
              onChange={(e) => setEditVegetariano(e.target.checked)}
            />
            <UncontrolledTooltip placement='top' target="cheese-icon-new">
              Vegetariano
            </UncontrolledTooltip>
            <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">
              <FontAwesomeIcon icon={faCheese} className='text-warning fs-4' />
            </Label>
          </div>

          <div className="form-check form-check-inline me-4">
            <Input
              className="form-check-input"
              type="checkbox"
              id="inlineCheckbox7"
              checked={editVegano} // Utilizza checked per gestire lo stato del checkbox
              onChange={(e) => setEditVegano(e.target.checked)}
            />
            <UncontrolledTooltip placement='top' target="veg-icon-new">
              Vegano
            </UncontrolledTooltip>
            <Label className="form-check-label" id="veg-icon-new" htmlFor="inlineCheckbox7">
              <FontAwesomeIcon icon={faLeaf} className='text-success fs-4' />
            </Label>
          </div>

          <div className="form-check form-check-inline">
            <Input
              className="form-check-input"
              type="checkbox"
              id="inlineCheckbox8"
              checked={editGluten} // Utilizza checked per gestire lo stato del checkbox
              onChange={(e) => setEditGluten(e.target.checked)}
            />
            <UncontrolledTooltip placement='top' target="gluten-icon-new">
              Gluten Free
            </UncontrolledTooltip>
            <Label className="form-check-label" id='gluten-icon-new' htmlFor="inlineCheckbox8">
              <FontAwesomeIcon icon={faWheatAwn} className='text-danger fs-4' />
            </Label>
          </div>
        </div>
      </Col>
      <Col lg={5}>
                          <div className="mb-3">
                          <label htmlFor="ing-field" className="form-label">Varianti</label>
                            <Select
                          isMulti={true}
                          value={editVarianti}
                          onChange={handleEditVarianti}
                          options={variantiOptions}
                          placeholder="Varianti..."
                          classNamePrefix="js-example-basic-multiple mb-0"
                          styles={customStyles}
                        />
                        </div>
                          </Col>
                          <Col lg={2}>
                          
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox30" value={editGiacenzeVarianti} checked={editGiacenzeVarianti}   onChange={(e) => setEditGiacenzeVarianti(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox30">Giacenze Varianti</Label>
                              </div>
                            </div>

                          
                            </Col>
                            <Col lg={2}>
                          
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox25" value={editPrezziVarianti} checked={editPrezziVarianti}   onChange={(e) => setEditPrezziVarianti(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox25">Prezzi Varianti</Label>
                              </div>
                            </div>

                          
                            </Col>      
    </Row>
                        
                        
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleEditModal}>Chiudi</button>
                            <button type="submit" className="btn btn-primary">Salva Modifiche</button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>
        </React.Fragment>
    );
};

const SearchTable = ({ data, selectedRows, onRowSelect, onEdit, onDelete, setSelectedRows }) => {
  const [selectAll, setSelectAll] = useState(false);

  // Function to handle "Select All" checkbox toggle
  const handleSelectAll = () => {
      const allIds = data.map(item => item.id);
      if (!selectAll) {
          onRowSelect({ ids: allIds }); // Select all rows
          setSelectedRows(allIds); // Update selected rows
      } else {
          onRowSelect({ ids: [] }); // Deselect all rows
          setSelectedRows([]); // Clear selected rows
      }
      setSelectAll(!selectAll); // Toggle the select all state
  };

  // Function to format price
  const formatPrice = (price) => {
      return new Intl.NumberFormat('de-DE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
      }).format(price);
  };

  // Memoized column definitions
  const columns = useMemo(
      () => [
          {
              header: (
                  <div className="form-check">
                      <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkAll"
                          checked={selectAll}
                          onChange={handleSelectAll}
                      />
                  </div>
              ),
              cell: (cell) => (
                  <div className="form-check">
                      <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedRows.includes(cell.row.original.id)}
                          onChange={() => onRowSelect(cell.row.original)}
                      />
                  </div>
              ),
              accessorKey: "checkbox",
              enableColumnFilter: false,
              disableSortBy: true,
              size: "10",
          },
          {
              header: "ID",
              cell: (cell) => <span className="fw-semibold">{cell.getValue()}</span>,
              accessorKey: "id",
              enableColumnFilter: false,
              enableResizing: false,
              size: "10",
              thClass: "d-none",
              tdClass: "d-none",
          },
          {
              header: "Categoria",
              accessorKey: "category.description",
              enableColumnFilter: false,
              size: "15",
              thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
          },
          {
              header: "Codice",
              accessorKey: "code",
              enableColumnFilter: false,
              size: "15",
              thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
          },
          {
              header: "Descrizione",
              accessorKey: "description",
              enableColumnFilter: false,
              size: "450",
              
              thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
          },
          {
              header: "U.M.",
              accessorKey: "um.description",
              enableColumnFilter: false,
              size: "15",
              thClass: "text-center align-middle",
              tdClass: "text-center align-middle",
          },
          {
              header: "Iva",
              accessorKey: "iva.description",
              enableColumnFilter: false,
              size: "30",
              thClass: "text-center align-middle",
              tdClass: "text-center align-middle",
          },
          {
              header: "Prezzo",
              accessorKey: "price",
              enableColumnFilter: false,
              size: "15",
              thClass: "text-center align-middle",
              tdClass: "text-center align-middle",
              cell: (cell) => <span>{formatPrice(cell.getValue())}</span>,
          },
          {
              header: "Azioni",
              cell: (cell) => (
                  <div>
                      <Button size="sm" color="primary" onClick={() => onEdit(cell.row.original)}>Modifica</Button>{' '}
                      <Button
                          size="sm"
                          color="danger"
                          onClick={() => {
                              onDelete(cell.row.original.id);
                              setSelectedRows(prevSelected => [...prevSelected, cell.row.original.id]);
                          }}
                      >
                          Elimina
                      </Button>
                  </div>
              ),
              accessorKey: "actions",
              enableColumnFilter: false,
              disableSortBy: true,
              size: "150",
              thClass: "text-center",
              tdClass: "text-center",
          }
      ],
      [data, selectedRows, selectAll, onRowSelect, onEdit, onDelete, setSelectedRows]
  );

  // Sync "Select All" checkbox with the selected rows state
  useEffect(() => {
      setSelectAll(selectedRows.length === data.length);
  }, [selectedRows, data]);

  return (
      <TableContainer 
          columns={columns} 
          data={data} 
          isGlobalFilter={true}
          customPageSize={5}
          SearchPlaceholder="Cerca..."
      />
  );
};

export default Articoli;
