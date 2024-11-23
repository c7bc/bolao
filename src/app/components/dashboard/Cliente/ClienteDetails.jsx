// src/app/components/dashboard/Cliente/ClienteDetails.jsx

'use client';

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
} from '@chakra-ui/react';
import ClienteGameHistory from './ClienteGameHistory';
import ClienteScores from './ClienteScores';
import ClienteFinancialHistory from './ClienteFinancialHistory';

const ClienteDetails = ({ cliente, onClose }) => {
  return (
    <Modal isOpen={!!cliente} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={4}>
            <Text><strong>Nome:</strong> {cliente.cli_nome}</Text>
            <Text><strong>Email:</strong> {cliente.cli_email}</Text>
            <Text><strong>Telefone:</strong> {cliente.cli_telefone}</Text>
            <Text><strong>Status:</strong> {cliente.cli_status}</Text>
            <Text><strong>ID do Colaborador:</strong> {cliente.cli_idcolaborador || 'N/A'}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(cliente.cli_datacriacao).toLocaleDateString()}</Text>
          </Box>
          <ClienteGameHistory clienteId={cliente.cli_id} />
          <ClienteScores clienteId={cliente.cli_id} />
          <ClienteFinancialHistory clienteId={cliente.cli_id} />
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ClienteDetails;
