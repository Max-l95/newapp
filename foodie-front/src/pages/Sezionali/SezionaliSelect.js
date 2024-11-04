import { useEffect, useState } from 'react';
import Select from 'react-select'; // Assuming you're using react-select
import { APIClient } from '../../helpers/api_helper';

const SezionaliSelect = ({ onSezionaleChange, selectedSezionale, selectedTipo }) => {
    const apiClient = new APIClient();

    // Define state for selected sezionale and options
    const [internalSelectedSezionale, setInternalSelectedSezionale] = useState(selectedSezionale || null);
    const [sezionaleOptions, setSezionaleOptions] = useState([]);
    const [filteredSezionaleOptions, setFilteredSezionaleOptions] = useState([]);

    const fetchSezionali = async () => {
        try {
            const response = await apiClient.get('/sezionali');
            if (response && response.data && Array.isArray(response.data)) {
                const transformedData = response.data.map((item) => ({
                    value: item.id,
                    label: item.description,
                    number: item.numero, // Custom property
                    documento: item.documento
                }));

                // Store all the options, not filtered yet
                setSezionaleOptions(transformedData);
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchSezionali();
    }, []);

    // Effect to filter options based on selectedTipo
    useEffect(() => {
        if (selectedTipo && selectedTipo.value) {
            // Filter the sezionali based on selectedTipo value
            const filteredOptions = sezionaleOptions.filter(option => option.documento === selectedTipo.value);
            setFilteredSezionaleOptions(filteredOptions);
        } else {
            // If no selectedTipo or it's empty, show all options
            setFilteredSezionaleOptions(sezionaleOptions);
        }
    }, [selectedTipo, sezionaleOptions]);

    useEffect(() => {
        // Sync internal state with props change
        setInternalSelectedSezionale(selectedSezionale);
    }, [selectedSezionale]);

    const handleSelectSezionale = (selectedOption) => {
        setInternalSelectedSezionale(selectedOption);
        onSezionaleChange(selectedOption); // Call the parent callback
    };

    return (
        <Select
            value={internalSelectedSezionale}
            onChange={handleSelectSezionale}
            placeholder="Sezionale..."
            options={filteredSezionaleOptions} // Use the filtered options here
            className="flex-grow-1"
            styles={{ fontSize: "16px" }}
        />
    );
};

export default SezionaliSelect;
