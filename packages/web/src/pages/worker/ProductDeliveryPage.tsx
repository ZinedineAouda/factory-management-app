import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Inventory,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';

interface Product {
  id: string;
  name: string;
  description: string | null;
}

const ProductDeliveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const { canView, canEdit, isAdmin } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check permissions
  const canViewProducts = isAdmin || canView('Products');
  const canEnterDelivery = isAdmin || canView('Products') || canEdit('Products');

  useEffect(() => {
    if (!canViewProducts) {
      setError('You do not have permission to view products.');
      setFetchingProducts(false);
      return;
    }
    fetchProducts();
  }, [canViewProducts]);

  const fetchProducts = async () => {
    try {
      setFetchingProducts(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEnterDelivery) {
      setError('You do not have permission to enter delivery amounts.');
      return;
    }

    if (!selectedProductId) {
      setError('Please select a product');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await axios.post(
        ApiEndpoints.PRODUCT_DELIVERIES.CREATE,
        {
          productId: selectedProductId,
          amount: amountNum,
          deliveryDate: deliveryDate || new Date().toISOString().split('T')[0],
          notes: notes.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Delivery amount entered successfully!');
      setSelectedProductId('');
      setAmount('');
      setNotes('');
      setDeliveryDate(new Date().toISOString().split('T')[0]);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to enter delivery amount');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProducts) {
    return (
      <PageContainer title="Enter Delivery Amount">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!canViewProducts) {
    return (
      <PageContainer title="Enter Delivery Amount">
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Enter Delivery Amount"
      subtitle={canEdit('Products') ? 'Declare delivered product amounts' : 'Enter delivery amounts for analytics tracking'}
    >
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: alpha(colors.primary[500], 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.primary[500],
                }}
              >
                <Inventory sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Delivery Entry
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
                  {canEdit('Products') 
                    ? 'Declare the amount of products delivered' 
                    : 'Enter the amount of products delivered for analytics tracking'}
                </Typography>
              </Box>
            </Box>

            <form onSubmit={handleSubmit}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="product-select-label" sx={{ color: colors.neutral[400] }}>
                  Select Product
                </InputLabel>
                <Select
                  labelId="product-select-label"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  label="Select Product"
                  required
                  disabled={loading}
                  sx={{
                    color: colors.neutral[100],
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.neutral[700],
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.neutral[600],
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary[500],
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.neutral[400],
                    },
                  }}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Delivery Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={loading}
                inputProps={{ min: 0, step: 1 }}
                sx={{ mb: 2 }}
                helperText="Enter the number of products delivered"
              />

              <TextField
                fullWidth
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                placeholder="Add any additional notes about this delivery..."
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  sx={{
                    color: colors.neutral[300],
                    borderColor: colors.neutral[700],
                    '&:hover': {
                      borderColor: colors.neutral[600],
                      backgroundColor: alpha(colors.neutral[700], 0.1),
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !canEnterDelivery}
                  startIcon={loading ? <CircularProgress size={16} /> : <CheckCircle />}
                  sx={{
                    backgroundColor: colors.success[500],
                    '&:hover': {
                      backgroundColor: colors.success[600],
                    },
                  }}
                >
                  {loading ? 'Submitting...' : canEdit('Products') ? 'Declare Delivery' : 'Enter Amount'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ProductDeliveryPage;
