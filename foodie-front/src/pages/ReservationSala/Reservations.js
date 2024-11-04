import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, Label,  } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainer';
import { APIClient } from '../../helpers/api_helper';
import Flatpickr from "react-flatpickr";
import { getLoggedinUser } from '../../helpers/api_helper';

const Reservations = () => {
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
    const [shopOptions, setShopOptions] = useState([]);
    const [shopSelected, setShopSelected] = useState('');
    const [newOrdinamento, setNewOrdinamento] = useState('')
    const [editOrdinamento, setEditOrdinamento] = useState('')
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
    
    const [newDate, setNewDate] = useState(getCurrentDate());
    
    
    const toggleDelete = () => {
        setModalDelete(!modalDelete);
    };

    const toggleEditModal = () => {
        setEditModal(!editModal);
    };

    const fetchData = async () => {
        
        // Check if newDate is a Date object
        let formattedDate;
    
        if (newDate instanceof Date) {
            // Format newDate to yyyy-mm-dd
            const year = newDate.getFullYear();
            const month = String(newDate.getMonth() + 1).padStart(2, '0'); // Add leading zero if necessary
            const day = String(newDate.getDate()).padStart(2, '0'); // Add leading zero if necessary
            formattedDate = `${year}-${month}-${day}`;
        } else if (typeof newDate === 'string') {
            // If newDate is already a string, use it directly
            formattedDate = newDate;
        } else {
            console.error('newDate is neither a Date object nor a string:', newDate);
            return; // Exit if newDate is not valid
        }
    
        try {
            const response = await apiClient.create('/reservations/tables-and-turns', {
                date: formattedDate, // Use formattedDate
                shop: shopSelected
            });
    
           
    
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    
    


    const handleEdit = (category) => {
        setEditId(category.id);
        setEditDescription(category.description);
        setEditReparto(category.reparti)
        setEditDescriptionAgg(category.descrizione_agg)
        setEditOrdinamento(category.ordinamento)
        toggleEditModal();
    };

    const handleEditCategory = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.update('/reservations/edit', {
                id: editId,
                description: editDescription,
                reparto: editReparto,
                descrizione_agg : editDescriptionAgg,
                ordinamento : editOrdinamento
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
            const response = await apiClient.delete('/reservations/delete', { ids: idsToDelete });
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
    const fetchDataShops = async () => {
        try {
            const response = await apiClient.get('/shops'); // Adjust endpoint as necessary
            const userProfileSession = getLoggedinUser();
    
            // Check if the userProfileSession has a shop value
            const shopFilterValue = userProfileSession.data.shop;
            console.log('Shop Filter Value:', shopFilterValue); // Log shop filter value
    
            if (response && response.data && Array.isArray(response.data)) {
                // Map the response data to create options
                const options = response.data.map(category => ({
                    value: category.id.toString(), // Ensure value is a string
                    label: category.description,
                }));
    
                // If shopFilterValue is not null, filter the options based on the shopFilterValue
                if (shopFilterValue) {
                    const filteredOptions = options.filter(option => option.value === shopFilterValue.toString()); // Ensure comparison is valid
                    console.log('Filtered Options:', filteredOptions); // Log filtered options
    
                    setShopOptions(filteredOptions);
    
                    // Set the first shop as the selected one if any filtered options are available
                    if (filteredOptions.length > 0) {
                        setShopSelected(filteredOptions[0].value); // Set the first shop as default selected
                    } else {
                        console.warn('No shops match the filter criteria.'); // Log a warning if no options match
                    }
                } else {
                    // If shopFilterValue is null, set all options and select the first one
                    console.log('No shop filter applied, setting all options.');
                    setShopOptions(options);
    
                    // Set the first shop as the selected one if any options are available
                    if (options.length > 0) {
                        setShopSelected(options[0].value); // Set the first shop as default selected
                    }
                }
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    };
    

    useEffect(() => {
        fetchDataShops(); // Fetch shops on component mount
    }, []);
    
    useEffect(() => {
        if (newDate && shopSelected) {
            fetchData(); // Fetch data when newDate or shopSelected changes
        }
    }, [newDate, shopSelected]);
    
    

    


    document.title = "Prenotazioni | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Prenotazioni</h4>
                                </CardHeader>
                                <CardBody>
                                    <Row>
                                    
                                    <Col lg={2} className="col-sm-auto">
                                        <div>
                                            <Flatpickr
                                                name="date"
                                                id="date-field"
                                                className="form-control"
                                                placeholder="AAAA/MM/GG"
                                                value={newDate}
                                                options={{
                                                    dateFormat: 'Y-m-d',
                                                    defaultDate: [newDate],
                                                }}
                                                onChange={(date) => {
                                                    setNewDate(date[0]);
                                                    fetchData(); // Call fetchData after changing the date
                                                }}
                                            />
                                        </div>
                                    </Col>
                                    <Col lg={3}>
                                        <div className='mb-3'>
                                            <select
                                                id='shop-field'
                                                className='form-control'
                                                value={shopSelected}
                                                onChange={(e) => {
                                                    setShopSelected(e.target.value);
                                                    fetchData(); // Call fetchData after changing the shop selection
                                                }}
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
                                    </Col>


                                    </Row>
                                    <SearchTable
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        onEdit={handleEdit}
                                        onDelete={(id) => { setIdToDelete(id); toggleDelete(); }}
                                        toggleDelete={toggleDelete}
                                        setSelectedRows={setSelectedRows}
                                        fetchData={fetchData}
                                        
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
            
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

const SearchTable = ({ data, selectedRows, onRowSelect, onEdit, onDelete, setSelectedRows, fetchData }) => {
    const [selectAll, setSelectAll] = useState(false);

    // Fixed grouping field (grouping by 'table.id')
    const groupByField = 'id'; // Matches your data structure

    const handleSelectAll = () => {
        const allIds = data.map(item => item.id);
        if (!selectAll) {
            setSelectedRows(allIds); // Select all rows
        } else {
            setSelectedRows([]); // Deselect all rows
        }
        setSelectAll(!selectAll); // Toggle selectAll state
    };

    const handleRowSelect = (row) => {
        if (selectedRows.includes(row.id)) {
            setSelectedRows(selectedRows.filter(id => id !== row.id)); // Deselect row
        } else {
            setSelectedRows([...selectedRows, row.id]); // Select row
        }
        onRowSelect(row); // Call onRowSelect if necessary
    };

    const columns = useMemo(
        () => [
            {
                header: "#",
                accessorKey: "expand",
                cell: ({ row }) => (
                    <button
                        className="btn btn-link"
                        onClick={() => row.toggleExpanded()} // Use toggleExpanded method
                    >
                        <i className={row.getIsExpanded() ? "ri-arrow-up-s-line fs-4" : "ri-arrow-down-s-line fs-4"}></i>
                    </button>
                ),
                enableColumnFilter: false,
                disableSortBy: true,
                size: "10",
                thClass: "align-middle text-start",
                tdClass: "align-middle text-start"
            },           
            
            {
                header: "Tavolo",
                accessorKey: "number", // Accessing the table number directly
                enableColumnFilter: false,
                size: "750",
                thClass: "align-middle text-start",
                tdClass: "align-middle text-start"

            },
            {
                header: "P.Minimi",
                accessorKey: "min_places", // Accessing the table number directly
                enableColumnFilter: false,
                size: "50",
                thClass: "align-middle text-start",
                tdClass: "align-middle text-start"

            },
            {
                header: "P.Massimi",
                accessorKey: "max_places", // Accessing the table number directly
                enableColumnFilter: false,
                size: "50",
                thClass: "align-middle text-start",
                tdClass: "align-middle text-start"

            },         

            
        ],
        [data, selectedRows, selectAll, onEdit, onDelete, setSelectedRows]
    );
    
    
    useEffect(() => {
        if (selectedRows.length === data.length && data.length > 0) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [selectedRows, data]);

    // Prepare data for expandable rows
    const preparedData = data.map(item => ({
        ...item,
        // Assuming each item has a 'reservations' array
        reservations: item.reservations || []
    }));

    return (
        <TableContainer 
            columns={columns} 
            data={preparedData} 
            isGlobalFilter={false}
            customPageSize={5}
            SearchPlaceholder="Cerca..."
            
            onRowSelect={handleRowSelect} // Handle row selection if needed
            fetchData = {fetchData}
           
        />
    );
};

export default Reservations;
