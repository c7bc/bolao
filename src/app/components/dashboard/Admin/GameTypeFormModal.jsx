// src/app/components/dashboard/Admin/GameTypeFormModal.jsx

'use client';

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
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

const GameTypeFormModal = ({ isOpen, onClose, refreshList }) => {
  const [formData, setFormData] = useState({
    name: '',
    min_numbers: 1,
    max_numbers: 60,
    min_digits: 1,
    max_digits: 25,
    points_for_10: 10,
    points_for_9: 9,
    total_drawn_numbers: 6,
    rounds: 1,
    draw_times: '',
    ticket_price: 10.0,
    number_generation: 'automatic',
  });
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (name, value) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setFormData({ ...formData, [name]: parsedValue });
    }
  };

  const handleSubmit = async () => {
    // Validações adicionais podem ser implementadas aqui

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Token não encontrado.',
          description: 'Por favor, faça login novamente.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Preparar array de horários
      const drawTimesArray = formData.draw_times
        .split(',')
        .map((time) => time.trim())
        .filter((time) => time !== '');

      await axios.post(
        '/api/game-types/create',
        {
          name: formData.name,
          min_numbers: formData.min_numbers,
          max_numbers: formData.max_numbers,
          min_digits: formData.min_digits,
          max_digits: formData.max_digits,
          points_for_10: formData.points_for_10,
          points_for_9: formData.points_for_9,
          total_drawn_numbers: formData.total_drawn_numbers,
          rounds: formData.rounds,
          draw_times: drawTimesArray,
          ticket_price: formData.ticket_price,
          number_generation: formData.number_generation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast({
        title: 'Tipo de jogo criado com sucesso.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setFormData({
        name: '',
        min_numbers: 1,
        max_numbers: 60,
        min_digits: 1,
        max_digits: 25,
        points_for_10: 10,
        points_for_9: 9,
        total_drawn_numbers: 6,
        rounds: 1,
        draw_times: '',
        ticket_price: 10.0,
        number_generation: 'automatic',
      });

      refreshList();
      onClose();
    } catch (error) {
      console.error('Erro ao criar tipo de jogo:', error);
      toast({
        title: 'Erro ao criar tipo de jogo.',
        description: error.response?.data?.error || 'Erro desconhecido.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      min_numbers: 1,
      max_numbers: 60,
      min_digits: 1,
      max_digits: 25,
      points_for_10: 10,
      points_for_9: 9,
      total_drawn_numbers: 6,
      rounds: 1,
      draw_times: '',
      ticket_price: 10.0,
      number_generation: 'automatic',
    });
    onClose();
  };

  return (
    <Modal size="lg" isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Criar Tipo de Jogo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {/* Nome do Jogo */}
            <FormControl isRequired>
              <FormLabel>Nome do Jogo</FormLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Mega-Sena"
              />
            </FormControl>
            {/* Quantidade Mínima de Números */}
            <FormControl isRequired>
              <FormLabel>Quantidade Mínima de Números</FormLabel>
              <NumberInput
                value={formData.min_numbers}
                onChange={(value) => handleNumberChange('min_numbers', value)}
                min={1}
                max={formData.max_numbers}
              >
                <NumberInputField placeholder="Ex: 6" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Quantidade Máxima de Números */}
            <FormControl isRequired>
              <FormLabel>Quantidade Máxima de Números</FormLabel>
              <NumberInput
                value={formData.max_numbers}
                onChange={(value) => handleNumberChange('max_numbers', value)}
                min={formData.min_numbers}
                max={60}
              >
                <NumberInputField placeholder="Ex: 60" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Dígitos Mínimos */}
            <FormControl isRequired>
              <FormLabel>Dígitos Mínimos</FormLabel>
              <NumberInput
                value={formData.min_digits}
                onChange={(value) => handleNumberChange('min_digits', value)}
                min={1}
                max={formData.max_digits}
              >
                <NumberInputField placeholder="Ex: 1" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Dígitos Máximos */}
            <FormControl isRequired>
              <FormLabel>Dígitos Máximos</FormLabel>
              <NumberInput
                value={formData.max_digits}
                onChange={(value) => handleNumberChange('max_digits', value)}
                min={formData.min_digits}
                max={100}
              >
                <NumberInputField placeholder="Ex: 25" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Pontos para 10 */}
            <FormControl isRequired>
              <FormLabel>Pontos para 10 Acertos</FormLabel>
              <NumberInput
                value={formData.points_for_10}
                onChange={(value) => handleNumberChange('points_for_10', value)}
                min={1}
                max={100}
              >
                <NumberInputField placeholder="Ex: 10" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Pontos para 9 */}
            <FormControl isRequired>
              <FormLabel>Pontos para 9 Acertos</FormLabel>
              <NumberInput
                value={formData.points_for_9}
                onChange={(value) => handleNumberChange('points_for_9', value)}
                min={1}
                max={100}
              >
                <NumberInputField placeholder="Ex: 9" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Total de Números Sorteados */}
            <FormControl isRequired>
              <FormLabel>Total de Números Sorteados</FormLabel>
              <NumberInput
                value={formData.total_drawn_numbers}
                onChange={(value) => handleNumberChange('total_drawn_numbers', value)}
                min={1}
                max={100}
              >
                <NumberInputField placeholder="Ex: 6" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Rodadas */}
            <FormControl isRequired>
              <FormLabel>Quantidade de Rodadas</FormLabel>
              <NumberInput
                value={formData.rounds}
                onChange={(value) => handleNumberChange('rounds', value)}
                min={1}
                max={10}
              >
                <NumberInputField placeholder="Ex: 1" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Horários de Sorteio */}
            <FormControl isRequired>
              <FormLabel>Horários de Sorteio (separados por vírgula)</FormLabel>
              <Input
                name="draw_times"
                value={formData.draw_times}
                onChange={handleChange}
                placeholder="Ex: 09:00, 11:00, 14:00"
              />
            </FormControl>
            {/* Valor do Ticket */}
            <FormControl isRequired>
              <FormLabel>Valor do Ticket (R$)</FormLabel>
              <NumberInput
                value={formData.ticket_price}
                onChange={(value) =>
                  setFormData({ ...formData, ticket_price: parseFloat(value) })
                }
                min={1}
                max={1000}
                precision={2}
              >
                <NumberInputField placeholder="Ex: 10.00" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
            {/* Geração de Números */}
            <FormControl isRequired>
              <FormLabel>Método de Geração de Números</FormLabel>
              <Select
                name="number_generation"
                value={formData.number_generation}
                onChange={handleChange}
              >
                <option value="automatic">Automático</option>
                <option value="manual">Manual</option>
              </Select>
            </FormControl>
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GameTypeFormModal;
