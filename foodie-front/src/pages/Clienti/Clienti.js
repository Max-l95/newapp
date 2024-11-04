import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, UncontrolledTooltip } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';
import NewCliente from './NewCliente';

const Clienti = () => {
    const apiClient = new APIClient();

  
    
   
    const [selectedRows, setSelectedRows] = useState([]);
    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [editModal, setEditModal] = useState(false); // State to control edit modal visibility
    const [editId, setEditId] = useState(null); // State to store the ID of the category being edited
    
    const [editDenominazione, setEditDenominazione] = useState("");
    const [editCognome, setEditCognome] = useState('');
    const [editNome, setEditNome] = useState('');
    const [editCodFiscale, setEditCodFiscale] = useState('');
    const [editPartitaiva, setEditPartitaiva] = useState('');
    const [editSDI, setEditSDI] = useState('');
    const [editIndirizzo, setEditIndirizzo] = useState('');
    const [editCap, setEditCap] = useState('');
    const [editComune, setEditComune] = useState('');
    const [editCivico, setEditCivico] = useState('');
    const [editProvincia, setEditProvincia] = useState('');
    const [editNazione, setEditNazione] = useState('');
    const [editTelefono, setEditTelefono] = useState('');
    const [editCellulare, setEditCellulare] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editPec, setEditPec] = useState('');
    const [genericoEditCheck, setEditGenericoCheck] = useState(false)
    const [newsEditCheck, setEditNewsCheck] = useState(false)
    const [privacyEditCheck, setEditPrivacyCheck] = useState(false)
    
    
    
    

   

  

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

    
  
    

    
  
 

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditDenominazione(category.denominazione);
        setEditNome(category.nome);
        setEditCognome(category.cognome);
        setEditCodFiscale(category.codicefiscale);
        setEditPartitaiva(category.partitaiva);
        setEditSDI(category.SDI);
        setEditIndirizzo(category.indirizzo);
        setEditCivico(category.civico);
        setEditCap(category.cap);
        setEditComune(category.comune);
        setEditProvincia(category.provincia);
        setEditNazione(category.nazione);
        setEditTelefono(category.telefono);
        setEditCellulare(category.cellulare);
        setEditEmail(category.email);
        setEditPec(category.pec)
        setEditGenericoCheck(category.generico)
        setEditNewsCheck(category.news)
        setEditPrivacyCheck(category.privacy)




              
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/clienti/edit', {
                id: editId,
                denominazione : editDenominazione,
                nome: editNome,
                cognome: editCognome,
                codicefiscale : editCodFiscale,
                partitaiva : editPartitaiva,
                indirizzo : editIndirizzo,
                civico : editCivico,
                cap : editCap,
                comune : editComune,
                provincia : editProvincia,
                SDI : editSDI,
                nazione : editNazione,
                telefono : editTelefono,
                cellulare : editCellulare,
                email : editEmail,
                pec: editPec,
                generico : genericoEditCheck,
                news : newsEditCheck,
                privacy : privacyEditCheck
                
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
            const response = await apiClient.delete('/clienti/delete', { ids: idsToDelete });
            
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

    

    
    

    

    

    document.title = "Clienti | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                <Row>
                <Col lg={12}>                    
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Clienti</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className="col-sm-auto">
                                        <div>
                                            <Button color="success" className="add-btn me-1" onClick={toggleList} id="create-btn"><i className="ri-add-line align-bottom me-1"></i> Aggiungi</Button>
                                            <Button className="btn btn-soft-danger" onClick={handleMultipleDelete}><i className="ri-delete-bin-2-line"></i></Button>
                                        </div>
                                    </Col>
                                    <SearchTable
                                        className = "table table-borderless table-nowrap table-centered align-middle mb-0"
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        onEdit={handleEdit}
                                        onDelete={(id) => { toggleDelete(); }}
                                        toggleDelete={toggleDelete}
                                        setSelectedRows={setSelectedRows}
                                    />
                                </CardBody>
                            </Card>
                    
                    </Col>
                </Row>   
                </Container>
            </div>
           <NewCliente
            modalList={modalList} 
            toggleList={toggleList} 
            fetchData={fetchData} 
            />
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
                <ModalHeader className="bg-light p-3" toggle={toggleEditModal}>Modifica Cliente</ModalHeader>
                <form className="tablelist-form" onSubmit={handleEditCategory}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="denominazione-edit-field" className="form-label">Denominazione</label>
                            <input
                                type="text"
                                id="denominazione-field"
                                className="form-control"
                                placeholder="Inserisci la denominazione"
                                value={editDenominazione}
                                onChange={(e) => setEditDenominazione(e.target.value)}
                                
                            />
                        </div>
                        </Col>
                          <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="nome-field" className="form-label">Nome</label>
                            <input
                                type="text"
                                id="nome-field"
                                className="form-control"
                                placeholder="Inserisci il nome"
                                value={editNome}
                                onChange={(e) => setEditNome(e.target.value)}
                                
                            />
                        </div>
                        </Col>
                        
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="description-field" className="form-label">Cognome</label>
                            <input
                                type="text"
                                id="description-field"
                                className="form-control"
                                placeholder="Inserisci il cognome"
                                value={editCognome}
                                onChange={(e) => setEditCognome(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                            <div className="form-check form-check-inline mt-4">
                                <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={genericoEditCheck} onChange={(e) => setEditGenericoCheck(e.target.checked)} />
                                <UncontrolledTooltip placement='top' target="cheese-icon-new">Generico</UncontrolledTooltip>
                                <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">Generico</Label>
                            </div>
                        </Col>
                       
                        </Row>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="codfiscale-field" className="form-label">Codice Fiscale</label>
                            <input
                                type="text"
                                id="codfiscale-field"
                                className="form-control"
                                placeholder="Inserisci il codice fiscale"
                                value={editCodFiscale}
                                onChange={(e) => setEditCodFiscale(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="partitaiva-field" className="form-label">Partita Iva</label>
                            <input
                                type="text"
                                id="partitaiva-field"
                                className="form-control"
                                placeholder="Inserisci il partita iva"
                                value={editPartitaiva}
                                onChange={(e) => setEditPartitaiva(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={2}>
                        <div className="mb-3">
                            <label htmlFor="sdi-field" className="form-label">SDI</label>
                            <input
                                type="text"
                                id="sdi-field"
                                className="form-control"
                                placeholder="Inserisci codice SDI"
                                value={editSDI}
                                onChange={(e) => setEditSDI(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        </Row>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="address-field" className="form-label">Indirizzo</label>
                            <input
                                type="text"
                                id="cognome-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo"
                                value={editIndirizzo}
                                onChange={(e) => setEditIndirizzo(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="civico-field" className="form-label">Civico</label>
                            <input
                                type="text"
                                id="civico-field"
                                className="form-control"
                                placeholder="Nr."
                                value={editCivico}
                                onChange={(e) => setEditCivico(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="civico-field" className="form-label">Cap</label>
                            <input
                                type="text"
                                id="cap-field"
                                className="form-control"
                                placeholder="CAP"
                                value={editCap}
                                onChange={(e) => setEditCap(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="comune-field" className="form-label">Comune</label>
                            <input
                                type="text"
                                id="comune-field"
                                className="form-control"
                                placeholder="Inserisci il comune"
                                value={editComune}
                                onChange={(e) => setEditComune(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="provincia-field" className="form-label">Provincia</label>
                            <input
                                type="text"
                                id="provincia-field"
                                className="form-control"
                                placeholder="Pr."
                                value={editProvincia}
                                onChange={(e) => setEditProvincia(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="nazione-field" className="form-label">Nazione</label>
                            <input
                                type="text"
                                id="nazione-field"
                                className="form-control"
                                placeholder="EE"
                                value={editNazione}
                                onChange={(e) => setEditNazione(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                    </Row>
                    <Row>
                    <Col lg={2}>
                        <div className="mb-3">
                            <label htmlFor="telefono-field" className="form-label">Telefono</label>
                            <input
                                type="text"
                                id="telefono-field"
                                className="form-control"
                                placeholder="Inserisci il numero di telefono"
                                value={editTelefono}
                                onChange={(e) => setEditTelefono(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={2}>
                        <div className="mb-3">
                            <label htmlFor="cellulare-field" className="form-label">Cellulare</label>
                            <input
                                type="text"
                                id="cellulare-field"
                                className="form-control"
                                placeholder="Inserisci il numero di cellulare"
                                value={editCellulare}
                                onChange={(e) => setEditCellulare(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="email-field" className="form-label">Email</label>
                            <input
                                type="mail"
                                id="email-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo Email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="pec-field" className="form-label">PEC</label>
                            <input
                                type="text"
                                id="pec-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo Pec"
                                value={editPec}
                                onChange={(e) => setEditPec(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                            <div className="form-check form-check-inline mt-4">
                                <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={newsEditCheck} onChange={(e) => setEditNewsCheck(e.target.checked)} />
                                <UncontrolledTooltip placement='top' target="cheese-icon-new">News</UncontrolledTooltip>
                                <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">News</Label>
                            </div>
                        </Col>
                        <Col lg={1}>
                            <div className="form-check form-check-inline mt-4">
                                <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={privacyEditCheck} onChange={(e) => setEditPrivacyCheck(e.target.checked)} />
                                <UncontrolledTooltip placement='top' target="cheese-icon-new">Privacy</UncontrolledTooltip>
                                <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">Privacy</Label>
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

const SearchTable = ({ 
    data, 
    selectedRows, 
    onRowSelect, 
    onEdit, 
    onDelete, 
    setSelectedRows 
}) => {
    const [selectAll, setSelectAll] = useState(false);

    // Function to handle "Select All" checkbox toggle
    const handleSelectAll = () => {
        const allIds = data.map(item => item.id);
        onRowSelect({ ids: selectAll ? [] : allIds }); // Select or deselect all rows
        setSelectedRows(selectAll ? [] : allIds); // Update selected rows state
        setSelectAll(!selectAll); // Toggle the select all state
    };

    // Memoized column definitions
    const columns = useMemo(() => [
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
                        name="check-row"
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
            header: "Denominazione / Cognome Nome",
            accessorKey: "denominazione",
            cell: (cell) => {
                const { cognome, nome } = cell.row.original;
                return (
                    <span>
                        {cell.getValue() || `${cognome} ${nome}`}
                    </span>
                );
            },
            enableColumnFilter: false,
            size: "150",
        },
        {
            header: "Codice Fiscale",
            accessorKey: "codicefiscale",
            enableColumnFilter: false,
            size: "10",
        },
        {
            header: "Partita Iva",
            accessorKey: "partitaiva",
            enableColumnFilter: false,
            size: "10",
        },
        {
            header: "Email",
            accessorKey: "email",
            enableColumnFilter: false,
            size: "10",
        },
        {
            header: "Telefono",
            accessorKey: "telefono",
            enableColumnFilter: false,
            size: "10",
        },
        {
            header: "Cellulare",
            accessorKey: "cellulare",
            enableColumnFilter: false,
            size: "10",
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
            size: "80",
            thClass: "text-center",
            tdClass: "text-center",
        }
    ], [data, selectedRows, selectAll, onRowSelect, onEdit, onDelete, setSelectedRows]);

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
            SearchPlaceholder='Cerca...'
        />
    );
};

export default Clienti;
