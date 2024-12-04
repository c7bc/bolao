import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  VStack,
  Container
} from '@chakra-ui/react';

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    method: '',
    details: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.amount || !formData.method) {
      setError('Por favor preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/colaborador/pagamentos', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setFormData({ amount: '', method: '', details: '' });
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao processar pagamento');
    }
  };

  return (
    <Container maxW="md">
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          {success && (
            <Alert status="success">
              <AlertIcon />
              <Box>
                <AlertTitle>Sucesso!</AlertTitle>
                <AlertDescription>
                  Pagamento criado com sucesso.
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          {error && (
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Valor</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Método de Pagamento</FormLabel>
                <Select
                  placeholder="Selecione o método"
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                >
                  <option value="pix">PIX</option>
                  <option value="transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Detalhes (opcional)</FormLabel>
                <Input
                  value={formData.details}
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                  placeholder="Observações adicionais"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
              >
                Criar Pagamento
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
};

export default PaymentForm;