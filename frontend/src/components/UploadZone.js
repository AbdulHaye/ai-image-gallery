import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Modal, ProgressBar, Alert, ListGroup } from 'react-bootstrap';
import { imagesAPI } from '../services/api';

const UploadZone = ({ onUploadStart, onUploadSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setShowModal(true);
    setUploading(true);
    setProgress(0);
    setResults([]);
    setError('');
    
    if (onUploadStart) onUploadStart();

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await imagesAPI.upload(formData);
      setResults(response.data.results);
      setProgress(100);
      
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onUploadStart, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    multiple: true
  });

  return (
    <>
      <div
        {...getRootProps()}
        className="dropzone p-3 border border-dashed rounded text-center"
        style={{ cursor: 'pointer' }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the images here...</p>
        ) : (
          <p>Drag & drop images here, or click to select</p>
        )}
        <Button variant="outline-primary">Upload Images</Button>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Upload Progress</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploading && (
            <>
              <ProgressBar now={progress} label={`${progress}%`} className="mb-3" />
              <p>Uploading and processing images...</p>
            </>
          )}
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {results.length > 0 && (
            <>
              <h6>Upload Results:</h6>
              <ListGroup>
                {results.map((result, index) => (
                  <ListGroup.Item
                    key={index}
                    variant={result.status === 'failed' ? 'danger' : 'success'}
                  >
                    {result.filename} - {result.status}
                    {result.error && `: ${result.error}`}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={uploading}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UploadZone;