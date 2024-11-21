// app/components/Admin/GameFormModal.jsx

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const GameFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    jog_status: 'ativo',
    jog_tipodojogo: '',
    jog_valorjogo: '',
    jog_numeros_totais: '',
    jog_quantidade_minima: '',
    jog_quantidade_maxima: '',
    jog_expiracao: '',
    jog_nome: '',
    jog_data_inicio: '',
    jog_data_fim: '',
  });
  const toast = useToast();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/jogos/create', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo cadastrado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao cadastrar jogo.',
        description: error.response.data.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cadastrar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired mb={3}>
            <FormLabel>Nome do Jogo</FormLabel>
            <Input name="jog_nome" value={formData.jog_nome} onChange={handleInputChange} />
          </FormControl>
          <FormControl isRequired mb={3}>
            <FormLabel>Status</FormLabel>
            <Select name="jog_status" value={formData.jog_status} onChange={handleInputChange}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="finalizado">Finalizado</option>
            </Select>
          </FormControl>
          {/* Adicione outros campos conforme necessário */}
          <FormControl isRequired mb={3}>
            <FormLabel>Valor do Jogo</FormLabel>
            <Input
              name="jog_valorjogo"
              type="number"
              value={formData.jog_valorjogo}
              onChange={handleInputChange}
            />
          </FormControl>
          {/* Continue adicionando os campos necessários */}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="green" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameFormModal;
