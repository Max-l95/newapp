import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Table, Label } from "reactstrap";
import Flatpickr from "react-flatpickr";
import { APIClient } from '../../helpers/api_helper';
import { Link } from 'react-router-dom';

const HrmRecords = () => {
    const apiClient = new APIClient();

    const [records, setRecords] = useState([]);
    const [dateRange, setDateRange] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [shouldFetchData, setShouldFetchData] = useState(true);

    const fetchHrmRecords = useCallback(async (startDate, endDate, page) => {
        try {
            const response = await apiClient.get("/api/hrm/records", {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    page: page,
                    limit: recordsPerPage
                }
            });
            if (response && response.payload && response.payload.list) {
                setRecords(response.payload.list);
                setTotalRecords(response.payload.count);
            }
        } catch (error) {
            console.error("Error fetching Records:", error);
        }
    }, [apiClient, recordsPerPage]);

    useEffect(() => {
        if (shouldFetchData) {
            const [startDate, endDate] = dateRange;
            fetchHrmRecords(startDate, endDate, currentPage);
            setShouldFetchData(false);
        }
    }, [shouldFetchData, dateRange, currentPage, fetchHrmRecords]);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => {
                setShouldFetchData(true);
                return prevPage - 1;
            });
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => {
                setShouldFetchData(true);
                return prevPage + 1;
            });
        }
    };

    const handleDateChange = (selectedDates) => {
        const formatDate = (date) => {
            const offset = date.getTimezoneOffset();
            const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
            return adjustedDate.toISOString().split('T')[0];
        };
        setDateRange([
            selectedDates[0] ? formatDate(selectedDates[0]) : null,
            selectedDates[1] ? formatDate(selectedDates[1]) : null
        ]);
        setShouldFetchData(true);
    };

    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    const renderPagination = () => {
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        return (
            <ul className="pagination listjs-pagination d-flex align-items-center">
                <li className={`page-item pagination-prev ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Link to="#" onClick={handlePrevPage}>
                        Indietro
                    </Link>
                </li>
                {Array.from({ length: (endPage - startPage + 1) }, (_, i) => (
                    <li key={startPage + i} className={`page-item ${currentPage === startPage + i ? 'active' : ''}`}>
                        <Link className="page-link" to="#" onClick={() => {
                            setCurrentPage(startPage + i);
                            setShouldFetchData(true);
                        }}>
                            {startPage + i}
                        </Link>
                    </li>
                ))}
                <li className={`page-item pagination-next ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <Link to="#" onClick={handleNextPage}>
                        Avanti
                    </Link>
                </li>
            </ul>
        );
    };

    const tog_list = () => setmodal_list(!modal_list);
    const [modal_list, setmodal_list] = useState(false);

    const tog_delete = () => setmodal_delete(!modal_delete);
    const [modal_delete, setmodal_delete] = useState(false);

    document.title = "Presenze | DgnsDesk";

    return (
        <React.Fragment>
            <div className='page-content'>
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <h4 className='card-title mb-0'>Presenze</h4>
                                </CardHeader>
                                <CardBody>
                                    <div className='listjs-table' id="hrmList">
                                        <Row className='g-4 mb-3'>
                                            <Col className='col-sm-auto'>
                                                <div>
                                                    <Button color="success" className="add-btn me-1" onClick={tog_list} id="create-btn">
                                                        <i className="ri-add-line align-bottom me-1"></i> Aggiungi
                                                    </Button>
                                                    <Button className="btn btn-soft-danger">
                                                        <i className="ri-delete-bin-2-line"></i>
                                                    </Button>
                                                </div>
                                            </Col>
                                            <Col>
                                                <div>
                                                    <Flatpickr
                                                        className="form-control"
                                                        options={{
                                                            mode: "range",
                                                            dateFormat: "Y-m-d",
                                                            placeholder: "Inserisci intervallo date"
                                                        }}
                                                        onChange={handleDateChange}
                                                    />
                                                </div>
                                            </Col>
                                            <Col className="col-sm">
                                                <div className="d-flex justify-content-sm-end">
                                                    <div className="search-box ms-2">
                                                        <input type="text" className="form-control search" placeholder="Search..." />
                                                        <i className="ri-search-line search-icon"></i>
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                        <div className="table-responsive table-card mt-3 mb-1">
                                            <Table className="table align-middle table-nowrap" id="hrmRecordTable">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Nome</th>
                                                        <th>Dipartimento</th>
                                                        <th>Check Time</th>
                                                        <th>Check Type</th>
                                                        <th>Dispositivo</th>
                                                        <th>Azioni</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {records.length > 0 ? records.map((record, index) => (
                                                        <tr key={record.uuid}>
                                                            <td>{index + 1 + (currentPage - 1) * recordsPerPage}</td>
                                                            <td>{`${record.employee.first_name} ${record.employee.last_name}`}</td>
                                                            <td>{record.employee.department}</td>
                                                            <td>{new Date(record.checktime).toLocaleString()}</td>
                                                            <td>{record.checktype === 1 ? 'Check In' : 'Check Out'}</td>
                                                            <td>{record.device.name}</td>
                                                            <td>
                                                                <Button color="primary" size="sm" onClick={tog_list}>Edit</Button>{' '}
                                                                <Button color="danger" size="sm" onClick={tog_delete}>Delete</Button>
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="7" className="text-center">No records found</td></tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                        <div className="d-flex justify-content-end">
                                            <div className="pagination-wrap hstack gap-2">
                                                {renderPagination()}
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default HrmRecords;
