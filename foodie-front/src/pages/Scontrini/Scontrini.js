import React, { useEffect, useRef, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import $ from 'jquery';
import 'datatables.net-bs5';
import 'datatables.net-responsive-bs5';
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css';
import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.min.css';

const Scontrini = ({ data, fetchData }) => {
    const apiClient = new APIClient();
    const [modalPrint, setModalPrint] = useState(false);
    const [modalDeleteS, setModalDeleteS] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const [idToPrint, setIdToPrint] = useState(null);
    const [tableData, setTableData] = useState([]);
    const dataTableRef = useRef(null);

    // Map the incoming data to the format expected by DataTable
    useEffect(() => {
        if (data && data.length > 0) {
            const mappedData = data.map(item => ({
                id: item.id,
                date: item.date, // Ensure your date format is correct
                numeroDoc: item.numeroDoc,
                cliente: item.cliente,
                totale: item.totale,
                annullato: item.annullato,
            }));
            setTableData(mappedData);
        }
    }, [data]);

    useEffect(() => {
        if (dataTableRef.current) {
            console.log("Table Data before initialization:", tableData);
    
            if ($.fn.DataTable.isDataTable(dataTableRef.current)) {
                $(dataTableRef.current).DataTable().clear().destroy();
            }
    
            const table = $(dataTableRef.current).DataTable({
                responsive: true,
                data: tableData,
                order: [[1, "desc"]],
                columns: [
                    { title: "Id", data: "id", visible: false },
                    { title: "Data", data: "date", type: 'date', className: "text-start" },
                    { title: "Scontrino", data: "numeroDoc", className: "text-start" },
                    { title: "Cliente", data: "cliente" },
                    {
                        title: "Totale",
                        data: "totale",
                        render: function(data) {
                            return new Intl.NumberFormat('de-DE', {
                                style: 'currency',
                                currency: 'EUR',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }).format(data);
                        }
                    },
                    {
                        title: "Annullato",
                        data: "annullato",
                        render: function(data) {
                            return data ? '<i class="ri-close-circle-line text-danger" style="font-size: 20px;"></i>' : '';
                        }
                    },
                    {
                        title: "Azioni",
                        width: "15%",
                        data: null,
                        render: function(data, type, row) {
                            return `
                                <button class="btn btn-primary btn-sm print-btn" ${!row.id ? 'disabled' : ''}>Stampa</button>
                                <button class="btn btn-danger btn-sm delete-btn" ${row.annullato ? 'disabled' : ''}>Elimina</button>
                            `;
                        }
                    }
                ],
                columnDefs: [
                    { targets: 0, visible: false },
                    { targets: 5, orderable: false },
                    { targets: 6, orderable: false },
                ],
                destroy: true,
                lengthChange: false,
            });
    
            $(dataTableRef.current).on('click', '.print-btn', function () {
                const rowData = table.row($(this).closest('tr')).data();
                console.log('Print Button Clicked. Row Data:', rowData);
                if (rowData) {
                    setIdToPrint(rowData.id);
                    togglePrint();
                } else {
                    console.error("Row data not found for print button.");
                }
            });
    
            $(dataTableRef.current).on('click', '.delete-btn', function () {
                const row = $(this).closest('tr');
                const rowData = table.row(row).data();
                console.log('Delete Button Clicked. Row Data:', rowData);
                if (rowData) {
                    setIdToDelete(rowData.id);
                    toggleDelete();
                } else {
                    console.error("Row data not found for delete button.");
                }
            });
        }
    }, [tableData]); // Trigger table initialization when tableData changes
    

    const toggleDelete = () => {
        setModalDeleteS(!modalDeleteS);
    };

    const togglePrint = () => {
        setModalPrint(!modalPrint);
    };

    const confirmDelete = async () => {
        if (!idToDelete) {
            toast.error("ID non trovato per l'eliminazione.");
            return;
        }
        
        try {
            const response = await apiClient.delete('/scontrino/annulla', { ids: [idToDelete] });
            if (response.success) {
                fetchData();
                toast.success("Scontrino Correttamente Annullato!");
                toggleDelete();
            } else {
                toast.error(response.error);
                console.error('Delete operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error deleting scontrini:', error);
        }
    };

    const handlePrint = async () => {
        if (!idToPrint) {
            toast.error("ID non trovato per la stampa.");
            return;
        }
        
        try {
            const response = await apiClient.create('/scontrino/reprint', { ids: [idToPrint] });
            if (response.success) {
                fetchData();
                toast.success("Scontrino Correttamente Stampato!");
                togglePrint();
            } else {
                toast.error(response.error);
                console.error('Print operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error printing scontrini:', error);
        }
    };

    return (
        <React.Fragment>
            <div className="table-responsive">
                <table ref={dataTableRef} className="table table-striped table-bordered dt-responsive nowrap" style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Id</th>
                            <th>Data</th>
                            <th>Scontrino</th>
                            <th>Cliente</th>
                            <th>Totale</th>
                            <th>Annullato</th>
                            <th>Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* DataTable will populate this body */}
                    </tbody>
                </table>
            </div>

            {/* Modal for print confirmation */}
            <Modal isOpen={modalPrint} toggle={togglePrint} centered>
                <ModalHeader toggle={togglePrint}>Conferma Stampa</ModalHeader>
                <ModalBody>
                    Sei sicuro di voler procedere con la stampa del record selezionato?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={togglePrint}>Annulla</Button>
                    <Button color="primary" onClick={handlePrint}>Si, Stampa!</Button>
                </ModalFooter>
            </Modal>

            {/* Modal for delete confirmation */}
            <Modal isOpen={modalDeleteS} toggle={toggleDelete} centered>
                <ModalHeader toggle={toggleDelete}>Conferma Eliminazione</ModalHeader>
                <ModalBody>
                    Sei sicuro di voler eliminare questo scontrino?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleDelete}>Annulla</Button>
                    <Button color="danger" onClick={confirmDelete}>Si, Elimina!</Button>
                </ModalFooter>
            </Modal>

            <ToastContainer closeButton={false} limit={1} />
        </React.Fragment>
    );
};

export default Scontrini;
