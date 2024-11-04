import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const Codiva = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    const [editDescription, setEditDescription] = useState(''); // State to store the new description for editing
    const [naturaSelected, setNaturaSelected] = useState("N/P")
    const [newAliquota, setNewAliquota] = useState('')

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
            const response = await apiClient.get('/codiva');
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
            const response = await apiClient.create('/codiva/add', {
                description: newDescription,
                aliquota : newAliquota,
                natura: naturaSelected
            });
            if (response.success) {
                fetchData();
                setNewDescription('');
                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    };

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditDescription(category.description);
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/codiva/edit', {
                id: editId,
                description: editDescription,
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
            const response = await apiClient.delete('/codiva/delete', { ids: idsToDelete });
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleDelete();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting codiva:', error);
        }
    };

    const options = [
      { value: 'N/P', label: 'Non presente' },
      { value: 'N1', label: 'N1 - escluse ex art.15 del DPR 633/72' },
      { value: 'N2.1', label: 'N2.1 - non soggette ad IVA ai sensi degli artt. Da 7 a 7- septies del DPR 633/72' },
      { value: 'N2.2', label: 'N2.2 - non soggette – altri casi' },
      { value: 'N3.1', label: 'N3.1 - non imponibili – esportazioni' },
      { value: 'N3.2', label: 'N3.2 - non imponibili – cessioni intracomunitarie' },
      { value: 'N3.3', label: 'N3.3 - non imponibili – cessioni verso San Marino' },
      { value: 'N3.4', label: 'N3.4 - non imponibili – operazioni assimilate alle cessioni all’esportazione' },
      { value: 'N3.5', label: 'N3.5 - non imponibili – a seguito di dichiarazioni d’intento' },
      { value: 'N3.6', label: 'N3.6 - non imponibili – altre operazioni che non concorrono alla formazione del plafond' },
      { value: 'N4', label: 'N4 - esenti' },
      { value: 'N5', label: 'N5 - regime del margine / IVA non esposta in fattura' },
      { value: 'N6.1', label: 'N6.1 - inversione contabile – cessione di rottami e altri materiali di recupero' },
      { value: 'N6.2', label: 'N6.2 - inversione contabile – cessione di oro e argento ai sensi della legge 7/2000 nonché di oreficeria usata ad OPO' },
      { value: 'N6.3', label: 'N6.3 - inversione contabile – subappalto nel settore edile' },
      { value: 'N6.4', label: 'N6.4 - inversione contabile – cessione di fabbricati' },
      { value: 'N6.5', label: 'N6.5 - inversione contabile – cessione di telefoni cellulari' },
      { value: 'N6.6', label: 'N6.6 - inversione contabile – cessione di prodotti elettronici' },
      { value: 'N6.7', label: 'N6.7 - inversione contabile – prestazioni comparto edile e settori connessi' },
      { value: 'N6.8', label: 'N6.8 - inversione contabile – operazioni settore energetico' },
      { value: 'N6.9', label: 'N6.9 - inversione contabile – altri casi' },
      { value: 'N7', label: 'N7 - IVA assolta in altro stato UE (prestazione di servizi di telecomunicazioni, tele-radiodiffusione ed elettronici ex art. 7-sexies lett. f, g, art. 74- sexies DPR 633/72)' }
    ];
    
    document.title = "Codice Iva | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Codice Iva</h4>
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
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Codici Iva</ModalHeader>
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
                            <label htmlFor="description-field" className="form-label">Aliquota</label>
                            <input
                                type="text"
                                id="aliquota-field"
                                className="form-control"
                                placeholder="Inserisci l'aliquota"
                                value={newAliquota}
                                onChange={(e) => setNewAliquota(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                        <label htmlFor='natura-field' className='form-label'>
                                Natura
                            </label>
                            <select
                              id='natura-field'
                              className='form-select'
                              value={naturaSelected}
                              onChange={(e) => setNaturaSelected(e.target.value)}
                              required
                            >
                              
                              {options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                        </div>
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

    // Handle "Select All" toggle
    const handleSelectAll = () => {
        const allIds = data.map(item => item.id);
        if (!selectAll) {
            setSelectedRows(allIds); // Select all rows
        } else {
            setSelectedRows([]); // Deselect all rows
        }
        setSelectAll(!selectAll); // Toggle selectAll state
    };

    // Handle selection of individual rows
    const handleRowSelect = (row) => {
        if (selectedRows.includes(row.id)) {
            setSelectedRows(selectedRows.filter(id => id !== row.id)); // Deselect row
        } else {
            setSelectedRows([...selectedRows, row.id]); // Select row
        }
    };

    // Define table columns
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
                size: "600",
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
            },
            {
                header: "Aliquota",
                accessorKey: "aliquota",
                enableColumnFilter: false,
                size: "20",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
            },
            {
                header: "Natura",
                accessorKey: "natura",
                enableColumnFilter: false,
                size: "20",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
            },
            {
                header: "Azioni",
                thClass: "text-center",
                cell: (cell) => (
                    <div>
                        <Button size="sm" color="primary" onClick={() => onEdit(cell.row.original)}>Modifica</Button>{' '}
                        <Button size="sm" color="danger" onClick={() => { onDelete(cell.row.original.id); setSelectedRows(prevSelected => [...prevSelected, cell.row.original.id]); }}>Elimina</Button>
                    </div>
                ),
                accessorKey: "actions",
                enableColumnFilter: false,
                disableSortBy: true,
                size: "120",
                thClass: "text-center",
                tdClass: "text-center"
            }
        ],
        [data, selectedRows, selectAll, onRowSelect, onEdit, onDelete, setSelectedRows]
    );

    // Sync selectAll with selectedRows
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

export default Codiva;
