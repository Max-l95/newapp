import React, { useEffect } from "react";
import { Row, Col, CardBody, Card, Alert, Container, Input, Label, Form, FormFeedback } from "reactstrap";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// redux
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

// Import images 
import logoLight from "../../assets/images/logo-light.png";
import ParticlesAuth from "../AuthenticationInner/ParticlesAuth";
import { registerUser, apiError, resetRegisterFlag } from "../../slices/thunks";
import { createSelector } from "reselect";

const Register = () => {
    const history = useNavigate();
    const dispatch = useDispatch();

    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            email: '',
            first_name: '',
            last_name: '',
            phone_number: '',
            city: '',
            address: '',
            cap: '',
            id_azienda: '',
            id_ruolo: '',
            password: '',
            confirm_password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string().required("Please enter your email"),
            first_name: Yup.string().required("Please enter your first name"),
            last_name: Yup.string().required("Please enter your last name"),
            phone_number: Yup.string().required("Please enter your phone number"),
            city: Yup.string().required("Please enter your city"),
            address: Yup.string().required("Please enter your address"),
            cap: Yup.string().required("Please enter your CAP"),
            id_azienda: Yup.string().required("Please select a company"),
            id_ruolo: Yup.string().required("Please select a role"),
            password: Yup.string().required("Please enter your password"),
            confirm_password: Yup.string()
                .oneOf([Yup.ref("password")], "Passwords do not match")
                .required("Please confirm your password"),
        }),
        onSubmit: (values) => {
            // Call the register endpoint
            fetch('http://localhost:5000/post-jwt-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(values)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.token) {
                        toast.success("Registration successful! Redirecting to login...");
                        setTimeout(() => history("/login"), 3000);
                    } else {
                        toast.error(data.message || "Registration failed!");
                    }
                })
                .catch(error => {
                    toast.error("Registration failed! Please try again.");
                });
        }
    });

    const selectLayoutState = (state) => state.Account;
    const registerdatatype = createSelector(
        selectLayoutState,
        (account) => ({
            success: account.success,
            error: account.error
        })
    );

    const { error, success } = useSelector(registerdatatype);

    useEffect(() => {
        dispatch(apiError(""));
    }, [dispatch]);

    useEffect(() => {
        if (success) {
            setTimeout(() => history("/login"), 3000);
        }
        setTimeout(() => {
            dispatch(resetRegisterFlag());
        }, 3000);
    }, [dispatch, success, error, history]);

    document.title = "Basic SignUp | Velzon - React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <ParticlesAuth>
                <div className="auth-page-content mt-lg-5">
                    <Container>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mt-sm-5 mb-4 text-white-50">
                                    <div>
                                        <Link to="/" className="d-inline-block auth-logo">
                                            <img src={logoLight} alt="" height="20" />
                                        </Link>
                                    </div>
                                    <p className="mt-3 fs-15 fw-medium">Premium Admin & Dashboard Template</p>
                                </div>
                            </Col>
                        </Row>

                        <Row className="justify-content-center">
                            <Col md={8} lg={6} xl={5}>
                                <Card className="mt-4">
                                    <CardBody className="p-4">
                                        <div className="text-center mt-2">
                                            <h5 className="text-primary">Create New Account</h5>
                                            <p className="text-muted">Get your free Velzon account now</p>
                                        </div>
                                        <div className="p-2 mt-4">
                                            <Form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    validation.handleSubmit();
                                                    return false;
                                                }}
                                                className="needs-validation" action="#">

                                                {success && success ? (
                                                    <>
                                                        {toast("Your Redirect To Login Page...", { position: "top-right", hideProgressBar: false, className: 'bg-success text-white', progress: undefined, toastId: "" })}
                                                        <ToastContainer autoClose={2000} limit={1} />
                                                        <Alert color="success">
                                                            Register User Successfully and Your Redirect To Login Page...
                                                        </Alert>
                                                    </>
                                                ) : null}

                                                {error && error ? (
                                                    <Alert color="danger"><div>
                                                        Email has been registered before, please use another email address.</div></Alert>
                                                ) : null}

                                                <div className="mb-3">
                                                    <Label htmlFor="useremail" className="form-label">Email <span className="text-danger">*</span></Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        className="form-control"
                                                        placeholder="Enter email address"
                                                        type="email"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.email || ""}
                                                        invalid={
                                                            validation.touched.email && validation.errors.email ? true : false
                                                        }
                                                    />
                                                    {validation.touched.email && validation.errors.email ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.email}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="firstname" className="form-label">First Name <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="first_name"
                                                        type="text"
                                                        placeholder="Enter first name"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.first_name || ""}
                                                        invalid={
                                                            validation.touched.first_name && validation.errors.first_name ? true : false
                                                        }
                                                    />
                                                    {validation.touched.first_name && validation.errors.first_name ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.first_name}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="lastname" className="form-label">Last Name <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="last_name"
                                                        type="text"
                                                        placeholder="Enter last name"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.last_name || ""}
                                                        invalid={
                                                            validation.touched.last_name && validation.errors.last_name ? true : false
                                                        }
                                                    />
                                                    {validation.touched.last_name && validation.errors.last_name ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.last_name}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="phonenumber" className="form-label">Phone Number <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="phone_number"
                                                        type="text"
                                                        placeholder="Enter phone number"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.phone_number || ""}
                                                        invalid={
                                                            validation.touched.phone_number && validation.errors.phone_number ? true : false
                                                        }
                                                    />
                                                    {validation.touched.phone_number && validation.errors.phone_number ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.phone_number}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="city" className="form-label">City <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="city"
                                                        type="text"
                                                        placeholder="Enter city"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.city || ""}
                                                        invalid={
                                                            validation.touched.city && validation.errors.city ? true : false
                                                        }
                                                    />
                                                    {validation.touched.city && validation.errors.city ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.city}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="address" className="form-label">Address <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="address"
                                                        type="text"
                                                        placeholder="Enter address"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.address || ""}
                                                        invalid={
                                                            validation.touched.address && validation.errors.address ? true : false
                                                        }
                                                    />
                                                    {validation.touched.address && validation.errors.address ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.address}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="cap" className="form-label">CAP <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="cap"
                                                        type="text"
                                                        placeholder="Enter CAP"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.cap || ""}
                                                        invalid={
                                                            validation.touched.cap && validation.errors.cap ? true : false
                                                        }
                                                    />
                                                    {validation.touched.cap && validation.errors.cap ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.cap}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="company" className="form-label">Company <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="id_azienda"
                                                        type="text"
                                                        placeholder="Enter company ID"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.id_azienda || ""}
                                                        invalid={
                                                            validation.touched.id_azienda && validation.errors.id_azienda ? true : false
                                                        }
                                                    />
                                                    {validation.touched.id_azienda && validation.errors.id_azienda ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.id_azienda}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="role" className="form-label">Role <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="id_ruolo"
                                                        type="text"
                                                        placeholder="Enter role ID"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.id_ruolo || ""}
                                                        invalid={
                                                            validation.touched.id_ruolo && validation.errors.id_ruolo ? true : false
                                                        }
                                                    />
                                                    {validation.touched.id_ruolo && validation.errors.id_ruolo ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.id_ruolo}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-3">
                                                    <Label htmlFor="userpassword" className="form-label">Password <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="password"
                                                        type="password"
                                                        placeholder="Enter password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.password || ""}
                                                        invalid={
                                                            validation.touched.password && validation.errors.password ? true : false
                                                        }
                                                    />
                                                    {validation.touched.password && validation.errors.password ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.password}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-2">
                                                    <Label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="text-danger">*</span></Label>
                                                    <Input
                                                        name="confirm_password"
                                                        type="password"
                                                        placeholder="Confirm password"
                                                        onChange={validation.handleChange}
                                                        onBlur={validation.handleBlur}
                                                        value={validation.values.confirm_password || ""}
                                                        invalid={
                                                            validation.touched.confirm_password && validation.errors.confirm_password ? true : false
                                                        }
                                                    />
                                                    {validation.touched.confirm_password && validation.errors.confirm_password ? (
                                                        <FormFeedback type="invalid"><div>{validation.errors.confirm_password}</div></FormFeedback>
                                                    ) : null}
                                                </div>

                                                <div className="mb-4">
                                                    <p className="mb-0 fs-12 text-muted fst-italic">By registering you agree to the Velzon
                                                        <Link to="#" className="text-primary text-decoration-underline fst-normal fw-medium">Terms of Use</Link></p>
                                                </div>

                                                <div className="mt-4">
                                                    <button className="btn btn-success w-100" type="submit">Sign Up</button>
                                                </div>

                                                <div className="mt-4 text-center">
                                                    <div className="signin-other-title">
                                                        <h5 className="fs-13 mb-4 title text-muted">Create account with</h5>
                                                    </div>

                                                    <div>
                                                        <button type="button" className="btn btn-primary btn-icon waves-effect waves-light"><i className="ri-facebook-fill fs-16"></i></button>{" "}
                                                        <button type="button" className="btn btn-danger btn-icon waves-effect waves-light"><i className="ri-google-fill fs-16"></i></button>{" "}
                                                        <button type="button" className="btn btn-dark btn-icon waves-effect waves-light"><i className="ri-github-fill fs-16"></i></button>{" "}
                                                        <button type="button" className="btn btn-info btn-icon waves-effect waves-light"><i className="ri-twitter-fill fs-16"></i></button>
                                                    </div>
                                                </div>
                                            </Form>
                                        </div>
                                    </CardBody>
                                </Card>
                                <div className="mt-4 text-center">
                                    <p className="mb-0">Already have an account? <Link to="/login" className="fw-semibold text-primary text-decoration-underline"> Sign in </Link> </p>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </ParticlesAuth>
        </React.Fragment>
    );
};

export default Register;
