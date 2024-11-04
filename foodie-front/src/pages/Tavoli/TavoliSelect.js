import React, { useState, useEffect } from 'react';
import { APIClient } from '../../helpers/api_helper';
import { Button } from 'reactstrap';
import Select from 'react-select';

const TavoliSelect = ({ onTableChange, selectedTable }) => {
    const apiClient = new APIClient();
    
    // Define state for selected customer
    const [internalSelectedTable, setInternalSelectedTable] = useState(selectedTable || null);
    const [singleOptions, setSingleOptions] = useState([]);

    const fetchDataTavoli = async () => {
        try {
            const response = await apiClient.get('/tavoli');
            if (response && response.data && Array.isArray(response.data)) {
               
                
                // Filter out the item with id 0 before transforming the data
                const filteredData = response.data.filter(item => item.id !== 0);
    
                const transformedData = filteredData.map((item) => ({
                    value: item.id,
                    label: "Tavolo " + item.number
                }));
    
                // Add the option with value 0 and label "Nessun Cliente"
                const nessunTavoloOption = { value: 0, label: 'Nessun Tavolo' };
    
                // Add it to the beginning or end of the options array
                setSingleOptions([nessunTavoloOption, ...transformedData]);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    useEffect(() => {
        fetchDataTavoli();
    }, []);
    
    useEffect(() => {
        // Sync internal state with props change
        setInternalSelectedTable(selectedTable);
    }, [selectedTable]);

    const handleSelectTable = (selectedSingle) => {
        setInternalSelectedTable(selectedSingle);
        onTableChange(selectedSingle); // Call the parent callback
    };

    // Move handleRemoveCliente inside the component
    const handleRemoveTable = () => {
        const nessunTavoloOption = { value: 0, label: 'Nessun Tavolo' };
        setInternalSelectedTable(nessunTavoloOption);
        onTableChange(nessunTavoloOption); // Update parent with the "Nessun Cliente" selection
    };

    return (
        <div className="input-group">
            <Button className="btn btn-soft-warning" onClick={handleRemoveTable}><i className="ri-delete-bin-2-line"></i></Button>                                      
            <Select
                value={internalSelectedTable}
                onChange={handleSelectTable}
                placeholder="Seleziona Tavolo..."
                options={singleOptions}
                className="flex-grow-1"
            />
            </div>
           
    );
};

export default TavoliSelect;
