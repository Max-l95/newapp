import React, { useMemo, useState, useEffect } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    UncontrolledTooltip,
    Label
} from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable'; // Replace with Tavolo TableContainer import
import { APIClient } from '../../helpers/api_helper';


const Tavoli = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [shopSelected, setShopSelected] = useState('');
    const [newNumber, setNewNumber] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editShop, setEditShop] = useState(1);
    const [editNumber, setEditNumber] = useState('');
    const [bancoCheck, setBancoCheck] = useState(false)
    const [bancoEditCheck, setEditBancoCheck] = useState(false)
    const [shopOptions, setShopOptions] = useState([]);
    const [newMin, setNewMin] = useState(0)
    const [newMax, setNewMax] = useState(0)
    const [editMax, setEditMax] = useState(0)
    const [editMin, setEditMin] = useState(0)


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
            const response = await apiClient.get('/tavoli');
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

    const fetchDataShops = async () => {
        try {
          const response = await apiClient.get('/shops');
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
    
      useEffect(() => {
        fetchDataShops();
      }, []);

    const handleAddCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/tavoli/add', {
                shop : shopSelected, 
                number: newNumber,
                banco: bancoCheck,
                min_places: newMin,
                max_places: newMax
            });
            if (response.success) {
                fetchData();
                setNewNumber('');
                setBancoCheck(false);
                setNewMax(0);
                setNewMin(0);
                setModalList(false);
            }
        } catch (error) {
            console.error('Error adding table:', error);
        }
    };

    const handleEdit = (category) => {
        console.log(category)
        setEditId(category.id);
        setEditNumber(category.number);
        setEditShop(1);
        setEditBancoCheck(category.banco)
        setEditMin(category.min_places)
        setEditMax(category.max_places)
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/tavoli/edit', {
                id: editId,
                shop: editShop,
                number: editNumber,
                banco: bancoEditCheck,
                min_places: editMin,
                max_places: editMax
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

    const handleRowSelect = (row) => {
        const selectedIndex = selectedRows.indexOf(row.id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = [...selectedRows, row.id];
        } else {
            newSelected = selectedRows.filter((id) => id !== row.id);
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
            const response = await apiClient.delete('/tavoli/delete', { ids: idsToDelete });
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleDelete();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting ums:', error);
        }
    };
    const options = [
      { value: '1', label: 'Negozio Principale' },
      
    ];
    
    document.title = 'Tavoli | DgnsDesk';

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Tavoli</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className='col-sm-auto'>
                                        <div>
                                            <Button color='success' className='add-btn me-1' onClick={toggleList} id='create-btn'>
                                                <i className='ri-add-line align-bottom me-1'></i> Aggiungi
                                            </Button>
                                            <Button className='btn btn-soft-danger' onClick={handleMultipleDelete}>
                                                <i className='ri-delete-bin-2-line'></i>
                                            </Button>
                                        </div>
                                    </Col>
                                    <SearchTable
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        onEdit={handleEdit}
                                        onDelete={(id) => {
                                            setIdToDelete(id);
                                            toggleDelete();
                                        }}
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
                <ModalHeader className='bg-light p-3' toggle={toggleList}>
                    Aggiungi Tavoli
                </ModalHeader>
                <form className='tablelist-form' onSubmit={handleAddCategory}>
                    <ModalBody>
                        <div className='mb-3' id='modal-id' style={{ display: 'none' }}>
                            <label htmlFor='id-field' className='form-label'>
                                ID
                            </label>
                            <input type='text' id='id-field' className='form-control' placeholder='ID' readOnly />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='description-field' className='form-label'>
                                Negozio
                            </label>
                            <select
                              id='shop-field'
                              className='form-control'
                              value={shopSelected}
                              onChange={(e) => setShopSelected(e.target.value)}
                              required
                            >
                              <option value="" disabled>Seleziona Negozio</option>
                              {shopOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='description-field' className='form-label'>
                                Numero
                            </label>
                            <input
                                type='text'
                                id='number-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={newNumber}                                
                                onChange={(e) => setNewNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='min-field' className='form-label'>
                                Posti Minimi
                            </label>
                            <input
                                type='text'
                                id='min-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={newMin}                                
                                onChange={(e) => setNewMin(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='max-field' className='form-label'>
                                Posti Massimi
                            </label>
                            <input
                                type='text'
                                id='max-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={newMax}                                
                                onChange={(e) => setNewMax(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-check form-check-inline me-4">
                            <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={bancoCheck} onChange={(e) => setBancoCheck(e.target.checked)} />
                            <UncontrolledTooltip placement='top' target="cheese-icon-new">Banco</UncontrolledTooltip>
                            <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">Banco</Label>
                        </div>

                    </ModalBody>
                    <ModalFooter>
                        <div className='hstack gap-2 justify-content-end'>
                            <button type='button' className='btn btn-light' onClick={toggleList}>
                                Chiudi
                            </button>
                            <button type='submit' className='btn btn-success' id='add-btn'>
                                Aggiungi
                            </button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>
            <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                <ModalHeader toggle={toggleDelete}></ModalHeader>
                <ModalBody>
                    <div className='mt-2 text-center'>
                        <lord-icon
                            src='https://cdn.lordicon.com/gsqxdxog.json'
                            trigger='loop'
                            colors='primary:#f7b84b,secondary:#f06548'
                            style={{ width: '100px', height: '100px' }}
                        ></lord-icon>
                        <div className='mt-4 pt-2 fs-15 mx-4 mx-sm-5'>
                            <h4>Sei sicuro?</h4>
                            <p className='text-muted mx-4 mb-0'>
                                Sei sicuro di voler procedere con l'eliminazione dei record selezionati?
                            </p>
                        </div>
                    </div>
                    <div className='d-flex gap-2 justify-content-center mt-4 mb-2'>
                        <button type='button' className='btn w-sm btn-light' onClick={toggleDelete}>
                            Annulla
                        </button>
                        <button type='button' className='btn w-sm btn-danger' onClick={confirmMultipleDelete}>
                            Si, Elimina!
                        </button>
                    </div>
                </ModalBody>
            </Modal>
            <Modal isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className='bg-light p-3' toggle={toggleEditModal}>
                    Modifica Tavoli
                </ModalHeader>
                <form className='tablelist-form' onSubmit={handleEditCategory}>
                    <ModalBody>
                    <div className='mb-3'>
                            <label htmlFor='edit-shop-field' className='form-label'>
                                Negozio
                            </label>
                            <select
                              id='shop-field'
                              className='form-control'
                              value={editShop}
                              onChange={(e) => setEditShop(e.target.value)}
                              required
                            >
                              <option value="" disabled>Seleziona Negozio</option>
                              {shopOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='edit-number-field' className='form-label'>
                                Numero
                            </label>
                            <input
                                type='text'
                                id='number-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={editNumber}                                
                                onChange={(e) => setEditNumber(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='edit-max-field' className='form-label'>
                                Posti Minimi
                            </label>
                            <input
                                type='text'
                                id='edit-max-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={editMin}                                
                                onChange={(e) => setEditMin(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <label htmlFor='edit-min-field' className='form-label'>
                                Posti Massimi
                            </label>
                            <input
                                type='text'
                                id='edit-min-field'
                                className='form-control'
                                placeholder='Inserisci un numero'
                                value={editMax}                                
                                onChange={(e) => setEditMax(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className="form-check form-check-inline me-4">
                            <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={bancoEditCheck} onChange={(e) => setEditBancoCheck(e.target.checked)} />
                            <UncontrolledTooltip placement='top' target="cheese-icon-new">Banco</UncontrolledTooltip>
                            <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">Banco</Label>
                        </div>

                    </ModalBody>
                    <ModalFooter>
                        <div className='hstack gap-2 justify-content-end'>
                            <button type='button' className='btn btn-light' onClick={toggleEditModal}>
                                Chiudi
                            </button>
                            <button type='submit' className='btn btn-primary'>
                                Salva Modifiche
                            </button>
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
        const allIds = data.map((item) => item.id);
        if (!selectAll) {
            setSelectedRows(allIds);  // Select all rows
        } else {
            setSelectedRows([]);  // Deselect all rows
        }
        setSelectAll(!selectAll);  // Toggle the selectAll state
    };

    // Handle selection of individual rows
    const handleRowSelect = (row) => {
        if (selectedRows.includes(row.id)) {
            setSelectedRows(selectedRows.filter(id => id !== row.id));  // Deselect row
        } else {
            setSelectedRows([...selectedRows, row.id]);  // Select row
        }
    };

    // Define table columns
    const columns = useMemo(
        () => [
            {
                header: (
                    <div className='form-check'>
                        <input
                            className='form-check-input'
                            type='checkbox'
                            id='checkAll'
                            checked={selectAll}
                            onChange={handleSelectAll}
                        />
                    </div>
                ),
                cell: (cell) => (
                    <div className='form-check'>
                        <input
                            className='form-check-input'
                            type='checkbox'
                            checked={selectedRows.includes(cell.row.original.id)}
                            onChange={() => handleRowSelect(cell.row.original)}
                        />
                    </div>
                ),
                accessorKey: 'checkbox',
                enableColumnFilter: false,
                disableSortBy: true,
                size: '10',
            },
            {
                header: 'ID',
                cell: (cell) => (
                    <span className='fw-semibold'>{cell.getValue()}</span>
                ),
                accessorKey: 'id',
                enableColumnFilter: false,
                enableResizing: false,
                size: '10',
                thClass: "d-none",
                tdClass: "d-none"
            },
            {
                header: 'Negozio',
                accessorKey: 'shop',
                enableColumnFilter: false,
                size: '250',
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
            },
            {
                header: 'Numero',
                accessorKey: 'number',
                enableColumnFilter: false,
                size: '250',
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
            },
            {
                header: 'P.Minimi',
                accessorKey: 'min_places',
                enableColumnFilter: false,
                size: '50',
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
            },
            {
                header: 'P.Massimi',
                accessorKey: 'max_places',
                enableColumnFilter: false,
                size: '50',
                thClass: "text-start align-middle",
                tdClass: "text-start align-middle",
            },
            {
                header: 'Azioni',
                cell: (cell) => (
                    <div>
                        <Button size='sm' color='primary' onClick={() => onEdit(cell.row.original)}>
                            Modifica
                        </Button>{' '}
                        <Button
                            size='sm'
                            color='danger'
                            onClick={() => {
                                onDelete(cell.row.original.id);
                                setSelectedRows((prevSelected) => [...prevSelected, cell.row.original.id]);
                            }}
                        >
                            Elimina
                        </Button>
                    </div>
                ),
                accessorKey: 'actions',
                enableColumnFilter: false,
                disableSortBy: true,
                size: '120',
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
            },
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


export default Tavoli;
