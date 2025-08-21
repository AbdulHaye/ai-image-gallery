import React from 'react';
import {
  Modal,
  Button,
  Badge,
  Row,
  Col,
  Spinner,
  Alert
} from 'react-bootstrap';

const ImageModal = ({ show, onHide, image, onSimilarSearch, onColorSearch }) => {
  if (!image) return null;

  const metadata = image.metadata;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{image.filename}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <img
              src={image.original_path}
              alt={image.filename}
              style={{ width: '100%', height: 'auto' }}
            />
          </Col>
          <Col md={6}>
            <h5>Image Details</h5>
            <p>
              <strong>Uploaded:</strong>{' '}
              {new Date(image.uploaded_at).toLocaleDateString()}
            </p>
            
            {metadata?.ai_processing_status === 'processing' && (
              <Alert variant="info">
                <Spinner animation="border" size="sm" className="me-2" />
                AI analysis in progress...
              </Alert>
            )}
            
            {metadata?.ai_processing_status === 'failed' && (
              <Alert variant="warning">
                AI analysis failed. Please try uploading again.
              </Alert>
            )}
            
            {metadata?.ai_processing_status === 'completed' && (
              <>
                <h6>Description:</h6>
                <p>{metadata.description}</p>
                
                <h6>Tags:</h6>
                <div className="mb-3">
                  {metadata.tags?.map((tag, i) => (
                    <Badge key={i} bg="secondary" className="me-1 mb-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h6>Colors:</h6>
                <div className="color-palette mb-3">
                  {metadata.colors?.map((color, i) => (
                    <div
                      key={i}
                      className="color-swatch large"
                      style={{ backgroundColor: color }}
                      title={color}
                      onClick={() => onColorSearch(color)}
                    />
                  ))}
                </div>
                
                <Button
                  variant="outline-primary"
                  onClick={() => onSimilarSearch(image.id)}
                >
                  Find Similar Images
                </Button>
              </>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button
          variant="primary"
          href={image.original_path}
          target="_blank"
          download
        >
          Download
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageModal;