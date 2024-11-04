import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'; // DataTables Bootstrap 5 CSS
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css'; // DataTables Responsive Bootstrap 5 CSS
import $ from 'jquery'; // jQuery is required for DataTables
import 'datatables.net-bs5'; // DataTables Bootstrap 5
import 'datatables.net-responsive-bs5'; // DataTables Responsive Bootstrap 5

const Sezionali = () => {
    const apiClient = new APIClient();
    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [numero, setNewNumero] = useState(0);
    const [newDocumento, setNewDocumento] = useState([]);
    const [editNumero, setEditNumero] = useState(0);
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [editDocumento, setEditDocumento] = useState([]);

    const dataTableRef = useRef(null);

    const toggleList = () => setModalList(!modalList);
    const toggleDelete = () => setModalDelete(!modalDelete);
    const toggleEditModal = () => setEditModal(!editModal);

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/sezionali');
            console.log(response);
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

    useEffect(() => {
        // Initialize or update DataTable
        if (dataTableRef.current) {
            // Destroy existing DataTable instance if it exists
            if ($.fn.DataTable.isDataTable(dataTableRef.current)) {
                $(dataTableRef.current).DataTable().clear().destroy();
            }

            // Initialize DataTable
            $(dataTableRef.current).DataTable({
                responsive: true,
                data: data, // Use the `data` state as the data source
                columns: [
                    { data: null, render: (data, type, row) => `<input type="checkbox" class="row-select" data-id="${row.id}">`,
                    width: "2%",
                    sorting: "false"
                 },
                    { data: 'documento' },
                    { data: 'description' },
                    { data: 'numero' },
                    { data: null,
                        width: "10%",
                        
                        render: (data, type, row) => `
                        <button class="btn btn-primary btn-sm edit-btn">Modifica</button>
                        <button class="btn btn-danger btn-sm delete-btn">Elimina</button>
                    ` },
                ],
            });

            // Event delegation for edit and delete buttons
            $(dataTableRef.current).on('click', '.edit-btn', function () {
                const rowData = $(this).closest('tr').data();
                handleEdit(rowData);
            });

            $(dataTableRef.current).on('click', '.delete-btn', function () {
                const rowData = $(this).closest('tr').data();
                setIdToDelete(rowData.id);
                toggleDelete();
            });
        }
    }, [data]); // Dependency on `data` to reinitialize DataTable when data changes

    const handleAddCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/sezionali/add', {
                description: newDescription,
                numero: numero,
                documento: newDocumento
            });
            if (response.success) {
                fetchData();
                setNewDescription('');
                setNewNumero(0);
                setNewDocumento([]);
                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditDescription(category.description);
        setEditNumero(category.numero);
        setEditDocumento(category.documento);
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/sezionali/edit', {
                id: editId,
                description: editDescription,
                numero: editNumero,
                documento: editDocumento
            });
            if (response.success) {
                fetchData();
                setEditModal(false);
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing category:', error);
        }
    };

    const handleMultipleDelete = () => {
        const selectedIds = Array.from($(dataTableRef.current).DataTable().rows('.row-selected').data()).map(row => row.id);
        if (selectedIds.length === 0) {
            console.error('No rows selected for deletion');
            return;
        }
        toggleDelete();
    };

    const confirmMultipleDelete = async () => {
        const idsToDelete = selectedRows;

        try {
            const response = await apiClient.delete('/sezionali/delete', { ids: idsToDelete });
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

    document.title = "Sezionali | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Sezionali</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className="col-sm-auto">
                                        <div>
                                            <Button color="success" className="add-btn me-1" onClick={toggleList} id="create-btn"><i className="ri-add-line align-bottom me-1"></i> Aggiungi</Button>
                                            <Button className="btn btn-soft-danger" onClick={handleMultipleDelete}><i className="ri-delete-bin-2-line"></i></Button>
                                        </div>
                                    </Col>
                                    <table className="table table-striped table-bordered dt-responsive nowrap" ref={dataTableRef} style={{ width: "100%" }}>
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Tipo Documento</th>
                                                <th>Descrizione</th>
                                                <th>Numero</th>
                                                <th>Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map(item => (
                                                <tr key={item.id}>
                                                    <td></td>
                                                    <td>{item.documento}</td>
                                                    <td>{item.description}</td>
                                                    <td>{item.numero}</td>
                                                    <td>
                                                        <Button size="sm" color="primary" onClick={() => handleEdit(item)}>Modifica</Button>{' '}
                                                        <Button size="sm" color="danger" onClick={() => {
                                                            setIdToDelete(item.id);
                                                            toggleDelete();
                                                        }}>Elimina</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Modal for adding a new Sezionale */}
            <Modal isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Sezionale</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddCategory}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="category-field" className="form-label">Tipo Documento</label>
                            <select
                                id='category-field'
                                className='form-select'
                                value={newDocumento}
                                onChange={(e) => setNewDocumento(e.target.value)}
                                required
                            >
                                <option value="">Seleziona un Tipo Documento</option>
                                <option value="TD1">TD1</option>
                                <option value="TD2">TD2</option>
                                <option value="TD3">TD3</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="description-field" className="form-label">Descrizione</label>
                            <input
                                type="text"
                                id="description-field"
                                className="form-control"
                                placeholder="Descrizione"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="numero-field" className="form-label">Numero</label>
                            <input
                                type="number"
                                id="numero-field"
                                className="form-control"
                                placeholder="Numero"
                                value={numero}
                                onChange={(e) => setNewNumero(e.target.value)}
                                required
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleList}>Chiudi</Button>
                        <Button type="submit" color="primary">Aggiungi</Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Modal for editing a Sezionale */}
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Sezionale</ModalHeader>
                <form onSubmit={handleEditCategory}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" value={editId} readOnly />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="category-field" className="form-label">Tipo Documento</label>
                            <select
                                id='category-field'
                                className='form-select'
                                value={editDocumento}
                                onChange={(e) => setEditDocumento(e.target.value)}
                                required
                            >
                                <option value="">Seleziona un Tipo Documento</option>
                                <option value="TD1">TD1</option>
                                <option value="TD2">TD2</option>
                                <option value="TD3">TD3</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="description-field" className="form-label">Descrizione</label>
                            <input
                                type="text"
                                id="description-field"
                                className="form-control"
                                placeholder="Descrizione"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="numero-field" className="form-label">Numero</label>
                            <input
                                type="number"
                                id="numero-field"
                                className="form-control"
                                placeholder="Numero"
                                value={editNumero}
                                onChange={(e) => setEditNumero(e.target.value)}
                                required
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleEditModal}>Chiudi</Button>
                        <Button type="submit" color="primary">Modifica</Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Modal for deleting a Sezionale */}
            <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleDelete}>Elimina Sezionale</ModalHeader>
                <ModalBody>
                    Sei sicuro di voler eliminare questo Sezionale?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleDelete}>Chiudi</Button>
                    <Button color="danger" onClick={confirmMultipleDelete}>Elimina</Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default Sezionali;
