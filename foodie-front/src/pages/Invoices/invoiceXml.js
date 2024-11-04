import { getLoggedinUser } from "../../helpers/api_helper";

export const XmlGenerator = (
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
  date,
  sezionale,
  numero,
  tipo,
  corpo,
  sconto,
  arrotondamento,
  totale,
  groupedRows,
  selectedPagamento
) => {
    const generateXML = () => {
        const xmlDoc = document.implementation.createDocument(
            "http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2", 
            "p:FatturaElettronica", 
            null
        );

        

        const invoiceNode = xmlDoc.documentElement;
        const userProfileSession = getLoggedinUser();

        // Define the XML namespaces and attributes for the root element
        invoiceNode.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        invoiceNode.setAttribute("xmlns:ds", "http://www.w3.org/2000/09/xmldsig#");
        invoiceNode.setAttribute("versione", "FPR12");

        // Create header
        const headerNode = xmlDoc.createElement("FatturaElettronicaHeader");
        invoiceNode.appendChild(headerNode);

                const datiTrasmissione = xmlDoc.createElement("DatiTrasmissione");
        headerNode.appendChild(datiTrasmissione);

        const idTrasmittente = xmlDoc.createElement("IdTrasmittente");
        datiTrasmissione.appendChild(idTrasmittente);

        const idPaeseT = xmlDoc.createElement('IdPaese');
        idPaeseT.textContent = "IT";
        idTrasmittente.appendChild(idPaeseT);

        const idCodicet = xmlDoc.createElement('IdCodice');
        idCodicet.textContent = "01533080675";
        idTrasmittente.appendChild(idCodicet);

        const progressivoInvio = xmlDoc.createElement('ProgressivoInvio');
        progressivoInvio.textContent = "000000";
        datiTrasmissione.appendChild(progressivoInvio);

        const formatoTrasmissione = xmlDoc.createElement('FormatoTrasmissione');
        formatoTrasmissione.textContent = 'FPR12';
        datiTrasmissione.appendChild(formatoTrasmissione);

        const codiceDestinatario = xmlDoc.createElement('CodiceDestinatario');
        codiceDestinatario.textContent = SDI; // Use the passed parameter here
        datiTrasmissione.appendChild(codiceDestinatario);

        const cedentePrestatore = xmlDoc.createElement('CedentePrestatore');
        headerNode.appendChild(cedentePrestatore);

        const datiAnagraficiPrestatore = xmlDoc.createElement('DatiAnagrafici');
        cedentePrestatore.appendChild(datiAnagraficiPrestatore);

        const idFiscaleIVAPrestatore = xmlDoc.createElement('IdFiscaleIVA');
        datiAnagraficiPrestatore.appendChild(idFiscaleIVAPrestatore);

        const idPaesePrestatore = xmlDoc.createElement('IdPaese');
        idPaesePrestatore.textContent = "IT";
        idFiscaleIVAPrestatore.appendChild(idPaesePrestatore);

        const idCodicePrestatore = xmlDoc.createElement('IdCodice');
        idCodicePrestatore.textContent = userProfileSession.data.azienda.partitaIva;
        idFiscaleIVAPrestatore.appendChild(idCodicePrestatore);

        const codiceFiscalePrestatore = xmlDoc.createElement('CodiceFiscale');
        codiceFiscalePrestatore.textContent = userProfileSession.data.azienda.codiceFiscale;
        datiAnagraficiPrestatore.appendChild(codiceFiscalePrestatore);

        const anagraficaPrestatore = xmlDoc.createElement('Anagrafica');
        datiAnagraficiPrestatore.appendChild(anagraficaPrestatore);

        if (userProfileSession.data.azienda.denominazione !== "") {
            const denominazionePrestatore = xmlDoc.createElement("Denominazione");
            denominazionePrestatore.textContent = userProfileSession.data.azienda.denominazione;
            anagraficaPrestatore.appendChild(denominazionePrestatore);
        } else {
            const nomePrestatore = xmlDoc.createElement("Nome");
            nomePrestatore.textContent = userProfileSession.data.azienda.nome;
            anagraficaPrestatore.appendChild(nomePrestatore);

            const cognomePrestatore = xmlDoc.createElement("Cognome");
            cognomePrestatore.textContent = userProfileSession.data.azienda.cognome;
            anagraficaPrestatore.appendChild(cognomePrestatore);
        }

        const regimeFiscale = xmlDoc.createElement("RegimeFiscale");
        regimeFiscale.textContent = userProfileSession.data.azienda.rFiscale;
        datiAnagraficiPrestatore.appendChild(regimeFiscale);

        const sedePrestatore = xmlDoc.createElement('Sede');
        cedentePrestatore.appendChild(sedePrestatore);

        const indirizzoPrestatore = xmlDoc.createElement('Indirizzo');
        indirizzoPrestatore.textContent = userProfileSession.data.azienda.sede;
        sedePrestatore.appendChild(indirizzoPrestatore);

        const capPrestatore = xmlDoc.createElement('CAP');
        capPrestatore.textContent = userProfileSession.data.azienda.cap;
        sedePrestatore.appendChild(capPrestatore);

        const comunePrestatore = xmlDoc.createElement('Comune');
        comunePrestatore.textContent = userProfileSession.data.azienda.city;
        sedePrestatore.appendChild(comunePrestatore);

        const provinciaPrestatore = xmlDoc.createElement('Provincia');
        provinciaPrestatore.textContent = userProfileSession.data.azienda.provincia;
        sedePrestatore.appendChild(provinciaPrestatore);

        const nazionePrestatore = xmlDoc.createElement('Nazione');
        nazionePrestatore.textContent = nazione;
        sedePrestatore.appendChild(nazionePrestatore);

        // CessionarioCommittente node and its children
        const cessionarioCommittente = xmlDoc.createElement('CessionarioCommittente');
        headerNode.appendChild(cessionarioCommittente);

        const datiAnagraficiCommittente = xmlDoc.createElement('DatiAnagrafici');
        cessionarioCommittente.appendChild(datiAnagraficiCommittente);

        const idFiscaleIVACommittente = xmlDoc.createElement('IdFiscaleIVA');
        datiAnagraficiCommittente.appendChild(idFiscaleIVACommittente);

        const idPaeseCommittente = xmlDoc.createElement('IdPaese');
        idPaeseCommittente.textContent = nazione;
        idFiscaleIVACommittente.appendChild(idPaeseCommittente);

        const idCodiceCommittente = xmlDoc.createElement('IdCodice');
        idCodiceCommittente.textContent = partitaiva;
        idFiscaleIVACommittente.appendChild(idCodiceCommittente);

        if (codicefiscale) {
            const codiceFiscaleCommittente = xmlDoc.createElement('CodiceFiscale');
            codiceFiscaleCommittente.textContent = codicefiscale;
            datiAnagraficiCommittente.appendChild(codiceFiscaleCommittente);
        }

        const anagraficaCommittente = xmlDoc.createElement('Anagrafica');
        datiAnagraficiCommittente.appendChild(anagraficaCommittente);

        if (nome) {
            const cognomeCommittente = xmlDoc.createElement("Cognome");
            cognomeCommittente.textContent = cognome;
            anagraficaCommittente.appendChild(cognomeCommittente);
            const nomeCommittente = xmlDoc.createElement("Nome");
            nomeCommittente.textContent = nome;
            anagraficaCommittente.appendChild(nomeCommittente);
            
            
        } else {
            const denominazioneCommittente = xmlDoc.createElement("Denominazione");
            denominazioneCommittente.textContent = denominazione;
            anagraficaCommittente.appendChild(denominazioneCommittente);
           
        }

        const sedeCommittente = xmlDoc.createElement('Sede');
        cessionarioCommittente.appendChild(sedeCommittente);

        if (indirizzo) {
            const indirizzoCommittente = xmlDoc.createElement('Indirizzo');
            indirizzoCommittente.textContent = indirizzo;
            sedeCommittente.appendChild(indirizzoCommittente);
        }

        if (civico) {
            const numeroCivicoCommittente = xmlDoc.createElement('NumeroCivico');
            numeroCivicoCommittente.textContent = civico;
            sedeCommittente.appendChild(numeroCivicoCommittente);
        }

        if (cap) {
            const capCommittente = xmlDoc.createElement('CAP');
            capCommittente.textContent = cap;
            sedeCommittente.appendChild(capCommittente);
        }

        if (comune) {
            const comuneCommittente = xmlDoc.createElement('Comune');
            comuneCommittente.textContent = comune;
            sedeCommittente.appendChild(comuneCommittente);
        }

        if (provincia) {
            const provinciaCommittente = xmlDoc.createElement('Provincia');
            provinciaCommittente.textContent = provincia;
            sedeCommittente.appendChild(provinciaCommittente);
        }

        if (nazione) {
            const nazioneCommittente = xmlDoc.createElement('Nazione');
            nazioneCommittente.textContent = nazione;
            sedeCommittente.appendChild(nazioneCommittente);
        }

        const fatturaElettronicaBody = xmlDoc.createElement('FatturaElettronicaBody');
        invoiceNode.appendChild(fatturaElettronicaBody);
        const datiGenerali = xmlDoc.createElement('DatiGenerali');
        fatturaElettronicaBody.appendChild(datiGenerali);
        const datiGeneraliDocumento = xmlDoc.createElement('DatiGeneraliDocumento');
        datiGenerali.appendChild(datiGeneraliDocumento);

        // Create DatiGeneraliDocumento elements
        const tipoDocumento = xmlDoc.createElement('TipoDocumento');
        tipoDocumento.textContent = tipo.value;
        datiGeneraliDocumento.appendChild(tipoDocumento);
        const divisa = xmlDoc.createElement('Divisa');
        divisa.textContent = 'EUR';
        datiGeneraliDocumento.appendChild(divisa);
        const dataDocumento = xmlDoc.createElement('Data');
        dataDocumento.textContent = date;
        datiGeneraliDocumento.appendChild(dataDocumento);
        const numeroDocumento = xmlDoc.createElement('Numero');        
        numeroDocumento.textContent = `${numero}/${sezionale.label}`;
        datiGeneraliDocumento.appendChild(numeroDocumento);

        if (sconto) {
            const scontoMaggiorazione = xmlDoc.createElement('ScontoMaggiorazione');
            datiGeneraliDocumento.appendChild(scontoMaggiorazione);
            const tipoSconto = xmlDoc.createElement('Tipo');
            tipoSconto.textContent = ''; // Add appropriate value if available
            scontoMaggiorazione.appendChild(tipoSconto);
            const percentualeSconto = xmlDoc.createElement('Percentuale');
            percentualeSconto.textContent = ''; // Add appropriate value if available
            scontoMaggiorazione.appendChild(percentualeSconto);
            const importoSconto = xmlDoc.createElement('Importo');
            importoSconto.textContent = ''; // Add appropriate value if available
            scontoMaggiorazione.appendChild(importoSconto);
        }

        const importoTotaleDocumento = xmlDoc.createElement('ImportoTotaleDocumento');
        importoTotaleDocumento.textContent = totale;
        datiGeneraliDocumento.appendChild(importoTotaleDocumento);

        if (arrotondamento) {
            const arrotondamentoElement = xmlDoc.createElement('Arrotondamento');
            arrotondamentoElement.textContent = formatNumber(arrotondamento);
            datiGeneraliDocumento.appendChild(arrotondamentoElement);
        }

        const datiBeni = xmlDoc.createElement("DatiBeniServizi");
        fatturaElettronicaBody.appendChild(datiBeni);

        

        // Loop through the corpo array to generate DettaglioLinee for each item
        corpo.forEach((rowData, index) => {
            // Create DettaglioLinee element for each item
            const dettaglioLinee = xmlDoc.createElement('DettaglioLinee');
            datiBeni.appendChild(dettaglioLinee);

            // NumeroLinea element
            const numeroLinea = xmlDoc.createElement('NumeroLinea');
            numeroLinea.textContent = (index + 1).toString(); // Line number starting from 1
            dettaglioLinee.appendChild(numeroLinea);

            // CodiceArticolo element (if applicable)
            if (rowData.articolo) {
                const codiceArticolo = xmlDoc.createElement('CodiceArticolo');
                dettaglioLinee.appendChild(codiceArticolo);

                const codiceTipo = xmlDoc.createElement('CodiceTipo');
                codiceTipo.textContent = 'ZZ'; // Assuming 'ZZ' as the default code type
                codiceArticolo.appendChild(codiceTipo);

                const codiceValore = xmlDoc.createElement('CodiceValore');
                codiceValore.textContent = rowData.code; // Assuming articolo as the code value
                codiceArticolo.appendChild(codiceValore);
            }

            // Descrizione element
            const descrizioneArticolo = xmlDoc.createElement('Descrizione');
            descrizioneArticolo.textContent = rowData.description || ''; // Assuming descrizione is provided in rowData
            dettaglioLinee.appendChild(descrizioneArticolo);

            // Quantita element
            const quantitaArticolo = xmlDoc.createElement('Quantita');
            quantitaArticolo.textContent = rowData.qt ? rowData.qt.toFixed(2) : '0.00'; // Quantity
            dettaglioLinee.appendChild(quantitaArticolo);

            // UnitaMisura element (if applicable)
            if (rowData.unitaMisura) {
                const umArticolo = xmlDoc.createElement('UnitaMisura');
                umArticolo.textContent = rowData.unitaMisura; // Assuming unitaMisura is provided in rowData
                dettaglioLinee.appendChild(umArticolo);
            }

            // PrezzoUnitario element
            const puArticolo = xmlDoc.createElement('PrezzoUnitario');
            puArticolo.textContent = rowData.prezzo ? rowData.prezzo.toFixed(2) : '0.00'; // Unit price
            dettaglioLinee.appendChild(puArticolo);

            // ScontoMaggiorazione element (if applicable)
            if (rowData.sconto && rowData.sconto > 0) {
                const scontoMaggiorazione = xmlDoc.createElement('ScontoMaggiorazione');
                dettaglioLinee.appendChild(scontoMaggiorazione);

                const tipoSconto = xmlDoc.createElement('Tipo');
                tipoSconto.textContent = 'SC'; // Assuming 'SC' for discount type
                scontoMaggiorazione.appendChild(tipoSconto);

                const importoSconto = xmlDoc.createElement('Importo');
                importoSconto.textContent = rowData.sconto.toFixed(2); // Discount amount
                scontoMaggiorazione.appendChild(importoSconto);
            }

            // PrezzoTotale element
            const ptArticolo = xmlDoc.createElement('PrezzoTotale');
            ptArticolo.textContent = rowData.totale ? rowData.totale.toFixed(2) : '0.00'; // Total price
            dettaglioLinee.appendChild(ptArticolo);

            // AliquotaIVA element
            const aiArticolo = xmlDoc.createElement('AliquotaIVA');
            aiArticolo.textContent = rowData.codiva ? rowData.codiva.toFixed(2) : '0.00'; // IVA rate
            dettaglioLinee.appendChild(aiArticolo);

            // Natura element (if applicable)
            if (rowData.natura) {
                const naturaArticolo = xmlDoc.createElement('Natura');
                naturaArticolo.textContent = rowData.natura; // Assuming natura is provided in rowData
                dettaglioLinee.appendChild(naturaArticolo);
            }
        });

        // Process groupedRows to generate DatiRiepilogo
        groupedRows.forEach(row => {
            // Create DatiRiepilogo element
            const datiRiepilogo = xmlDoc.createElement("DatiRiepilogo");
            datiBeni.appendChild(datiRiepilogo);

            // Create AliquotaIVA element
            const aiRiepilogo = xmlDoc.createElement('AliquotaIVA');
            aiRiepilogo.textContent = row.selectedCodiva.aliquota ? row.selectedCodiva.aliquota.toFixed(2) : '0.00';
            datiRiepilogo.appendChild(aiRiepilogo);

            // Optionally add Natura element if it exists
            if (row.selectedCodiva && row.selectedCodiva.natura) {
                const naturaRiep = xmlDoc.createElement('Natura');
                naturaRiep.textContent = row.selectedCodiva.natura; // Assuming code represents Natura
                datiRiepilogo.appendChild(naturaRiep);
            }

            // Create ImponibileImporto element
            const imponibileImporto = xmlDoc.createElement('ImponibileImporto');
            imponibileImporto.textContent = row.imponibile ? formatNumber(row.imponibile) : '0.00';
            datiRiepilogo.appendChild(imponibileImporto);

            // Create Imposta element
            const imposta = xmlDoc.createElement('Imposta');
            imposta.textContent = row.iva ? formatNumber(row.iva) : '0.00';
            datiRiepilogo.appendChild(imposta);

            // Create EsigibilitaIVA element
            const esigibilitaIVA = xmlDoc.createElement('EsigibilitaIVA');
            esigibilitaIVA.textContent = 'I'; // Set default or leave empty if not provided
            datiRiepilogo.appendChild(esigibilitaIVA);
        });
        const datiPagamento = xmlDoc.createElement('DatiPagamento')
        fatturaElettronicaBody.appendChild(datiPagamento)
        const condizioniPagamento = xmlDoc.createElement('CondizioniPagamento')
        condizioniPagamento.textContent = "TP02"
        datiPagamento.appendChild(condizioniPagamento)
        const dettaglioPagamento = xmlDoc.createElement('DettaglioPagamento')
        datiPagamento.appendChild(dettaglioPagamento)
        const modalitaPagamento = xmlDoc.createElement("ModalitaPagamento")
        modalitaPagamento.textContent = selectedPagamento.tipo
        dettaglioPagamento.appendChild(modalitaPagamento)
        const importoPagamento = xmlDoc.createElement("ImportoPagamento")
        importoPagamento.textContent = formatNumber(totale)
        dettaglioPagamento.appendChild(importoPagamento)
        if (selectedPagamento.banca.iban !== "") {
            const iBAN = xmlDoc.createElement("IBAN")
            iBAN.textContent = selectedPagamento.banca.iban
            dettaglioPagamento.appendChild(iBAN)
        }



       // Define the XML declaration
        var xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';

        // Serialize the XML document to a string
        var xmlString = new XMLSerializer().serializeToString(xmlDoc);

        // Replace the namespace prefixes
        xmlString = xmlString.replace(/ns1:/g, 'p:');
        xmlString = xmlString.replace(/\/ns1:/g, '/p:');

        // Combine the XML declaration with the serialized XML string
        var xmlStringWithDeclaration = xmlDeclaration + xmlString;

        // Return the final XML string with the declaration
        return xmlStringWithDeclaration;

    };

    // Helper function to format numbers
    const formatNumber = (number) => {
        return Number(number).toFixed(2);
    };

    return generateXML();
};
