from flask import session
import lxml.etree as etree
import lxml.builder 
import datetime
import xml.dom.minidom
from signxml import XMLSigner, XMLVerifier
import random
import string
import os, json  
import subprocess
from subprocess import call



def invoicegen(fat_path, serie):
	with open(fat_path, 'r') as file:
		fattura = json.load(file)
	E = lxml.builder.ElementMaker()
	NS = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2'	
	etree.register_namespace("p", NS)
	FATTURA = etree.Element(etree.QName(NS, "FatturaElettronica"))
	FATTURA.set('versione','FPR12')
	HEADER = etree.SubElement(FATTURA,'FatturaElettronicaHeader')
	TRANS =  etree.SubElement(HEADER, 'DatiTrasmissione')
	IDTRAS = etree.SubElement(TRANS, 'IdTrasmittente')
	IDPAESE = etree.SubElement(IDTRAS, 'IdPaese')
	IDPAESE.text = 'IT'
	IDCODICE = etree.SubElement(IDTRAS, 'IdCodice')
	IDCODICE.text = '01533080675'
	PINVIO = etree.SubElement(TRANS,'ProgressivoInvio')
	PINVIO.text = str('00000')
	FTRAS = etree.SubElement(TRANS,'FormatoTrasmissione')
	FTRAS.text = 'FPR12'
	CDES = etree.SubElement(TRANS,'CodiceDestinatario')
	CDES.text = fattura['cliente']['SDI']
	CPRES = etree.SubElement(HEADER,'CedentePrestatore')
	DANA = etree.SubElement(CPRES,'DatiAnagrafici')
	IDIVA = etree.SubElement(DANA,'IdFiscaleIVA')
	IDPAESECED = etree.SubElement(IDIVA, 'IdPaese')
	IDPAESECED.text = 'IT'
	IDCODCED = etree.SubElement(IDIVA,'IdCodice')
	IDCODCED.text = session['ditta']['partitaiva']
	CODF = etree.SubElement(DANA, 'CodiceFiscale')
	CODF.text = session['ditta']['codicefiscale']
	ANAG = etree.SubElement(DANA, 'Anagrafica')
	DENOM = etree.SubElement(ANAG,'Denominazione')
	DENOM.text = session['ditta']['denominazione']
	RFISC = etree.SubElement(DANA, 'RegimeFiscale')
	RFISC.text = 'RF01'
	SEDE = etree.SubElement(CPRES ,'Sede')
	INDIRIZZO = etree.SubElement(SEDE, 'Indirizzo')
	INDIRIZZO.text = session['ditta']['indirizzo'] + ' ' + session['ditta']['civico']
	CAP = etree.SubElement(SEDE, 'CAP')
	CAP.text = str(session['ditta']['cap'])
	COMUNE = etree.SubElement(SEDE, 'Comune')
	COMUNE.text = session['ditta']['comune']
	PROV = etree.SubElement(SEDE, 'Provincia')
	PROV.text = session['ditta']['provincia']
	NAZ = etree.SubElement(SEDE, 'Nazione')
	NAZ.text = 'IT'
	if session['ditta']['ufficiorea'] is not None:
		ICREA = etree.SubElement(CPRES, 'IscrizioneREA')
		UREA  = etree.SubElement(ICREA, 'Ufficio')
		UREA.text = session['ditta']['ufficiorea']	
		NREA = etree.SubElement(ICREA, 'NumeroREA')
		NREA.text = session['ditta']['rea']
		CSOC = etree.SubElement(ICREA, 'CapitaleSociale')
		CSOC.text = session['ditta']['csociale']
		SLIQ = etree.SubElement(ICREA, 'StatoLiquidazione')
		SLIQ.text = session['ditta']['sliquidazione']
	CCOMM = etree.SubElement(HEADER,'CessionarioCommittente')
	DANAC = etree.SubElement(CCOMM,'DatiAnagrafici')
	IDIVAC = etree.SubElement(DANAC,'IdFiscaleIVA')
	IDPAESECOM = etree.SubElement(IDIVAC, 'IdPaese')
	IDPAESECOM.text = fattura['cliente']['Stato']
	IDCODCOM = etree.SubElement(IDIVAC,'IdCodice')
	IDCODCOM.text =  fattura['cliente']['PartitaIva']
	CODFC = etree.SubElement(DANAC, 'CodiceFiscale')
	CODFC.text = fattura['cliente']['CodiceFiscale']
	ANAGC = etree.SubElement(DANAC, 'Anagrafica')
	DENOMC = etree.SubElement(ANAGC,'Denominazione')
	DENOMC.text =  fattura['cliente']['denominazione']
	SEDEC = etree.SubElement(CCOMM,'Sede')
	INDIRIZZOC = etree.SubElement(SEDEC, 'Indirizzo')
	INDIRIZZOC.text = fattura['cliente']['Indirizzo'] + fattura['cliente']['Civico'] 
	CAPC = etree.SubElement(SEDEC, 'CAP')
	CAPC.text = fattura['cliente']['Cap']
	COMUNEC = etree.SubElement(SEDEC, 'Comune')
	COMUNEC.text =  fattura['cliente']['Comune']
	PROVC = etree.SubElement(SEDEC, 'Provincia')
	PROVC.text =  fattura['cliente']['Provincia']
	NAZC = etree.SubElement(SEDEC, 'Nazione')
	NAZC.text =  fattura['cliente']['Stato']
	TERZOI = etree.SubElement(HEADER, 'TerzoIntermediarioOSoggettoEmittente')
	DATIAT = etree.SubElement(TERZOI, 'DatiAnagrafici')	
	IDIVAT = etree.SubElement(DATIAT,'IdFiscaleIVA')
	IDPAESET = etree.SubElement(IDIVAT, 'IdPaese')
	IDPAESET.text = 'IT'
	IDCODT = etree.SubElement(IDIVAT,'IdCodice')
	IDCODT.text = '01498460524'
	ANAGT = etree.SubElement(DATIAT, 'Anagrafica')
	DENOMT = etree.SubElement(ANAGT,'Denominazione')
	DENOMT.text = 'Digital Business srl'
	SEMIT = etree.SubElement(HEADER,'SoggettoEmittente')
	SEMIT.text = 'TZ'
	BODY = etree.SubElement(FATTURA, 'FatturaElettronicaBody')
	DGEN = etree.SubElement(BODY, 'DatiGenerali')
	DGEND = etree.SubElement(DGEN, 'DatiGeneraliDocumento')
	TIPOD= etree.SubElement(DGEND, 'TipoDocumento')
	TIPOD.text = fattura['testata']['tipo']
	DIVISA= etree.SubElement(DGEND, 'Divisa')
	DIVISA.text = 'EUR'
	DATA = etree.SubElement(DGEND,'Data')
	date = datetime.datetime.strptime(fattura['testata']['data'], '%d/%m/%Y')
	date = date.strftime('%Y-%m-%d')
	DATA.text = str(date)
	NUMDOC= etree.SubElement(DGEND, 'Numero')
	if fattura['testata']['serie'] != '':
		NUMDOC.text = str(fattura['testata']['numero']) +'/' + fattura['testata']['serie'] if fattura['testata']['serie'] != " " else str(fattura['testata']['numero'])
	else:
		NUMDOC.text = str(fattura['testata']['numero'])
	if 'ritenuta' in fattura:
		RITE = etree.SubElement(DGEND, 'DatiRitenuta')
		TRITE = etree.SubElement(RITE, 'TipoRitenuta')
		TRITE.text = fattura['ritenuta']['tRit']
		IRITE = etree.SubElement(RITE, 'ImportoRitenuta')
		IRITE.text = str("{:.2f}".format(fattura['ritenuta']['importoRit']))
		ARITE = etree.SubElement(RITE, 'AliquotaRitenuta')
		ARITE.text = str(("{:.2f}".format(float(fattura['ritenuta']['ritAliquota']))))
		C770 = etree.SubElement(RITE, 'CausalePagamento')
		C770.text = fattura['ritenuta']['cau770']
	if 'bollo' in fattura:
		DBOLLO = etree.SubElement(DGEND, 'DatiBollo')
		BOLLOV = etree.SubElement(DBOLLO, 'BolloVirtuale')
		BOLLOV.text = 'SI'
		IBOLLO = etree.SubElement(DBOLLO, 'ImportoBollo')
		IBOLLO.text = '2.00'
	if 'cassa' in fattura:	
		CASSA = etree.SubElement(DGEND, 'DatiCassaPrevidenziale')
		TCASSA = etree.SubElement(CASSA, 'TipoCassa')
		TCASSA.text = fattura['cassa']['cassa-tipo']
		ALCASSA= etree.SubElement(CASSA, 'AlCassa')
		ALCASSA.text = str(("{:.2f}".format(float(fattura['cassa']['cassa-aliquota'].replace('%',"")))))
		ICASSA = etree.SubElement(CASSA, 'ImportoContributoCassa')
		ICASSA.text = str(("{:.2f}".format(float(fattura['cassa']['cassa-importo']))))
		IMPOCASSA =  etree.SubElement(CASSA, 'ImponibileCassa')
		IMPOCASSA.text = str(("{:.2f}".format(float(fattura['cassa']['cassa-imponibile']))))
		AIVAC = etree.SubElement(CASSA, 'AliquotaIVA')
		AIVAC.text =  str(("{:.2f}".format(float(fattura['cassa']['cassa-iva'].replace('%',"")))))
			
	IMPORTOT= etree.SubElement(DGEND, 'ImportoTotaleDocumento')
	if fattura['bollo']['checkaddbollo'] is True:
		imptotaledoc = float(fattura['totali']['importo']) + 2
	else: 
		imptotaledoc = fattura['totali']['importo']	
	IMPORTOT.text = str("{:.2f}".format(float(imptotaledoc)))
	if 'sconto' in fattura:
		SCONTO = etree.SubElement(DGEND, 'ScontoMaggiorazione')
		TIPOS = etree.SubElement(SCONTO, 'Tipo')
		TIPOS.text = fattura['sconto']['sconto-tipo']
		if fattura['sconto']['sconto-ip'] == 0:
			TIPOS = etree.SubElement(SCONTO, 'Percentuale')
			TIPOS.text = fattura['sconto']['sconto-percentuale']
		else:
			TIPOS = etree.SubElement(SCONTO, 'Importo')
			TIPOS.text = fattura['sconto']['sconto-importo']
		TIPOS = etree.SubElement(SCONTO, 'Tipo')
	if 'causale' in fattura:
		CAUSALE= etree.SubElement(DGEND, 'Causale')
		CAUSALE.text = fattura['causale']['causale']
	if 'ordine_acquisto' in fattura:		
		ORDACQ = etree.SubElement(DGEN, 'DatiOrdineAcquisto')		
		RIFLINORD = etree.SubElement(ORDACQ, 'RiferimentoNumeroLinea')
		RIFLINORD.text = fattura['ordine_acquisto']['linea']
		IDDOCORD = etree.SubElement(ORDACQ, 'IdDocumento')
		IDDOCORD.text = fattura['ordine_acquisto']['id']
		DATAORD = etree.SubElement(ORDACQ, 'Data')
		DATAORD.text = str((datetime.datetime.strptime(fattura['ordine_acquisto']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMITEMORD = etree.SubElement(ORDACQ, 'NumItem')
		NUMITEMORD.text = fattura['ordine_acquisto']['item']
		COMMORD = etree.SubElement(ORDACQ, 'CodiceCommessaConvenzione')
		COMMORD.text = fattura['ordine_acquisto']['commessa']
		CUPORD = etree.SubElement(ORDACQ, 'CodiceCUP')
		CUPORD.text = fattura['ordine_acquisto']['CUP']
		CIGORD = etree.SubElement(ORDACQ, 'CodiceCIG')
		CIGORD.text = fattura['ordine_acquisto']['CIG']
	if 'contratto' in fattura:		
		CONTRATTO = etree.SubElement(DGEN, 'DatiContratto')		
		RIFLINCONTR = etree.SubElement(CONTRATTO, 'RiferimentoNumeroLinea')
		RIFLINCONTR.text = fattura['contratto']['linea']
		IDDOCCONTR = etree.SubElement(CONTRATTO, 'IdDocumento')
		IDDOCCONTR.text = fattura['contratto']['id']
		DATACONTR = etree.SubElement(CONTRATTO, 'Data')
		DATACONTR.text = str((datetime.datetime.strptime(fattura['contratto']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMITEMCONTR = etree.SubElement(CONTRATTO, 'NumItem')
		NUMITEMCONTR.text = fattura['contratto']['item']
		COMMCONTR = etree.SubElement(CONTRATTO, 'CodiceCommessaConvenzione')
		COMMCONTR.text = fattura['contratto']['commessa']
		CUPCONTR = etree.SubElement(CONTRATTO, 'CodiceCUP')
		CUPCONTR.text = fattura['contratto']['CUP']
		CIGCONTR = etree.SubElement(CONTRATTO, 'CodiceCIG')
		CIGCONTR.text = fattura['contratto']['CIG']
	if 'convenzione' in fattura:		
		CONVENZIONE = etree.SubElement(DGEN, 'DatiConvenzione')		
		RIFLINCONV = etree.SubElement(CONVENZIONE, 'RiferimentoNumeroLinea')
		RIFLINCONV.text = fattura['convenzione']['linea']
		IDDOCCONV = etree.SubElement(CONVENZIONE, 'IdDocumento')
		IDDOCCONV.text = fattura['convenzione']['id']
		DATACONV = etree.SubElement(CONVENZIONE, 'Data')
		DATACONV.text = str((datetime.datetime.strptime(fattura['convenzione']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMITEMCONV = etree.SubElement(CONVENZIONE, 'NumItem')
		NUMITEMCONV.text = fattura['convenzione']['item']
		COMMCONV = etree.SubElement(CONVENZIONE, 'CodiceCommessaConvenzione')
		COMMCONV.text = fattura['convenzione']['commessa']
		CUPCONV = etree.SubElement(CONVENZIONE, 'CodiceCUP')
		CUPCONV.text = fattura['convenzione']['CUP']
		CIGCONV = etree.SubElement(CONVENZIONE, 'CodiceCIG')
		CIGCONV.text = fattura['convenzione']['CIG']
	if 'ricezione' in fattura:		
		RICEZIONE = etree.SubElement(DGEN, 'DatiRicezione')		
		RIFLINRIC = etree.SubElement(RICEZIONE, 'RiferimentoNumeroLinea')
		RIFLINRIC.text = fattura['ricezione']['linea']
		IDDOCRIC = etree.SubElement(RICEZIONE, 'IdDocumento')
		IDDOCRIC.text = fattura['ricezione']['id']
		DATARIC = etree.SubElement(RICEZIONE, 'Data')
		DATARIC.text = str((datetime.datetime.strptime(fattura['ricezione']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMITEMRIC = etree.SubElement(RICEZIONE, 'NumItem')
		NUMITEMRIC.text = fattura['ricezione']['item']
		COMMRIC = etree.SubElement(RICEZIONE, 'CodiceCommessaConvenzione')
		COMMRIC.text = fattura['ricezione']['commessa']
		CUPRIC = etree.SubElement(RICEZIONE, 'CodiceCUP')
		CUPRIC.text = fattura['ricezione']['CUP']
		CIGRIC = etree.SubElement(RICEZIONE, 'CodiceCIG')
		CIGRIC.text = fattura['ricezione']['CIG']
	if 'fatture-collegate' in fattura:		
		FCOLL = etree.SubElement(DGEN, 'DatiFattureCollegate')		
		RIFLINFCOLL = etree.SubElement(FCOLL, 'RiferimentoNumeroLinea')
		RIFLINFCOLL.text = fattura['fatture-collegate']['linea']
		IDDOCFCOLL = etree.SubElement(FCOLL, 'IdDocumento')
		IDDOCFCOLL.text = fattura['fatture-collegate']['id']
		DATAFCOLL = etree.SubElement(FCOLL, 'Data')
		DATAOFCOLLtext = str((datetime.datetime.strptime(fattura['fatture-collegate']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMITEMFCOLL = etree.SubElement(FCOLL, 'NumItem')
		NUMITEMFCOLL.text = fattura['fatture-collegate']['item']
		COMMFCOLL = etree.SubElement(FCOLL, 'CodiceCommessaConvenzione')
		COMMFCOLL.text = fattura['fatture-collegate']['commessa']
		CUPFCOLL = etree.SubElement(FCOLL, 'CodiceCUP')
		CUPFCOLL.text = fattura['fatture-collegate']['CUP']
		CIGFCOLL = etree.SubElement(FCOLL, 'CodiceCIG')
		CIGFCOLL.text = fattura['fatture-collegate']['CIG']		
	if 'sal' in fattura:
		SAL = etree.SubElement(DGEN, 'DatiSAL')		
		RFASE = etree.SubElement(SAL, 'RiferimentoFase')
		RFASE.text = fattura['sal']['riffase']
	if 'ddt' in fattura:
		DDT = etree.SubElement(DGEN, 'DatiDDT')		
		NUMDDT = etree.SubElement(DDT, 'NumeroDDT')
		NUMDDT.text = fattura['ddt']['ddt-numero']
		NUMDDT = etree.SubElement(DDT, 'DataDDT')
		NUMDDT.text = str((datetime.datetime.strptime(fattura['ddt']['ddt-data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))
		NUMDDT = etree.SubElement(DDT, 'RiferimentoNumeroLinea')
		NUMDDT.text = fattura['ddt']['ddt-riflinea']
	if 'trasporto' or 'vettore' in fattura:
		TRASP =  etree.SubElement(DGEN, 'DatiTrasporto')
	if 'trasporto' in fattura:
		MEZZO = etree.SubElement(TRASP, 'MezzoTrasporto')
		MEZZO.text = fattura['trasporto']['trasporto-mezzo']
		CAUST = etree.SubElement(TRASP, 'CausaleTrasporto')
		CAUST.text = fattura['trasporto']['trasporto-causale']
		COLLI = etree.SubElement(TRASP, 'NumeroColli')
		COLLI.text = fattura['trasporto']['trasporto-colli']
		DESCT = etree.SubElement(TRASP, 'Descrizione')
		DESCT.text = fattura['trasporto']['trasporto-descrizione']
		UMPESO = etree.SubElement(TRASP, 'UnitaMisuraPeso')
		UMPESO.text = fattura['trasporto']['trasporto-um']
		PESOL = etree.SubElement(TRASP, 'PesoLordo')
		PESOL.text = fattura['trasporto']['trasporto-pesol']
		PESON = etree.SubElement(TRASP, 'PesoNetto')
		PESON.text = fattura['trasporto']['trasporto-peson']
	if 'vettore' in fattura:		
		VETTORE =  etree.SubElement(TRASP, 'DatiAnagraficiVettore')
		IDFISVET = etree.SubElement(VETTORE, 'IdFiscaleIVA')
		IDCODVET = etree.SubElement(IDFISVET, 'IdPaese')
		IDCODVET.text = fattura['vettore']['vettore-piva-paese'] 
		CODFISVET = etree.SubElement(VETTORE, 'CodiceFiscale')
		CODFISVET.text = fattura['vettore']['vettore-cf']
		IDCODVET = etree.SubElement(IDFISVET, 'IdCodice')
		IDCODVET.text = fattura['vettore']['vettore-piva-codice'] 
		ANAVETTORE = etree.SubElement(VETTORE, 'Anagrafica')
		DENVET = etree.SubElement(ANAVETTORE, 'Denominazione')
		DENVET.text = fattura['vettore']['vettore-denominazione']
		NOMEVET = etree.SubElement(ANAVETTORE, 'Nome')
		NOMEVET.text = fattura['vettore']['vettore-nome']
		COGVET = etree.SubElement(ANAVETTORE, 'Cognome')
		COGVET.text = fattura['vettore']['vettore-cognome']
		TITVET = etree.SubElement(ANAVETTORE, 'Titolo')
		TITVET.text = fattura['vettore']['vettore-titolo']
		EORIVET = etree.SubElement(ANAVETTORE, 'CodEori')
		EORIVET.text = fattura['vettore']['vettore-eori']
		LICVET = etree.SubElement(VETTORE, 'NumeroLicenzaGuida')
		LICVET.text = fattura['vettore']['vettore-lic']
	if 'resa' in fattura:
		RESA = etree.SubElement(TRASP, 'TipoResa')
		RESA.text = fattura['resa']['resa-tipo']
		RESAI = etree.SubElement(TRASP, 'IndirizzoResa')
		RESAIND = etree.SubElement(RESAI, 'Indirizzo')
		RESAIND.text = fattura['resa']['resa-indirizzo']
		RESACIV = etree.SubElement(RESAI, 'NumeroCivico')
		RESACIV.text = fattura['resa']['resa-civico']
		RESACAP = etree.SubElement(RESAI, 'CAP')
		RESACAP.text = fattura['resa']['resa-cap']	
		RESACOMUNE = etree.SubElement(RESAI, 'Comune')
		RESACOMUNE.text = fattura['resa']['resa-comune']
		RESAPROV = etree.SubElement(RESAI, 'Provincia')
		RESAPROV.text = fattura['resa']['resa-prov']
		RESANAZ = etree.SubElement(RESAI, 'Nazione')
		RESANAZ.text = fattura['resa']['resa-naz']
	if 'fattura-principale' in fattura:
		FPRINC = etree.SubElement(DGEN, 'FatturaPrincipale')
		FPRINCNUM = etree.SubElement(FPRINC, 'NumeroFatturaPrincipale')
		FPRINCNUM.text = fattura['fattura-principale']['numero']
		FPDATA = etree.SubElement(FPRINC, 'DataFatturaPrincipale')
		FPDATA.text = str((datetime.datetime.strptime(fattura['fattura-principale']['data'],'%d/%m/%Y')).strftime("%Y-%m-%d"))	

	DBENI = etree.SubElement(BODY, 'DatiBeniServizi')
	for r in fattura['corpo']:
		DLINEE = etree.SubElement(DBENI, 'DettaglioLinee') 
		NLINEA = etree.SubElement(DLINEE, 'NumeroLinea')
		NLINEA.text = str(r['rigaArt'])
		if  'CodiceArt' in r and r['CodiceArt'] != "":
			CARTL = etree.SubElement(DLINEE, 'CodiceArticolo')
			CTIPO = etree.SubElement(CARTL, 'CodiceTipo' )
			CTIPO.text = '' 
			CVAL = etree.SubElement(CARTL, 'CodiceValore')
			CVAL.text = r[ 'CodiceArt']
		DLINEA  = etree.SubElement(DLINEE,'Descrizione')
		DLINEA.text = r[ 'DescrizioneArt']
		QT = etree.SubElement(DLINEE, 'Quantita')
		QT.text = str(("{:.2f}".format(float(r[ 'qtArt']))))
		UM = etree.SubElement(DLINEE, 'UnitaMisura')
		UM.text = r[ 'umArt']
		PUNI = etree.SubElement(DLINEE,'PrezzoUnitario')
		PUNI.text = str("{:.2f}".format(float(r[ 'puniArt'])))
		PTOT = etree.SubElement(DLINEE,'PrezzoTotale')
		PTOT.text = str("{:.2f}".format(float((r[ 'puniArt']))))
		ALIQ = etree.SubElement(DLINEE,'AliquotaIVA')
		ALIQ.text = str("{:.2f}".format(float(r['alART'])))
		if float(r['alART']) > 22:
			ALIQ.text = str("{:.2f}".format(float(0)))
			nat = Codiva.query.filter_by(codice = r['alART']).first()
			NATL = etree.SubElement(DLINEE,'Natura')
			NATL.text = nat.natura
	for d in fattura['riepiloghi']:		
		DRIEP = etree.SubElement(DBENI,'DatiRiepilogo')
		ALIVA = etree.SubElement(DRIEP, 'AliquotaIVA')
		ALIVA.text = str("{:.2f}".format(float(d['aliquota'])))
		if float(d['aliquota']) > 22:
			ALIVA.text = str("{:.2f}".format(float(0)))
			nat = Codiva.query.filter_by(codice = d['aliquota']).first()
			NATL = etree.SubElement(DRIEP,'Natura')
			NATL.text = nat.natura
		IMPO = etree.SubElement(DRIEP, 'ImponibileImporto')
		impoiva = d['imponibile']
		IMPO.text = "{:.2f}".format(float(impoiva))
		IMPOSTA = etree.SubElement(DRIEP, 'Imposta')
		IMPOSTA.text =  str("{:.2f}".format(float(d['imposta'])))
		if d['rifnorma'] != "":
			NORMA = etree.SubElement(DRIEP, 'RiferimentoNormativo')
			NORMA.text = d['rifnorma']	
	DPAG = etree.SubElement(BODY, 'DatiPagamento')
	CPAG = etree.SubElement(DPAG, 'CondizioniPagamento')
	CPAG.text = fattura['pagamento'][0]['pagamento_condizioni']
	if 'veicolo' in fattura:
		VEICOLO = etree.SubElement(BODY, 'DatiVeicoli')
		DATAVEIC = etree.SubElement(VEICOLO, 'Data')
		DATAVEIC.text = fattura['veicolo']['data'] 
		DATAVEIC = etree.SubElement(VEICOLO, 'TotalePercorso')
		DATAVEIC.text = fattura['veicolo']['totale']
	for s in fattura['pagamento']:
		DEPAG = etree.SubElement(DPAG, 'DettaglioPagamento')
		MPAG = etree.SubElement(DEPAG, 'ModalitaPagamento' )
		MPAG.text = s['pagamento_tipo']
		DRIF = etree.SubElement(DEPAG, 'DataScadenzaPagamento' )
		date = datetime.datetime.strptime(s['pagamento_scadenza'],'%d/%m/%Y')
		date = date.strftime("%Y-%m-%d")	 
		DRIF.text = str(date)		
		IMPPAG = etree.SubElement(DEPAG, 'ImportoPagamento' )
		IMPPAG.text = str("{:.2f}".format(float(s['pagamento_importo'])))
		ISTITUTO = etree.SubElement(DEPAG, 'IstitutoFinanziario' )
		ISTITUTO.text = s['pagamento_istituto']
		IBAN = etree.SubElement(DEPAG, 'IBAN' )
		IBAN.text = s['pagamento_iban']
		ABI = etree.SubElement(DEPAG, 'ABI' )
		ABI.text = s['pagamento_abi']
		CAB = etree.SubElement(DEPAG, 'CAB' )
		CAB.text = s['pagamento_cab']					
	m_encoding = 'UTF-8'		
	dom = xml.dom.minidom.parseString(etree.tostring(FATTURA))
	xml_string = dom.toprettyxml()		
	part1, part2 = xml_string.split('?>')
	directory = os.path.abspath("skote/easyinvoice/clienti/")	
	newdir = os.path.join(directory, session['ditta']['partitaiva'])
	if not os.path.exists(newdir):
		os.mkdir(newdir)
		dainv = os.path.join(newdir, "da_inviare")
		os.mkdir(dainv)
	attive = os.path.join(newdir, "attive")		
	if not os.path.exists(attive):		
		config = os.path.abspath("config.xml") 
		with open(config,'rb') as cf:
			xmlconfig = cf.read()			
			tree = etree.fromstring(xmlconfig)
			API = tree.find('DocEasyWebApiKey')
			API.text = '3a6cdf0709895e984953d881bc7e879948a08698eee624fdd6e4355a125a3247'
			SECRET = tree.find('DocEasyWebApiSecret') 
			SECRET.text = '06f74b6bd1883e5140dd1731f74067b95391c21bb2bc099989696affd57cf22d1785d483b4c7e3a3d7eefe60083a6db0703e7f20baa06a1397fd0f6617507adb'
		dom2 = xml.dom.minidom.parseString(etree.tostring(tree))
		xml_stringconf = dom2.toprettyxml()		
		part1conf, part2conf = xml_stringconf.split('?>')	
		with open(os.path.join(newdir, 'config.xml' ), 'w') as confc:
			confc.write(part1conf +  'encoding=\"{}\"?>'.format(m_encoding) + part2conf) 
			confc.close() 
		os.mkdir(attive)
	number_of_strings = 5
	length_of_string = 5	
	nfatttura = 'IT' + session['ditta']['partitaiva'] + '_' + ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(length_of_string))
	with open(os.path.join(attive, nfatttura) + '.xml','w') as f:
		f.write(part1 + 'encoding=\"{}\"?>'.format(m_encoding)  + part2 )
		f.close()	
	
	return nfatttura
	
	




def config_file_write(key, secret):
    config_file = etree.Element("CLIConfiguration")
    URL = etree.SubElement(config_file, "DocEasyWebApiUrl")
    URL.text = "https://webapi.doceasy.it"
    KEY = etree.SubElement(config_file, "DocEasyWebApiKey")
    KEY.text = key
    SECRET = etree.SubElement(config_file, "DocEasyWebApiSecret")
    SECRET.text = secret    
    directory = os.path.abspath("skote/easyinvoice/clienti/")
    newdir = os.path.join(directory, session["ditta"]["partitaiva"])    
    if not os.path.exists(newdir):
        os.mkdir(newdir)    
    with open(os.path.join(newdir, "config.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n')
        f.write(etree.tostring(config_file, encoding="unicode", pretty_print=True))    
    return "success"





def config_json_write(key, secret):
    data = {
        "apyKey": key, 
        "apyKeySecret": secret,
        "CodiceFiscale": session['ditta']['codicefiscale'],
        "PartitaIva": session['ditta']['partitaiva'],
        "IDpassivo": 0,
        "Idattivo": 0
    }
    
    directory = os.path.abspath("skote/easyinvoice/clienti/")
    newdir = os.path.join(directory, session["ditta"]["partitaiva"])    
    if not os.path.exists(newdir):
        os.mkdir(newdir) 
    indices = os.path.join(newdir, 'indices')
    if not os.path.exists(indices):
        os.mkdir(indices)
        
    config_file_path = os.path.join(indices, "config.json")    
    
    with open(config_file_path, "w") as f:
        json.dump(data, f, indent= 4)
        
    return 'success'

