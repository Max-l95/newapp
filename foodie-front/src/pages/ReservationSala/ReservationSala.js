import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, CardFooter, Modal, ModalBody, ModalHeader } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import { useWebSocket } from '../../Components/WebSocketProvider/WebSocketcontext';
import ReservationTable from './ReservationsTable';
import { getLoggedinUser } from '../../helpers/api_helper';

const ReservationSala = () => {
    const [cart, setCart] = useState([]);
    const [shopOptions, setShopOptions] = useState([]);
    const [shopSelected, setShopSelected] = useState('');
    const [tables, setTables] = useState([]);
    const [data, setData] = useState([]);
    const [reservations, setReservations] = useState({}); // Store reservations for each table
    const [selectedTable, setSelectedTable] = useState(1);
    const [selectedNumber, setSelectedNumber] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [idToConfrim, setIdToConfirm] = useState(null);
    const [modalDelete, setModalDelete] = useState(false);
    const [modalConfirm, setModalConfirm] = useState(false);
    
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const [newDate, setNewDate] = useState(getCurrentDate());
    
    const apiClient = new APIClient();
    const tablesFetched = useRef(false);    
    const { socket } = useWebSocket();

    useEffect(() => {
        if (socket) {
            const handleTablesUpdate = async () => {
                await fetchTablesAndReservations(); // Fetch and update on event
            };
    
            socket.on('tables_updated', handleTablesUpdate);
    
            return () => {
                socket.off('tables_updated', handleTablesUpdate);
            };
        }
    }, [socket]); // Ensure this runs when the socket is established
    

    // Fetch tables and reservations when shopSelected changes
    useEffect(() => {
        if (shopSelected && !tablesFetched.current) {
            fetchTablesAndReservations();
        }
    }, [shopSelected]);

    const fetchTablesAndReservations = async () => {
        try {
            if (!shopSelected) return; // Ensure a shop is selected before making API call
    
            // Fetch tables
            const tablesResponse = await apiClient.get(`/tavoli/${shopSelected}`);
            if (!tablesResponse || !tablesResponse.data || !Array.isArray(tablesResponse.data)) {
                console.error('Invalid response structure for tables:', tablesResponse);
                return;
            }
    
            const updatedTables = tablesResponse.data;
    
            // Find the table with banco: true
            const tableWithBanco = updatedTables.find(table => table.banco === true);
            if (tableWithBanco) {
                setSelectedTable(tableWithBanco.id);
            }
    
            // Fetch reservations
            const reservationsResponse = await apiClient.create('/reservations/filter', {
                date: newDate,
                shop: shopSelected,
            });
    
            if (!reservationsResponse || !reservationsResponse.data || !Array.isArray(reservationsResponse.data)) {
                console.error('Invalid response structure for reservations:', reservationsResponse);
                return;
            }
    
            // Create a map to store reservations by table ID
            const reservationsData = {};
            reservationsResponse.data.forEach(reservation => {
                const tableId = reservation.table.id; // Make sure to access the correct nested property
                
                // Check if the reservation is not removed
                if (!reservation.removed) { // Include only reservations that are NOT removed
                    if (!reservationsData[tableId]) {
                        reservationsData[tableId] = [];
                    }
                    reservationsData[tableId].push(reservation);
                }
            });
    
            // Attach reservations data to the tables
            const tablesWithReservations = updatedTables.map(table => ({
                ...table,
                reservations: reservationsData[table.id] || [] // Attach the reservations to the table
            }));
    
            handleTablesUpdate(tablesWithReservations);
            console.log('Tables with Reservations:', tablesWithReservations); // Debugging log
    
        } catch (error) {
            console.error('Error fetching tables or reservations:', error);
        }
    };


    const confirmMultipleDelete = async () => {
        const idsToDelete = selectedRows;

        try {
            const response = await apiClient.delete('/reservation/delete', { ids: idsToDelete });
            if (response.success) {
                
                await fetchTablesAndReservations(); // Re-fetch the tables and reservations
                setSelectedRows([]);
                toggleDelete();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting categories:', error);
        }
    };

    const confirmMultipleConfirm = async () => {
        const idsToConfirm = selectedRows;
    
        try {
            const response = await apiClient.delete('/reservation/confirm', { ids: idsToConfirm });
            if (response.success) {
                // Fetch the updated reservations again to update the local state
                await fetchTablesAndReservations(); // Re-fetch the tables and reservations
                setSelectedRows([]); // Clear selected rows
                toggleConfirm(); // Close the confirmation modal
            } else {
                console.error('Confirm operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error confirming reservations:', error);
        }
    };
     
    
    

    const handleTablesUpdate = (newTables) => {
        renderTableButtons()
        setTables(newTables);
    };

    const toggleDelete = () => {
        setModalDelete(!modalDelete);
    };

    const toggleConfirm = () => {
        setModalConfirm(!modalConfirm);
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
    
    
    

    const fetchData = async () => {
        try {
            const response = await apiClient.create('/reservations/filter', {
                date: newDate, // Current date
                shop: shopSelected,
                table: selectedTable // Fetch using the selected table
            });
    
            if (response && response.data && Array.isArray(response.data)) {
                // Filter out removed reservations
                const filteredData = response.data.filter(reservation => !reservation.removed);
                setData(filteredData);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    

    // Fetch data when the component mounts
    useEffect(() => {
        fetchDataShops(); // Fetch shop options on mount
    }, []);

    // Fetch data when selectedTable changes
    useEffect(() => {
        fetchData(); // Fetch data whenever selectedTable changes
    }, [selectedTable]);

    const renderTableButtons = () => {
        // Get the current date and time
        const currentTime = new Date();
        currentTime.setSeconds(0); // Set seconds to 0 for precise comparison
    
        return tables.map((table) => {
            // Check if the table has any reservations
            const hasReservations = table.reservations && table.reservations.length > 0;
    
            // Initialize the button color
            let buttonColor = "success"; // Default color is success
    
            // If there are reservations, check them
            if (hasReservations) {
                const hasValidReservation = table.reservations.some(reservation => {
                    const [hours, minutes] = reservation.time.split(':'); // Split hh:mm
                    const reservationTime = new Date(currentTime);
                    reservationTime.setHours(parseInt(hours), parseInt(minutes), 0); // Set hours and minutes
    
                    // Set the time window: 30 minutes before and after
                    const reservationStartTime = new Date(reservationTime.getTime() - 30 * 60000); // 30 minutes before
                    const reservationEndTime = new Date(reservationTime.getTime() + 30 * 60000); // 30 minutes after
    
                    // Check if current time is within the reservation window and is validated
                    return currentTime >= reservationStartTime && currentTime <= reservationEndTime && reservation.reservation_validated;
                });
    
                // Check if there are any unvalidated reservations in the time window
                const hasUnvalidatedReservations = table.reservations.some(reservation => {
                    const [hours, minutes] = reservation.time.split(':'); // Split hh:mm
                    const reservationTime = new Date(currentTime);
                    reservationTime.setHours(parseInt(hours), parseInt(minutes), 0); // Set hours and minutes
    
                    // Set the time window: 30 minutes before and after
                    const reservationStartTime = new Date(reservationTime.getTime() - 30 * 60000); // 30 minutes before
                    const reservationEndTime = new Date(reservationTime.getTime() + 30 * 60000); // 30 minutes after
    
                    // Check if current time is within the reservation window
                    return currentTime >= reservationStartTime && currentTime <= reservationEndTime;
                });
    
                // Set button color based on reservation status
                if (hasValidReservation) {
                    buttonColor = "danger"; // Validated reservation within 30 minutes
                } else if (hasUnvalidatedReservations) {
                    buttonColor = "warning"; // Unvalidated reservations within 30 minutes
                }
            }
    
            return (
                <Button
                    key={table.id}
                    color={buttonColor}
                    className="m-2"
                    style={{ width: '150px', height: '150px', fontSize: "20px" }}
                    onClick={() => handleTableButtonClick(table.id, table.number)}
                >
                    {table.number}
                </Button>
            );
        });
    };
    
    
    
    
    

    const handleTableButtonClick = (tableId, tableN) => {
        setSelectedTable(tableId); // Set the selected table ID
        setSelectedNumber(tableN);  // Optionally set the selected table number
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

    document.title = "Negozio | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={6}>
                            <Card>
                                <CardHeader>
                                    <div className='d-flex justify-content-between'>
                                        <h4 className='card-title mb-0'>Sala</h4>
                                        <div className='mb-3'>
                                            <select
                                                id='shop-field'
                                                className='form-control'
                                                value={shopSelected}
                                                onChange={(e) => setShopSelected(e.target.value)} // Update shop selection
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
                                    </div>
                                </CardHeader>
                                <CardBody>
                                    {renderTableButtons()}
                                </CardBody>
                            </Card>
                        </Col>
                        <Col lg={6}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Prenotazioni</h4>
                                </CardHeader>
                                <CardBody>
                                    <ReservationTable
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        onDelete={(id) => { setIdToDelete(id); toggleDelete(); }}
                                        setSelectedRows={setSelectedRows}
                                        onEdit={(id) => { setIdToConfirm(id); toggleConfirm(); }}
                                    />
                                </CardBody>
                                <CardFooter>
                                </CardFooter>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                <ModalHeader toggle={toggleDelete}>Eliminare prenotazione?</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                       
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
            <Modal isOpen={modalConfirm} toggle={toggleConfirm} centered>
                <ModalHeader toggle={toggleConfirm}>Confermare prenotazione?</ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">                        
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Sei sicuro?</h4>
                            <p className="text-muted mx-4 mb-0">Sei sicuro di voler procedere con la conferma dei record selezionati?</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={toggleConfirm}>Annulla</button>
                        <button type="button" className="btn w-sm btn-success" onClick={confirmMultipleConfirm}>Si, Conferma!</button>
                    </div>
                </ModalBody>
            </Modal>
            </div>
        </React.Fragment>
    );
}

export default ReservationSala;
