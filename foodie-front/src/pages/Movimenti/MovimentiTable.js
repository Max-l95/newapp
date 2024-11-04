import React, { useState, useMemo } from 'react';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';

const MovimentiTable = ({ data, fetchData }) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [modalDelete, setModalDelete] = useState(false);
    const [rowToDelete, setRowToDelete] = useState(null); // State to store the row ID to delete
    const apiClient = new APIClient();

    const toggleDelete = (rowId) => {
        setRowToDelete(rowId); // Store the row ID to delete
        setModalDelete(!modalDelete);
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

        toggleDelete(null); // Open the modal for multiple deletion
    };

    const confirmDelete = async () => {
        try {
            const idsToDelete = rowToDelete ? [rowToDelete] : selectedRows; // Use single row ID or selected rows
            const response = await apiClient.delete('/movimenti/magazzino/delete', { data: { ids: idsToDelete } });
            
            if (response.success) {
                fetchData();
                setSelectedRows([]);
                setRowToDelete(null); // Reset the row to delete
                toggleDelete(null); // Close the modal
            } else {
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting products:', error);
        }
    };

    const columns = useMemo(
        () => [
            {
                header: (
                    <div className="form-check">
                        <input
                            className='form-check-input'
                            type="checkbox"
                            id="checkAll"
                            onChange={(e) => {
                                if (e.target.checked) {
                                    const allIds = data.map((item) => item.id);
                                    setSelectedRows(allIds);
                                } else {
                                    setSelectedRows([]);
                                }
                            }}
                        />
                    </div>
                ),
                cell: (cell) => {
                    return (
                        <div className="form-check">
                            <input
                                className='form-check-input'
                                type="checkbox"
                                checked={selectedRows.includes(cell.row.original.id)}
                                onChange={() => handleRowSelect(cell.row.original)}
                            />
                        </div>
                    );
                },
                accessorKey: "checkbox",
                enableColumnFilter: false,
                disableSortBy: true,
                size: "10",
            },
            {
                header: "Data",
                accessorKey: "date",
                enableColumnFilter: false,
                thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
            },
            {
                header: "Numero",
                accessorKey: "numero",
                enableColumnFilter: false,
                thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
            },
            {
                header: "Fornitore",
                accessorKey: "fornitore",
                enableColumnFilter: false,
                thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
            },
            {
                header: "Totale Documento",
                accessorKey: "totale",
                enableColumnFilter: false,
                thClass: "text-end align-middle",
              tdClass: "text-end align-middle",
            },
            {
                header: "Azioni",
                cell: (cell) => {
                    return (
                        <div>
                            <Button size="sm" color="primary">Modifica</Button>{' '}
                            <Button size="sm" color="danger" onClick={() => toggleDelete(cell.row.original.id)}>Elimina</Button>
                        </div>
                    );
                },
                accessorKey: "actions",
                enableColumnFilter: false,
                disableSortBy: true,
                size: "40",
                thClass: "text-start align-middle",
              tdClass: "text-start align-middle",
            }
        ],
        [data, selectedRows]
    );

    return (
        <React.Fragment>
            <TableContainer
                columns={columns}
                data={data}
                isGlobalFilter={true}
                customPageSize={5}
                SearchPlaceholder="Search..."
            />
            <Modal isOpen={modalDelete} toggle={() => toggleDelete(null)} centered>
                <ModalHeader toggle={() => toggleDelete(null)}></ModalHeader>
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
                        <button type="button" className="btn w-sm btn-light" onClick={() => toggleDelete(null)}>Annulla</button>
                        <button type="button" className="btn w-sm btn-danger" onClick={confirmDelete}>Si, Elimina!</button>
                    </div>
                </ModalBody>
            </Modal>
        </React.Fragment>
    );
};

export default MovimentiTable;
