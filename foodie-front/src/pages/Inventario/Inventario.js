import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, Container, Row, Col, CardBody, Button, Input, Modal, ModalHeader, ModalBody } from 'reactstrap';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { APIClient } from '../../helpers/api_helper';

const Inventario = () => {
    const apiClient = new APIClient();
    const [data, setData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [modalConfirm, setModalConfirm] = useState(null);
    const [modalDelete, setModalDelete] = useState(null);

    const toggleDelete = () => {
        setModalDelete(!modalDelete);
    };

    const toggleConfirm = () => {
        setModalConfirm(!modalConfirm);
    };

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/giacenze');
            if (response && response.data && Array.isArray(response.data)) {
                
                setData(response.data);
                
                // Filter the data based on your criteria
                const filteredData = response.data.filter(articolo => {
                    return !(articolo.giacenza_varianti === null && articolo.is_variante === false);
                });
    
                setTableData(filteredData); // Initialize tableData with filtered data
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
        const newSelected = selectedIndex === -1 
            ? [...selectedRows, row.id] 
            : selectedRows.filter(id => id !== row.id);

        setSelectedRows(newSelected);
    };

    const handleConfirm = async () => {
        console.log(tableData)
        try {
            const response = await apiClient.create('/update-giacenze', { data: tableData });
            if (response && response.data) {
                fetchData(); // Refresh the data after confirmation
                setModalConfirm(!modalConfirm);
                // Optionally: Notify the user about the successful update
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error sending data:', error);
        }
    };

    const handleReset = () => {
        fetchData(); // Re-fetch the original data
        setModalDelete(!modalDelete);
    };

    document.title = "Inventario | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Inventario e Listini</h4>
                                </CardHeader>
                                <CardBody>
                                    <Col className="col-sm-auto">
                                        <div>
                                            <Button 
                                                color="success" 
                                                className="add-btn me-1" 
                                                id="create-btn" 
                                                onClick={toggleConfirm}
                                            >
                                                <i className="ri-check-line align-bottom me-1"></i> Conferma
                                            </Button>
                                            <Button 
                                               className="btn btn-soft-danger"
                                                id="delete-btn" 
                                                onClick={toggleDelete}
                                            >
                                                <i className="ri-delete-bin-line"></i> Ripristina
                                            </Button>
                                        </div>
                                    </Col>
                                    <SearchTable
                                        data={data}
                                        selectedRows={selectedRows}
                                        onRowSelect={handleRowSelect}
                                        setSelectedRows={setSelectedRows}
                                        setTableData={setTableData} // Pass setter function
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
                    <ModalHeader toggle={toggleDelete}></ModalHeader>
                    <ModalBody>
                        <div className="mt-2 text-center">
                            <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop"
                                colors="primary:#f7b84b,secondary:#f06548" style={{ width: "100px", height: "100px" }}></lord-icon>
                            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                                <h4>Sei sicuro?</h4>
                                <p className="text-muted mx-4 mb-0">Sei sicuro di voler ripristinare le modifiche apportate?</p>
                            </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                            <button type="button" className="btn w-sm btn-light" onClick={toggleDelete}>Annulla</button>
                            <button type="button" className="btn w-sm btn-danger" onClick={handleReset}>Si, Elimina!</button>
                        </div>
                    </ModalBody>
                </Modal>
                <Modal isOpen={modalConfirm} toggle={toggleConfirm} centered>
                    <ModalHeader toggle={toggleConfirm}></ModalHeader>
                    <ModalBody>
                        <div className="mt-2 text-center">
                            <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                                <h4>Sei sicuro?</h4>
                                <p className="text-muted mx-4 mb-0">Sei sicuro di voler salvare le modifiche apportate?</p>
                            </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                            <button type="button" className="btn w-sm btn-light" onClick={toggleConfirm}>Annulla</button>
                            <button type="button" className="btn w-sm btn-success" onClick={handleConfirm}>Conferma</button>
                        </div>
                    </ModalBody>
                </Modal>
            </div>
        </React.Fragment>
    );
};

const SearchTable = ({ data, selectedRows, setTableData }) => {
    const [localTableData, setLocalTableData] = useState(data);
    const [currentPage, setCurrentPage] = useState(0);

    // Update localTableData whenever data changes, without resetting the current page
    useEffect(() => {
        setLocalTableData(prevData => {
            const maxPage = Math.ceil(data.length / 10) - 1;
            if (currentPage > maxPage) {
                setCurrentPage(maxPage); // Adjust the page if needed, but don't reset it unnecessarily
            }
            return data;
        });
    }, [data, currentPage]);

    // Memoized handleInputChange to avoid re-creating on each render
    const handleInputChange = useCallback((id, key, value) => {
        const parsedValue = parseFloat(value) || 0;

        setLocalTableData(prevData => {
            const updatedData = prevData.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [key]: parsedValue };
                    const giacenza_iniziale = updatedItem.giacenza_iniziale || 0;
                    let carico = updatedItem.carico || 0;
                    let scarico = updatedItem.scarico || 0;

                    if (key === 'giacenza_iniziale' || key === 'carico' || key === 'scarico') {
                        // Update giacenza_finale based on the formula
                        updatedItem.giacenza_finale = giacenza_iniziale + carico - scarico;
                    } else if (key === 'giacenza_finale') {
                        const diff = giacenza_iniziale - parsedValue;

                        if (diff < 0) {
                            carico = Math.abs(diff); // Set carico to the positive difference
                            scarico = 0; // Ensure scarico is 0
                        } else {
                            scarico = diff; // Set scarico to the positive difference
                            carico = 0; // Ensure carico is 0
                        }

                        updatedItem.carico = carico;
                        updatedItem.scarico = scarico;
                    }

                    return updatedItem;
                }
                return item;
            });

            // Update the parent component's state
            setTableData(updatedData);
            return updatedData;
        });
    }, [setTableData]);

    // Memoized columns definition to avoid re-creating columns on each render
    const columns = useMemo(() => [
        {
            header: "ID",
            accessorKey: "id",
            cell: cell => <span className="fw-semibold">{cell.getValue()}</span>,
            size: "10",
            thClass: "d-none",
            tdClass: "d-none",
            enableColumnFilter: false,
        },
        {
            header: "Categoria",
            accessorKey: "category.description",
            size: "15",
            enableColumnFilter: false,
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
        },
        {
            header: "Codice",
            accessorKey: "code",
            size: "30",
            enableColumnFilter: false,
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
        },
        {
            header: "Cod.Variante",
            accessorKey: "codice_variante",
            size: "30",
            enableColumnFilter: false,
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
        },
        {
            header: "Descrizione",
            accessorKey: "description",
            size: "200",
            enableColumnFilter: false,
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
        },
        {
            header: "Descrizione Variante",
            accessorKey: "desc_variante",
            size: "200",
            enableColumnFilter: false,
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
        },
        {
            header: "G. Iniziale",
            accessorKey: "giacenza_iniziale",
            size: "30",
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
            enableColumnFilter: false,
            cell: cell => (
                <Input
                    type="text"
                    value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                    className='text-end'
                    onChange={e => handleInputChange(cell.row.original.id, 'giacenza_iniziale', e.target.value)}
                    disabled
                />
            )
        },
        {
            header: "Carico",
            accessorKey: "carico",
            size: "30",
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
            enableColumnFilter: false,
            cell: cell => (
                <Input
                    type="text"
                    value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                    className='text-end'
                    onChange={e => handleInputChange(cell.row.original.id, 'carico', e.target.value)}
                />
            )
        },
        {
            header: "Scarico",
            accessorKey: "scarico",
            size: "30",
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
            enableColumnFilter: false,
            cell: cell => (
                <Input
                    type="text"
                    value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                    className='text-end'
                    onChange={e => handleInputChange(cell.row.original.id, 'scarico', e.target.value)}
                />
            )
        },
        {
            header: "G. Finale",
            accessorKey: "giacenza_finale",
            size: "30",
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
            enableColumnFilter: false,
            cell: cell => (
                <Input
                    type="text"
                    value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                    className='text-end'
                    onChange={e => handleInputChange(cell.row.original.id, 'giacenza_finale', e.target.value)}
                />
            )
        },
        {
            header: "Prezzo(€)",
            accessorKey: "prezzo",
            size: "30",
            thClass: "text-start align-middle",
            tdClass: "text-start align-middle",
            enableColumnFilter: false,
            cell: cell => {
                // Check if the row key 'prezzi_varianti' is true
                const isPrezziVariantiTrue = cell.row.original.prezzi_varianti;
                const isVariante = cell.row.original.is_variante;
        
                // Render an Input if 'prezzi_varianti' is false, else render a span or similar element
                return isPrezziVariantiTrue  && isVariante ? (
                    <Input
                        type="text"
                        value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                        className='text-end'
                        onChange={e => handleInputChange(cell.row.original.id, 'prezzo', e.target.value)}
                    />
                ) : !isPrezziVariantiTrue && !isVariante ? (
                    <Input
                        type="text"
                        value={cell.getValue() !== undefined ? cell.getValue() : '0'}
                        className='text-end'
                        onChange={e => handleInputChange(cell.row.original.id, 'prezzo', e.target.value)}
                    />
                ): (
                    <span></span>
                )
            }
        }
        
    ], [handleInputChange]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage); // Update the current page state
    };

    return (
        <TableContainer
            columns={columns}
            data={localTableData} // Use localTableData as data source
            isGlobalFilter={true}
            customPageSize={10}
            SearchPlaceholder='Cerca...'
            currentPage={currentPage}
            onPageChange={handlePageChange} // Capture page change events
        />
    );
};

export default Inventario;
