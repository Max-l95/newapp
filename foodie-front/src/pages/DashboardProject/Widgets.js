import React, { useState, useEffect } from 'react';
import CountUp from "react-countup";
import FeatherIcon from "feather-icons-react";
import { Card, CardBody, Col, Row } from 'reactstrap';
import { APIClient } from '../../helpers/api_helper';

const Widgets = ({ date }) => {  // Destructure date correctly
    const apiClient = new APIClient();
    const [dataWidget, setDataWidget] = useState([]);

    const fetchDataWidget = async () => {
        setDataWidget([]); // Clear previous data before fetching new data
        try {
            const response = await apiClient.get(`/api/widgets/${date}`);
            if (response) {
                setDataWidget(response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    

    // Fetch data whenever the date changes
    useEffect(() => {
        fetchDataWidget();
    }, [date]);  // Add date as a dependency

    return (
        <React.Fragment>
            <Row>
                {(dataWidget || []).map((item, key) => (
                    <Col xl={4} key={key}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="avatar-sm flex-shrink-0">
                                        <span className={`avatar-title bg-${item.feaIconClass}-subtle text-${item.feaIconClass} rounded-2 fs-2`}>
                                            <FeatherIcon icon={item.feaIcon} className={`text-${item.feaIconClass}`} />
                                        </span>
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden ms-3">
                                        <p className="text-uppercase fw-medium text-muted text-truncate mb-3">{item.label}</p>

                                        {/* Display both total revenue and Contanti revenue inline */}
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="flex-grow-1">
                                                {item.subCounter.map((subItem, subKey) => (
                                                    <span key={subKey} style={{ display: 'inline-block', marginRight: '10px' }}>
                                                        {/* Total or other counter value */}
                                                        {subItem.label === "Contanti" && (
                                                            <span className="text-muted ms-2 me-2" style={{ fontSize: "0.8rem", display: 'inline-block' }}>
                                                                CONTANTI: 
                                                            </span>
                                                        )}
                                                        
                                                        <h4 className="fs-4 mb-0 d-inline-block">
                                                            <span className="counter-value me-1" data-target={subItem.counter}>
                                                                <CountUp
                                                                    start={0}
                                                                    suffix={subItem.suffix}
                                                                    separator={subItem.separator}
                                                                    end={subItem.counter}
                                                                    duration={4}
                                                                    decimals={2} 
                                                                />
                                                            </span>
                                                        </h4>
                                                    </span>
                                                ))}
                                            </div>
                                            <span className={"fs-12 badge bg-" + item.badgeClass + "-subtle text-" + item.badgeClass + ""}>
                                                <i className={"fs-13 align-middle me-1 " + item.icon}></i>{item.percentage}
                                            </span>
                                        </div>

                                        <p className="text-muted text-truncate mb-0">{item.caption}</p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>
        </React.Fragment>
    );
};

export default Widgets;
