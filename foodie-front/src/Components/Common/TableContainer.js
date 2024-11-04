import React, { Fragment, useEffect, useState } from "react";
import { CardBody, Col, Row, Table, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { Link } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';
import { APIClient } from "../../helpers/api_helper";
import Select from "react-select";



// Column Filter component
const Filter = ({ column }) => {
  const columnFilterValue = column.getFilterValue();
  return (
    <>
      <Input
        type="text"
        value={columnFilterValue ?? ''}
        onChange={e => column.setFilterValue(e.target.value)}
        placeholder="Search..."
        className="w-36 border shadow rounded"
      />
      <div className="h-1" />
    </>
  );
};

const TableContainer = ({
  columns,
  data,
  isGlobalFilter,
  customPageSize,
  groupByField,
  tableClass,
  theadClass,
  trClass,
  thClass,
  divClass,
  SearchPlaceholder,  
  fetchData,
  
}) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnSizing, setColumnSizing] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [grouping, setGrouping] = useState([groupByField]);
  const [idToDelete, setIdToDelete] = useState(null);
  const [modalDelete, setModalDelete] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tavoliOptions, setTavoliOptions] = useState([])
  const [newTavoli, setNewTavoli] = useState([])

  const apiClient = new APIClient();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const fuzzyFilter = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value);
    addMeta({ itemRank });
    return itemRank.passed;
  };

  const table = useReactTable({
    columns,
    data,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      globalFilter,
      columnSizing,
      pagination: {
        pageIndex,
        pageSize: customPageSize || 10,
      },
      expanded,
      grouping,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
    onExpandedChange: setExpanded,
    onGroupingChange: setGrouping,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const {
    getHeaderGroups,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    getPageOptions,
    nextPage,
    previousPage,
    setPageSize,
    getState,
  } = table;

  useEffect(() => {
    if (customPageSize) {
      setPageSize(customPageSize);
    }
  }, [customPageSize]);

  useEffect(() => {
    setPageIndex(getState().pagination.pageIndex);
  }, [getState().pagination.pageIndex]);

  const toggleModal = (row) => {
    setModalOpen(!modalOpen);
    
    
  }


  const toggleDelete = (id) => {
    setIdToDelete(id); // Set the ID of the reservation to delete
    setModalDelete(!modalDelete); // Toggle the modal
  };

  // Confirm deletion of the selected reservation
  const confirmDelete = async () => {
    if (idToDelete) {
      try {
        const response = await apiClient.delete('/reservation/delete', { id: idToDelete });
        if (response.success) {
          fetchData()
          toggleDelete(); // Close the modal
        } else {
          console.error('Delete operation failed:', response.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error deleting reservation:', error);
      }
    }
  };


const fetchDataTavoli = async () => {
  try {
    const response = await apiClient.get('/tavoli'); // Adjust the endpoint as needed
    if (response && response.data && Array.isArray(response.data)) {
      const options = response.data.map(iva => ({
        value: iva.id.toString(),
        label: iva.number, // Adjust the label as needed
       
      }));
      setTavoliOptions(options);
      
    } else {
      console.error('Invalid response structure:', response);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
useEffect(() => {      
  fetchDataTavoli();
}, []);

const handleSelectTables = (selectedOptions) => {
  setNewTavoli(selectedOptions || []); // Handle null when no options are selected
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
const handleRowSelection = (row, reservationData) => {
  setSelectedRow(row.original);
  setSelectedReservation(reservationData);
  setModalOpen(true); // Open the modal directly
};


  return (
    <Fragment>
      {isGlobalFilter && (
        <Row className="mb-3">
          <CardBody className="border border-dashed border-end-0 border-start-0">
            <form>
              <Row>
                <Col sm={5}>
                  <div className="search-box ms-auto me-2 mb-2 d-inline-block col-12">
                    <Input
                      value={globalFilter ?? ''}
                      onChange={e => setGlobalFilter(e.target.value)}
                      placeholder={SearchPlaceholder}
                    />
                    <i className="bx bx-search-alt search-icon"></i>
                  </div>
                </Col>
              </Row>
            </form>
          </CardBody>
        </Row>
      )}

      <div className={divClass}>
        <Table hover className={tableClass}>
          <thead className={theadClass}>
            {getHeaderGroups().map(headerGroup => (
              <tr className={trClass} key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`${thClass} ${header.column.columnDef.thClass || ''}`}
                    style={{ width: header.getSize() }}
                    {...{
                      onClick: header.column.getToggleSortingHandler(),
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <React.Fragment>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} />
                          </div>
                        ) : null}
                      </React.Fragment>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
  {getRowModel().rows.map(row => (
    <Fragment key={row.id}>
      <tr className={trClass}> {/* Main row */}
        {row.getVisibleCells().map(cell => (
          <td key={cell.id} className={cell.column.columnDef.tdClass || ''}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
      {row.getIsExpanded() && (
        <tr>
          <td colSpan={row.getVisibleCells().length}> {/* Span for expanded row */}
            <Table className={tableClass} hover>
              <thead className={theadClass}>
                <tr>
                  <th>Disponibile</th>
                  <th className={thClass}>Turno</th>
                  <th>Ore</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Persone</th>
                  <th className={thClass}>Note</th>
                  <th className="text-center">Prenota</th>
                  <th className="text-center">Disdici</th>
                </tr>
              </thead>
              <tbody>
                {row.original.reservations.map((reservationData, index) => (
                  <tr key={index} className={trClass}> {/* Sub-row for reservations */}
                    <td>
                      {/* Display circle based on reservation status */}
                      <span 
                        style={{
                          display: 'inline-block',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: reservationData.reservations?.length ? 'red' : 'green'
                        }}
                      />
                    </td>
                    <td className={trClass}>
                      {reservationData.turn?.description || 'No Turn'}
                    </td>
                    <td className={trClass}>
                    {reservationData.reservations?.[0]?.time !== undefined ? reservationData.reservations[0].time : 'N/A'}
                    </td>

                    <td className={trClass}>
                      {/* Check if cognome and nome are undefined */}
                      {reservationData.reservations?.[0]?.customer?.cognome === undefined && 
                       reservationData.reservations?.[0]?.customer?.nome === undefined
                        ? 'N/A'
                        : `${reservationData.reservations?.[0]?.customer?.cognome || ''} ${reservationData.reservations?.[0]?.customer?.nome || ''}`.trim() || 'N/A'}
                    </td>
                    <td className={trClass}>
                      {reservationData.reservations?.[0]?.people !== undefined ? reservationData.reservations[0].people : 'N/A'}
                    </td>
                    <td className={trClass}>
                      {reservationData.reservations?.[0]?.note || 'N/A'}
                    </td>
                    <td className="text-center">
                    <Button 
                      color="primary" 
                      onClick={() => handleRowSelection(row, reservationData)}
                    >
                      Prenota
                    </Button>
                    </td>
                    <td className="text-center">
                    <Button color="danger"
                              onClick={() => {
                                if (reservationData.reservations && reservationData.reservations.length > 0) {
                                  toggleDelete(reservationData.reservations[0].id); // Pass the reservation ID to delete
                                }
                              }}
                            >
                              Disdici
                            </Button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </td>
        </tr>
      )}
    </Fragment>
  ))}
</tbody>


        </Table>
      </div>

      <Row className="align-items-center mt-2 g-3 text-center text-sm-start">
        <div className="col-sm">
          <div className="text-muted">
            <span className="fw-semibold ms-1">{getState().pagination.pageSize}</span> di <span className="fw-semibold">{data.length}</span> Risultati
          </div>
        </div>
        <div className="col-sm-auto">
          <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
            <li className={!getCanPreviousPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={() => {
                previousPage();
                setPageIndex(getState().pagination.pageIndex - 1); // Update internal page index
              }}>
                Precedente
              </Link>
            </li>
            {getPageOptions().map((item, key) => (
              <React.Fragment key={key}>
                <li className="page-item">
                  <Link to="#" className={getState().pagination.pageIndex === item ? "page-link active" : "page-link"} onClick={() => {
                    setPageIndex(item); // Update internal page index
                  }}>
                    {item + 1}
                  </Link>
                </li>
              </React.Fragment>
            ))}
            <li className={!getCanNextPage() ? "page-item disabled" : "page-item"}>
              <Link to="#" className="page-link" onClick={() => {
                nextPage();
                setPageIndex(getState().pagination.pageIndex + 1); // Update internal page index
              }}>
                Successiva
              </Link>
            </li>
          </ul>
        </div>
      </Row>
      <Modal isOpen={modalDelete} toggle={toggleDelete} centered>
        <ModalHeader toggle={toggleDelete}>Eliminare prenotazione?</ModalHeader>
        <ModalBody>
          <div className="mt-2 text-center">
            <h4>Sei sicuro?</h4>
            <p className="text-muted mx-4 mb-0">Sei sicuro di voler procedere con l'eliminazione?</p>
          </div>
          <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
            <Button color="light" onClick={toggleDelete}>Annulla</Button>
            <Button color="danger" onClick={confirmDelete}>Si, Elimina!</Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Modal for Reservation Details */}
      <Modal isOpen={modalOpen} toggle={toggleModal}>
  <ModalHeader toggle={toggleModal}>
    <h1>Tavolo {selectedRow? selectedRow.number : ""}</h1>
    Aggiungi Prenotazione 
  </ModalHeader>
  <ModalBody>
    {selectedRow && selectedReservation ? (
      <form id="reservationForm">        
        <div className="mb-3">
          <label htmlFor="cognome" className="form-label">Cognome</label>
          <Input
            type="text"
            id="cognome"
            className="form-control"
            required
            
          />
        </div>
        <div className="mb-3">
          <label htmlFor="nome" className="form-label">Nome</label>
          <Input
            type="text"
            id="nome"
            className="form-control"
            required
            
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="people" className="form-label">Numero di Persone</label>
          <Input
            type="number"
            id="people"
            className="form-control"
            min="1"
            required
            defaultValue={selectedRow.min_places}
            
          />
        </div>

        <div className="mb-3">
          <label htmlFor="time" className="form-label">Ore</label>
          <Input
            type="time"
            id="time"
            className="form-control"
            required
            defaultValue={selectedReservation.turn.description}

          />
        </div>
        <div className="mb-3">
            <label htmlFor="ing-field" className="form-label">Tavoli</label>
              <Select
            isMulti={true}
            value={newTavoli}
            onChange={handleSelectTables}
            options={tavoliOptions}
            placeholder="Tavoli..."
            classNamePrefix="js-example-basic-multiple mb-0"
            styles={customStyles}
            
            
          />
          </div>

        <div className="mb-3">
          <label htmlFor="notes" className="form-label">Note</label>
          <textarea
            id="notes"
            className="form-control"
            rows="3"
          />
        </div>
      </form>
    ) : (
      <p>No reservation selected.</p>
    )}
  </ModalBody>
  <ModalFooter>
    <Button color="secondary" onClick={toggleModal}>Chiudi</Button>
    <Button color="primary" onClick={async () => {
      const form = document.getElementById('reservationForm');
      
      if (form.checkValidity()) {
        
        
        try {
          const response = await apiClient.create('/reservation/add', {            
            cognome: form.cognome.value,
            nome: form.nome.value,
            people: form.people.value,
            time: form.time.value,
            notes: form.notes.value,
            turn: selectedReservation.turn.id,
            date: document.getElementById('date-field').value,
            shop : document.getElementById('shop-field').value,
            table: newTavoli,
            number: selectedRow.number
          });
          if (response.success) {
            // Handle success
            fetchData()            
            toggleModal();
            // Optionally refresh your reservation list here
          } else {
            // Handle error
            alert(result.error);
          }
        } catch (error) {
          console.error('Error adding reservation:', error);
        }
      } else {
        form.reportValidity();
      }
    }}>Conferma</Button>
  </ModalFooter>
</Modal>

    </Fragment>
  );
};

export default TableContainer;
