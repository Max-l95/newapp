import React, { useState, useEffect, useRef } from "react";
import { Col, Container, Row, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';
import { APIClient } from '../../../helpers/api_helper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWheatAwn, faCheese, faLeaf } from '@fortawesome/free-solid-svg-icons';
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import defaultDemo from "../../../assets/images/brands/01393770522/WP_Nero-Verde_LOUNGEBAR_JPEG.jpg";
import "../../../assets/css/stylesheet.css";

const apiClient = new APIClient();

const Home = () => {
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [customActiveTab, setCustomActiveTab] = useState(null);
    const [filteredData, setFilteredData] = useState([]);
    const [categoryDescriptionAgg, setCategoryDescriptionAgg] = useState(""); // New state for category description_agg

    // Refs for NavLinks
    const navLinkRefs = useRef({});

    // Fetch data
    const fetchData = async () => {
        try {
            const response = await apiClient.getWithoutAuth('/products/2');
            if (response && response.data && Array.isArray(response.data)) {
                setData(response.data);
                console.log(response.data)
                

                // Extract unique categories
                const uniqueCategories = [...new Map(response.data.filter(item => item.category.menu === true).map(item => [item.category.id, item.category])).values()];
                setCategories(uniqueCategories);

                // Set default active category to the first one
                if (uniqueCategories.length > 0) {
                    setCustomActiveTab(uniqueCategories[0].id.toString());
                    setCategoryDescriptionAgg(uniqueCategories[0].description_agg); // Set default description_agg
                }
            } else {
                console.error('Invalid response structure:', response);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Filter products by category when customActiveTab changes
    useEffect(() => {
        if (customActiveTab && data.length > 0) {
            const filtered = data.filter(item => item.category.id.toString() === customActiveTab);
            setFilteredData(filtered);

            // Update category description_agg
            const currentCategory = categories.find(cat => cat.id.toString() === customActiveTab);
            if (currentCategory) {
                setCategoryDescriptionAgg(currentCategory.description_agg);
            }
        }
    }, [customActiveTab, data, categories]);

    // Toggle active tab and scroll clicked NavLink into view
    const toggleCustom = (categoryId) => {
        setCustomActiveTab(categoryId);
    };

    // Scroll into view after customActiveTab updates
    useEffect(() => {
        if (customActiveTab) {
            // Ensure refs are updated and available
            const timer = setTimeout(() => {
                const currentNavLink = navLinkRefs.current[customActiveTab];
                if (currentNavLink && currentNavLink.scrollIntoView) {
                    currentNavLink.scrollIntoView({
                        behavior: 'smooth',
                        inline: 'center',
                        block: 'nearest'
                    });
                } else {
                    console.warn('Scroll target not found or not valid:', currentNavLink);
                }
            }, 100); // Delay to ensure DOM update
            return () => clearTimeout(timer); // Cleanup timer on unmount
        }
    }, [customActiveTab]);

    useEffect(() => {
        fetchData();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };

    return (
        <React.Fragment>
            <section className="section pb-0 logo-section" id="logo" style={{ backgroundColor: "#FFFFFF" }}>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} sm={10}>
                            <div style={{ textAlign: "center", alignContent: "middle" }}>
                                <img src={defaultDemo} className="d-block img-fluid m-auto" alt="..." style={{height: "350px"}} />
                            </div>
                            <h1 className='bd-sans-black text-center mt-5'>
                                MENU'
                            </h1>
                        </Col>
                    </Row>

                    {/* Navbar for Categories */}
                    <Row>
                        <Col>
                            <div
                                style={{
                                    overflowX: 'auto',
                                    whiteSpace: 'nowrap',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                <Nav
                                    tabs
                                    className="menu nav nav-tabs nav-tabs-custom nav-success mb-3 gap-0 bd-sans-black"
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'nowrap',
                                        whiteSpace: 'nowrap',
                                       
                                    }}
                                >
                                    {categories.map((category) => (
                                        <NavItem
                                            key={category.id}
                                            style={{
                                                display: 'inline-block'
                                            }}
                                        >
                                            <div
                                                ref={(el) => {
                                                    if (el) {
                                                        navLinkRefs.current[category.id] = el;
                                                    }
                                                }} // Callback ref assignment
                                            >
                                                <NavLink
                                                    style={{ cursor: 'pointer' }}
                                                    className={classnames({
                                                        active: customActiveTab === category.id.toString(),
                                                    })}
                                                    onClick={() => toggleCustom(category.id.toString())}
                                                >
                                                    {category.description.toUpperCase()}
                                                </NavLink>
                                            </div>
                                        </NavItem>
                                    ))}
                                </Nav>
                            </div>
                        </Col>
                    </Row>

                    {/* Category Description */}
                    <Row className="my-4 bd-sans-black text-center">
                        <Col>
                            <p>{categoryDescriptionAgg.toUpperCase()}</p> {/* Displaying the category description_agg */}
                        </Col>
                    </Row>

                    {/* Product Display */}
                    <Row>
                    {filteredData.map((item) => (
  <Col key={item.id} lg={item.varianti && item.varianti.length > 1 ? 12 : 4} sm={item.varianti && item.varianti.length > 1 ? 12 : 6} className="mb-3">
    <div className="d-flex justify-content-between w-100">
      <div className="w-100">
        <h6 className="my-0 mt-3 bd-sans-black">
          {item.description}
          {item.vegetariano && (
            <span className="ms-2 me-2" title="Vegetariano">
              <FontAwesomeIcon icon={faCheese} style={{ color: 'goldenrod' }} />
            </span>
          )}
          {item.vegano && (
            <span className="ms-2 me-2" title="Vegano">
              <FontAwesomeIcon icon={faLeaf} style={{ color: 'darkgreen' }} />
            </span>
          )}
          {item.celiaco && (
            <span title="Celiaco">
              <FontAwesomeIcon icon={faWheatAwn} style={{ color: 'orange' }} />
            </span>
          )}
        </h6>

        <small className="text-muted bd-sans-black">
          {item.ingredienti && Array.isArray(item.ingredienti)
            ? item.ingredienti.map((ing) => ing.label).join(', ')
            : ''}
        </small>

        {/* Display Variants */}
        <div className="d-flex flex-column">
          {item.category.id > 5 && item.varianti && item.varianti.length > 0 ? (
            item.varianti.map((variant, index) => (
              <div key={index} className="text-muted bd-sans-black d-flex flex-row justify-content-between fs-6">
                <div>{variant.label}</div>
                <div>{variant.prezzo && variant.prezzo.prezzo ? formatPrice(variant.prezzo.prezzo) : variant.prezzo ? formatPrice(variant.prezzo) : ""}</div>
              </div>
            ))
          ) : null}
        </div>
      </div>

     {/* Display price if no variants exist (empty or non-existent array, or no price in first variant) */}
{(!item.varianti || item.varianti.length === 0 || !item.varianti[0].prezzo) && (
  <h6 className="text-muted mt-3 bd-sans-black">{formatPrice(item.price)}</h6>
)}

    </div>
  </Col>
))}



                    </Row>
                    <Row className="mt-5 border-top"> 
                        <ul className="d-flex bd-sans-black list-unstyled mt-2">
                            <li><FontAwesomeIcon icon={faCheese} style={{ color: 'goldenrod' }} /> {/* Vegetarian icon */}<small className="me-2">Vegetariano</small></li>
                            <li><FontAwesomeIcon icon={faLeaf} style={{ color: 'darkgreen' }} /> {/* Vegan icon */}<small className="me-2">Vegano</small></li>
                            <li><FontAwesomeIcon icon={faWheatAwn} style={{ color: 'orange' }} /> {/* Gluten-Free (Celiaco) icon */}<small className="me-1">GlutenFree</small></li>
                        </ul>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Home;
