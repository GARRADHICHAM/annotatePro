
// Updated useImages.js hook with better loading states
import { useState, useEffect } from 'react';

export default function useImages() {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    skip: 0,
    limit: 10
  });
  const [isChangingImage, setIsChangingImage] = useState(false);

  const fetchImages = async (skip = 0, limit = 10) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/images-all?skip=${skip}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      const data = await response.json();
      
      setImages(data.images);
      setPagination({
        total: data.total,
        skip: data.skip,
        limit: data.limit
      });
      
      // Reset current image index when fetching a new batch
      if (skip === 0) {
        setCurrentImageIndex(0);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToNextImage = () => {
    setIsChangingImage(true);
    
    if (currentImageIndex < images.length - 1) {
      // If we have more images in the current batch
      setCurrentImageIndex(currentImageIndex + 1);
      setIsChangingImage(false);
    } else if (pagination.skip + pagination.limit < pagination.total) {
      // If we need to fetch the next batch
      fetchImages(pagination.skip + pagination.limit, pagination.limit)
        .then(() => {
          setCurrentImageIndex(0);
          setIsChangingImage(false);
        });
    } else {
      setIsChangingImage(false);
    }
  };

  const goToPreviousImage = () => {
    setIsChangingImage(true);
    
    if (currentImageIndex > 0) {
      // If we have previous images in the current batch
      setCurrentImageIndex(currentImageIndex - 1);
      setIsChangingImage(false);
    } else if (pagination.skip > 0) {
      // If we need to fetch the previous batch
      const newSkip = Math.max(0, pagination.skip - pagination.limit);
      fetchImages(newSkip, pagination.limit)
        .then(() => {
          // Set current index to the last image of the newly fetched batch
          setCurrentImageIndex(pagination.limit - 1);
          setIsChangingImage(false);
        });
    } else {
      setIsChangingImage(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    currentImage: images[currentImageIndex],
    currentImageIndex,
    pagination,
    loading,
    isChangingImage,
    error,
    goToNextImage,
    goToPreviousImage,
    refetch: fetchImages
  };
}