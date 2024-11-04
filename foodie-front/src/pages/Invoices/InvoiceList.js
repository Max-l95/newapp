import React, { useState, useEffect, useMemo } from "react";
import {
  CardBody,
  Row,
  Col,
  Card,
  Container,
  CardHeader,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  ButtonGroup,
} from "reactstrap";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import TableContainer from "../../Components/Common/TableContainerReactTable";
import DeleteModal from "../../Components/Common/DeleteModal";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { APIClient } from "../../helpers/api_helper";
import { deleteInvoice as onDeleteInvoice } from "../../slices/thunks";
import { sendInvoice as onSendInvoice } from "../../slices/thunks";
import { renderInvoice as onRenderInvoice } from "../../slices/thunks";
import { renderInvoicePassive as onRenderInvoicePassive } from "../../slices/thunks";

import SendModal from "../../Components/Common/SendModal";
import RenderModal from "../../Components/Common/RenderModal";
import { useNavigate } from "react-router-dom";

// Utility function to get year options
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2019; year <= currentYear; year++) {
    years.push({ label: `${year}`, value: year });
  }
  years.push({ label: "Tutti", value: 9999 });
  return [{ options: years }];
};

const InvoiceList = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const apiClient = new APIClient();
  const [modalDelete, setModalDelete] = useState(false);
  const [modalSend, setModalSend] = useState(false);
  const [modalRender, setModalRender] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [idToSend, setIdToSend] = useState(null);
  const [idToRender, setIdToRender] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [xmlString, setXmlString] = useState(null);
  const [xsl, setXsl] = useState(null);
  const [tipo, setTipo] = useState("fattureattive"); // Default value

  const yearOptions = getYearOptions();

  const fetchData = async (tipoParam, yearParam) => {
    try {
      const response = await apiClient.get(`/doceasy/api/${tipoParam}/${yearParam}`);
      
      if (response && response.data && Array.isArray(response.data)) {
          setData(response.data);
      } else {
          console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChangeYear = (selectedValue) => {
    const selectedYearOption = yearOptions[0].options.find(option => option.value === parseInt(selectedValue, 10));
    if (selectedYearOption) {
      setYear(selectedYearOption.value);
      fetchData(tipo, selectedYearOption.value); // Fetch data with updated year
    }
  };

  const handleChangeTipo = (newTipo) => {
    setTipo(newTipo); // Set the new tipo
    fetchData(newTipo, year); // Fetch data with the new tipo
  };

  const handleDeleteInvoice = async () => {
    if (idToDelete) {
      try {
        await dispatch(onDeleteInvoice(idToDelete));
        setData(prevData => prevData.filter(invoice => invoice.ID !== idToDelete));
        setModalDelete(false);
        toast.success("Fattura Eliminata Correttamente!");
      } catch (error) {
        console.error("Failed to delete the invoice:", error);
        toast.error("Errore Cancellazione Fattura.");
      }
    }
  };

  const handleSendInvoice = async () => {
    if (idToSend) {
      try {
        await dispatch(onSendInvoice(idToSend));
        setModalSend(false);
        toast.success("Fattura Inviata Correttamente!");
        fetchData(tipo, year); // Refresh data after sending invoice
      } catch (error) {
        console.error("Failed to send the invoice:", error);
        toast.error("Errore Nell'Invio Fattura.");
      }
    }
  };

  const handleRenderInvoice = async (id) => {
    if (id) {
      const result = tipo === "fattureattive"
        ? await dispatch(onRenderInvoice(id)).unwrap()
        : await dispatch(onRenderInvoicePassive(id)).unwrap();
        
      setXmlString(result.xmlString);
      setXsl(result.xsl);
      setModalRender(true);
    }
  };

  useEffect(() => {
    fetchData(tipo, year); // Fetch data whenever tipo or year changes
  }, [tipo, year]);

  const navigate = useNavigate();
  document.title = "Fatture | DgnsDesk";

  return (
    <React.Fragment>
      <div className="page-content">
        <DeleteModal
          show={modalDelete}
          onDeleteClick={handleDeleteInvoice}
          onCloseClick={() => setModalDelete(false)}
        />
        <SendModal show={modalSend}
          onSendClick={handleSendInvoice}
          onCloseClick={() => setModalSend(false)}
        />
        <RenderModal
        show={modalRender}
        xmlString={xmlString}
        xsl={xsl}
        onCloseClick={() => setModalRender(false)}
      />
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card id="invoiceList">
                <CardHeader className="border-0">
                  <div className="d-flex align-items-center">
                    <h5 className="card-title mb-0 flex-grow-1">Fatture</h5>
                    <div className="flex-shrink-0 me-2">
                      <div className="d-flex gap-2 flex-wrap">
                        <select
                          id="tipo-field"
                          className="form-select"
                          value={tipo}
                          onChange={(e) => handleChangeTipo(e.target.value)}
                          required
                        >                          
                          <option value="fattureattive">Attive</option>
                          <option value="fatturepassive">Passive</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex-shrink-0 me-2">
                      <div className="d-flex gap-2 flex-wrap">
                        <select
                          id="year-field"
                          className="form-select"
                          value={year}
                          onChange={(e) => handleChangeYear(e.target.value)}
                          required
                        >
                          <option value="" disabled>Seleziona Anno</option>
                          {yearOptions[0].options.map((yearOption) => (
                            <option key={yearOption.value} value={yearOption.value}>
                              {yearOption.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="d-flex gap-2 flex-wrap">
                        <Link to="/fatture/nuova" className="btn btn-success">
                          <i className="ri-add-line align-bottom me-1"></i> Nuova Fattura
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <SearchTable
                    data={data}
                    selectedRows={selectedRows}
                    onRowSelect={setSelectedRows}
                    onDelete={(id) => {
                      setIdToDelete(id);
                      setModalDelete(true);
                    }}
                    onSend={(id) => {
                      setIdToSend(id);
                      setModalSend(true);
                    }}

                    onRender={(id) =>{
                      
                      handleRenderInvoice(id)
                      setModalRender(true)
                    }}
                    
                    onEdit={(id) => {
                      navigate("/fattura/edit", { state: { id: id } });
                    }}

                    tipo = {tipo}
                    
                  
                  
                  />
                  <ToastContainer closeButton={false} limit={1} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

const SearchTable = ({
  data,
  selectedRows,
  onRowSelect,
  onDelete,
  onSend,
  onRender,
  onEdit, 
  tipo
}) => {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    const allIds = data.map(item => item.ID);
    if (!selectAll) {
      onRowSelect(allIds);
    } else {
      onRowSelect([]);
    }
    setSelectAll(!selectAll);
  };

  const statusIcons = {
    ConsegnatoDestinatario: "ri-checkbox-circle-line text-success",
    AccettataCommittente: "ri-checkbox-circle-line text-success",
    DecorrenzaTermini: "ri-error-warning-line text-warning",
    ImpossibileRecapitare: "ri-error-warning-line text-warning",
    RifiutataCommittente: "ri-close-circle-line text-danger",
    ScartoSdI: "ri-close-circle-line text-danger",
    Attesa: "ri-corner-up-right-line",
    DaInviare: "ri-send-plane-fill text-body-tertiary",
    InviatoSdI : "ri-send-plane-fill text-info",
    Ricevuta : "ri-checkbox-circle-line text-success"
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
};

  const columns = useMemo(() => [
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
      size: "20",
      thClass: "text-end align-middle",
      tdClass: "text-end align-middle",

      
    },
    {
      header: "Numero",
      cell: ({ getValue }) => <span className="fw-semibold">{getValue()}</span>,
      accessorKey: "Numero",
      enableColumnFilter: false,
      enableResizing: false,
      size:"20",
      thClass: "align-middle",
      tdClass: "align-middle",
     
    },
    {
      header: "Data",
      cell: ({ getValue }) => {
        const dateStr = getValue();
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        return <span className="fw-semibold">{formattedDate}</span>;
      },
      accessorKey: "Data",
      enableColumnFilter: false,
      enableResizing: false,
      thClass: "align-middle",
      tdClass: "align-middle",
      
    },
    {
      header: "Cliente",
      accessorKey: "Denominazione",
      enableColumnFilter: false,
      thClass: "align-middle",
      tdClass: "align-middle",
    },
    {
      header: "Codice Fiscale",
      accessorKey: "CodiceFiscale",
      enableColumnFilter: false,
      thClass: "align-middle",
      tdClass: "align-middle",
    },
    {
      header: "Partita Iva",
      accessorKey: "PartitaIva",
      enableColumnFilter: false,
      thClass: "align-middle",
      tdClass: "align-middle",
    },
    {
      header: "Stato",
      accessorKey: "StatoDocumento",
      thClass: "text-end align-middle",
      tdClass: "text-end align-middle",
      enableColumnFilter: false,
      cell: ({ getValue }) => {
        const status = getValue();
        const icon = statusIcons[status] || "ri-close-circle-line";
        
        return (
          <span className="fw-semibold">
            <i className={icon} style={{ fontSize: "24px", textAlign: "center" }} />
          </span>
        );
      },
    },
    {
      header: "Importo",
      accessorKey: "Importo",
      enableColumnFilter: false,
      thClass: "text-end align-middle",
      tdClass: "text-end align-middle",
      cell: (cell) => {
        return (
            <span>{formatPrice(cell.getValue())}</span>
        );
    },
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
                {stato === "Attesa" && (
                  <>
                  <DropdownItem onClick={() => onSend(row.original.ID)}>
                    Invia
                  </DropdownItem>
                    <DropdownItem onClick={() => onEdit(row.original.ID)}>
                      Modifica
                    </DropdownItem>
                    <DropdownItem onClick={() => onDelete(row.original.ID)}>
                      Elimina
                    </DropdownItem>
                  </>
                )}
                <DropdownItem onClick={() => onRender(row.original.ID)}>
                  Visualizza
                </DropdownItem>
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
    
  ], [data, selectedRows, selectAll, onRowSelect, onDelete, onSend, onRender, onEdit]);

  return (
    <TableContainer
      columns={columns}
      data={data}
      isGlobalFilter={false}
      isAddUserList={false}
      isBulkActions={false}
      customPageSize={8}
      
    />
  );
};

export default InvoiceList;
