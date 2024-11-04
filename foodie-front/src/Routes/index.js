import React, { Suspense, lazy } from 'react';
import { Routes, Route } from "react-router-dom";

// Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

// Routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import { AuthProtected } from './AuthProtected';

// Lazy load SpecialPage
const OnePage = lazy(() => import("../pages/Landing/OnePage")); // Import the special page

const Index = () => {
    return (
        <React.Fragment>
            <Routes>
                {/* Route for Special Page */}
                <Route
                    path="/papiniwalter/menu"
                    element={
                        <Suspense fallback={<div>Loading landing page...</div>}>
                            <OnePage />
                        </Suspense>
                    }
                />

                {/* Public Routes */}
                {publicRoutes.map((route, idx) => (
                    <Route
                        path={route.path}
                        element={
                            <NonAuthLayout>
                                {route.component}
                            </NonAuthLayout>
                        }
                        key={idx}
                        exact={true}
                    />
                ))}

                {/* Auth Protected Routes */}
                {authProtectedRoutes.map((route, idx) => (
                    <Route
                        path={route.path}
                        element={
                            <AuthProtected>
                                <VerticalLayout>{route.component}</VerticalLayout>
                            </AuthProtected>
                        }
                        key={idx}
                        exact={true}
                    />
                ))}
            </Routes>
        </React.Fragment>
    );
};

export default Index;
