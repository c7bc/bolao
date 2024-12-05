// components/ImageUpload.js
import React, { useState } from 'react';
import { FormControl, FormLabel, Input, Button, Box, Image } from '@chakra-ui/react';
import axios from 'axios';

const ImageUpload = ({ onUpload, preview, label }) => {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        // Call the API route for upload
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const imageUrl = response.data.url;
        onUpload(imageUrl);
      } catch (error) {
        console.error('Upload failed', error);
        // Handle error appropriately
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        display="none"
        id={`file-${label}`}
      />
      <Button
        as="label"
        htmlFor={`file-${label}`}
        cursor="pointer"
        colorScheme="green"
        isLoading={loading}
      >
        {loading ? 'Uploading...' : 'Upload Image'}
      </Button>
      {preview && (
        <Box mt={2}>
          <Image src={preview} alt="Preview" maxH="100px" />
        </Box>
      )}
    </FormControl>
  );
};

export default ImageUpload;
