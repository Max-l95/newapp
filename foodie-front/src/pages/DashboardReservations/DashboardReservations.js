import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Modal, ModalHeader, ModalBody, ModalFooter, ButtonGroup, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const DashboardReservations = () => {
    const apiClient = new APIClient();

    const [modalList, setModalList] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [modalConfirm, setModalConfirm] = useState(false);
    const [modalCharge, setModalCharge] = useState(false)
    
    const [data, setData] = useState([]);
    const [newDescription, setNewDescription] = useState('');
    const [newDescriptionAgg, setNewDescriptionAgg] = useState('');
    const [newReparto, setNewReparto] = useState('')
    
    const [selectedRows, setSelectedRows] = useState([]);
    const [idToDelete, setIdToDelete] = useState(null);
    const [idToConfirm, setIdToConfirm] = useState(null);
    const [idToCharge, setIdToCharge] = useState(null);

    
    const toggleDelete = (id) => {
        setIdToDelete(id)
        setModalDelete(!modalDelete);
    };

    const toggleConfirm = () => {
        setModalConfirm(!modalConfirm);
    };

    const toggleCharge = () => {
        setModalCharge(!modalCharge);
    };

    

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/reservations');
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
                console.log(response.data)
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

    

    const confirmMultipleDelete = async () => {
        const idsToDelete = idToDelete;
        console.log(idsToDelete)
        

        try {
            const response = await apiClient.delete('/reservation/delete/complete', { id: idsToDelete });
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

    const confirmMultipleConfirm = async () => {
        const idsToConfirm = idToConfirm;
        


        try {
            const response = await apiClient.delete('/reservation/confirm', { id: idsToConfirm });
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleConfirm();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting categories:', error);
        }
    };
    const confirmMultipleCharge = async () => {
        const idsToCharge = idsToCharge;
        console.log(idsToCharge)

        try {
            const response = await apiClient.delete('/reservation/charge', { id: idsToCharge });
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                toggleCharge();
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting categories:', error);
        }
    };      

    

    

    document.title = "Dashboard | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Dashboard</h4>
                                </CardHeader>
                                <CardBody>                                    
                                <SearchTable
                                    data={data}
                                    selectedRows={selectedRows}
                                    onRowSelect={handleRowSelect}
                                    onCharge={(id) => { setIdToCharge(id); toggleCharge(); }} // Fix here
                                    onDelete={(id) => { setIdToDelete(id); toggleDelete(id); }} // Fix here
                                    onConfirm={(id) => { setIdToConfirm(id); toggleConfirm(); }} // Fix here
                                    toggleDelete={toggleDelete}
                                    setSelectedRows={setSelectedRows}
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
                <ModalHeader toggle={toggleConfirm}></ModalHeader>
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
            <Modal isOpen={modalCharge} toggle={toggleCharge} centered>
                <ModalHeader toggle={toggleCharge}></ModalHeader>
                <ModalBody>
                    <div className="mt-2 text-center">
                        
                        <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                            <h4>Sei sicuro?</h4>
                            <p className="text-muted mx-4 mb-0">Sei sicuro di voler procedere con l'addebito dei record selezionati?</p>
                        </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                        <button type="button" className="btn w-sm btn-light" onClick={toggleCharge}>Annulla</button>
                        <button type="button" className="btn w-sm btn-primary" onClick={confirmMultipleCharge}>Si, Addebita!</button>
                    </div>
                </ModalBody>
            </Modal>

            
        </React.Fragment>
    );
};

const SearchTable = ({ data, selectedRows, onCharge, onDelete,onConfirm, setSelectedRows }) => {
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
                      className="form-check-input"
                      type="checkbox"
                      id="checkAll"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </div>
                ),
                cell: ({ row }) => (
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedRows.includes(row.original.ID)}
                      onChange={() => onRowSelect([row.original.ID])}
                    />
                  </div>
                ),
                accessorKey: "checkbox",
                enableColumnFilter: false,
                disableSortBy: true,
                thClass: "d-none",
                tdClass: "d-none",
          
                
              },
           
            

            {
                header: "Cliente",
                accessorKey: "customer.nomeCognome", // New accessor key for combined name
                enableColumnFilter: false,
                size: "100",
                cell: ({ row }) => `${row.original.customer.nome} ${row.original.customer.cognome}`, // Combines nome and cognome
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                
            },
            {
                header: "Data",
                accessorKey: "date", // New accessor key for combined name
                enableColumnFilter: false,
                size: "30",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                
            },
            {
                header: "Online",
                accessorKey: "locale", // Assuming this is where the true/false value is stored
                enableColumnFilter: false,
                size: "30",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                cell: ({ getValue }) => {
                  const status = getValue(); // Get the value (true/false)
                  
                  // Define the icon and color based on true or false
                  const icon = status ? "ri-close-circle-line" : "ri-checkbox-circle-line"; // Check icon for true, X icon for false
                  const color = status ? "red" : "green"; // Green for true, red for false
                  
                  return (
                    <span className="fw-semibold">
                      <i className={icon} style={{ fontSize: "20px", color: color, textAlign: "center" }} />
                    </span>
                  );
                }
              },
              
              {
                header: "Tavolo",
                accessorKey: "tables", // New accessor key for combined name
                enableColumnFilter: false,
                size: "30",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                cell: ({ row, getValue }) => {
                    const tables = getValue();
            
                    // Extract unique numbers from the tables array
                    const uniqueNumbers = Array.from(new Set(tables.map(table => table.number))).join(", ");
            
                    // Return the unique numbers for display
                    return (
                        <span>{uniqueNumbers}</span>
                    );
                }
            },
            
            {
                header: "Negozio",
                accessorKey: "shops", // New accessor key for combined name
                enableColumnFilter: false,
                size: "300",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                
            },
            {
                header: "Stato",
                accessorKey: "reservation_validated", // Assuming this holds the validation status (true/false)
                enableColumnFilter: false,
                size: "30",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
                cell: ({ row, getValue }) => {
                  const status = getValue(); // Get the reservation_validated value
                  const charged = row.original.charged; // Assuming 'charged' is a part of the row data
              
                  // Check if charged is true, use a specific icon for charged
                  let icon;
                  let color;
                  let title;
              
                  if (charged) {
                    icon = "ri-money-euro-circle-line"; // Icon for when charged is true
                    color = "#405486"; // Color for charged (you can choose a different color)
                    title = "Addebitata"
                  } else {
                    // Define the icon and color based on reservation_validated (status)
                    
                    icon = status ? "ri-checkbox-circle-line" : "ri-close-circle-line"; // Check icon for true, X icon for false
                    color = status ? "green" : "red"; // Green for true, red for false
                    title = status ? "Confermata" : "Non Confermata"
                  }
              
                  return (
                    <span className="fw-semibold">
                      <i
                      title={title}
                        className={icon}
                        style={{ fontSize: "20px", color: color, textAlign: "center" }}
                      />
                    </span>
                  );
                }
              },
              
            {
                header: "Azioni",
                cell: ({ row }) => {
                  const stato = row.original.StatoDocumento;
              
                  return (
                    <ButtonGroup>
                      <UncontrolledDropdown>
                        <DropdownToggle tag="button" className="btn btn-light">
                          <i className="ri-list-check" style={{ fontSize: "24px", textAlign: "center" }}></i>
                        </DropdownToggle>
                        <DropdownMenu>
                          
                          {/* Conditionally render Modifica and Elimina based on StatoDocumento */}
                          
                            <>
                            <DropdownItem onClick={() => onConfirm(row.original.reservation_col)}>
                              Conferma
                            </DropdownItem>
                              <DropdownItem onClick={() => onDelete(row.original.reservation_col)}>
                                Disdici
                              </DropdownItem>
                              <DropdownItem onClick={() => onCharge(row.original.reservation_col)}>
                                Addebita
                              </DropdownItem>
                            </>                        
                          
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </ButtonGroup>
                  );
                },
                accessorKey: "actions",
                enableColumnFilter: false,
                disableSortBy: true,
                size: "20",
                thClass: "text-center align-middle",
                tdClass: "text-center align-middle",
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

export default DashboardReservations;
