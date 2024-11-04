import React, { useState } from 'react';
import { Row, Col, Modal, ModalHeader, ModalBody, ModalFooter, Input, UncontrolledTooltip, Label } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';

const NewFornitore = ({ modalList, toggleList, fetchData }) => {
    const apiClient = new APIClient();
    const [newDenominazione, setNewDenominazione] = useState("");
    const [newCognome, setnewCognome] = useState('');
    const [newNome, setNewNome] = useState('');
    const [newCodFiscale, setNewCodFiscale] = useState('');
    const [newPartitaiva, setNewPartitaiva] = useState('');
    const [newSDI, setNewSDI] = useState('');
    const [newIndirizzo, setnewIndirizzo] = useState('');
    const [newCap, setNewCap] = useState('');
    const [newComune, setNewComune] = useState('');
    const [newCivico, setNewCivico] = useState('');
    const [newProvincia, setNewProvincia] = useState('');
    const [newNazione, setNewNazione] = useState('');
    const [newTelefono, setNewTelefono] = useState('');
    const [newCellulare, setNewCellulare] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPec, setNewPec] = useState('');
    const [genericoCheck, setGenericoCheck] = useState(false)

    const handleAddFornitore = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/fornitori/add', {
                denominazione: newDenominazione,
                cognome: newCognome,
                nome: newNome,
                codicefiscale: newCodFiscale,
                partitaiva: newPartitaiva,
                indirizzo: newIndirizzo,
                civico: newCivico,
                cap: newCap,
                comune: newComune,
                provincia: newProvincia,
                SDI: newSDI,
                nazione: newNazione,
                telefono: newTelefono,
                cellulare: newCellulare,
                email: newEmail,
                pec: newPec,
                generico : genericoCheck
            });

            if (response.success) {
                setNewDenominazione("");
                setnewCognome('');
                setNewNome('');
                setNewCodFiscale('');
                setNewPartitaiva('');
                setNewSDI('');
                setnewIndirizzo('');
                setNewCap('');
                setNewComune('');
                setNewCivico('');
                setNewProvincia('');
                setNewNazione('');
                setNewTelefono('');
                setNewCellulare('');
                setNewEmail('');
                setNewPec('');
                setGenericoCheck(false)
                toggleList();
                fetchData();
            } else {
                console.error('Add operation failed:', response.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error adding fornitore:', error);
        }
    };

    return (
        <Modal size='xl' isOpen={modalList} toggle={toggleList} centered>
                <ModalHeader className="bg-light p-3" toggle={toggleList}>Aggiungi Fornitore</ModalHeader>
                <form className="tablelist-form" onSubmit={handleAddFornitore}>
                    <ModalBody>
                        <div className="mb-3" id="modal-id" style={{ display: "none" }}>
                            <label htmlFor="id-field" className="form-label">ID</label>
                            <input type="text" id="id-field" className="form-control" placeholder="ID" readOnly />
                        </div>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="denominazione-field" className="form-label">Denominazione</label>
                            <input
                                type="text"
                                id="denominazione-field"
                                className="form-control"
                                placeholder="Inserisci la denominazione"
                                value={newDenominazione}
                                onChange={(e) => setNewDenominazione(e.target.value)}
                                
                            />
                        </div>
                        </Col>
                          <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="nome-field" className="form-label">Nome</label>
                            <input
                                type="text"
                                id="nome-field"
                                className="form-control"
                                placeholder="Inserisci il nome"
                                value={newNome}
                                onChange={(e) => setNewNome(e.target.value)}
                                
                            />
                        </div>
                        </Col>
                        
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="description-field" className="form-label">Cognome</label>
                            <input
                                type="text"
                                id="description-field"
                                className="form-control"
                                placeholder="Inserisci il cognome"
                                value={newCognome}
                                onChange={(e) => setnewCognome(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                            <div className="form-check form-check-inline mt-4">
                                <Input className="form-check-input" type="checkbox" id="inlineCheckbox6" checked={genericoCheck} onChange={(e) => setGenericoCheck(e.target.checked)} />
                                <UncontrolledTooltip placement='top' target="cheese-icon-new">Generico</UncontrolledTooltip>
                                <Label className="form-check-label" id="cheese-icon-new" htmlFor="inlineCheckbox6">Generico</Label>
                            </div>
                        </Col>
                       
                        </Row>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="codfiscale-field" className="form-label">Codice Fiscale</label>
                            <input
                                type="text"
                                id="codfiscale-field"
                                className="form-control"
                                placeholder="Inserisci il codice fiscale"
                                value={newCodFiscale}
                                onChange={(e) => setNewCodFiscale(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="partitaiva-field" className="form-label">Partita Iva</label>
                            <input
                                type="text"
                                id="partitaiva-field"
                                className="form-control"
                                placeholder="Inserisci il partita iva"
                                value={newPartitaiva}
                                onChange={(e) => setNewPartitaiva(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={2}>
                        <div className="mb-3">
                            <label htmlFor="sdi-field" className="form-label">SDI</label>
                            <input
                                type="text"
                                id="sdi-field"
                                className="form-control"
                                placeholder="Inserisci codice SDI"
                                value={newSDI}
                                onChange={(e) => setNewSDI(e.target.value)}
                                
                            />                       
                        </div>
                        </Col>
                        </Row>
                        <Row>
                        <Col lg={5}>
                        <div className="mb-3">
                            <label htmlFor="address-field" className="form-label">Indirizzo</label>
                            <input
                                type="text"
                                id="cognome-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo"
                                value={newIndirizzo}
                                onChange={(e) => setnewIndirizzo(e.target.value)}                                
                            />                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="civico-field" className="form-label">Civico</label>
                            <input
                                type="text"
                                id="civico-field"
                                className="form-control"
                                placeholder="Nr."
                                value={newCivico}
                                onChange={(e) => setNewCivico(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="cap-field" className="form-label">Cap</label>
                            <input
                                type="text"
                                id="cap-field"
                                className="form-control"
                                placeholder="CAP"
                                value={newCap}
                                onChange={(e) => setNewCap(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="comune-field" className="form-label">Comune</label>
                            <input
                                type="text"
                                id="comune-field"
                                className="form-control"
                                placeholder="Inserisci il comune"
                                value={newComune}
                                onChange={(e) => setNewComune(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="provincia-field" className="form-label">Provincia</label>
                            <input
                                type="text"
                                id="provincia-field"
                                className="form-control"
                                placeholder="Pr."
                                value={newProvincia}
                                onChange={(e) => setNewProvincia(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={1}>
                        <div className="mb-3">
                            <label htmlFor="nazione-field" className="form-label">Nazione</label>
                            <input
                                type="text"
                                id="nazione-field"
                                className="form-control"
                                placeholder="EE"
                                value={newNazione}
                                onChange={(e) => setNewNazione(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                    </Row>
                    <Row>
                    <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="telefono-field" className="form-label">Telefono</label>
                            <input
                                type="text"
                                id="telefono-field"
                                className="form-control"
                                placeholder="Inserisci il numero di telefono"
                                value={newTelefono}
                                onChange={(e) => setNewTelefono(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="cellulare-field" className="form-label">Cellulare</label>
                            <input
                                type="text"
                                id="cellulare-field"
                                className="form-control"
                                placeholder="Inserisci il numero di cellulare"
                                value={newCellulare}
                                onChange={(e) => setNewCellulare(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="email-field" className="form-label">Email</label>
                            <input
                                type="mail"
                                id="email-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo Email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        <Col lg={3}>
                        <div className="mb-3">
                            <label htmlFor="pec-field" className="form-label">PEC</label>
                            <input
                                type="text"
                                id="pec-field"
                                className="form-control"
                                placeholder="Inserisci l'indirizzo Pec"
                                value={newPec}
                                onChange={(e) => setNewPec(e.target.value)}
                                
                            />
                       
                        </div>
                        </Col>
                        
                    </Row>

                    </ModalBody>
                    <ModalFooter>
                        <div className="hstack gap-2 justify-content-end">
                            <button type="button" className="btn btn-light" onClick={toggleList}>Chiudi</button>
                            <button type="submit" className="btn btn-success" id="add-btn">Aggiungi Fornitore</button>
                        </div>
                    </ModalFooter>
                </form>
            </Modal>
  )
}


export default NewFornitore;
