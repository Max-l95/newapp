import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Scrollspy from "react-scrollspy";
import {
  Collapse,
  Container,
  NavbarToggler,
  NavLink,
} from "reactstrap";
import LogoDark from "../../../assets/images/logo-dark.png";
import LogoLight from "../../../assets/images/invert-logo.png";
const Navbar = () => {
  const [isOpenMenu, setisOpenMenu] = useState(false);
  const [navClass, setnavClass] = useState("");

  const toggle = () => setisOpenMenu(!isOpenMenu);

  useEffect(() => {
    window.addEventListener("scroll", scrollNavigation, true);
  });

  const scrollNavigation = () => {
    var scrollup = document.documentElement.scrollTop;
    if (scrollup > 50) {
      setnavClass(" is-sticky");
    } else {
      setnavClass("");
    }
  };

  const [activeLink, setActiveLink] = useState();
  useEffect(() => {
    const activation = (event) => {
      const target = event.target;
      if (target) {
        target.classList.add('active');
        setActiveLink(target);
        if (activeLink && activeLink !== target) {
          activeLink.classList.remove('active');
        }
      }
    };
    const defaultLink = document.querySelector('.navbar li.a.active');
    if (defaultLink) {
      defaultLink?.classList.add("active")
      setActiveLink(defaultLink)
    }
    const links = document.querySelectorAll('.navbar a');
    links.forEach((link) => {
      link.addEventListener('click', activation);
    });
    return () => {
      links.forEach((link) => {
        link.removeEventListener('click', activation);
      });
    };
  }, [activeLink]);

  return (
    <React.Fragment>
      <nav
        className={
          "navbar navbar-expand-lg navbar-landing fixed-top job-navbar" +
          navClass
        }
        id="navbar"
      >
        <Container fluid className="custom-container">
          <Link className="navbar-brand" to="/index">
            <img
              src={LogoDark}
              className="card-logo card-logo-dark"
              alt="logo dark"
              height="45"
            />
            <img
              src={LogoLight}
              className="card-logo card-logo-light"
              alt="logo light"
              height="45"
            />
          </Link>
          <NavbarToggler
            onClick={toggle}
            className="navbar-toggler py-0 fs-20 text-body"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <i className="mdi mdi-menu"></i>
          </NavbarToggler>

          <Collapse className="navbar-collapse" id="navbarSupportedContent" isOpen={isOpenMenu}>
            <Scrollspy
              offset={-18}
              items={[
                "hero",
                "process",
                "categories",
                "findJob",
                "candidates",
                "blog",
              ]}
              currentClassName="active"
              className="navbar-nav mx-auto mt-2 mt-lg-0"
              id="navbar-example"
            >
              <li className="nav-item">
                <NavLink className="fs-16" href="#hero">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#process">
                  Chi siamo
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#categories">
                  Prodotti
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#findJob">
                  Software
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#candidates">
                  Partners
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="fs-16" href="#blog">
                  Tickets
                </NavLink>
              </li>
            </Scrollspy>

            <div>
              <Link to="/login" className="btn btn-soft-primary">
                <i className="ri-user-3-line align-bottom me-1"></i> Login &
                Register
              </Link>
            </div>
          </Collapse>
        </Container>
      </nav>
    </React.Fragment>
  );
};

export default Navbar;
