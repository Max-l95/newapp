import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const Users = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newName, setNewName] = useState('');
    const [newSurname, setNewSurname] = useState('');
    const [newMail, setNewMail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newCity, setNewCity] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newProvincia, setNewProvincia] = useState('');
    const [newCap, setNewCap] = useState('');
    const [newAdmin, setNewAdmin] = useState(false)   
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    const [editName, setEditName] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [editMail, setEditMail] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editProvincia, setEditProvincia] = useState('');
    const [editCap, setEditCap] = useState('');
    const [editAdmin, setEditAdmin] = useState(false)
    const [shopSelected, setShopSelected] = useState(0);
    const [shopOptions, setShopOptions] = useState([]);
    const [editShopSelected, setEditShopSelected] = useState(0)   
    
    
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    
    
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
            const response = await apiClient.get('/users');
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
                console.log(response.data)
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchDataShops();
    }, []);

    const handleAddUser = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/user/add', {
                first_name: newName,
                last_name: newSurname,
                email: newMail,
                phone_number: newPhone,
                city: newCity,
                address: newAddress,
                provincia: newProvincia,
                cap: newCap,
                shop:shopSelected,
                admin: newAdmin
                
            });
            if (response.success) {
                fetchData();
                // Resetting the new variables if needed
                setNewName('');
                setNewSurname('');
                setNewMail('');
                setNewPhone('');
                setNewCity('');
                setNewAddress('');
                setNewProvincia('');
                setNewCap('');
                setNewAdmin
                setShopSelected(0)
    
                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };
    const fetchDataShops = async () => {
        try {
            const response = await apiClient.get('/shops'); // Adjust endpoint as necessary
            console.log(response)
            if (response && response.data && Array.isArray(response.data)) {
                const options = response.data.map(category => ({
                    value: category.id.toString(),
                    label: category.description,
                }));
                setShopOptions(options);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    

    const handleEdit = (user) => {
        setEditId(user.id);
        setEditName(user.first_name);
        setEditSurname(user.last_name);
        setEditMail(user.email);
        setEditPhone(user.phone_number);
        setEditCity(user.city);
        setEditAddress(user.address);
        setEditProvincia(user.provincia);
        setEditCap(user.cap);
        setEditShopSelected(user.shop)
        
        if(user.ruolo == "admin") {
            setEditAdmin(true)
        } else {
            setEditAdmin(false)
        }
        console.log(user.shop)

        

        
        toggleEditModal();
    };

    const handleEditUser = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/user/edit', {
                id : editId,
                first_name: editName,
                last_name: editSurname,
                email: editMail,
                phone: editPhone,
                city: editCity,
                address: editAddress,
                provincia: editProvincia,
                cap: editCap,
                shop: editShopSelected
            });
    
            if (response.success) {
                fetchData(); // Fetch updated data
                // Resetting the new variables if needed
                setEditName('');
                setEditSurname('');
                setEditMail('');
                setEditPhone('');
                setEditCity('');
                setEditAddress('');
                setEditProvincia('');
                setEditCap('');
                setEditShopSelected(0)
    
                setEditModal(false); // Close the edit modal
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing user:', error);
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

        try {
            const response = await apiClient.delete('/user/delete', { ids: idsToDelete });
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleDelete();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting categories:', error);
        }
    };

    

    

    document.title = "Utenti | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Utenti</h4>
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
            <Modal size="lg" isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Utente</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddUser}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <Row>
                            <Col lg={6}>
                                <div className="mb-3">
                                    <label htmlFor="name-field" className="form-label">Nome</label>
                                    <input
                                        type="text"
                                        id="name-field"
                                        className="form-control"
                                        placeholder="Inserisci il nome"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="mb-3">
                                    <label htmlFor="surname-field" className="form-label">Cognome</label>
                                    <input
                                        type="text"
                                        id="surname-field"
                                        className="form-control"
                                        placeholder="Inserisci il cognome"
                                        value={newSurname}
                                        onChange={(e) => setNewSurname(e.target.value)}
                                       
                                    />
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col lg={6}>
                        <div className="mb-3">
                            <label htmlFor="email-field" className="form-label">Email</label>
                            <input
                                type="email"
                                id="email-field"
                                className="form-control"
                                placeholder="Inserisci l'email"
                                value={newMail}
                                onChange={(e) => setNewMail(e.target.value)}
                                required
                                
                            />
                        </div>
                        </Col>
                            <Col lg={6}>
                        <div className="mb-3">
                            <label htmlFor="phone-field" className="form-label">Telefono</label>
                            <input
                                type="tel"
                                id="phone-field"
                                className="form-control"
                                placeholder="Inserisci il numero di telefono"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                               
                            />
                        </div>
                        </Col>
                        </Row>
                        <div className="mb-3">
                            <label htmlFor="address-field" className="form-label">Indirizzo</label>
                            <input
                                type="text"
                                id="address-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo"
                                value={newAddress}
                                onChange={(e) => setNewAddress(e.target.value)}
                                
                            />
                        </div>
                        <Row>
                            <Col lg={8}>
                        <div className="mb-3">
                            <label htmlFor="city-field" className="form-label">Città</label>
                            <input
                                type="text"
                                id="city-field"
                                className="form-control"
                                placeholder="Inserisci la città"
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                
                            />
                        </div>
                        </Col>
                        <Col lg={2}>
                        
                        <div className="mb-3">
                            <label htmlFor="provincia-field" className="form-label">Provincia</label>
                            <input
                                type="text"
                                id="provincia-field"
                                className="form-control"
                                placeholder="EE"
                                value={newProvincia}
                                onChange={(e) => setNewProvincia(e.target.value)}
                               
                            />
                        </div>
                        </Col>
                        <Col lg={2}>
                        <div className="mb-3">
                            <label htmlFor="cap-field" className="form-label">CAP</label>
                            <input
                                type="text"
                                id="cap-field"
                                className="form-control"
                                placeholder="CAP"
                                value={newCap}
                                onChange={(e) => setNewCap(e.target.value)}
                               
                            />
                        </div>
                        </Col>
                        <Col lg={1}>
                            <div className="mt-1">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox12" value={newAdmin }checked={newAdmin}  onChange={(e) => setNewAdmin(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="admin-edit" htmlFor="inlineCheckbox6">Admin</Label>
                              </div>
                            </div>

                          </Col>
                          <Col lg={11}>
                          <div className='ms-5 mb-3'>
                            
                            <select
                              id='shop-field'
                              className='form-control'
                              value={shopSelected}
                              onChange={(e) => setShopSelected(e.target.value)}
                             
                            >
                              <option value="0" >Seleziona Negozio</option>
                              {shopOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                        </div>
                          </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleList}>Chiudi</button>
                            <button type="submit" className="btn btn-success" id="add-btn">Aggiungi Utente</button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>

            <Modal size="lg" isOpen={modalDelete} toggle={toggleDelete} centered>
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
            <Modal size="lg" isOpen={editModal} toggle={toggleEditModal} centered>
            <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Utente</ModalHeader>
            <form className="tablelist-form" onSubmit={handleEditUser}>
                <ModalBody>
                    <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                        <label htmlFor="id-field" className="form-label">ID</label>
                        <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                    </div>
                    <Row>
                        <Col lg={6}>
                            <div className="mb-3">
                                <label htmlFor="edit-name-field" className="form-label">Nome</label>
                                <input
                                    type="text"
                                    id="edit-name-field"
                                    className="form-control"
                                    placeholder="Inserisci il nome"
                                    value={editName}  // Bind to editName state
                                    onChange={(e) => setEditName(e.target.value)}  // Update state on change
                                    required
                                />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="mb-3">
                                <label htmlFor="edit-surname-field" className="form-label">Cognome</label>
                                <input
                                    type="text"
                                    id="edit-surname-field"
                                    className="form-control"
                                    placeholder="Inserisci il cognome"
                                    value={editSurname}  // Bind to editSurname state
                                    onChange={(e) => setEditSurname(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                    </Row>
                    <Row>
                        <Col lg={6}>
                            <div className="mb-3">
                                <label htmlFor="edit-email-field" className="form-label">Email</label>
                                <input
                                    type="email"
                                    id="edit-email-field"
                                    className="form-control"
                                    placeholder="Inserisci l'email"
                                    value={editMail}  // Bind to editMail state
                                    onChange={(e) => setEditMail(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="mb-3">
                                <label htmlFor="edit-phone-field" className="form-label">Telefono</label>
                                <input
                                    type="tel"
                                    id="edit-phone-field"
                                    className="form-control"
                                    placeholder="Inserisci il numero di telefono"
                                    value={editPhone}  // Bind to editPhone state
                                    onChange={(e) => setEditPhone(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                    </Row>
                    <div className="mb-3">
                        <label htmlFor="edit-address-field" className="form-label">Indirizzo</label>
                        <input
                            type="text"
                            id="edit-address-field"
                            className="form-control"
                            placeholder="Inserisci l'indirizzo"
                            value={editAddress}  // Bind to editAddress state
                            onChange={(e) => setEditAddress(e.target.value)}  // Update state on change
                            
                        />
                    </div>
                    <Row>
                        <Col lg={8}>
                            <div className="mb-3">
                                <label htmlFor="edit-city-field" className="form-label">Città</label>
                                <input
                                    type="text"
                                    id="edit-city-field"
                                    className="form-control"
                                    placeholder="Inserisci la città"
                                    value={editCity}  // Bind to editCity state
                                    onChange={(e) => setEditCity(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                        <Col lg={2}>
                            <div className="mb-3">
                                <label htmlFor="edit-provincia-field" className="form-label">Provincia</label>
                                <input
                                    type="text"
                                    id="edit-provincia-field"
                                    className="form-control"
                                    placeholder="EE"
                                    value={editProvincia}  // Bind to editProvincia state
                                    onChange={(e) => setEditProvincia(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                        <Col lg={2}>
                            <div className="mb-3">
                                <label htmlFor="edit-cap-field" className="form-label">CAP</label>
                                <input
                                    type="text"
                                    id="edit-cap-field"
                                    className="form-control"
                                    placeholder="CAP"
                                    value={editCap}  // Bind to editCap state
                                    onChange={(e) => setEditCap(e.target.value)}  // Update state on change
                                    
                                />
                            </div>
                        </Col>
                        <Col lg={1}>
                            <div className="mt-1">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox12" value={editAdmin }checked={editAdmin}  onChange={(e) => setEditAdmin(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="admin-edit" htmlFor="inlineCheckbox6">Admin</Label>
                              </div>
                            </div>

                          </Col>
                          <Col lg={11}>
                          <div className='ms-5 mb-3'>
                            
                            <select
                              id='shop-field'
                              className='form-control'
                              value={editShopSelected}
                              onChange={(e) => setEditShopSelected(e.target.value)}
                             
                            >
                              <option value="0" >Seleziona Negozio</option>
                              {shopOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                        </div>
                          </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <div className="hstack gap-2 justify-content-end">
                        <button type="button" className="btn btn-light" onClick={toggleEditModal}>Chiudi</button>
                        <button type="submit" className="btn btn-success" id="edit-btn">Modifica Utente</button>
                    </div>
                </ModalFooter>
            </form>
        </Modal>


        </React.Fragment>
    );
};

const SearchTable = ({ data, selectedRows, onRowSelect, onEdit, onDelete, setSelectedRows }) => {
    const [selectAll, setSelectAll] = useState(false);

    // Handle the "Select All" checkbox toggle
    const handleSelectAll = () => {
        const allIds = data.map(item => item.id);
        if (!selectAll) {
            setSelectedRows(allIds); // Select all rows
        } else {
            setSelectedRows([]); // Deselect all rows
        }
        setSelectAll(!selectAll); // Toggle selectAll state
    };

    // Handle the selection of individual rows
    const handleRowSelect = (row) => {
        if (selectedRows.includes(row.id)) {
            setSelectedRows(selectedRows.filter(id => id !== row.id)); // Deselect row
        } else {
            setSelectedRows([...selectedRows, row.id]); // Select row
        }
    };

    // Table columns definition
    const columns = useMemo(
        () => [
            {
                header: (
                    <div className="form-check">
                        <input
                            className='form-check-input'
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
                            className='form-check-input'
                            type="checkbox"
                            checked={selectedRows.includes(cell.row.original.id)}
                            onChange={() => handleRowSelect(cell.row.original)}
                        />
                    </div>
                ),
                accessorKey: "checkbox",
                enableColumnFilter: false,
                disableSortBy: true,
                size: "10"
            },
            {
                header: "ID",
                cell: (cell) => (
                    <span className="fw-semibold">{cell.getValue()}</span>
                ),
                accessorKey: "id",
                enableColumnFilter: false,
                enableResizing: false,
                size: "10",
                thClass: "d-none",
                tdClass: "d-none"
            },
            {
                header: "Utente",
                accessorKey: "nomeCognome", // New accessor key for combined name
                enableColumnFilter: false,
                size: "100",
                cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`, // Combines nome and cognome
               
                
            },
            {
                header: "Email",
                accessorKey: "email",
                enableColumnFilter: false,
                size: "100"
            },
            {
                header: "Telefono",
                accessorKey: "phone_number",
                enableColumnFilter: false,
                size: "100"
            },
            {
                header: "Ruolo",
                accessorKey: "ruolo",
                enableColumnFilter: false,
                size: "100"
            },


            {
                header: "Azioni",
                cell: (cell) => (
                    <div>
                        <Button size="sm" color="primary" onClick={() => onEdit(cell.row.original)}>Modifica</Button>{' '}
                        <Button size="sm" color="danger" onClick={() => {
                                onDelete(cell.row.original.id);
                                setSelectedRows(prevSelected => [...prevSelected, cell.row.original.id]);
                            }}>Elimina</Button>
                    </div>
                ),
                accessorKey: "actions",
                enableColumnFilter: false,
                disableSortBy: true,
                thClass: "text-center",
                tdClass: "text-center",
                size: "120"
            }
        ],
        [data, selectedRows, selectAll]
    );

    // Sync selectAll with selectedRows and data length
    useEffect(() => {
        if (selectedRows.length === data.length && data.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedRows, data]);

    return (
        <TableContainer 
            columns={columns} 
            data={data} 
            isGlobalFilter={true}
            customPageSize={5}
            SearchPlaceholder='Cerca...'
        />
    );
};

export default Users;
