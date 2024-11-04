import React from 'react'
import { useState, useMemo, useEffect } from 'react';
import TableContainer from '../../Components/Common/TableContainerReactTable';
import { Button } from 'reactstrap';


const ReservationTable = ({ data, selectedRows, onRowSelect, onEdit, onDelete, setSelectedRows }) => {
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
                size: "10",
                thClass: "d-none",
                tdClass:"d-none"
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
                header: "Ore",
                accessorKey: "time",
                enableColumnFilter: false,
                size: "20"
            },
            {
                header: "Cliente",
                accessorKey: "customer.nomeCognome", // New accessor key for combined name
                enableColumnFilter: false,
                size: "300",
                cell: ({ row }) => `${row.original.customer.nome} ${row.original.customer.cognome}` // Combines nome and cognome
            },
            {
                header: "Persone",
                accessorKey: "people",
                enableColumnFilter: false,
                size: "20",
                thClass: "text'center",
                tdClass: "text'center"
            },
            
            {
                header: "Note",
                accessorKey: "note",
                enableColumnFilter: false,
                size: "150"
            },
           
            {
                header: "Azioni",
                cell: (cell) => (
                    <div>
                        <Button size="sm" color="primary" onClick={() => {onEdit(cell.row.original)
                        setSelectedRows(prevSelected => [...prevSelected, cell.row.original.id])}}>Conferma</Button>{' '}
                        <Button size="sm" color="danger" onClick={() => {
                                onDelete(cell.row.original.id);
                                setSelectedRows(prevSelected => [...prevSelected, cell.row.original.id]);
                            }}>Disdici</Button>
                    </div>
                ),
                accessorKey: "actions",
                enableColumnFilter: false,
                disableSortBy: true,
                thClass: "text-center",
                tdClass: "text-center",
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
            isGlobalFilter={false}
            customPageSize={5}
            SearchPlaceholder='Cerca...'
        />
    );
};

export default ReservationTable