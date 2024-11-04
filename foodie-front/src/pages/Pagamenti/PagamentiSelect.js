import React, { useState, useEffect } from 'react';
import { APIClient } from '../../helpers/api_helper';

import Select from 'react-select';


const PagamentiSelect = ({ onCustomerChange, selectedCustomer }) => {
    const apiClient = new APIClient();
    
    // Define state for selected customer
    const [internalSelectedCustomer, setInternalSelectedCustomer] = useState(selectedCustomer || null);
    const [singleOptions, setSingleOptions] = useState([]);

    const fetchDataClienti = async () => {
        try {
            const response = await apiClient.get('/pagamenti');
           
            if (response && response.data && Array.isArray(response.data)) {
                const transformedData = response.data.map((item) => ({
                    value: item.id,
                    label: item.description,
                    tipo: item.tipo,
                    rate: item.rate,
                    banca: item.banca,
                    condizioni: item.condizioni




                }));

                // Add the option with value 0 and label "Nessun Cliente"
                const nessunClienteOption = { value: 0, label: 'Nessun Pagamento' };

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
                placeholder="Seleziona Pagamento..."
                options={singleOptions}
                className="flex-grow-1"
                styles={{"font-size" : "16px"}}
            />
            </div>
           
    );
};

export default PagamentiSelect;
