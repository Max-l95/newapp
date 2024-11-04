// DashboardProject.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Col, Container, Row } from 'reactstrap';
import Widgets from './Widgets';
import { getLoggedinUser } from '../../helpers/api_helper';
import Scontrini from '../Scontrini/Scontrini';
import { APIClient } from '../../helpers/api_helper';
import Flatpickr from "react-flatpickr";

const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DashboardProject = () => {
    document.title = "Dashboard | Dgns Desk";

    const navigate = useNavigate();
    const apiClient = new APIClient();
    const [dataScontrini, setDataScontrini] = useState([]);
    const [newDate, setNewDate] = useState(getCurrentDate());

    const fetchDataScontrini = async () => {
        try {
            const response = await apiClient.get(`/scontrini/filter/${newDate}`);
            if (response?.data && Array.isArray(response.data)) {
                setDataScontrini(response.data);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchDataScontrini();
    }, [newDate]);

    useEffect(() => {
        const authUser = getLoggedinUser();
        if (authUser?.data?.azienda) {
            if (!authUser.data.azienda.pos) {
                navigate('/dashboard-reservations');
            }
        } else {
            console.error("User data or azienda is missing");
        }
    }, [navigate]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row className="project-wrapper">
                        <Col xxl={12}>
                            <Widgets date={newDate} />  {/* Pass the newDate here */}
                            <Card>
                                <CardBody>
                                    <Row>
                                        <Col lg={2} className="col-sm-auto">
                                            <div>
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
                                                    onChange={(date) => {
                                                        setNewDate(formatDate(date[0]));  // Format the date properly
                                                    }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Scontrini data={dataScontrini} fetchData={fetchDataScontrini} />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default DashboardProject;
