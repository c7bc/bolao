// src/app/components/dashboard/Admin/ColaboradorDetailsModal.jsx

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
  Stack,
} from '@chakra-ui/react';

const ColaboradorDetailsModal = ({ isOpen, onClose, colaborador }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Detalhes do Colaborador</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text><strong>Nome:</strong> {colaborador.col_nome}</Text>
            <Text><strong>Documento:</strong> {colaborador.col_documento}</Text>
            <Text><strong>Email:</strong> {colaborador.col_email}</Text>
            <Text><strong>Telefone:</strong> {colaborador.col_telefone}</Text>
            <Text><strong>Endereço:</strong> {`${colaborador.col_rua}, ${colaborador.col_numero}, ${colaborador.col_bairro}, ${colaborador.col_cidade}, ${colaborador.col_estado}, CEP: ${colaborador.col_cep}`}</Text>
            <Text><strong>Status:</strong> {colaborador.col_status}</Text>
            <Text><strong>Data de Criação:</strong> {new Date(colaborador.col_datacriacao).toLocaleString()}</Text>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ColaboradorDetailsModal;
