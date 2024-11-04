import PropTypes from "prop-types";
import React from "react";
import { Modal, ModalBody } from "reactstrap";

const SendModal = ({ show, onSendClick, onCloseClick }) => {
  return (
    <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-3 px-5">
        <div className="mt-2 text-center">          
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>Sei sicuro?</h4>
            <p className="text-muted mx-4 mb-0">
              Una volta inviata non sara più possibile modifcare/eliminare la fattura ?
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <button
            type="button"
            className="btn w-sm btn-light"
            data-bs-dismiss="modal"
            onClick={onCloseClick}
          >
            Chiudi
          </button>
          <button
            type="button"
            className="btn w-sm btn-success "
            id="send-record"
            onClick={onSendClick}
          >
            Si, Invia
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
};

SendModal.propTypes = {
  onCloseClick: PropTypes.func,
  onSendClick: PropTypes.func,
  show: PropTypes.any,
};

export default SendModal;