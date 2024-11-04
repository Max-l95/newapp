import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'; // DataTables Bootstrap 5 CSS
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css'; // DataTables Responsive Bootstrap 5 CSS
import $ from 'jquery'; // jQuery is required for DataTables
import 'datatables.net-bs5'; // DataTables Bootstrap 5
import 'datatables.net-responsive-bs5'; // DataTables Responsive Bootstrap 5

const Banche = () => {
    const apiClient = new APIClient();
    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [IBAN, setIBAN] = useState('');
    const [ABI, setABI] = useState('');
    const [CAB, setCAB] = useState('');
    const [editId, setEditId] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [editIBAN, setEditIBAN] = useState('');
    const [editABI, setEditABI] = useState('');
    const [editCAB, setEditCAB] = useState('');
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const dataTableRef = useRef(null);

    const toggleList = () => setModalList(!modalList);
    const toggleDelete = () => setModalDelete(!modalDelete);
    const toggleEditModal = () => setEditModal(!editModal);

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/banche');
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
            const table = $(dataTableRef.current).DataTable({
                responsive: true,
                data: data,
                columns: [
                    { data: 'id', visible: false }, // Hide the ID column
                    { data: 'description', title: 'Descrizione', width: "85%" },
                    { data: null, title: 'Azioni', render: function(data, type, row) {
                        return `
                            <button class="btn btn-primary btn-sm edit-btn">Modifica</button>
                            <button class="btn btn-danger btn-sm delete-btn">Elimina</button>
                        `;
                    }, width: "10%" }
                ],
                destroy: true,
                lengthChange: false,
            });

            // Event delegation for edit and delete buttons
            $(dataTableRef.current).on('click', '.edit-btn', function () {
                const rowData = table.row($(this).closest('tr')).data();
                console.log("Row Data for Edit:", rowData);
                handleEdit(rowData);
            });

            $(dataTableRef.current).on('click', '.delete-btn', function () {
                const rowData = table.row($(this).closest('tr')).data();
                setIdToDelete(rowData.id);
                toggleDelete();
            });
        }
    }, [data]); // Dependency on `data` to reinitialize DataTable when data changes

    const handleEdit = (banca) => {
        console.log("Editing Bank:", banca);
        if (!banca) {
            console.error("No banca data provided");
            return;
        }
        
        setEditId(banca.id);
        setEditDescription(banca.description);
        setEditIBAN(banca.IBAN);
        setEditABI(banca.ABI);
        setEditCAB(banca.CAB);
        toggleEditModal();
    };

    const handleAddBanca = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/banche/add', {
                description: newDescription,
                IBAN,
                ABI,
                CAB
            });
            if (response.success) {
                fetchData();
                setNewDescription('');
                setIBAN('');
                setABI('');
                setCAB('');
                toggleList(); // Close the modal after adding
            }
        } catch (error) {
            console.error('Error adding banca:', error);
        }
    };

    const handleEditBanca = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/banche/edit', {
                id: editId,
                description: editDescription,
                IBAN: editIBAN,
                ABI: editABI,
                CAB: editCAB
            });
            if (response.success) {
                fetchData();
                toggleEditModal(); // Close the modal after editing
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error editing banca:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await apiClient.delete('/banche/delete', { id: idToDelete });
            if (response.success) {
                fetchData();
                toggleDelete(); // Close the delete confirmation modal
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting banca:', error);
        }
    };

    document.title = "Banche | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Banche</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className="col-sm-auto">
                                        <div>
                                            <Button color="success" className="add-btn me-1" onClick={toggleList} id="create-btn">
                                                <i className="ri-add-line align-bottom me-1"></i> Aggiungi
                                            </Button>
                                            <Button className="btn btn-soft-danger" onClick={() => {
                                                // Handle multiple delete logic here if needed
                                            }}>
                                                <i className="ri-delete-bin-2-line"></i>
                                            </Button>
                                        </div>
                                    </Col>
                                    <table className="table table-striped table-bordered dt-responsive nowrap" ref={dataTableRef} style={{ width: "100%" }}>
                                        <thead>
                                            <tr>
                                                <th></th> {/* Hidden ID column */}
                                                <th>Descrizione</th>                                                
                                                <th>Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>
                                                    <td>{item.description}</td>
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

            {/* Modal for adding a new Banca */}
            <Modal isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Banca</ModalHeader>
                <form onSubmit={handleAddBanca}>
                    <ModalBody>
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
                            <label htmlFor="iban-field" className="form-label">IBAN</label>
                            <input
                                type="text"
                                id="iban-field"
                                className="form-control"
                                placeholder="IBAN"
                                value={IBAN}
                                onChange={(e) => setIBAN(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="abi-field" className="form-label">ABI</label>
                            <input
                                type="text"
                                id="abi-field"
                                className="form-control"
                                placeholder="ABI"
                                value={ABI}
                                onChange={(e) => setABI(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="cab-field" className="form-label">CAB</label>
                            <input
                                type="text"
                                id="cab-field"
                                className="form-control"
                                placeholder="CAB"
                                value={CAB}
                                onChange={(e) => setCAB(e.target.value)}
                                required
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleList}>Chiudi</Button>
                        <Button color="primary" type="submit">Aggiungi</Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Modal for editing Banca */}
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Banca</ModalHeader>
                <form onSubmit={handleEditBanca}>
                    <ModalBody>
                        <div className="mb-3">
                            <label htmlFor="edit-description-field" className="form-label">Descrizione</label>
                            <input
                                type="text"
                                id="edit-description-field"
                                className="form-control"
                                placeholder="Descrizione"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-iban-field" className="form-label">IBAN</label>
                            <input
                                type="text"
                                id="edit-iban-field"
                                className="form-control"
                                placeholder="IBAN"
                                value={editIBAN}
                                onChange={(e) => setEditIBAN(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-abi-field" className="form-label">ABI</label>
                            <input
                                type="text"
                                id="edit-abi-field"
                                className="form-control"
                                placeholder="ABI"
                                value={editABI}
                                onChange={(e) => setEditABI(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-cab-field" className="form-label">CAB</label>
                            <input
                                type="text"
                                id="edit-cab-field"
                                className="form-control"
                                placeholder="CAB"
                                value={editCAB}
                                onChange={(e) => setEditCAB(e.target.value)}
                                required
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleEditModal}>Chiudi</Button>
                        <Button color="primary" type="submit">Salva</Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Modal for delete confirmation */}
            <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleDelete}>Conferma Eliminazione</ModalHeader>
                <ModalBody>
                    Sei sicuro di voler eliminare questa banca?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleDelete}>Chiudi</Button>
                    <Button color="danger" onClick={confirmDelete}>Elimina</Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default Banche;
