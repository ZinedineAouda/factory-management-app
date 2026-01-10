import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Refresh,
  Inventory,
  ShoppingCart,
  CheckCircle,
  Image as ImageIcon,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const ProductViewPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { canView, isAdmin } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can view products
  const canViewProducts = isAdmin || canView('Products');
  
  // Delivery dialog states
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedProductForDelivery, setSelectedProductForDelivery] = useState<Product | null>(null);
  const [deliveryFormData, setDeliveryFormData] = useState({
    amount: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  useEffect(() => {
    if (!canViewProducts) {
      setError('You do not have permission to view products.');
      setLoading(false);
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewProducts, token]);

  const fetchProducts = async () => {
    if (!canViewProducts) {
      setError('You do not have permission to view products.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[ProductViewPage] Fetching products for view-only user');
      
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const fetchedProducts = response.data || [];
      console.log('[ProductViewPage] Fetched products count:', fetchedProducts.length);
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error('[ProductViewPage] Fetch products error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to fetch products';
      setError(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeliveryDialog = (product: Product) => {
    setSelectedProductForDelivery(product);
    setDeliveryFormData({
      amount: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setDeliveryDialogOpen(true);
    setDeliveryError(null);
    setDeliverySuccess(null);
  };

  const handleCloseDeliveryDialog = () => {
    setDeliveryDialogOpen(false);
    setSelectedProductForDelivery(null);
    setDeliveryFormData({
      amount: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setDeliveryError(null);
    setDeliverySuccess(null);
  };

  const handleSubmitDelivery = async () => {
    if (!selectedProductForDelivery) return;

    const amountNum = parseFloat(deliveryFormData.amount);
    if (!deliveryFormData.amount || isNaN(amountNum) || amountNum <= 0) {
      setDeliveryError('Please enter a valid positive amount');
      return;
    }

    try {
      setSubmittingDelivery(true);
      setDeliveryError(null);
      setDeliverySuccess(null);

      await axios.post(
        ApiEndpoints.PRODUCT_DELIVERIES.CREATE,
        {
          productId: selectedProductForDelivery.id,
          amount: amountNum,
          deliveryDate: deliveryFormData.deliveryDate || new Date().toISOString().split('T')[0],
          notes: deliveryFormData.notes.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Success - show success message and close dialog after a short delay
      setDeliverySuccess('Delivery amount entered successfully!');
      setTimeout(() => {
        handleCloseDeliveryDialog();
      }, 1500);
    } catch (err: any) {
      console.error('Delivery submission error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to enter delivery amount';
      setDeliveryError(errorMessage);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    const getImageBaseUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        return apiUrl.replace(/\/api\/?$/, '');
      }
      return '';
    };
    const baseUrl = getImageBaseUrl();
    return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
  };

  if (!canViewProducts) {
    return (
      <PageContainer title="Products">
        <Alert severity="error">You do not have permission to view products.</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Products"
      subtitle="View products and enter delivery amounts"
      actions={
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchProducts}>
          Refresh
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        <Box
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 3,
          }}
        >
          <EmptyState
            icon={<Inventory />}
            title="No products yet"
            description="No products are available at the moment. Products created by users with edit permissions will appear here."
          />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {products.map((product) => {
            const imageUrl = getImageUrl(product.image_url);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.neutral[900],
                    border: `1px solid ${colors.neutral[800]}`,
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: colors.primary[500],
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(colors.primary[500], 0.2)}`,
                    },
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      backgroundColor: colors.neutral[950],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <ImageIcon sx={{ fontSize: 64, color: colors.neutral[700] }} />
                    )}
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: colors.neutral[100],
                        mb: 0.5,
                      }}
                    >
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          color: colors.neutral[400],
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {product.description}
                      </Typography>
                    )}
                    <Chip
                      label={new Date(product.created_at).toLocaleDateString()}
                      size="small"
                      sx={{
                        backgroundColor: alpha(colors.primary[500], 0.1),
                        color: colors.primary[400],
                        fontSize: '0.75rem',
                        height: 20,
                      }}
                    />
                  </CardContent>
                  <CardActions sx={{ p: 1.5, pt: 0, gap: 0.5, justifyContent: 'center' }}>
                    <Tooltip title="Enter Delivery Amount">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ShoppingCart />}
                        onClick={() => handleOpenDeliveryDialog(product)}
                        sx={{
                          borderColor: colors.success[500],
                          color: colors.success[500],
                          '&:hover': {
                            borderColor: colors.success[600],
                            backgroundColor: alpha(colors.success[500], 0.1),
                          },
                        }}
                      >
                        Enter Delivery
                      </Button>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onClose={handleCloseDeliveryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Enter Delivery Amount - {selectedProductForDelivery?.name}
        </DialogTitle>
        <DialogContent>
          {deliveryError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeliveryError(null)}>
              {deliveryError}
            </Alert>
          )}
          {deliverySuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {deliverySuccess}
            </Alert>
          )}
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mb: 2 }}>
            Enter the amount of products delivered for analytics tracking
          </Typography>
          <TextField
            fullWidth
            label="Delivery Amount"
            type="number"
            value={deliveryFormData.amount}
            onChange={(e) => setDeliveryFormData({ ...deliveryFormData, amount: e.target.value })}
            required
            disabled={submittingDelivery}
            inputProps={{ min: 0, step: 1 }}
            margin="normal"
            helperText="Enter the number of products delivered"
            autoFocus
          />
          <TextField
            fullWidth
            label="Delivery Date"
            type="date"
            value={deliveryFormData.deliveryDate}
            onChange={(e) => setDeliveryFormData({ ...deliveryFormData, deliveryDate: e.target.value })}
            required
            disabled={submittingDelivery}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="Notes (Optional)"
            multiline
            rows={3}
            value={deliveryFormData.notes}
            onChange={(e) => setDeliveryFormData({ ...deliveryFormData, notes: e.target.value })}
            disabled={submittingDelivery}
            margin="normal"
            placeholder="Add any additional notes about this delivery..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeliveryDialog} variant="outlined" disabled={submittingDelivery}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitDelivery}
            variant="contained"
            disabled={submittingDelivery}
            startIcon={submittingDelivery ? <CircularProgress size={16} /> : <CheckCircle />}
            sx={{
              backgroundColor: colors.success[500],
              '&:hover': {
                backgroundColor: colors.success[600],
              },
            }}
          >
            {submittingDelivery ? 'Submitting...' : 'Enter Amount'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProductViewPage;

