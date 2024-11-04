import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Modal, ModalBody } from "reactstrap";

const RenderModal = ({ show, xmlString, xsl, onCloseClick }) => {
  const [transformedHtml, setTransformedHtml] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (show && xmlString && xsl) {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, "text/xml");
        const xslt = parser.parseFromString(xsl, "application/xml");

        const xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslt);

        const resultDocument = xsltProcessor.transformToFragment(xml, document);
        const serializer = new XMLSerializer();
        const htmlString = serializer.serializeToString(resultDocument);
        
        setTransformedHtml(htmlString);
      } catch (error) {
        console.error("Failed to transform XML:", error);
      }
    } else {
      setTransformedHtml(null); // Clear content if inputs are not available
    }
  }, [show, xmlString, xsl]);

  useEffect(() => {
    if (iframeRef.current && transformedHtml !== null) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(transformedHtml);
        iframeDoc.close();
      }
    }
  }, [transformedHtml]);

  return (
    <Modal
      size={"xl"}
      fade={true}
      isOpen={show}
      toggle={onCloseClick}
      centered={true}
    >
      <ModalBody className="py-3 px-5 ">
        <div className="mt-2 text-center">
          <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
            <h4>Anteprima Fattura</h4>
            <div className="text-muted mx-4 mb-0 ">
              {/* Render the transformed HTML inside the iframe */}
              <iframe
                ref={iframeRef}
                style={{ width: "100%", height: "650px", border: "none" }}
                title="Preview"
              />
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
          <button
            type="button"
            className="btn w-sm btn-light"
            onClick={onCloseClick}
          >
            Chiudi
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
};

RenderModal.propTypes = {
  show: PropTypes.bool.isRequired,
  xmlString: PropTypes.string,
  xsl: PropTypes.string,
  onCloseClick: PropTypes.func.isRequired,
};

export default RenderModal;
