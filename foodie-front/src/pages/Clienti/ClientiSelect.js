import React, { useState, useEffect } from 'react';
import { APIClient } from '../../helpers/api_helper';
import { Button } from 'reactstrap';
import Select from 'react-select';

const ClientiSelect = ({ onCustomerChange, selectedCustomer }) => {
    const apiClient = new APIClient();
    
    // Define state for selected customer
    const [internalSelectedCustomer, setInternalSelectedCustomer] = useState(selectedCustomer || null);
    const [singleOptions, setSingleOptions] = useState([]);

    const fetchDataClienti = async () => {
        try {
            const response = await apiClient.get('/clienti');
            if (response && response.data && Array.isArray(response.data)) {
                const transformedData = response.data.map((item) => ({
                    value: item.id,
                    label: item.denominazione
                        ? item.denominazione
                        : `${item.cognome} ${item.nome}`,
                    nome: item.nome,
                    cognome: item.cognome,
                    partitaiva: item.partitaiva,
                    codicefiscale: item.codicefiscale,
                    indirizzo: item.indirizzo,
                    cap: item.cap,
                    civico: item.civico,
                    comune: item.comune,
                    provincia: item.provincia,
                    nazione: item.nazione,
                    SDI: item.SDI,
                    pec: item.pec,
                    generico: item.generico
                }));

                // Add the option with value 0 and label "Nessun Cliente"
                const nessunClienteOption = { value: 0, label: 'Nessun Cliente' };
                const optionsWithNessunCliente = [nessunClienteOption, ...transformedData];

                setSingleOptions(optionsWithNessunCliente);

                // Check for the customer with generico: true
                const defaultGenericoCustomer = transformedData.find(customer => customer.generico === true);

                // Set the customer with generico: true as the default if no selectedCustomer is passed
                if (!selectedCustomer && defaultGenericoCustomer) {
                    setInternalSelectedCustomer(defaultGenericoCustomer);
                    onCustomerChange(defaultGenericoCustomer); // Update the parent component with default selection
                }
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

    const handleRemoveCliente = () => {
        const nessunClienteOption = { value: 0, label: 'Nessun Cliente' };
        setInternalSelectedCustomer(nessunClienteOption);
        onCustomerChange(nessunClienteOption); // Update parent with the "Nessun Cliente" selection
    };

    return (
        <div className="input-group">
            <Button className="btn btn-soft-warning" onClick={handleRemoveCliente}>
                <i className="ri-delete-bin-2-line"></i>
            </Button>
            <Select
                value={internalSelectedCustomer}
                onChange={handleSelectCliente}
                placeholder="Seleziona Cliente..."
                options={singleOptions}
                className="flex-grow-1"
                styles={{"font-size" : "16px"}}
            />
        </div>
    );
};

export default ClientiSelect;
