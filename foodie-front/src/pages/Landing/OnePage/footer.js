import React, { useEffect, useState } from 'react';
import { Row, Col } from 'reactstrap';
import { Link } from 'react-router-dom';

const Footer = ({ azienda }) => {
    const [denominazione, setDenominazione] = useState("PAPINI WALTER");
    const [indirizzo, setIndirizzo] = useState("");
    const [cap, setCap] = useState("");
    const [comune, setComune] = useState("");
    const [provincia, setProvincia] = useState("");
    const [codiceFiscale, setCodiceFiscale] = useState("");
    const [partitaIva, setPartitaIva] = useState("");

    useEffect(() => {
        if (azienda) {
            setDenominazione(azienda.denominazione?.toUpperCase() || "PAPINI WALTER");
            setIndirizzo(azienda.indirizzo?.toUpperCase() || "");
            setCap(azienda.cap?.toUpperCase() || "");
            setComune(azienda.comune?.toUpperCase() || "");
            setProvincia(azienda.provincia?.toUpperCase() || "");
            setCodiceFiscale(azienda.codice_fiscale?.toUpperCase() || "");
            setPartitaIva(azienda.partita_iva?.toUpperCase() || "");
        }
    }, [azienda]);

    return (
        <React.Fragment>
            <footer 
                className="py-5 position-relative" 
                style={{ backgroundColor: "#30544B" }}
            >
                <Row className="text-center text-sm-start justify-content-center align-items-center bd-sans-black text-white fs-6">
                    <Col sm={12}>
                        <div className="text-sm-center mt-3">
                            <p>{denominazione}</p>
                            <small>{indirizzo}<br /></small>
                            <small>{cap} - {comune} ({provincia})<br /></small>
                            <small>C.F. {codiceFiscale}<br /></small>
                            <small>P.IVA {partitaIva}</small>
                        </div>
                    </Col>
                </Row>

                <Row className="text-center text-sm-start align-items-center justify-content-center flex-column mb-5 mt-5">
                    <Col sm={6}>
                        <div className="text-sm-center mt-3 mt-sm-0">
                            <ul className="list-inline mb-5 footer-social-link">
                                <li className="list-inline-item">
                                    <Link to="https://www.facebook.com/wpgardensbar?locale=it_IT" className="avatar-xs d-block">
                                        <div className="avatar-title rounded-circle">
                                            <i className="ri-facebook-fill"></i>
                                        </div>
                                    </Link>
                                </li>
                                <li className="list-inline-item">
                                    <Link to="https://www.instagram.com/wp_gardensbar/" className="avatar-xs d-block">
                                        <div className="avatar-title rounded-circle">
                                            <i className="ri-instagram-fill"></i>
                                        </div>
                                    </Link>
                                </li>
                                <li className="list-inline-item">
                                    <Link to="#" className="avatar-xs d-block">
                                        <div className="avatar-title rounded-circle">
                                            <i className="ri-dribbble-line"></i>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </Col>
                    <Col sm={6}>
                        <div className='text-center'>
                            <small className="copy-rights text-white text-sm-center mt-3 mt-sm-0 text-center">
                                {new Date().getFullYear()} © Digital Business Srl
                            </small>
                        </div>
                    </Col>
                </Row>
            </footer>
        </React.Fragment>
    );
};

export default Footer;
