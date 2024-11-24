// src/app/components/dashboard/Admin/GameEditModal.jsx (Ensure unique and necessary code)

import React, { useState, useEffect } from 'react';
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
  Stack,
} from '@chakra-ui/react';
import axios from 'axios';

const GameEditModal = ({ isOpen, onClose, refreshList, jogo }) => {
  const [formData, setFormData] = useState({ ...jogo });
  const toast = useToast();

  useEffect(() => {
    setFormData({ ...jogo });
  }, [jogo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/jogos/${jogo.jog_id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast({
        title: 'Jogo atualizado com sucesso!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      refreshList();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input name="jog_nome" value={formData.jog_nome} onChange={handleInputChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Status</FormLabel>
              <Select name="jog_status" value={formData.jog_status} onChange={handleInputChange}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="finalizado">Finalizado</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tipo de Jogo</FormLabel>
              <Select name="jog_tipodojogo" value={formData.jog_tipodojogo} onChange={handleInputChange}>
                <option value="">Selecione</option>
                <option value="MEGA">MEGA</option>
                <option value="LOTOFACIL">LOTOFACIL</option>
                <option value="JOGO_DO_BICHO">JOGO DO BICHO</option>
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Valor do Jogo (R$)</FormLabel>
              <Input
                name="jog_valorjogo"
                type="number"
                value={formData.jog_valorjogo}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Quantidade Mínima de Números</FormLabel>
              <Input
                name="jog_quantidade_minima"
                type="number"
                value={formData.jog_quantidade_minima}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Quantidade Máxima de Números</FormLabel>
              <Input
                name="jog_quantidade_maxima"
                type="number"
                value={formData.jog_quantidade_maxima}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Números</FormLabel>
              <Input
                name="jog_numeros"
                placeholder="Ex: 01,02,03,..."
                value={formData.jog_numeros}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Data de Início</FormLabel>
              <Input
                name="jog_data_inicio"
                type="date"
                value={formData.jog_data_inicio}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Data de Fim</FormLabel>
              <Input
                name="jog_data_fim"
                type="date"
                value={formData.jog_data_fim}
                onChange={handleInputChange}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Atualizar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameEditModal;
