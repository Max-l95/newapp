//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import { postFakeProfile, postJwtProfile, updatePassword } from "../../../helpers/fakebackend_helper";

// action
import { profileSuccess, profileError, resetProfileFlagChange } from "./reducer";

const fireBaseBackend = getFirebaseBackend();

export const editProfile = (user) => async (dispatch) => {
    try {
        let response;

        if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
            response = fireBaseBackend.editProfileAPI(
                user.username,
                user.idx
            );

        } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
            
            response = postJwtProfile(

                {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    phone_number: user.phone_number,
                    email: user.email,
                    city: user.city,
                    address: user.address,
                    cap: user.cap


                }
            );

        } else if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
            response = postFakeProfile(user);
        }

        const data = await response;

        if (data) {
            dispatch(profileSuccess(data));
        }

    } catch (error) {
        dispatch(profileError(error));
    }
};

export const editPassword = (password) => async (dispatch) => {
    try {

        let response;        
        const obj = JSON.parse(sessionStorage.getItem("authUser"));        
        response = updatePassword(
            {
                email: obj.data.email,
                old_password: password.old_password,
                new_password: password.new_password,
                confirm_password: password.confirm_password
            }

        )
        const data = await response;
        if (data) {
            dispatch(profileSuccess(data))
        }

    } catch(error) {
        dispatch(profileError(error))
    }
}

export const resetProfileFlag = () => {
    try {
        const response = resetProfileFlagChange();
        return response;

    } catch (error) {
        return error;
    }
};