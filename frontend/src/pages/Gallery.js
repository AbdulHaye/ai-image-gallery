import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  InputGroup,
  Pagination,
  Badge,
  Alert,
  Spinner
} from 'react-bootstrap';
import { useDropzone } from 'react-dropzone';
import { imagesAPI, searchAPI } from '../services/api';
import ImageModal from '../components/ImageModal';
import UploadZone from '../components/UploadZone';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchImages();
  }, [currentPage, searchQuery]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      let response;
      
      if (searchQuery) {
        response = await searchAPI.text(searchQuery, currentPage, limit);
      } else {
        response = await imagesAPI.getAll(currentPage, limit);
      }
      
      // Process the images to handle the metadata array structure
      const processedImages = response.data.images.map(image => {
        // image_metadata is an array, so we need to get the first item
        const metadata = image.image_metadata && image.image_metadata.length > 0 
          ? image.image_metadata[0] 
          : null;
        
        return {
          ...image,
          metadata // Add a flat metadata property for easier access
        };
      });
      
      setImages(processedImages);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      setError('Failed to load images');
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchImages();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  const handleUploadSuccess = () => {
    setUploading(false);
    setCurrentPage(1);
    fetchImages();
  };

  const handleUploadStart = () => {
    setUploading(true);
  };

  const handleColorSearch = async (color) => {
    try {
      setLoading(true);
      const response = await searchAPI.color(color, 1, limit);
      
      // Process the images for consistent structure
      const processedImages = response.data.images.map(image => {
        const metadata = image.image_metadata && image.image_metadata.length > 0 
          ? image.image_metadata[0] 
          : null;
        
        return {
          ...image,
          metadata
        };
      });
      
      setImages(processedImages);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(1);
      setSearchQuery('');
    } catch (error) {
      setError('Failed to search by color');
      console.error('Error searching by color:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimilarSearch = async (imageId) => {
    try {
      setLoading(true);
      const response = await searchAPI.similar(imageId, 1, limit);
      
      // Process the images for consistent structure
      const processedImages = response.data.images.map(image => {
        const metadata = image.image_metadata && image.image_metadata.length > 0 
          ? image.image_metadata[0] 
          : null;
        
        return {
          ...image,
          metadata
        };
      });
      
      setImages(processedImages);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(1);
      setSearchQuery('');
    } catch (error) {
      setError('Failed to find similar images');
      console.error('Error finding similar images:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        />
        {items}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        />
      </Pagination>
    );
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>My Image Gallery</h1>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <Form onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search by tags or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="primary" type="submit">
                Search
              </Button>
              {searchQuery && (
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </InputGroup>
          </Form>
        </Col>
        <Col md={4} className="text-end">
          <UploadZone
            onUploadStart={handleUploadStart}
            onUploadSuccess={handleUploadSuccess}
          />
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {uploading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Uploading...</span>
          </Spinner>
          <p>Uploading and processing images...</p>
        </div>
      )}

      {loading ? (
        <Row>
          {[...Array(8)].map((_, i) => (
            <Col key={i} xs={6} sm={4} md={3} className="mb-4">
              <Card className="h-100">
                <div className="placeholder-glow">
                  <Card.Img
                    variant="top"
                    style={{ height: '200px', objectFit: 'cover' }}
                    className="placeholder"
                  />
                  <Card.Body>
                    <div className="placeholder col-7"></div>
                    <div className="placeholder col-4"></div>
                    <div className="placeholder col-6"></div>
                  </Card.Body>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : images.length === 0 ? (
        <div className="text-center my-5">
          <h4>No images found</h4>
          <p>
            {searchQuery
              ? 'Try a different search term'
              : 'Upload some images to get started'}
          </p>
        </div>
      ) : (
        <>
          <Row>
            {images.map((image) => (
              <Col key={image.id} xs={6} sm={4} md={3} className="mb-4">
                <Card className="h-100 image-card">
                  <div
                    className="image-container"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleImageClick(image)}
                  >
                    <Card.Img
                      variant="top"
                      src={image.thumbnail_path}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    {image.metadata?.ai_processing_status === 'processing' && (
                      <div className="image-overlay">
                        <Spinner animation="border" variant="light" />
                      </div>
                    )}
                  </div>
                  <Card.Body>
                    <Card.Title className="text-truncate">
                      {image.filename}
                    </Card.Title>
                    {image.metadata?.ai_processing_status === 'completed' && (
                      <>
                        <div className="mb-2">
                          {image.metadata.tags?.slice(0, 10).map((tag, i) => (
                            <Badge key={i} bg="secondary" className="me-1">
                              {tag}
                            </Badge>
                          ))}
                          {image.metadata.tags?.length > 10 && (
                            <Badge bg="light" text="dark">
                              +{image.metadata.tags.length - 10}
                            </Badge>
                          )}
                        </div>
                        <div className="color-palette">
                          {image.metadata.colors?.map((color, i) => (
                            <div
                              key={i}
                              className="color-swatch"
                              style={{ backgroundColor: color }}
                              title={color}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColorSearch(color);
                              }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {renderPagination()}
        </>
      )}

      <ImageModal
        show={showModal}
        onHide={() => setShowModal(false)}
        image={selectedImage}
        onSimilarSearch={handleSimilarSearch}
        onColorSearch={handleColorSearch}
      />
    </Container>
  );
};

export default Gallery;