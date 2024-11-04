import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const Shops = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newName, setNewName] = useState('')
    const [newIndirizzo, setNewIndirizzo] = useState('')
    const [newCitta, setNewCitta] = useState('')
    const [newCAP, setNewCAP] = useState('')
    const [newDescription, setNewDescription] = useState('');
    const [newProvincia, setNewProvincia] = useState('')
    const [newLink, setNewLink] = useState('')
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    const [editName, setEditName] = useState('')
    const [editIndirizzo, setEditIndirizzo] = useState('')
    const [editCitta, setEditCitta] = useState('')
    const [editCAP, setEditCAP] = useState('')
    const [editDescription, setEditDescription] = useState('');
    const [editProvincia, setEditProvincia] = useState('')
    const [editLink, setEditLink] = useState('')
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
            const response = await apiClient.get('/shops');
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

    const handleAddCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/shops/add', {
                name: newName,                    // Shop name
                description: newDescription,      // Shop description
                address: newIndirizzo,            // Shop address
                city: newCitta,                   // Shop city
                cap: newCAP,                      // Postal code
                provincia: newProvincia,          // Shop province
                location_link: newLink            // Location link (e.g., Google Maps link)
            });
            if (response.success) {
                fetchData();                      // Fetch updated data
                setNewName('');                   // Clear form fields
                setNewDescription('');
                setNewIndirizzo('');
                setNewCitta('');
                setNewCAP('');
                setNewProvincia('');
                setNewLink('');
                setModalList(false);              // Close the modal
            } else {
                console.error('Add operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error adding shop:', error);
        }
    };
    

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditName(category.name);
        setEditDescription(category.description);
        setEditIndirizzo(category.address);
        setEditCitta(category.city);
        setEditCAP(category.cap);
        setEditLink(category.location_link);
        setEditProvincia(category.provincia)


        
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/shops/edit', {
                id: editId,                       // ID of the shop being edited
                name: editName,                   // Edited shop name
                description: editDescription,     // Edited description
                address: editIndirizzo,           // Edited address
                city: editCitta,                  // Edited city
                cap: editCAP,                     // Edited postal code
                provincia: editProvincia,         // Edited province
                location_link: editLink           // Edited location link
            });
            if (response.success) {
                fetchData();                      // Fetch updated data
                setEditModal(false);              // Close the edit modal
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing shop:', error);
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
            const response = await apiClient.delete('/shops/delete', { ids: idsToDelete });
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

    



    document.title = "Negozi | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Negozi</h4>
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
            <Modal size='lg' isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Negozio</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddCategory}>
                    <ModalBody >
                        <Row>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="name-field" className="form-label">Nome</label>
                            <input
                                type="text"
                                id="name-field"
                                className="form-control"
                                placeholder="Inserisci il nome del negozio"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                            />
                        </div>
                        </Row>
                        <Row>
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
                        </Row>
                        <Row>
                        
                        <div className="mb-3">
                            <label htmlFor="address-field" className="form-label">Indirizzo</label>
                            <input
                                type="text"
                                id="address-field"
                                className="form-control"
                                placeholder="Inserisci l'Indirizzo'"
                                value={newIndirizzo}
                                onChange={(e) => setNewIndirizzo(e.target.value)}
                                required
                            />
                        </div>
                        </Row>
                        <Row>
                            <Col lg={8}>
                        <div className="mb-3">
                            <label htmlFor="city-field" className="form-label">Citta</label>
                            <input
                                type="text"
                                id="city-field"
                                className="form-control"
                                placeholder="Inserisci la città"
                                value={newCitta}
                                onChange={(e) => setNewCitta(e.target.value)}
                                required
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
                                placeholder="Inserisci il CAP'"
                                value={newCAP}
                                onChange={(e) => setNewCAP(e.target.value)}
                                required
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
                                placeholder="Inserisci la provincia"
                                value={newProvincia}
                                onChange={(e) => setNewProvincia(e.target.value)}
                                required
                            />
                        </div>
                        </Col>
                        </Row>
                        <div className="mb-3">
                            <label htmlFor="gmap-field" className="form-label">Google Maps Link</label>
                            <input
                                type="text"
                                id="gmap-field"
                                className="form-control"
                                placeholder="Inserisci il link di Gmaps'"
                                value={newLink}
                                onChange={(e) => setNewLink(e.target.value)}
                                required
                            />
                        </div>
                    
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleList}>Chiudi</button>
                            <button type="submit" className="btn btn-success" id="add-btn">Aggiungi Negozio</button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>
            <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
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
            <Modal size='lg' isOpen={editModal} toggle={toggleEditModal} centered>
    <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Negozio</ModalHeader>
    <form className="tablelist-form" onSubmit={handleEditCategory}>
        <ModalBody>
            <Row>
                <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                    <label htmlFor="id-field" className="form-label">ID</label>
                    <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                </div>
                <div className="mb-3">
                    <label htmlFor="edit-name-field" className="form-label">Nome</label>
                    <input
                        type="text"
                        id="edit-name-field"
                        className="form-control"
                        placeholder="Inserisci il nome del negozio"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                    />
                </div>
            </Row>
            <Row>
                <div className="mb-3">
                    <label htmlFor="edit-description-field" className="form-label">Descrizione</label>
                    <input
                        type="text"
                        id="edit-description-field"
                        className="form-control"
                        placeholder="Inserisci una descrizione"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        required
                    />
                </div>
            </Row>
            <Row>
                <div className="mb-3">
                    <label htmlFor="edit-address-field" className="form-label">Indirizzo</label>
                    <input
                        type="text"
                        id="edit-address-field"
                        className="form-control"
                        placeholder="Inserisci l'Indirizzo'"
                        value={editIndirizzo}
                        onChange={(e) => setEditIndirizzo(e.target.value)}
                        required
                    />
                </div>
            </Row>
            <Row>
                <Col lg={8}>
                    <div className="mb-3">
                        <label htmlFor="edit-city-field" className="form-label">Citta</label>
                        <input
                            type="text"
                            id="edit-city-field"
                            className="form-control"
                            placeholder="Inserisci la città"
                            value={editCitta}
                            onChange={(e) => setEditCitta(e.target.value)}
                            required
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
                            placeholder="Inserisci il CAP'"
                            value={editCAP}
                            onChange={(e) => setEditCAP(e.target.value)}
                            required
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
                            placeholder="Inserisci la provincia"
                            value={editProvincia}
                            onChange={(e) => setEditProvincia(e.target.value)}
                            required
                        />
                    </div>
                </Col>
            </Row>
            <div className="mb-3">
                <label htmlFor="edit-gmap-field" className="form-label">Google Maps Link</label>
                <input
                    type="text"
                    id="edit-gmap-field"
                    className="form-control"
                    placeholder="Inserisci il link di Gmaps'"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    required
                />
            </div>
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
                header: "Descrizione",
                accessorKey: "description",
                enableColumnFilter: false,
                size: "750"
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

export default Shops;
