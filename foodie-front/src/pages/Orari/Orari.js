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
import Select from 'react-select';
import TableContainer from '../../Components/Common/TableContainerReactTable'; // Replace with Tavolo TableContainer import
import { APIClient } from '../../helpers/api_helper';

const Orari = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [data, setData] = useState([]);
    const [shopSelected, setShopSelected] = useState('');
    const [newDescrizione, setNewDescrizione] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [editModal, setEditModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editDescrizione, setEditDescrizione] = useState('');
    const [attivoCheck, setAttivoCheck] = useState(false);
    const [attivoEditCheck, setEditAttivoCheck] = useState(false);
    const [shopOptions, setShopOptions] = useState([]);
    const [turnOptions, setTurnOptions] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]); // For selected days
    const [selectedTurn, setSelectedTurn] = useState([]); // For selected turn
    const [editShopSelected, setEditShopSelected] = useState(null)

    const daysOfWeekOptions = [
        { value: 'monday', label: 'Lunedì' },
        { value: 'tuesday', label: 'Martedì' },
        { value: 'wednesday', label: 'Mercoledì' },
        { value: 'thursday', label: 'Giovedì' },
        { value: 'friday', label: 'Venerdì' },
        { value: 'saturday', label: 'Sabato' },
        { value: 'sunday', label: 'Domenica' },
    ];

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
            const response = await apiClient.get('/orari');
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
        fetchDataShops();
        fetchTurns(); // Fetch turns when component mounts
    }, []);

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

    const fetchTurns = async () => {
        try {
            const response = await apiClient.get('/turns'); // Fetching turns
            if (response && response.data && Array.isArray(response.data)) {
                const options = response.data.map(turn => ({
                    value: turn.id,
                    label: turn.description,
                }));
                setTurnOptions(options);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching turns:', error);
        }
    };

    const handleAddCategory = async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
        try {
            // Prepare the data to send to the API
            const dataToSend = {
                name: newDescrizione.trim(), // Trim whitespace from the description
                shop: shopSelected, // The selected shop
                active: attivoCheck, // Boolean indicating if it's active
                monday: selectedDays.some(day => day.value === 'monday') ? selectedTurn.map(turn => turn.value) : [],
                tuesday: selectedDays.some(day => day.value === 'tuesday') ? selectedTurn.map(turn => turn.value) : [],
                wednesday: selectedDays.some(day => day.value === 'wednesday') ? selectedTurn.map(turn => turn.value) : [],
                thursday: selectedDays.some(day => day.value === 'thursday') ? selectedTurn.map(turn => turn.value) : [],
                friday: selectedDays.some(day => day.value === 'friday') ? selectedTurn.map(turn => turn.value) : [],
                saturday: selectedDays.some(day => day.value === 'saturday') ? selectedTurn.map(turn => turn.value) : [],
                sunday: selectedDays.some(day => day.value === 'sunday') ? selectedTurn.map(turn => turn.value) : [],
            };
    
            // Make the API call to add the schedule
            const response = await apiClient.create('/orari/add', dataToSend);
    
            if (response.success) {
                // If the response is successful, fetch the updated data
                fetchData();
                // Reset the form fields
                setNewDescrizione('');
                setAttivoCheck(false);
                setSelectedDays([]);
                setSelectedTurn([]); // Reset selected turns
                setModalList(false); // Close the modal
            } else {
                console.error('Failed to add schedule:', response.message);
                alert('Failed to add schedule. Please try again.'); // User feedback
            }
        } catch (error) {
            console.error('Error adding schedule:', error);
            alert('An error occurred while adding the schedule. Please try again.'); // User feedback
        }
    };
    
    
    

    const handleEdit = (category) => {
        setEditId(category.id);
        setEditShopSelected(category.shop.id)
        setEditDescrizione(category.name);
        setEditAttivoCheck(category.active); // Ensure correct field name
    
        // Check if category.days and category.turns are defined and are arrays
        setSelectedDays(Array.isArray(category.days) ? 
            category.days.map(day => ({ value: day, label: day })) : []
        ); // Set selected days for edit
    
        setSelectedTurn(Array.isArray(category.turns) ? 
            category.turns.map(turn => ({ value: turn, label: turn })) : []
        ); // Set selected turns for edit
    
        toggleEditModal();
    };
    
    
    
    const handleEditCategory = async (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
        console.log(editShopSelected)
        try {
            // Prepare the data to send to the API
            const dataToSend = {
                id: editId,
                shop: editShopSelected,
                name: editDescrizione.trim(), // Trim whitespace from the description
                active: attivoEditCheck, // Boolean indicating if it's active
                monday: selectedDays.some(day => day.value === 'monday') ? selectedTurn.map(turn => turn.value) : [],
                tuesday: selectedDays.some(day => day.value === 'tuesday') ? selectedTurn.map(turn => turn.value) : [],
                wednesday: selectedDays.some(day => day.value === 'wednesday') ? selectedTurn.map(turn => turn.value) : [],
                thursday: selectedDays.some(day => day.value === 'thursday') ? selectedTurn.map(turn => turn.value) : [],
                friday: selectedDays.some(day => day.value === 'friday') ? selectedTurn.map(turn => turn.value) : [],
                saturday: selectedDays.some(day => day.value === 'saturday') ? selectedTurn.map(turn => turn.value) : [],
                sunday: selectedDays.some(day => day.value === 'sunday') ? selectedTurn.map(turn => turn.value) : [],
            };
    
            // Make the API call to edit the schedule
            const response = await apiClient.update('/orari/edit', dataToSend);
    
            if (response.success) {
                fetchData(); // Refresh the data
                setEditModal(false); // Close the edit modal
            } else {
                console.error('Edit operation failed:', response.error || 'Unknown error');
                alert('Failed to edit schedule. Please try again.'); // User feedback
            }
        } catch (error) {
            console.error('Error editing category:', error);
            alert('An error occurred while editing the schedule. Please try again.'); // User feedback
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
            const response = await apiClient.delete('/orari/delete', { ids: idsToDelete });
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

    // Other existing functions remain the same...
    document.title = 'Orari | DgnsDesk';
    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Orari</h4>
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
            <Modal size='lg' isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className='bg-light p-3' toggle={toggleList}>
                    Aggiungi Orari
                </ModalHeader>
                <form className='tablelist-form' onSubmit={handleAddCategory}>
                    <ModalBody>
                        <div className='mb-3'>
                            <label htmlFor='shop-field' className='form-label'>
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
                                Descrizione
                            </label>
                            <input
                                type='text'
                                id='description-field'
                                className='form-control'
                                placeholder='Inserisci una descrizione'
                                value={newDescrizione}
                                onChange={(e) => setNewDescrizione(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <div className='form-check'>
                                <input
                                    type='checkbox'
                                    className='form-check-input'
                                    id='bancoCheck'
                                    checked={attivoCheck}
                                    onChange={() => setAttivoCheck(!attivoCheck)}
                                />
                                <label className='form-check-label' htmlFor='bancoCheck'>
                                    Attivo
                                </label>
                            </div>
                        </div>
                        <div className='mb-3'>
                            <Label htmlFor='days-field' className='form-label'>
                                Giorni della settimana
                            </Label>
                            <Select
                                id='days-field'
                                isMulti
                                options={daysOfWeekOptions}
                                value={selectedDays}
                                onChange={setSelectedDays}
                                placeholder='Seleziona i giorni'
                                classNamePrefix="js-example-basic-multiple mb-0"
                                styles={customStyles}
                            />
                        </div>
                        <div className='mb-3'>
                            <Label htmlFor='turn-field' className='form-label'>
                                Turno
                            </Label>
                            <Select
                                id='turn-field'
                                isMulti
                                options={turnOptions}
                                value={selectedTurn}
                                onChange={setSelectedTurn}
                                placeholder='Seleziona un turno'
                                classNamePrefix="js-example-basic-multiple mb-0"
                                styles={customStyles}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                    <Button color='secondary' className='btn btn-light' onClick={toggleList}>
                            Chiudi
                        </Button>
                        <Button type='submit' className='btn btn-success'>
                            Aggiungi Orario
                        </Button>
                       
                    </ModalFooter>
                </form>
            </Modal>
            {/* Edit Modal */}
            <Modal size='lg' isOpen={editModal} toggle={toggleEditModal} centered>
                <ModalHeader className='bg-light p-3' toggle={toggleEditModal}>
                    Modifica Orario
                </ModalHeader>
                <form className='tablelist-form' onSubmit={handleEditCategory}>
                    <ModalBody>
                        <div className='mb-3'>
                            <label htmlFor='edit-shop-field' className='form-label'>
                                Negozio
                            </label>
                            <select
                              id='edit-shop-field'
                              className='form-control'
                              value={editShopSelected}
                              onChange={(e) => setEditShopSelected(e.target.value)}
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
                            <label htmlFor='edit-description-field' className='form-label'>
                                Descrizione
                            </label>
                            <input
                                type='text'
                                id='edit-description-field'
                                className='form-control'
                                placeholder='Inserisci una descrizione'
                                value={editDescrizione}
                                onChange={(e) => setEditDescrizione(e.target.value)}
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <div className='form-check'>
                                <input
                                    type='checkbox'
                                    className='form-check-input'
                                    id='edit-bancoCheck'
                                    checked={attivoEditCheck}
                                    onChange={() => setEditAttivoCheck(!attivoEditCheck)}
                                />
                                <label className='form-check-label' htmlFor='edit-bancoCheck'>
                                    Attivo
                                </label>
                            </div>
                        </div>
                        <div className='mb-3'>
                            <Label htmlFor='edit-days-field' className='form-label'>
                                Giorni della settimana
                            </Label>
                            <Select
                                id='edit-days-field'
                                isMulti
                                options={daysOfWeekOptions}
                                value={selectedDays}
                                onChange={setSelectedDays}
                                placeholder='Seleziona i giorni'
                                classNamePrefix="js-example-basic-multiple mb-0"
                                styles={customStyles}
                            />
                        </div>
                        <div className='mb-3'>
                            <Label htmlFor='edit-turn-field' className='form-label'>
                                Turno
                            </Label>
                            <Select
                                id='edit-turn-field'
                                isMulti
                                options={turnOptions}
                                value={selectedTurn}
                                onChange={setSelectedTurn}
                                placeholder='Seleziona un turno'
                                classNamePrefix="js-example-basic-multiple mb-0"
                                styles={customStyles}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        
                        <Button color='secondary' className='btn btn-light' onClick={toggleEditModal}>
                            Chiudi
                        </Button>
                        <Button type='submit' className='btn btn-success' color='primary'>
                            Salva
                        </Button>
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
                accessorKey: 'shop.description',
                enableColumnFilter: false,
                size: '250',
            },
            {
                header: 'Descrizione',
                accessorKey: 'name',
                enableColumnFilter: false,
                size: '250',
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
                thClass: "text-center",
                tdClass: "text-center"
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


export default Orari;
