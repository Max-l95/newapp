import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const SettingTables = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [newDescriptionAgg, setNewDescriptionAgg] = useState('');
    const [newReparto, setNewReparto] = useState('')
    const [repartiOptions, setRepartiOptions] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    const [editDescription, setEditDescription] = useState(''); // State to store the new description for editing
    const [editDescriptionAgg, setEditDescriptionAgg] = useState(''); // State to store the new description for editing
    const [editReparto, setEditReparto] = useState(0)
    const [newOrdinamento, setNewOrdinamento] = useState('')
    const [editOrdinamento, setEditOrdinamento] = useState('')
    const [newMenu, setNewMenu] = useState(false)
    const [editMenu, setEditMenu] = useState(false)
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
            const response = await apiClient.get('/categories');
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
            const response = await apiClient.create('/categories/add', {
                description: newDescription,
                reparto : newReparto,
                descrizione_agg : newDescriptionAgg,
                ordinamento : newOrdinamento,
                menu: newMenu

            });
            if (response.success) {
                fetchData();
                setNewDescription('');
                setNewReparto('')
                setNewDescriptionAgg('')
                
                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditDescription(category.description);
        setEditReparto(category.reparti)
        setEditDescriptionAgg(category.descrizione_agg)
        setEditOrdinamento(category.ordinamento)
        setEditMenu(category.menu)
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/categories/edit', {
                id: editId,
                description: editDescription,
                reparto: editReparto,
                descrizione_agg : editDescriptionAgg,
                ordinamento : editOrdinamento,
                menu : editMenu
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

        try {
            const response = await apiClient.delete('/categories/delete', { ids: idsToDelete });
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

    

    const fetchDataReparti = async () => {
        try {
          const response = await apiClient.get('/reparti');
          if (response && response.data && Array.isArray(response.data)) {
            const options = response.data.map(category => ({
              value: category.id.toString(),
              label: category.description,
            }));
            setRepartiOptions(options);
          } else {
            console.error('Invalid response structure:', response);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
    
      useEffect(() => {
        fetchDataReparti();
      }, []);


    document.title = "Categorie | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Categorie</h4>
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
            <Modal isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Categoria</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddCategory}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
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
                            <label htmlFor="description-agg-field" className="form-label">Descrizione Aggiuntiva</label>
                            <input
                                type="text"
                                id="description-agg-field"
                                className="form-control"
                                placeholder="Inserisci una descrizione aggiuntiva da mostrare sul menu'"
                                value={newDescriptionAgg}
                                onChange={(e) => setNewDescriptionAgg(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                        <select
                            id='reparto-field'
                            className='form-select'
                            value={newReparto}
                            onChange={(e) => setNewReparto(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Reparto</option>
                            {repartiOptions.map((categoryOption) => (
                              <option key={categoryOption.value} value={categoryOption.value}>
                                {categoryOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="new-ordinamento-field" className="form-label">Ordinamento</label>
                            <input
                                type="text"
                                id="new-ordinamento-field"
                                className="form-control"
                                placeholder="Inserisci ordinamento"
                                value={newOrdinamento}
                                onChange={(e) => setNewOrdinamento(e.target.value)}
                                required
                            />
                        </div>
                        <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={newMenu}  onChange={(e) => setNewMenu(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-new" htmlFor="inlineCheckbox6">Menù</Label>
                              </div>
                            </div>

                          </Col>
                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleList}>Chiudi</button>
                            <button type="submit" className="btn btn-success" id="add-btn">Aggiungi Categoria</button>
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
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Categoria</ModalHeader>
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
                            <label htmlFor="edit-description-field" className="form-label">Descrizione Aggiuntiva</label>
                            <input
                                type="text"
                                id="edit-description-field"
                                className="form-control"
                                placeholder="Inserisci la nuova descrizione"
                                value={editDescriptionAgg}
                                onChange={(e) => setEditDescriptionAgg(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                        <select
                            id='edit-reparto-field'
                            className='form-select'
                            value={editReparto}
                            onChange={(e) => setEditReparto(e.target.value)}
                            required
                          >
                            <option value="" disabled>Seleziona Reparto</option>
                            {repartiOptions.map((categoryOption) => (
                              <option key={categoryOption.value} value={categoryOption.value}>
                                {categoryOption.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="edit-ordinamento-field" className="form-label">Ordinamento</label>
                            <input
                                type="text"
                                id="edit-ordinamento-field"
                                className="form-control"
                                placeholder="Inserisci ordinamento"
                                value={editOrdinamento}
                                onChange={(e) => setEditOrdinamento(e.target.value)}
                                required
                            />
                        </div>
                        <Col lg={1}>
                            <div className="mt-5">
                              <div className="form-check form-check-inline">
                                  <Input className="form-check-input"  type="checkbox" id="inlineCheckbox6" value={editMenu }checked={editMenu}  onChange={(e) => setEditMenu(e.target.checked)}/>                                          
                                  <Label className="form-check-label" id="menu-edit" htmlFor="inlineCheckbox6">Menù</Label>
                              </div>
                            </div>

                          </Col>
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
                size: "750",
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
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
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                size: "150"
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

export default SettingTables;
