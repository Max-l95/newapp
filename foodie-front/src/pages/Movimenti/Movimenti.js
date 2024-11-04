import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Label,
  Table,
} from 'reactstrap';
import Flatpickr from 'react-flatpickr';
import Select from 'react-select';
import { APIClient } from '../../helpers/api_helper';
import NewFornitore from '../Fornitori/NewFornitore';
import MovimentiTable from './MovimentiTable';


const Movimenti = () => {
  const apiClient = new APIClient();

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newDate, setNewDate] = useState(getCurrentDate());
  const [newNumero, setNewNumero] = useState('');
  const [newSezionale, setNewSezionale] = useState('');
  const [selectedFornitore, setNewFornitore] = useState('');
  const [articoliOptions, setArticoliOptions] = useState([]);
  const [codivaOptions, setCodivaOptions] = useState([]);
  const [singleOptions, setSingleOptions] = useState([]);
  const [rows, setRows] = useState([
    {
      id: 1,
      selectedArticolo: null,
      selectedCodiva: null,
      qt: '',
      prezzo: '',
      totale: '',
    },
  ]);

  const [modalList, setModalList] = useState(false);
  const [modalFornitore, setModalFornitore] = useState(false);

  const [groupedRows, setGroupedRows] = useState([]); // New state for grouped rows
  const [imponibile, setImponibile] = useState(0);
  const [iva, setIva] = useState(0);
  const [totale, setTotale] = useState(0)
  const [data, setData] = useState([]);

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/magazzino/movimenti');
            console.log(response);
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
    }, []);


  const toggleList = () => {
    setModalList(!modalList);
  };

  const toggleAddFornitore = () => {
    setModalFornitore(!modalFornitore);
  };

  const handleSelectFornitore = (selectedSingle) => {
    setNewFornitore(selectedSingle);
  };

  
  const fetchDataCodiva = async () => {
    try {
      const response = await apiClient.get('/codiva');
      if (response && response.data && Array.isArray(response.data)) {
        const transformedData = response.data.map((item) => ({
          value: item.id,
          label: item.description,
        }));
        setCodivaOptions(transformedData);
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDataCodiva();
  }, []);

  const fetchDataFornitore = async () => {
    try {
      const response = await apiClient.get('/fornitori');
      if (response && response.data && Array.isArray(response.data)) {
        const transformedData = response.data.map((item) => ({
          value: item.id,
          label: item.denominazione
            ? item.denominazione
            : `${item.cognome} ${item.nome}`,
        }));
        setSingleOptions(transformedData);
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDataFornitore();
  }, []);

  const fetchDataArticoli = async () => {
    try {
      const response = await apiClient.get('/products');
      if (response && response.data && Array.isArray(response.data)) {
        const transformedData = response.data.map((item) => ({
          value: item.id,
          label: item.description,
          codiva: item.iva,
        }));
        setArticoliOptions(transformedData);
      } else {
        console.error('Invalid response structure:', response);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDataArticoli();
  }, []);

  const handleSelectArticolo = (index, selectedOption) => {
    const newRows = [...rows];
    newRows[index].selectedArticolo = selectedOption;
    newRows[index].selectedCodiva = {
      value: selectedOption.codiva.id,
      label: `${selectedOption.codiva.description}`,
    };
    setRows(newRows);
  };

  const handleSelectCodiva = (index, selectedOption) => {
    const newRows = [...rows];
    newRows[index].selectedCodiva = selectedOption;
    setRows(newRows);
  };

  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const calculateTotals = () => {
    const newRows = rows.map((row) => {
      const quantita = parseFloat(row.qt) || 0;
      const prezzo = parseFloat(row.prezzo) || 0;
      const totale = quantita * prezzo;
      return { ...row, totale: totale.toFixed(2) };
    });
  
    // Only update if newRows is different from current rows
    if (JSON.stringify(newRows) !== JSON.stringify(rows)) {
      setRows(newRows);
    }
  };
  

  const groupRowsByIva = () => {
    const groupedData = rows.reduce((acc, row) => {
      const ivaKey = row.selectedCodiva?.value;
      const totale = parseFloat(row.totale) || 0;
  
      if (ivaKey) {
        if (!acc[ivaKey]) {
          acc[ivaKey] = {
            id: ivaKey,
            selectedCodiva: row.selectedCodiva,
            imponibile: 0,
            iva: 0,
          };
        }
        acc[ivaKey].imponibile += totale;
        acc[ivaKey].iva += totale * (parseFloat(row.selectedCodiva.label.split('%')[0]) / 100);
      }
      return acc;
    }, {});

    const newGroupedRows = Object.values(groupedData).map((item, index) => ({
      id: index + 1,
      selectedCodiva: item.selectedCodiva,
      imponibile: item.imponibile.toFixed(2),
      iva: item.iva.toFixed(2),
      totale: (parseFloat(item.imponibile.toFixed(2)) + parseFloat(item.iva.toFixed(2))).toFixed(2),
    }));
  
    setGroupedRows(newGroupedRows);
    const imponibile = newGroupedRows.reduce((sum, item) => sum + parseFloat(item.imponibile), 0);
    const iva = newGroupedRows.reduce((sum, item) => sum + parseFloat(item.iva), 0);
    const totale = imponibile + iva;

    setImponibile(imponibile.toFixed(2));
    setIva(iva.toFixed(2));
    setTotale(totale.toFixed(2));
  };

 useEffect(() => {
  // This can be simplified by only calling when rows are actually updated
  calculateTotals();
  groupRowsByIva();
}, [rows]);
  const addRow = () => {
    const newRow = {
      id: rows.length + 1,
      selectedArticolo: null,
      selectedCodiva: null,
      qt: '',
      prezzo: '',
      totale: '',
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (index) => {
    const newRows = rows.filter((row, rowIndex) => rowIndex !== index);
    setRows(newRows);
  };

  const handleAddMovimento = async (event) => {
    event.preventDefault();
  
    // Create corpo data from rows
    const corpo = rows.map(row => ({
      articolo: row.selectedArticolo ? row.selectedArticolo.value : null, // ID of the article
      qt: row.qt ? parseFloat(row.qt) : 0, // Quantity
      codiva: row.selectedCodiva ? row.selectedCodiva.value : null, // ID of the IVA code
      prezzo: row.prezzo ? parseFloat(row.prezzo) : 0, // Price
      totale: row.totale ? parseFloat(row.totale) : 0, // Total
    }));
    console.log(totale)
    try {
      const response = await apiClient.create('/movimenti/magazzino/add', {
        data: newDate,
        numero: newNumero,
        sezionale: newSezionale,
        fornitore: selectedFornitore,
        iva: iva,
        totale: totale,
        corpo: corpo, // Pass the corpo data here
      });
  
      if (response.success) {
        // Reset the form or handle success
        fetchData();
        setModalList(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };
  

  document.title = 'Movimenti Magazzino | DgnsDesk';
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Movimenti Magazzino</h4>
                </CardHeader>
                <CardBody>
                  <Col className="col-sm-auto">
                    <div>
                      <Button
                        color="success"
                        className="add-btn me-1"
                        onClick={toggleList}
                        id="create-btn"
                      >
                        <i className="ri-add-line align-bottom me-1"></i> Aggiungi
                      </Button>
                      <Button className="btn btn-soft-danger">
                        <i className="ri-delete-bin-2-line"></i>
                      </Button>
                    </div>
                  </Col>
                  <MovimentiTable data={data} fetchData={fetchData}/>
                  

                </CardBody>
              </Card>
            </Col>
          </Row>
          <Modal isOpen={modalList} toggle={toggleList} size="xl">
            <form onSubmit={handleAddMovimento}>
              <ModalHeader toggle={toggleList}>
                Nuovo Movimento
              </ModalHeader>
              <ModalBody>
                <Row>
                  <Col lg={4}>
                    <div className="mb-3">
                      <label htmlFor="date-field" className="form-label">
                        Data
                      </label>
                      <Flatpickr
                        className="form-control"
                        value={newDate}
                        options={{
                          dateFormat: 'Y-m-d',
                          defaultDate: [newDate],
                        }}
                        onChange={(date) => setNewDate(date[0])}
                      />
                    </div>
                  </Col>
                  <Col lg={2}>
                    <div className="mb-3">
                      <label htmlFor="number-field" className="form-label">
                        Numero
                      </label>
                      <input
                        type="text"
                        id="number-field"
                        className="form-control"
                        placeholder="Inserisci il numero"
                        value={newNumero}
                        onChange={(e) => setNewNumero(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col lg={2}>
                    <div className="mb-3">
                      <label htmlFor="sezionale-field" className="form-label">
                        Sezionale
                      </label>
                      <input
                        type="text"
                        id="sezionale-field"
                        className="form-control"
                        placeholder="Inserisci il Sezionale"
                        value={newSezionale}
                        onChange={(e) => setNewSezionale(e.target.value)}
                      />
                    </div>
                  </Col>
                  <Col lg={4}>
                    <div className="mb-3">
                      <Label
                        htmlFor="choices-fornitore-default"
                        className="form-label"
                      >
                        Fornitore
                      </Label>
                      <div className="d-flex align-items-center">
                      <div className="input-group">
                        <Button
                          color="success"
                          className="add-btn"
                          onClick={toggleAddFornitore}
                          id="create-btn"
                        >
                          <i className="ri-add-line align-bottom"></i>
                        </Button>
                        <Select
                          value={selectedFornitore}
                          onChange={handleSelectFornitore}
                          placeholder="Seleziona Fornitore..."
                          options={singleOptions}
                          className="flex-grow-1"
                        />
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Table
                    
                  >
                    <thead>
                      <tr>
                        <th className="text-center">#</th>
                        <th>Articolo</th>
                        <th>Qtà</th>
                        <th>Iva</th>
                        <th>Prezzo</th>
                        <th>Totale</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index}>
                          <td className="text-center">{row.id}</td>
                          <td>
                            <Select
                              value={row.selectedArticolo}
                              onChange={(option) =>
                                handleSelectArticolo(index, option)
                              }
                              placeholder="Codice"
                              options={articoliOptions}
                              className="flex-grow-1"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="QT"
                              value={row.qt}
                              onChange={(e) =>
                                handleInputChange(index, 'qt', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <Select
                              value={row.selectedCodiva}
                              onChange={(option) =>
                                handleSelectCodiva(index, option)
                              }
                              placeholder="Iva"
                              options={codivaOptions}
                              className="flex-grow-1"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Prezzo"
                              value={row.prezzo}
                              onChange={(e) =>
                                handleInputChange(index, 'prezzo', e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Totale"
                              value={row.totale}
                              readOnly
                            />
                          </td>
                          <td>
                            <Button
                              color="danger"
                              onClick={() => removeRow(index)}
                            >
                              Rimuovi
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <Button color="primary" onClick={addRow}>
                    Aggiungi Riga
                  </Button>
                </Row>
                <Row>
                  <div className="hstack gap-2 justify-content-between mt-4">
                    <Col lg={12}>
                      <Table className='table-striped'>
                        <thead>
                          <tr>
                            <th className="text-center">Aliquota</th>
                            <th className="text-center">Imponibile</th>
                            <th className="text-center">Iva</th>
                            <th className='text-center'>Totale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedRows.map((group, index) => (
                            <tr key={index}>
                              <td className="text-end">
                                {group.selectedCodiva.label}
                              </td>
                              <td className="text-end">{group.imponibile}</td>
                              <td className="text-end">{group.iva}</td>
                              <td className='text-end'> {group.totale}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="text-end fw-bold">Totale</td>
                            <td className="text-end fw-bold">{imponibile}</td>
                            <td className="text-end fw-bold">{iva}</td>
                            <td className='text-end fw-bold'>{totale}</td>

                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </div>
                </Row>
              </ModalBody>
              <ModalFooter>
                <div className="hstack gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={toggleList}
                  >
                    Chiudi
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    id="add-btn"
                    onClick={handleAddMovimento}
                  >

                    Aggiungi Movimento
                  </button>
                </div>
              </ModalFooter>
            </form>
          </Modal>
          <NewFornitore
            modalList={modalFornitore}
            toggleList={toggleAddFornitore}
            fetchData={fetchDataFornitore}
          />
        </Container>
      </div>
    </React.Fragment>
  );
};






export default Movimenti;
