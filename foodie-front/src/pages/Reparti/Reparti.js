import React, { useEffect, useState } from 'react';
import {
  Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'; // DataTables Bootstrap 5 CSS
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css'; // DataTables Responsive Bootstrap 5 CSS
import $ from 'jquery'; // jQuery is required for DataTables
import 'datatables.net-bs5'; // DataTables Bootstrap 5
import 'datatables.net-responsive-bs5'; // DataTables Responsive Bootstrap 5

const Reparti = () => {
  const apiClient = new APIClient();

  const [modalList, setModalList] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [data, setData] = useState([]);
  const [newDescription, setNewDescription] = useState('');
  const [printer, setPrinter] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [idToDelete, setIdToDelete] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPrinter, setEditPrinter] = useState('');

  const toggleList = () => setModalList(!modalList);
  const toggleDelete = () => setModalDelete(!modalDelete);
  const toggleEditModal = () => setEditModal(!editModal);

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/reparti');
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
    if (data.length > 0) {
      $('#reparti-table').DataTable({
        responsive: {
          details: {
            renderer: $.fn.dataTable.Responsive.renderer.listHiddenNodes(),
          },
        },
        // Column definitions
        columnDefs: [
            { targets: 0, visible: false },  // Hide the first column (ID)
            { targets: 3, width: '10%' },    // Set specific width for the "Numero" column
        ],
        destroy: true, // Reinitialize if already initialized
        lengthChange: false,
      });
    }
  }, [data]);

  const handleAddCategory = async (event) => {
    event.preventDefault();
    try {
      const response = await apiClient.create('/reparti/add', {
        description: newDescription,
        printer,
      });
      if (response.success) {
        fetchData();
        setNewDescription('');
        setPrinter('');
        toggleList();
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setEditDescription(category.description);
    setEditPrinter(category.printer);
    toggleEditModal();
  };

  const handleEditCategory = async (event) => {
    event.preventDefault();
    try {
      const response = await apiClient.update('/reparti/edit', {
        id: editId,
        description: editDescription,
        printer: editPrinter,
      });
      if (response.success) {
        fetchData();
        toggleEditModal();
      } else {
        console.error('Edit operation failed:', response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error editing category:', error);
    }
  };

  const handleRowSelect = (row) => {
    const selectedIndex = selectedRows.indexOf(row.id);
    const newSelected = selectedIndex === -1 ? [...selectedRows, row.id] : selectedRows.filter((id) => id !== row.id);
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
    try {
      const response = await apiClient.delete('/reparti/delete', { ids: selectedRows });
      if (response.success) {
        fetchData();
        setSelectedRows([]);
        toggleDelete();
      } else {
        console.error('Delete operation failed:', response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting reparti:', error);
    }
  };

  document.title = "Reparti | DgnsDesk";

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h4 className='card-title mb-0'>Reparti</h4>
                </CardHeader>
                <CardBody>
                  <Col className="col-sm-auto">
                    <div>
                      <Button color="success" className="add-btn me-1" onClick={toggleList} id="create-btn">
                        <i className="ri-add-line align-bottom me-1"></i> Aggiungi
                      </Button>
                      <Button className="btn btn-soft-danger" onClick={handleMultipleDelete}>
                        <i className="ri-delete-bin-2-line"></i>
                      </Button>
                    </div>
                  </Col>
                  <table id="reparti-table" className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Descrizione</th>
                        <th>Stampante IP</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.description}</td>
                          <td>{item.printer}</td>
                          <td>
                            <Button className='edit-btn' size="sm" color="primary" onClick={() => handleEdit(item)}>
                              Modifica
                            </Button>{' '}
                            <Button
                              size="sm"
                              color="danger"
                              onClick={() => {
                                setIdToDelete(item.id);
                                toggleDelete();
                              }}
                            >
                              Elimina
                            </Button>
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

      {/* Add Category Modal */}
      <Modal isOpen={modalList} toggle={toggleList} centered>
        <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Reparto</ModalHeader>
        <form className="tablelist-form" onSubmit={handleAddCategory}>
          <ModalBody>
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
            <div className="mb-3">
              <label htmlFor="printer-field" className="form-label">Stampante IP</label>
              <input
                type="text"
                id="printer-field"
                className="form-control"
                placeholder="Inserisci l'IP della stampante"
                value={printer}
                onChange={(e) => setPrinter(e.target.value)}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">Aggiungi</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={editModal} toggle={toggleEditModal} centered>
        <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Reparto</ModalHeader>
        <form className="tablelist-form" onSubmit={handleEditCategory}>
          <ModalBody>
            <div className="mb-3">
              <label htmlFor="edit-description-field" className="form-label">Descrizione</label>
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
            <div className="mb-3">
              <label htmlFor="edit-printer-field" className="form-label">Stampante IP</label>
              <input
                type="text"
                id="edit-printer-field"
                className="form-control"
                placeholder="Inserisci il nuovo IP della stampante"
                value={editPrinter}
                onChange={(e) => setEditPrinter(e.target.value)}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="submit" color="primary">Salva Modifiche</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
        <ModalHeader toggle={toggleDelete}></ModalHeader>
        <ModalBody>
          <h4>Sei sicuro?</h4>
          <p>Sei sicuro di voler procedere con l'eliminazione dei record selezionati?</p>
        </ModalBody>
        <ModalFooter>
          <Button type="button" className="btn btn-light" onClick={toggleDelete}>Annulla</Button>
          <Button type="button" className="btn btn-danger" onClick={confirmMultipleDelete}>Si, Elimina!</Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default Reparti;
