import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { createSelector } from 'reselect';
import { useSelector } from 'react-redux';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";

const ProfileDropdown = () => {


    const profiledropdownData = createSelector(
        (state) => state.Profile,
        (state) => ({
            user: state.user
        })
      );
    // Inside your component
    const {user} = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("Admin");
    const [userRole, setUserRole] = useState("Admin")

    useEffect(() => {
        if (sessionStorage.getItem("authUser")) {
            const obj = JSON.parse(sessionStorage.getItem("authUser"));
            
            setUserName(process.env.REACT_APP_DEFAULTAUTH === "jwt" ? obj.username === undefined ? user.first_name ? user.first_name : obj.data.first_name : "Admin" || "Admin" :
                process.env.REACT_APP_DEFAULTAUTH === "firebase" ? obj.email && obj.email : "Admin"
            );
            setUserRole(process.env.REACT_APP_DEFAULTAUTH === "jwt" ? obj.ruolo === undefined ? user.ruolo ? user.ruolo : obj.data.ruolo : "Admin" || "Admin" :
            process.env.REACT_APP_DEFAULTAUTH === "firebase" ? obj.email && obj.email : "Admin"
        );
        }
    }, [userName, userRole,user]);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="ms-sm-3 header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={avatar1}
                            alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{userName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{userRole}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Benvenuto {userName}!</h6>
                    <DropdownItem className='p-0'>
                        <Link to= "/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Profilo</span>
                        </Link>
                    </DropdownItem> 
                    <DropdownItem className='p-0'>
                        <Link to= "/users" className="dropdown-item">
                            <i
                                className="mdi mdi-account-multiple text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Utenti</span>
                        </Link>
                    </DropdownItem>                   
                    <div className="dropdown-divider"></div>                    
                    
                    <DropdownItem className='p-0'>
                        <Link to= "/logout" className="dropdown-item">
                            <i
                                className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle" data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;