// components/PageSection.js
import React from 'react';
import { Box, Heading } from '@chakra-ui/react';

const PageSection = ({ title, children }) => (
  <Box mb={8}>
    <Heading size="md" mb={4} color="green.700">{title}</Heading>
    {children}
  </Box>
);

export default PageSection;
