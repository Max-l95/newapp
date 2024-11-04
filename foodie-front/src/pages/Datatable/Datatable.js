import React, { useState } from "react";
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-bs5'; // Bootstrap 5 DataTables integration
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'; // Bootstrap 5 DataTables CSS
import { Card, CardBody, CardHeader, Container, Row, Col } from "reactstrap";

// Apply the Bootstrap-styled DataTable
DataTable.use(DT);

const Datatable = () => {
  const [tableData, setTableData] = useState([
    ['Tiger Nixon', 'System Architect'],
    ['Garrett Winters', 'Accountant'],
    ['Ashton Cox', 'Junior Technical Author'],
    ['Cedric Kelly', 'Senior Javascript Developer'],
  ]);

  return (
    <React.Fragment>
      <div className='page-content'>
        <Container fluid>
          <Row className="justify-content-center">
            <Col xl={12}>
              <Card>
                <CardHeader>
                  <h4 className="card-title mb-0">Employee Table</h4>
                </CardHeader>
                <CardBody>
                  <DataTable 
                    data={tableData} 
                    className="display table table-striped table-bordered table-responsive"
                    options={{
                      paging: true,
                      searching: true,
                      ordering: true,
                    }}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position</th>
                      </tr>
                    </thead>
                  </DataTable>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Datatable;
