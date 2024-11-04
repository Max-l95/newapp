import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Card, CardBody, CardHeader, Col, Container, Form, Input, Label, Nav, NavItem, NavLink, Row, TabContent, TabPane } from 'reactstrap';
import classnames from "classnames";
import Flatpickr from "react-flatpickr";

//import images
import progileBg from '../../../../assets/images/profile-bg.jpg';
import avatar1 from '../../../../assets/images/users/avatar-1.jpg';

import { getLoggedinUser } from '../../../../helpers/api_helper';
import { APIClient } from '../../../../helpers/api_helper';

const Settings = () => {
    const apiClient = new APIClient();

    const userProfileSession = getLoggedinUser();
    console.log(userProfileSession)    
    
    const [activeTab, setActiveTab] = useState("1");
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState('');
    const [color, setColor] = useState('');
    const [messageUser, setMessageUser] = useState('');
    const [colorUser, setColorUser] = useState('');
    const [messageFirm, setMessageFirm] = useState('');
    const [colorFirm, setColorFirm] = useState('');
    const [firstName, setFirstName] = useState(userProfileSession.data.first_name)
    const [lastName, setLastName] = useState(userProfileSession.data.last_name)
    const [ruolo, setRuolo] = useState(userProfileSession.data.ruolo)
    const [address, setAddress] = useState(userProfileSession.data.address)
    const [cap, setCap] = useState(userProfileSession.data.cap)
    const [comune, setComune] = useState(userProfileSession.data.city)
    const [provincia, setProvincia] = useState(userProfileSession.data.provincia)
    const [denominazione, setDenominazione] = useState(userProfileSession.data.azienda.denominazione)
    const [codiceFiscale, setCodiceFiscale] = useState(userProfileSession.data.azienda.codiceFiscale)
    const [partitaIva, setPartitaIva] =  useState(userProfileSession.data.azienda.partitaIva)
    const [addressFirm, setAddressFirm] =  useState(userProfileSession.data.azienda.sede)
    const [capFirm, setCapFirm] =  useState(userProfileSession.data.azienda.cap)
    const [cityFirm, setCityFirm] =  useState(userProfileSession.data.azienda.city)
    const [provinciaFirm, setProvinciaFirm] =  useState(userProfileSession.data.azienda.provincia)
    const [phone, setPhone] =  useState(userProfileSession.data.phone_number)
    const [email, setEmail] = useState(userProfileSession.data.email)
    const [adeUsername, setADEusername] = useState(userProfileSession.data.ade_user);
    const [adePassword, setADEpassword] = useState(userProfileSession.data.ade_password);
    const [adePin, setADEpin] = useState(userProfileSession.data.ade_pin);
    const [importoCauzione, setImportoCauzione] = useState('')
    const [passwordEmail, setPasswordEmail] = useState('')




    const tabChange = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        try {
            const response = await apiClient.create('/password/change', {
                email : userProfileSession.data.email,
                old_password : oldPassword,
                new_password : newPassword,
                confirm_password : confirmPassword
            });
            
            // Update the state with the response data
            setMessage(response.message);
            setColor(response.color);

        } catch (error) {
            console.error('Error changing password:', error);

            // Optionally, handle errors differently
            setMessage('Errore nella modifica della password');
            setColor('danger');
        }

        // Reset the input fields (if you want to keep this behavior)
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handleUserDetailConfirm = async (event) => {
        try {
            const response = await apiClient.create('post-jwt-profile', {                
                

            });
            
            // Update the state with the response data
            setMessageUser(response.message);
            setColorUser(response.color);

        } catch (error) {
            

            // Optionally, handle errors differently
            setMessageUser('Errore nella modifica dei dati');
            setColorUser('danger');
        }


    }

    const handleFirmConfirm = async (event) => {
        try {
            const response = await apiClient.create('/azienda/update', {                
                denominazione : firstName,
                codice_fiscale : codiceFiscale,
                partita_iva : partitaIva,
                address : address,
                cap : cap,
                city : comune,
                provincia : provincia,
                ade_user : adeUser,
                ade_password : adePassword,
                ade_pin : adePin,               

            });
            
            // Update the state with the response data
            setMessageFirm(response.message);
            setColorFirm(response.color);

        } catch (error) {
            

            // Optionally, handle errors differently
            setMessageFirm('Errore nella modifica dei dati');
            setColorFirm('danger');
        }
    }

    const handleContactConfirm = async(event) => {
        try {
            const response = await apiClient.create('/post-jwt-profile', {                
                phone_number : phone,
                email : email,
            });
            
            // Update the state with the response data
            setMessageUser(response.message);
            setColorUser(response.color);

        } catch (error) {
            

            // Optionally, handle errors differently
            setMessageUser('Errore nella modifica dei dati');
            setColorUser('danger');
        }

    }

    const handleSettingsConfirm = async(event) => {
        try {
            const response = await apiClient.create('/post-jwt-profile', {                
                email_password : passwordEmail,
                cauzione : importoCauzione,
            });
            
            // Update the state with the response data
            setMessageUser(response.message);
            setColorUser(response.color);

        } catch (error) {
            

            // Optionally, handle errors differently
            setMessageUser('Errore nella modifica dei dati');
            setColorUser('danger');
        }

    }



    document.title = "Profilo Utente | DgnsDesk";

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <div className="position-relative mx-n4 mt-n4">
                        <div className="profile-wid-bg profile-setting-img">
                            <img src={progileBg} className="profile-wid-img" alt="" />                            
                        </div>
                    </div>
                    <Row>
                        <Col xxl={3}>
                            <Card className="mt-n5">
                                <CardBody className="p-4">
                                    <div className="text-center">
                                        <div className="profile-user position-relative d-inline-block mx-auto  mb-4">
                                            <img src={avatar1}
                                                className="rounded-circle avatar-xl img-thumbnail user-profile-image"
                                                alt="user-profile" />
                                            <div className="avatar-xs p-0 rounded-circle profile-photo-edit">
                                                <Input id="profile-img-file-input" type="file"
                                                    className="profile-img-file-input" />
                                                <Label htmlFor="profile-img-file-input"
                                                    className="profile-photo-edit avatar-xs">
                                                    <span className="avatar-title rounded-circle bg-light text-body">
                                                        <i className="ri-camera-fill"></i>
                                                    </span>
                                                </Label>
                                            </div>
                                        </div>
                                        <h5 className="fs-16 mb-1">{userProfileSession.data.first_name}</h5>
                                        <p className="text-muted mb-0">{userProfileSession.data.ruolo}</p>
                                    </div>
                                </CardBody>
                            </Card>

                            
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center mb-4">
                                        <div className="flex-grow-1">
                                            <h5 className="card-title mb-0">Contatti</h5>
                                        </div>
                                        
                                    </div>
                                    <div className="mb-3 d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-success text-light">
                                                <i className="ri-mail-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="email" className="form-control" id="email-contact" placeholder="Email"
                                        defaultValue={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="mb-3 d-flex">
                                        <div className="avatar-xs d-block flex-shrink-0 me-3">
                                            <span className="avatar-title rounded-circle fs-16 bg-primary text-light">
                                                <i className="ri-phone-fill"></i>
                                            </span>
                                        </div>
                                        <Input type="text" className="form-control" id="phone" placeholder="Telefono"
                                        defaultValue={phone} onChange={(e) => setPhone(e.target.value)}
                                            />
                                    </div>
                                    <div className="hstack gap-2 mb-3 d-flex justify-content-end">
                                        <button type="button" className="btn btn-success" onClick={handleContactConfirm}>Aggiorna</button>                                                       
                                    </div>
                                 
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xxl={9}>
                            <Row>
                                <Card className="mt-xxl-n5">
                                    <CardHeader>
                                        <Nav className="nav-tabs-custom rounded card-header-tabs border-bottom-0"
                                            role="tablist">
                                            <NavItem>
                                                <NavLink
                                                    className={classnames({ active: activeTab === "1" })}
                                                    onClick={() => {
                                                        tabChange("1");
                                                    }}>
                                                    <i className="fas fa-home"></i>
                                                    Dettagli Utente
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink to="#"
                                                    className={classnames({ active: activeTab === "2" })}
                                                    onClick={() => {
                                                        tabChange("2");
                                                    }}
                                                    type="button">
                                                    <i className="far fa-user"></i>
                                                    Cambio Password
                                                </NavLink>
                                            </NavItem>
                                            <NavItem >
                                                <NavLink to="#"
                                                    className={classnames({ active: activeTab === "3" })}
                                                    onClick={() => {
                                                        tabChange("3");
                                                    }}
                                                    type="button">
                                                    <i className="far fa-envelope"></i>
                                                    Dati Azienda
                                                </NavLink>
                                            </NavItem>
                                            <NavItem >
                                                <NavLink to="#"
                                                    className={classnames({ active: activeTab === "4" })}
                                                    onClick={() => {
                                                        tabChange("4");
                                                    }}
                                                    type="button">
                                                    <i className="far fa-envelope"></i>
                                                    Impostazioni
                                                </NavLink>
                                            </NavItem>                                        
                                        </Nav>
                                    </CardHeader>
                                    <CardBody className="p-4">
                                        <TabContent activeTab={activeTab}>
                                            <TabPane tabId="1">
                                                <Form>
                                                    <Row>
                                                        <Col lg={6}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="firstnameInput" className="form-label">
                                                                    Nome</Label>
                                                                <Input type="text" className="form-control" id="firstnameInput"
                                                                    placeholder="Inserisci il tuo nome" defaultValue={firstName}  onChange={(e) => setFirstName(e.target.value)}/>
                                                            </div>
                                                        </Col>
                                                        <Col lg={6}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="lastnameInput" className="form-label">
                                                                    Cognome</Label>
                                                                <Input type="text" className="form-control" id="lastnameInput"
                                                                    placeholder="inserisci il tuo cognome" defaultValue={lastName} onChange={(e) => setLastName(e.target.value)} />
                                                            </div>
                                                        </Col>                                                    
                                                        
                                                        <Col lg={12}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="designationInput"
                                                                    className="form-label">Ruolo Aziendale</Label>
                                                                <Input type="text" className="form-control"
                                                                    id="designationInput" placeholder="Designation" disabled
                                                                    defaultValue={ruolo} onChange={(e) => setRuolo(e.target.value)}/>
                                                            </div>
                                                        </Col>
                                                        <Col lg={6}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="websiteInput1"
                                                                    className="form-label">Indirizzo</Label>
                                                                <Input type="text" className="form-control" id="addressInput1"
                                                                    placeholder="inserisci il tuo indirizzo" defaultValue={address} onChange={(e) => setAddress(e.target.value)} />
                                                            </div>
                                                        </Col>
                                                        <Col lg={2}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="capInput" className="form-label">Cap</Label>
                                                                <Input type="text" className="form-control" id="capInput"
                                                                    placeholder="Cap" defaultValue={cap} onChange={(e) => setCap(e.target.value)}/>
                                                            </div>
                                                        </Col>
                                                        <Col lg={3}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="cityInput" className="form-label">Comune</Label>
                                                                <Input type="text" className="form-control" id="cityInput"
                                                                    placeholder="City" defaultValue={comune} onChange={(e) => setComune(e.target.value)} />
                                                            </div>
                                                        </Col>
                                                        <Col lg={1}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="provinciaInput" className="form-label">Provincia</Label>
                                                                <Input type="text" className="form-control" id="provinciaInput"
                                                                    placeholder="Provincia" defaultValue={provincia} onChange={(e) => setProvincia(e.target.value)} />
                                                            </div>
                                                        </Col>
                                                        <Col lg={12}>
                                                            <div className="hstack gap-2 justify-content-end mb-3">
                                                                <button type="button"
                                                                    className="btn btn-primary" onClick={handleUserDetailConfirm}>Aggiorna</button>
                                                                
                                                            </div>
                                                        </Col>
                                                        
                                                    </Row>
                                                </Form>
                                            </TabPane>

                                            <TabPane tabId="2">
                                                <Form>
                                                    <Row className="g-2">
                                                        <Col lg={4}>
                                                            <div>
                                                                <Label htmlFor="oldpasswordInput" className="form-label">Vecchia
                                                                    Password*</Label>
                                                                <input type="password" className="form-control"
                                                                    id="oldpasswordInput"
                                                                    value={oldPassword}
                                                                    placeholder="Enter current password" onChange={(e) => setOldPassword(e.target.value)}/>
                                                            </div>
                                                        </Col>

                                                        <Col lg={4}>
                                                            <div>
                                                                <Label htmlFor="newpasswordInput" className="form-label">Nuova
                                                                    Password*</Label>
                                                                <input type="password" className="form-control"
                                                                    value={newPassword}
                                                                    id="newpasswordInput" placeholder="Enter new password" onChange={(e) => setNewPassword(e.target.value)} />
                                                            </div>
                                                        </Col>

                                                        <Col lg={4}>
                                                            <div>
                                                                <Label htmlFor="confirmpasswordInput" className="form-label">Conferma
                                                                    Password*</Label>
                                                                <input type="password" className="form-control"
                                                                    id="confirmpasswordInput"
                                                                    value={confirmPassword}
                                                                    placeholder="Confirm password" onChange={(e) => setConfirmPassword(e.target.value)} />
                                                            </div>
                                                        </Col>

                                                        
                                                        <Col lg={12}>
                                                        {message && <Alert color={color}>{message}</Alert>}
                                                        </Col>

                                                        <Col lg={12}>
                                                            <div className="text-end">
                                                                <button type="button" className="btn btn-success" onClick={handleChangePassword}>Cambia
                                                                    Password</button>
                                                            </div>
                                                        </Col>

                                                    </Row>

                                                </Form>
                                                
                                            </TabPane>

                                            <TabPane tabId="3">                                            
                                                    <div id="newlink">
                                                        <div id="1">
                                                            <Row>
                                                                <Col lg={12}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="firmName" className="form-label">Nome Azienda
                                                                            </Label>
                                                                        <Input type="text" className="form-control"
                                                                            id="firmName" placeholder="Nome Azienda"
                                                                            defaultValue={denominazione} onChange={(e) => setDenominazione(e.target.value)} />
                                                                    </div>
                                                                </Col>

                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="companyName" className="form-label">Codice Fiscale 
                                                                            </Label>
                                                                        <Input type="text" className="form-control"
                                                                            id="codiceFiscale" placeholder="Codice Fiscale"
                                                                            defaultValue={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                                                                    </div>
                                                                </Col>
                                                                <Col lg={6}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="companyName" className="form-label">Partita Iva
                                                                            </Label>
                                                                        <Input type="text" className="form-control"
                                                                            id="partitaIva" placeholder="Company name"
                                                                            defaultValue={partitaIva} onChange={(e) => setPartitaIva(e.target.value)} />
                                                                    </div>
                                                                </Col>

                                                                

                                                                <Col lg={8}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="indrirzzoAzienda" className="form-label">Indirizzo
                                                                        </Label>
                                                                        <Input type='teaxtarea'
                                                                            className="form-control" id="indirizzoAzienda"
                                                                            rows="3"
                                                                            placeholder='Enter description'
                                                                            defaultValue={addressFirm} onChange={(e) => setAddressFirm(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col lg={1}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="capAzienda" className="form-label">Cap
                                                                        </Label>
                                                                        <Input type='teaxtarea'
                                                                            className="form-control" id="cap"
                                                                            rows="3"
                                                                            placeholder='Cap'
                                                                            defaultValue={capFirm} onChange={(e) => setCapFirm(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col lg={2}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="comuneAzienda" className="form-label">Comune
                                                                        </Label>
                                                                        <Input type='teaxtarea'
                                                                            className="form-control" id="comuneAzienda"
                                                                            rows="3"
                                                                            placeholder='Enter description'
                                                                            defaultValue={cityFirm} onChange={(e) => setCityFirm(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>
                                                                <Col lg={1}>
                                                                    <div className="mb-3">
                                                                        <Label htmlFor="provinciaAzienda" className="form-label">Provincia
                                                                        </Label>
                                                                        <Input type='teaxtarea'
                                                                            className="form-control" id="provinciaAzienda"
                                                                            rows="3"
                                                                            placeholder='Enter description'
                                                                            defaultValue={provinciaFirm} onChange={(e) => setProvinciaFirm(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </Col>                                                               
                                                            </Row>
                                                        </div>
                                                    </div>
                                                    <Row>
                                                        {/* Username Field */}
                                                        <Col lg={4}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="usernameInput" className="form-label">USERNAME</Label>
                                                                <Input 
                                                                    type="text" 
                                                                    className="form-control" 
                                                                    id="usernameInput" 
                                                                    placeholder="Enter your username" 
                                                                    defaultValue={adeUsername} 
                                                                    onChange={(e) => setADEusername(e.target.value)} 
                                                                />
                                                            </div>
                                                        </Col>

                                                        {/* Password Field */}
                                                        <Col lg={4}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="passwordInput" className="form-label">PASSWORD</Label>
                                                                <Input 
                                                                    type="password" 
                                                                    className="form-control" 
                                                                    id="passwordInput" 
                                                                    placeholder="Enter your password" 
                                                                    defaultValue={adePassword} 
                                                                    onChange={(e) => setADEpassword(e.target.value)} 
                                                                />
                                                            </div>
                                                        </Col>

                                                        {/* PIN Field */}
                                                        <Col lg={4}>
                                                            <div className="mb-3">
                                                                <Label htmlFor="pinInput" className="form-label">PIN</Label>
                                                                <Input 
                                                                    type="text" 
                                                                    className="form-control" 
                                                                    id="pinInput" 
                                                                    placeholder="PIN"                                                         
                                                                    defaultValue={adePin} 
                                                                    onChange={(e) => setADEpin(e.target.value)} 
                                                                />
                                                            </div>
                                                        </Col>                                                        
                                                        
                                                    </Row>

                                                    <Col lg={12}>
                                                        <div className="hstack gap-2 mb-3">
                                                            <button type="button" className="btn btn-success" onClick={handleFirmConfirm}>Aggiorna</button>
                                                            
                                                        </div>
                                                    </Col>
                                                    
                                                
                                            </TabPane>
                                            <TabPane tabId="4">
                                                <div className="mb-3">
                                                    <Label htmlFor="passwordInput" className="form-label">PASSWORD EMAIL</Label>
                                                    <Input 
                                                        type="password" 
                                                        className="form-control" 
                                                        id="passwordEmailInput" 
                                                        placeholder="Enter your password" 
                                                        defaultValue={passwordEmail} 
                                                        onChange={(e) => setPasswordEmail(e.target.value)} 
                                                    />
                                                </div>
                                                <div className="mb-3">
                                                    <Label htmlFor="passwordInput" className="form-label">Importo Cauzione</Label>
                                                    <Input 
                                                        type="text" 
                                                        className="form-control" 
                                                        id="importoCauzione" 
                                                        placeholder="Inserisci l'importo della cauzione" 
                                                        defaultValue={importoCauzione} 
                                                        onChange={(e) => setImportoCauzione(e.target.value)} 
                                                    />
                                                </div>
                                                <Col lg={12}>
                                                        <div className="hstack gap-2 mb-3">
                                                            <button type="button" className="btn btn-success" onClick={handleSettingsConfirm}>Aggiorna</button>
                                                            
                                                    </div>
                                                </Col>
                                                
                                                





                                            </TabPane> 
                                                                                   
                                        </TabContent>
                                        <Col lg={12}>
                                        {messageUser && <Alert color={colorUser}>{messageUser}</Alert>}
                                        </Col>
                                    </CardBody>
                                </Card>
                            </Row>
                            
                            
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default Settings;