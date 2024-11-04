import React, { useEffect, useState } from 'react';

import Home from './home';
import Footer from "./footer";
import { APIClient } from '../../../helpers/api_helper';








const Index = () => {
    document.title = " Menu - Walter Papini | LOUNGE BAR";
    const [dataAzienda, setDataAzienda] = useState(null)

    useEffect(() => {
        fetchDataAzienda();
        
    }, []);
    const apiClient = new APIClient();

const fetchDataAzienda = async () => {
    try {
        const response = await apiClient.getWithoutAuth('/azienda/2');
                
        setDataAzienda(response.data);
        
    } catch (error) {
        console.error('Error fetching data:', error);
    }

} 

    
    window.onscroll = function () {
        scrollFunction();
    };

    const scrollFunction = () => {
        const element = document.getElementById("back-to-top");
        if (element) {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                element.style.display = "block";
            } else {
                element.style.display = "none";
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };
    return (
        <React.Fragment>
            <div className="layout-wrapper landing">                
                <Home />
                
                
                <button onClick={() => toTop()} className="btn btn-danger btn-icon landing-back-top menu-btn-wally" id="back-to-top">
                    <i className="ri-arrow-up-line"></i>
                </button>
                <Footer azienda={dataAzienda} />
            </div>
        </React.Fragment>
    );
};

export default Index;