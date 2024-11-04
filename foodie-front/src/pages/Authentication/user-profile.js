import React, { useState, useEffect } from "react";
import { isEmpty } from "lodash";
import { Row, Col, Button, Label, Input, FormFeedback, Form } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { APIClient } from "../../helpers/api_helper"; // Import APIClient
import { resetProfileFlag, editProfile } from "../../slices/thunks";

const UserProfile = () => {
  const dispatch = useDispatch();
  const apiClient = new APIClient(); // Create an instance of APIClient

  // Fetch user profile data function
  const fetchUserProfileData = async () => {
    try {
      const response = await apiClient.get("/user/profile"); // Use APIClient to fetch data
      return response;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Initial form values state
  const [formInitialValues, setFormInitialValues] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    city: "",
    address: "",
    cap: "",
  });

  // Selecting state from Redux store
  const selectLayoutState = (state) => state.Profile;
  const userprofileData = createSelector(
    selectLayoutState,
    (state) => ({
      user: state.user,
      success: state.success,
      error: state.error,
    })
  );

  const { user, success, error } = useSelector(userprofileData);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const userData = await fetchUserProfileData();
      if (userData && userData.success) {
        // Ensure the data structure matches form fields
        const user = userData.user;
        setFormInitialValues({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          phone_number: user.phone_number || "",
          email: user.email || "",
          city: user.city || "",
          address: user.address || "",
          cap: user.cap || "",
        });
      }
    };
    fetchData();
  }, []);

  // Update form values when user state changes
  useEffect(() => {
    if (sessionStorage.getItem("authUser")) {
      const obj = JSON.parse(sessionStorage.getItem("authUser"));

      if (!isEmpty(user)) {
        obj.data.first_name = user.first_name;
        sessionStorage.removeItem("authUser");
        sessionStorage.setItem("authUser", JSON.stringify(obj));
      }

      setFormInitialValues((prevValues) => ({
        ...prevValues,
        first_name: obj.data.first_name,
        last_name: obj.data.last_name,
        phone_number: obj.data.phone_number,
        address: obj.data.address,
        email: obj.data.email,
        cap: obj.data.cap,
        city: obj.data.city,
        idx: obj.data._id || "1",
      }));

      setTimeout(() => {
        dispatch(resetProfileFlag());
      }, 3000);
    }
  }, [dispatch, user]);

  // Form validation schema
  const validationSchema = Yup.object({
    first_name: Yup.string().required("Please Enter Your Username"),
    last_name: Yup.string().required("Please Enter Your Last Name"),
    phone_number: Yup.string().required("Please Enter Your Phone Number"),
    email: Yup.string().email("Invalid email address").required("Required"),
    city: Yup.string().required("Please Enter Your City"),
    address: Yup.string().required("Please Enter Your address"),
    cap: Yup.string().required("Please Enter Your Zip Code"),
  });

  // Form submission handler
  const onSubmit = (values) => {
    dispatch(editProfile(values));
  };

  // Formik form instance
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: formInitialValues,
    validationSchema,
    onSubmit,
  });
  return (
    <React.Fragment>
      <Form
                className="form-horizontal"
                onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}
              >
                <Row>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label htmlFor="firstnameInput" className="form-label">
                        Nome
                      </Label>
                      <Input
                        id="firstnameInput"
                        type="text"
                        className="form-control"
                        placeholder="Enter First Name"
                        name="first_name"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.first_name}
                        invalid={
                          formik.touched.first_name &&
                          formik.errors.first_name
                        }
                      />
                      {formik.touched.first_name &&
                      formik.errors.first_name ? (
                        <FormFeedback type="invalid">
                          {formik.errors.first_name}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label htmlFor="lastnameInput" className="form-label">
                        Cognome
                      </Label>
                      <Input
                        id="lastnameInput"
                        type="text"
                        className="form-control"
                        placeholder="Enter Last Name"
                        name="last_name"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.last_name}
                        invalid={
                          formik.touched.last_name &&
                          formik.errors.last_name
                        }
                      />
                      {formik.touched.last_name &&
                      formik.errors.last_name ? (
                        <FormFeedback type="invalid">
                          {formik.errors.last_name}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label htmlFor="phonenumberInput" className="form-label">
                        Numero di Telefono
                      </Label>
                      <Input
                        id="phonenumberInput"
                        type="text"
                        className="form-control"
                        placeholder="Enter Phone Number"
                        name="phone_number"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.phone_number}
                        invalid={
                          formik.touched.phone_number &&
                          formik.errors.phone_number
                        }
                      />
                      {formik.touched.phone_number &&
                      formik.errors.phone_number ? (
                        <FormFeedback type="invalid">
                          {formik.errors.phone_number}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col lg={6}>
                    <div className="mb-3">
                      <Label htmlFor="emailInput" className="form-label">
                        Indirizzo Email
                      </Label>
                      <Input
                        id="emailInput"
                        type="email"
                        className="form-control"
                        placeholder="inserisci Indirizzo Email"
                        name="email"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.email}
                        invalid={
                          formik.touched.email && formik.errors.email
                        }
                      />
                      {formik.touched.email && formik.errors.email ? (
                        <FormFeedback type="invalid">
                          {formik.errors.email}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col lg={4}>
                    <div className="mb-3">
                      <Label htmlFor="addressInput" className="form-label">
                        Indirizzo
                      </Label>
                      <Input
                        id="addressInput"
                        type="text"
                        className="form-control"
                        placeholder="Enter address"
                        name="address"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.address}
                        invalid={
                          formik.touched.address && formik.errors.address
                        }
                      />
                      {formik.touched.address && formik.errors.address ? (
                        <FormFeedback type="invalid">
                          {formik.errors.address}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  <Col lg={4}>
                    <div className="mb-3">
                      <Label htmlFor="cityInput" className="form-label">
                        Comune
                      </Label>
                      <Input
                        id="cityInput"
                        type="text"
                        className="form-control"
                        placeholder="Enter City"
                        name="city"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.city}
                        invalid={formik.touched.city && formik.errors.city}
                      />
                      {formik.touched.city && formik.errors.city ? (
                        <FormFeedback type="invalid">
                          {formik.errors.city}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>                 
                  <Col lg={4}>
                    <div className="mb-3">
                      <Label htmlFor="capInput" className="form-label">
                        Cap
                      </Label>
                      <Input
                        id="capInput"
                        type="text"
                        className="form-control"
                        placeholder="Inserisci Cap"
                        name="cap"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.cap}
                        invalid={
                          formik.touched.cap && formik.errors.cap
                        }
                      />
                      {formik.touched.cap && formik.errors.cap ? (
                        <FormFeedback type="invalid">
                          {formik.errors.cap}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                  
                  <Col lg={12}>
                    <div className="hstack gap-2 justify-content-end">
                      <Button type="submit" className="btn btn-primary">
                        Update Profile
                      </Button>
                      <Button type="button" className="btn btn-soft-success">
                        Cancel
                      </Button>
                    </div>
                  </Col>
                </Row>
      </Form>            
    </React.Fragment>
  );
};

export default UserProfile;

