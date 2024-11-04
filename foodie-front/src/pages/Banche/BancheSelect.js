import React, { useState, useEffect } from 'react';
import { APIClient } from '../../helpers/api_helper';
import { Button, Col, Row } from 'reactstrap';
import Select from 'react-select';


const BancheSelect = ({ onCustomerChange, selectedCustomer }) => {
    const apiClient = new APIClient();
    
    // Define state for selected customer
    const [internalSelectedCustomer, setInternalSelectedCustomer] = useState(selectedCustomer || null);
    const [singleOptions, setSingleOptions] = useState([]);

    const fetchDataClienti = async () => {
        try {
            const response = await apiClient.get('/banche');
            if (response && response.data && Array.isArray(response.data)) {
                const transformedData = response.data.map((item) => ({
                    value: item.id,
                    label: item.description,
                    abi: item.ABI,
                    cab: item.CAB,
                    iban: item.IBAN



                }));

                // Add the option with value 0 and label "Nessun Cliente"
                const nessunClienteOption = { value: 0, label: 'Nessun Banca' };

                // Add it to the beginning or end of the options array
                setSingleOptions([nessunClienteOption, ...transformedData]);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchDataClienti();
    }, []);

    useEffect(() => {
        // Sync internal state with props change
        setInternalSelectedCustomer(selectedCustomer);
    }, [selectedCustomer]);

    const handleSelectCliente = (selectedSingle) => {
        setInternalSelectedCustomer(selectedSingle);
        onCustomerChange(selectedSingle); // Call the parent callback
    };

    // Move handleRemoveCliente inside the component
    

    return (
        <div className="input-group">
                                            
            <Select
                value={internalSelectedCustomer}
                onChange={handleSelectCliente}
                placeholder="Seleziona Banca..."
                options={singleOptions}
                className="flex-grow-1"
                styles={{"font-size" : "16px"}}
            />
            </div>
           
    );
};

export default BancheSelect;
