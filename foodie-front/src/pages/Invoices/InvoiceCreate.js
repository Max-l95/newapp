import React, { useEffect, useState } from "react";

import {
  CardBody,
  Row,
  Col,
  Card,
  Container,
  Form,
  Input,
  Label,
  Table,
  FormFeedback,
  Button
} from "reactstrap";

import { Link, useNavigate } from "react-router-dom";
import Flatpickr from "react-flatpickr";
import { getLoggedinUser } from "../../helpers/api_helper";
import {XmlGenerator} from "./invoiceXml";


import Select from "react-select";


//formik
import { useFormik } from "formik";
import * as Yup from "yup";

//redux
import { useDispatch } from "react-redux";
import { addNewInvoice as onAddNewInvoice } from "../../slices/thunks";
import ClientiSelect from "../Clienti/ClientiSelect";
import NewCliente from "../Clienti/NewCliente";
import { APIClient } from "../../helpers/api_helper";
import SezionaliSelect from "../Sezionali/SezionaliSelect";
import PagamentiSelect from "../Pagamenti/PagamentiSelect";

const InvoiceCreate = () => {
  const dispatch = useDispatch();
  const history = useNavigate();
  const apiClient = new APIClient();

  const userProfileSession = getLoggedinUser();
  const [ispaymentDetails, setispaymentDetails] = useState(null);  
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedPagamento, setSelectedPagamento] = useState()

  const [modalList, setModalList] = useState(null)
  const [data, setData] = useState('')
  const [denominazione, setDenominazione] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState('');
  const [partitaiva, setPartitaiva] = useState("");
  const [codicefiscale, setCodicefiscale] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [civico, setCivico] = useState("");
  const [cap, setCap] = useState("");
  const [comune, setComune] = useState("");
  const [provincia, setProvincia] = useState("");
  const [nazione, setNazione] = useState("");
  const [SDI, setSDI] = useState("");
  const [pec, setPec] = useState("");
  const [sezionale, setSezionale] = useState([])
  const [sezionaliOptions, setSezionaliOptions] = useState([])
  const [numero, setNumero] = useState('')
  const [articoliOptions, setArticoliOptions] = useState([]);
  const [codivaOptions, setCodivaOptions] = useState([]);
  const [tipo, setTipo] = useState({ label: "Fattura", value: "TD01" })
  const [sconto, setSconto] = useState(0)
  const [ arrotondamento, setArrotondamento] = useState(0)

  const [rows, setRows] = useState([
    {
      id: 1,
      selectedArticolo: null,
      description: "",
      selectedCodiva: null,
      qt: 0,
      prezzo: 0,
      totale: '',
    },
  ]);

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newDate, setNewDate] = useState(getCurrentDate());


  function handleispaymentDetails(ispaymentDetails) {
    setispaymentDetails(ispaymentDetails);
  }

  const handleCustomerChange = (customer) => {
    setSelectedCustomer(customer);
    setDenominazione(customer?.label || "");
    setNome(customer?.nome || "");
    setCognome(customer?.cognome|| "");
    setPartitaiva(customer?.partitaiva || "");
    setCodicefiscale(customer?.codicefiscale || "");
    setIndirizzo(customer?.indirizzo || "");
    setCivico(customer?.civico || "");
    setCap(customer?.cap || "");
    setComune(customer?.comune || "");
    setProvincia(customer?.provincia || "");
    setNazione(customer?.nazione || "");
    setSDI(customer?.SDI || "");
    setPec(customer?.pec || "");
  };


  const handlePagamentiChange = (pagamento) => {
    setSelectedPagamento(pagamento)
  }
const handleSelectSezionale = (sezionale) => {

  console.log(sezionale)

  const newnumero = sezionale.number + 1
  setSezionale(sezionale)

  setNumero(newnumero)

}

const [logo, setLogo] = useState(null);

  useEffect(() => {
    const logoUrl = userProfileSession?.data?.azienda?.logo; // Assuming this returns a full URL or a relative path
    if (logoUrl) {
      setLogo(logoUrl);
    }
  }, [userProfileSession]);




const handleChangeTipo = (tipo) => {
  setTipo(tipo);
   // Fetch and filter data based on selected tipo
};

const navigate = useNavigate();

const handleSaveClick = async (event) => {
  
  event.preventDefault();

  // Create corpo data from rows
  const corpo = rows.map(row => {
    // Determine if row.description should be included
    const includeDescription = row.description !== (row.selectedArticolo ? row.selectedArticolo.description : '');

    return {
      articolo: row.selectedArticolo ? row.selectedArticolo.value : null, // ID of the article
      description: includeDescription ? row.description : null, // Include description if different
      code: row.selectedArticolo ? row.selectedArticolo.code : null,
      qt: row.qt ? parseFloat(row.qt) : 0, // Quantity
      codiva: row.selectedCodiva ? row.selectedCodiva.aliquota : null, // ID of the IVA code
      prezzo: row.prezzo ? parseFloat(row.prezzo) : 0, // Price
      totale: row.totale ? parseFloat(row.totale) : 0, // Total
    };
  });

  // Ensure groupedRows is defined correctly
  // For example, if it comes from state or props, make sure you access it correctly
  // const groupedRows = this.state.groupedRows; // Example if it's from state

  // Use groupedRows from state
  const xmlString = XmlGenerator(
    SDI, 
    nazione, 
    partitaiva, 
    codicefiscale, 
    denominazione, 
    nome, 
    cognome, 
    indirizzo, 
    civico, 
    cap, 
    comune, 
    provincia, 
    newDate, 
    sezionale, 
    numero, 
    tipo, 
    corpo, 
    sconto, 
    arrotondamento, 
    totale, 
    groupedRows, // Use groupedRows here
    selectedPagamento
  );

  try {
    const response = await apiClient.create('/doceasy/api/fatturavendita/new', {
      xml: xmlString,
      sezionale: sezionale,
      cliente: selectedCustomer,
      sezionale: sezionale,
      corpo: rows,
      totale: totale,
      pagamento: selectedPagamento,
      numero: numero, 
      data: newDate 
    });
    navigate("/fatture");
  } catch (error) {
    console.error('Error adding category:', error);
  }
};



const handleSelectCodiva = (index, selectedOption) => {
  const newRows = [...rows];
  newRows[index].selectedCodiva = selectedOption;
  setRows(newRows);
};

const fetchDataCodiva = async () => {
  try {
    const response = await apiClient.get('/codiva');
    if (response && response.data && Array.isArray(response.data)) {
      const transformedData = response.data.map((item) => ({
        value: item.id,
        label: item.description,
        aliquota: item.aliquota
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

  
  


const allTypes = [
  {
    options: [
      { label: "Seleziona tipo documento", value: "Seleziona tipo documento" },
      { label: "Fattura", value: "TD01" },
      { label: "Acconto/anticipo su fattura", value: "TD02" },
      { label: "Acconto/anticipo su parcella", value: "TD03" },
      { label: "Nota di credito", value: "TD04" },
      { label: "Nota di debito", value: "TD05" },
      { label: "Parcella", value: "TD06" },
      { label: "Integrazione fattura reverse charge interno", value: "TD16" },
      { label: "Integrazione/autofattura per acquisto servizi dall'estero", value: "TD17" },
      { label: "Integrazione per acquisto di beni intracomunitari", value: "TD18" },
      { label: "Integrazione/autofattura per acquisto di beni ex art.17 c.2 DPR 633/72", value: "TD19" },
      { label: "Autofattura per regolarizzazione e integrazione delle fatture (ex art.6 c.8 e 9-bis d.lgs. 471/97 o art.46 c.5 D.L. 331/93)", value: "TD20" },
      { label: "Autofattura per splafonamento", value: "TD21" },
      { label: "Estrazione beni da Deposito IVA", value: "TD22" },
      { label: "Estrazione beni da Deposito IVA con versamento dell'IVA", value: "TD23" },
      { label: "Fattura differita di cui all'art. 21, comma 4, lett. a)", value: "TD24" },
      { label: "Fattura differita di cui all'art. 21, comma 4, terzo periodo lett. b)", value: "TD25" },
      { label: "Cessione di beni ammortizzabili e per passaggi interni (ex art.36 DPR 633/72)", value: "TD26" },
      { label: "Fattura per autoconsumo o per cessioni gratuite senza rivalsa", value: "TD27" },
    ],
  },
];



  useEffect(() => {
    const fetchSezionale = async () => {
      try {
        const response = await apiClient.get('/sezionali'); // Use axios to make the API call
        
        setSezionaliOptions(response.data); // Access the data field
        
      } catch (error) {
        console.error('Error fetching sezionali:', error);
      }
    };

    fetchSezionale();
    
    
  }, []);

  const fetchDataArticoli = async () => {
    try {
      const response = await apiClient.get('/products');
      
      if (response && response.data && Array.isArray(response.data)) {
        const transformedData = response.data.map((item) => ({
          value: item.id,
          code : item.code,
          label: item.code + " - " + item.description,
          description : item.description,
          codiva: item.iva,
          price: item.price,         
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

  const customFilterOption = (option, searchText) => {
    const { label, code } = option.data;
  
    return (
      label.toLowerCase().includes(searchText.toLowerCase()) ||
      code.toLowerCase().includes(searchText.toLowerCase())
    );
  };
  

  

  const handleSelectArticolo = (index, selectedOption) => {
   
    
    const newRows = [...rows];
    newRows[index].selectedArticolo = selectedOption;
    newRows[index].selectedCodiva = {
      value: selectedOption.codiva.id,
      code: selectedOption.code,      
      label: `${selectedOption.codiva.description}`,
      aliquota: selectedOption.codiva.aliquota,      

    };
    newRows[index].description = selectedOption.description,
    
    newRows[index].prezzo = selectedOption.price
    

    setRows(newRows);
  };

  const [count, setCount] = useState(0);
  const [rate, setRate] = useState(0);
  const [tax, setTax] = useState(0);
  const [dis, setDis] = useState(0);
  const [charge, setCharge] = useState(0);
  const [groupedRows, setGroupedRows] = useState([]); // New state for grouped rows
  const [imponibile, setImponibile] = useState(0);
  const [iva, setIva] = useState(0);
  const [totale, setTotale] = useState(0)

  useEffect(() => {
    let tax = (0.125 * rate * count);
    let dis = (0.15 * rate * count);

    if ((rate && count) && isNaN !== 0) {
      setCharge(65);
    } else {
      setCharge(0);

    }
    setTax(tax);
    setDis(dis);
  }, [rate, count]);


  const fetchData = async () => {
    try {
        const response = await apiClient.get('/clienti');
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

const addRow = () => {
  const newRow = {
    id: rows.length + 1,
    selectedArticolo: null,
    selectedCodiva: null,
    qt: 0,
    prezzo: '',
    totale: '',
  };
  setRows([...rows, newRow]);
};


const removeRow = (index) => {
  const newRows = rows.filter((row, rowIndex) => rowIndex !== index);
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

const handleInputChange = (index, field, value) => {
  const newRows = [...rows];
  newRows[index][field] = value;
  setRows(newRows);
};



  document.title = "Nuova Fattura | DgnsDesk";

  const validation = useFormik({
    enableReinitialize: true,
  
    initialValues: {
      denominazione: selectedCustomer?.label || "",
      partitaiva: selectedCustomer?.partitaiva || "",
      codicefiscale: selectedCustomer?.codicefiscale || "",
      indirizzo: selectedCustomer?.indirizzo || "",
      civico: selectedCustomer?.civico || "",
      cap: selectedCustomer?.cap || "",
      comune: selectedCustomer?.comune || "",
      provincia: selectedCustomer?.provincia || "",
      nazione: selectedCustomer?.nazione || "",
      SDI: selectedCustomer?.SDI || "",
      pec: selectedCustomer?.pec || "",
      postalcode: "",
      website: "",
      contact: "",
      invoiceId: "",
      date: "",
      name: "",
      status: "",
      country: "",
      amount: "",
      billing_address: "",
      billing_phone: "",
      billing_taxno: "",
      shipping_name: "",
      shipping_address: "",
      shipping_phone: "",
      shipping_taxno: "",
      product_name: "",
    },
  
    validationSchema: Yup.object({
      denominazione: Yup.string().required("Inserisci la denominazione"),
      partitaiva: Yup.string().required("Inserisci la Partita IVA"),
      codicefiscale: Yup.string().required("Inserisci il Codice Fiscale"),
      indirizzo: Yup.string().required("Inserisci l'indirizzo"),
      civico: Yup.string().required("Inserisci il civico"),
      cap: Yup.string().required("Inserisci il CAP"),
      comune: Yup.string().required("Inserisci il comune"),
      provincia: Yup.string().required("Inserisci la provincia"),
      nazione: Yup.string().required("Inserisci la nazione"),
      SDI: Yup.string().required("Inserisci il codice SDI"),      
      postalcode: Yup.string().required("This field is required"),
      website: Yup.string().required("Please Enter a website"),
      contact: Yup.string().required("Please Enter a contact number"),
      invoiceId: Yup.string().required("This field is required"),
      name: Yup.string().required("Please Enter a Full name"),
      billing_address: Yup.string().required("Please Enter a Address"),
      billing_phone: Yup.string().required("Please Enter a Phone Number"),
      billing_taxno: Yup.string().required("Please Enter a tax Number"),
      shipping_name: Yup.string().required("Please Enter a Full name"),
      shipping_address: Yup.string().required("Please Enter a Address"),
      shipping_phone: Yup.string().required("Please Enter a Phone Number"),
      shipping_taxno: Yup.string().required("Please enter a tax Number"),
      product_name: Yup.string().required("Please Enter a product Name"),
    }),
  
    onSubmit: (values) => {
      const newInvoice = {
        _id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
        denominazione: values.denominazione,
        partitaiva: values.partitaiva,
        codicefiscale: values.codicefiscale,
        indirizzo: values.indirizzo,
        civico: values.civico,
        cap: values.cap,
        comune: values.comune,
        provincia: values.provincia,
        nazione: values.nazione,
        SDI: values.SDI,
        postalcode: values.postalcode,
        website: values.website,
        contact: values.contact,
        invoiceId: values.invoiceId,
        date: date,
        name: values.name,
        status: values.status,
        country: "United States of America", // Static value, can be replaced
        amount: Math.round(rate * count + tax + charge - dis),
        billing_address: values.billing_address,
        billing_phone: values.billing_phone,
        billing_taxno: values.billing_taxno,
        shipping_name: values.shipping_name,
        shipping_address: values.shipping_address,
        shipping_phone: values.shipping_phone,
        shipping_taxno: values.shipping_taxno,
        product_name: values.product_name,
      };
  
      dispatch(onAddNewInvoice(newInvoice));
      history("/apps-invoices-list");
      validation.resetForm();
    },
  });
  

  return (
    <div className="page-content">
      <Container fluid>
        
        <Row className="justify-content-center">
          <Col xxl={9}>
            <Card>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
                className="needs-validation"
                id="invoice_form"
              >
                <CardBody className="border-bottom border-bottom-dashed p-4">
                  <Row>
                    <Col lg={4}>
                      <div className="profile-user mx-auto  mb-3">
                        <Input
                          id="profile-img-file-input"
                          type="file"
                          className="profile-img-file-input"
                        />
                        <Label for="profile-img-file-input" className="d-block">
                          <span
                            className="overflow-hidden border border-dashed d-flex align-items-center justify-content-center rounded"
                            style={{ height: "60px", width: "256px" }}
                          >
                            <img
                              src={logo}
                              className="card-logo card-logo-dark user-profile-image img-fluid"
                              alt="logo dark"
                            />
                            <img
                              src={logo}
                              className="card-logo card-logo-light user-profile-image img-fluid"
                              alt="logo light"
                            />
                          </span>
                        </Label>
                      </div>
                      <div>                        
                        <div className="mb-2">
                        <Input
                            type="textarea"
                            className="form-control bg-light border-0"
                            id="companyAddress"
                            rows="5"
                            readOnly
                            value={`C.F. ${userProfileSession.data.azienda.codiceFiscale} P.Iva ${userProfileSession.data.azienda.partitaIva}
${userProfileSession.data.azienda.sede} - ${userProfileSession.data.azienda.cap} 
${userProfileSession.data.azienda.city}(${userProfileSession.data.azienda.provincia}) IT
                                          `}
                            
                          />

                          
                        </div>
                        
                      </div>
                    </Col>

                    <Col lg={5} className="ms-auto">
                      <div className="mb-2 d-flex justify-content-between">
                        <Button color="success" className="add-btn" onClick={toggleList} id="create-btn">
                          <i className="ri-add-line align-bottom"></i>
                        </Button>
                        <NewCliente modalList={modalList} toggleList={toggleList} fetchData={fetchData} />
                        <ClientiSelect onCustomerChange={handleCustomerChange} selectedCustomer={selectedCustomer} />
                      </div>

                      <div className="mb-2">
                        <Input
                          type="text"
                          className="form-control bg-light border-0"
                          id="denominazioneCliente"
                          name="denominazione"
                          value={denominazione}
                          onChange={(e) => setDenominazione(e.target.value)}
                          placeholder="Denominazione Cliente"
                        />
                      </div>
                      <Row>
                        <Col lg={6}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="partitaIvaCliente"
                              name="partitaiva"
                              value={partitaiva}
                              onChange={(e) => setPartitaiva(e.target.value)}
                              placeholder="Partita Iva"
                            />
                          </div>
                        </Col>
                        <Col lg={6}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="codiceFiscaleCliente"
                              name="codicefiscale"
                              value={codicefiscale}
                              onChange={(e) => setCodicefiscale(e.target.value)}
                              placeholder="Codice Fiscale"
                            />
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg={10}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="indirizzoCliente"
                              name="indirizzo"
                              value={indirizzo}
                              onChange={(e) => setIndirizzo(e.target.value)}
                              placeholder="Indirizzo"
                            />
                          </div>
                        </Col>
                        <Col lg={2}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="civicoCliente"
                              name="civico"
                              value={civico}
                              onChange={(e) => setCivico(e.target.value)}
                              placeholder="Nr."
                            />
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg={3}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="capCliente"
                              name="cap"
                              value={cap}
                              onChange={(e) => setCap(e.target.value)}
                              placeholder="CAP"
                            />
                          </div>
                        </Col>
                        <Col lg={5}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="comuneCliente"
                              name="comune"
                              value={comune}
                              onChange={(e) => setComune(e.target.value)}
                              placeholder="Comune"
                            />
                          </div>
                        </Col>
                        <Col lg={2}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="provinciaCliente"
                              name="provincia"
                              value={provincia}
                              onChange={(e) => setProvincia(e.target.value)}
                              placeholder="Provincia"
                            />
                          </div>
                        </Col>
                        <Col lg={2}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="nazioneCliente"
                              name="nazione"
                              value={nazione}
                              onChange={(e) => setNazione(e.target.value)}
                              placeholder="Nazione"
                            />
                          </div>
                        </Col>
                      </Row>
                      <Row>
                        <Col lg={3}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="SDICliente"
                              name="SDI"
                              value={SDI}
                              onChange={(e) => setSDI(e.target.value)}
                              placeholder="Codice SDI"
                            />
                          </div>
                        </Col>
                        <Col lg={9}>
                          <div className="mb-2">
                            <Input
                              type="text"
                              className="form-control bg-light border-0"
                              id="pecCliente"
                              name="pec"
                              value={pec}
                              onChange={(e) => setPec(e.target.value)}
                              placeholder="Inserire la pec"
                            />
                          </div>
                        </Col>
                      </Row>
                    </Col>


                  </Row>
                </CardBody>
                <CardBody className="p-4">
                  <Row className="g-3">
                  <Col lg={3} sm={6}>
                      <Label >Tipo Documento</Label>
                      <div className="input-light">

                        <Select
                          name="status"
                          type="select"
                          className="bg-light border-0"
                          id="choices-tipo-doc"
                          options={allTypes}
                          value={tipo}
                          placeholder="Tipo Documento..."
                          filterOption={customFilterOption}
                          onChange={(option) =>
                            handleChangeTipo(option)
                          }
                          />
                         
                        
                        
                      </div>
                    </Col>
                  <Col lg={1} sm={6}>
                      <Label for="invoicenoInput">Numero</Label>
                      <Input
                        type="text"
                        className="form-control bg-light border-0"
                        id="invoicenoInput"
                        name="invoiceId"
                        value={numero}                        
                        onChange={(e) => setNumero(e.target.value)}
                        
                      />
                      
                    </Col>
                    <Col lg={2} sm={6}>
                    <Label>Sezionale</Label>
                    <div className="input-light">
                    <SezionaliSelect onSezionaleChange={handleSelectSezionale} selectedSezionale={sezionale} selectedTipo ={tipo} />
                  </div>
                    </Col>
                    <Col lg={3} sm={6}>
                      <div>
                        <Label for="date-field">Data</Label>                        
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
                        onChange={(date) => setNewDate(date[0])}
                        
                      />
                        {validation.touched.date && validation.errors.date ? (
                          <FormFeedback type="invalid">{validation.errors.date}</FormFeedback>
                        ) : null}
                      </div>
                    </Col>
                    
                    <Col lg={3} sm={6}>
                      <div>
                        <Label for="totalamountInput">Totale</Label>
                        <Input
                          type="text"
                          className="form-control bg-light border-0 text-end"
                          id="totalamountInput"
                          placeholder="$0.00"
                          readOnly
                          value={"€" + totale}
                        />
                      </div>
                    </Col>
                  </Row>
                </CardBody>
                
                <CardBody className="p-4">
                  <div className="table-responsive">
                    <Table className="invoice-table table-borderless table-nowrap mb-0">
                      <thead className="align-middle">
                        <tr className="table-active">
                          <th scope="col" style={{ width: "50px" }}>
                            #
                          </th>
                          <th scope="col">Articoli</th>
                          <th scope="col" style={{ width: "120px" }}>
                            <div className="d-flex currency-select input-light align-items-center">
                              P.U.                              
                            </div>
                          </th>
                          <th scope="col" style={{ width: "120px" }} className="text-center">
                            Quantità
                          </th>
                          <th scope="col" style={{ width: "120px" }} className="text-center">
                            Iva
                          </th>
                          <th
                            scope="col"
                            className="text-center"
                            style={{ width: "150px" }}
                          >
                            Totale
                          </th>
                          <th
                            scope="col"
                            className="text-end"
                            style={{ width: "105px" }}
                          ></th>
                        </tr>
                      </thead>
                      <tbody id="newlink">
                      {rows.map((row, index) => (
                        <tr key={index} className="product">
                          <th scope="row" className="product-id text-center align-middle">
                          {row.id}
                          </th>
                          <td className="text-start">
                            <div className="mb-2">
                              <Select
                              value={row.selectedArticolo}
                              onChange={(option) =>
                                handleSelectArticolo(index, option)
                              }
                              placeholder="Codice"
                              options={articoliOptions}
                              className="form-control bg-light border-0"
                            />
                              
                            </div>
                            <Input
                              type="textarea"
                              className="form-control bg-light border-0"
                              id="productDetails-1"
                              rows="2"
                              value={row.description}
                              onChange={(e) =>
                                handleInputChange(index, 'description', e.target.value)
                              }
                              placeholder="Descrizione Aggiuntiva"
                            ></Input>
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="form-control product-price bg-light border-0 text-end"
                              placeholder="0.00"
                              id="productRate-1" step="0.01"
                              value={row.prezzo}
                              onChange={(e) =>
                                handleInputChange(index, 'prezzo', e.target.value)
                              }
                            />
                            
                          </td>
                          
                          
                          <td>


                          <div className="input-step">
                              <button
                                type="button"
                                className="minus"
                                onClick={() => handleInputChange(index, 'qt', row.qt > 0 ? row.qt - 1 : row.qt)}
                              >
                                –
                              </button>
                              <Input
                                type="number"
                                className="product-quantity "
                                id={`product-qty-${index}`}
                                value={row.qt}
                                onChange={(e) =>
                                  handleInputChange(index, 'qt', parseInt(e.target.value, 10))
                                }
                              />
                              <button
                                type="button"
                                className="plus"
                                onClick={() => handleInputChange(index, 'qt', row.qt + 1)}
                              >
                                +
                              </button>
                            </div>
                            



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
                          <td className="text-end">
                            <div>
                              <Input
                                type="text"
                                className="form-control bg-light border-0 product-line-price text-end"
                                id="productPrice-1"
                                placeholder="$0.00"
                                value={row.totale}
                                readOnly
                              />
                            </div>
                          </td>
                          <td className="product-removal">
                            <Button  className="btn btn-danger" onClick={() => removeRow(index)}>
                              Elimina
                            </Button>
                          </td>
                        </tr>
                      ))}
                      </tbody>
                      <tbody>
                        <tr id="newForm" style={{ display: "none" }}><td className="d-none" colSpan="5"><p>Add New Form</p></td></tr>
                        <tr>
                          <td colSpan="5">
                            <Button                              
                              className="btn btn-soft-secondary fw-medium"
                              id="add-item"
                              onClick={addRow}
                            >
                              <i className="ri-add-fill me-1 align-bottom"></i>{" "}
                              Aggiungi
                            </Button>                            
                          </td>
                        </tr>
                        <tr className="border-top border-top-dashed mt-2">
                          <td colSpan="5\-
                          
                          -..
                          0 2"></td>
                          <td colSpan="2" className="p-0">
                            <Table className="table-borderless table-sm table-nowrap align-middle mb-0 ">
                              <tbody>
                                <tr>
                                  <th scope="row">Imponibile</th>
                                  <td style={{ width: "150px" }}>
                                    <Input
                                      type="text"
                                      className="form-control bg-light border-0 text-end"
                                      id="cart-subtotal"
                                      placeholder="$0.00"
                                      readOnly
                                      value={"€ " + imponibile}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <th scope="row">Iva</th>
                                  <td>
                                    <Input
                                      type="text"
                                      className="form-control bg-light border-0 text-end"
                                      id="cart-tax"
                                      placeholder="$0.00"
                                      readOnly
                                      value={"€ " + iva}
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <th scope="row">
                                    Sconto{" "}                                    
                                  </th>
                                  <td>
                                    <Input
                                      type="text"
                                      className="form-control bg-light border-0 text-end"
                                      id="cart-discount"
                                      placeholder="$0.00"
                                      readOnly
                                      value={"€ " + dis}
                                    />
                                  </td>
                                </tr>                                
                                <tr className="border-top border-top-dashed">
                                  <th scope="row">Totale</th>
                                  <td>
                                    <Input
                                      type="text"
                                      className="form-control bg-light border-0 text-end"
                                      id="cart-total"
                                      placeholder="$0.00"
                                      readOnly
                                      value={"€ " + totale}
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                  <Row className="mt-3">
                    <Col lg={4}>
                      <div className="mb-2">
                        <Label                          
                          className="form-label text-muted text-uppercase fw-semibold"
                        >
                          Dettagli Pagamento
                        </Label>
                        <div className="input-light">
                        <PagamentiSelect onCustomerChange={handlePagamentiChange} selectedCustomer={selectedPagamento} />
                        </div>
                      </div>                      
                    </Col>
                  </Row>
                  
                  <div className="hstack gap-2 justify-content-end d-print-none mt-4">
                    <button type="submit" className="btn btn-success" onClick={handleSaveClick}>
                      <i className="ri-printer-line align-bottom me-1"></i> Salva
                    </button>
                    <Link to="#" className="btn btn-primary">
                      <i className="ri-download-2-line align-bottom me-1"></i>{" "}
                      Scarica
                    </Link>
                    <Link to="#" className="btn btn-danger">
                      <i className="ri-send-plane-fill align-bottom me-1"></i>{" "}
                      Invia
                    </Link>
                  </div>
                </CardBody>
              </Form>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default InvoiceCreate;
