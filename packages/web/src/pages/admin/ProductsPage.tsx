import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  CircularProgress,
  Tooltip,
  alpha,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Inventory,
  Refresh,
  CloudUpload,
  Image as ImageIcon,
  ShoppingCart,
  CheckCircle,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const { canView, canEdit, isAdmin } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user can view products
  const canViewProducts = isAdmin || canView('Products');
  const canEditProducts = isAdmin || canEdit('Products');
  // Users with can_view_products can enter delivery amounts
  const canEnterDelivery = canViewProducts;
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Fetch products error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to fetch products';
      setError(errorMsg);
      setProducts([]); // Reset products on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProductDialog = () => {
    setProductDialogOpen(true);
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || '',
    });
    setSelectedImage(null);
    // Get base URL for images (backend serves static files)
    const getImageUrl = (imagePath: string) => {
      if (!imagePath) return null;
      // If image path already includes full URL, return as-is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      // Otherwise, construct URL from API base
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        // Remove /api suffix if present, then add image path
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}${imagePath}`;
      }
      // Development fallback
      return imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    };
    setImagePreview(product.image_url ? getImageUrl(product.image_url) : null);
    setError(null);
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
    setEditingProduct(null);
    setProductFormData({
      name: '',
      description: '',
    });
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProduct = async () => {
    if (!productFormData.name.trim()) {
      setError('Product name is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const formData = new FormData();
      formData.append('name', productFormData.name.trim());
      formData.append('description', productFormData.description.trim() || '');
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      if (editingProduct) {
        await axios.put(ApiEndpoints.PRODUCTS.UPDATE(editingProduct.id), formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await axios.post(ApiEndpoints.PRODUCTS.CREATE, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      handleCloseProductDialog();
      fetchProducts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to save product';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteProductDialogOpen(true);
  };

  const handleDeleteProductCancel = () => {
    setDeleteProductDialogOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteProductConfirm = async () => {
    if (!productToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.PRODUCTS.DELETE(productToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to delete product';
      setError(errorMessage);
      setDeleteProductDialogOpen(false);
      setProductToDelete(null);
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

    // Check permissions before submitting
    if (!canEnterDelivery) {
      setError('You do not have permission to enter delivery amounts.');
      return;
    }

    const amountNum = parseFloat(deliveryFormData.amount);
    if (!deliveryFormData.amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    try {
      setSubmittingDelivery(true);
      setError(null);

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

      // Success - close dialog and reset form
      handleCloseDeliveryDialog();
      // Optionally show success message or refresh data
      setError(null);
    } catch (err: any) {
      console.error('Delivery submission error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to enter delivery amount';
      setError(errorMessage);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    // Get base URL for images
    const getImageBaseUrl = () => {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (apiUrl) {
        // Remove /api suffix if present
        return apiUrl.replace(/\/api\/?$/, '');
      }
      // Development fallback - use relative path
      return '';
    };
    const baseUrl = getImageBaseUrl();
    return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
  };

  return (
    <PageContainer
      title="Products"
      subtitle="Manage production products"
      actions={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchProducts}>
            Refresh
          </Button>
          {canEnterDelivery && (
            <Button 
              variant="outlined" 
              startIcon={<ShoppingCart />} 
              onClick={() => navigate('/products/delivery')}
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
          )}
          {canEditProducts && (
            <Button variant="contained" startIcon={<Add />} onClick={handleOpenProductDialog}>
              Create Product
            </Button>
          )}
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && products.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !loading && products.length === 0 ? (
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
            description="Create your first product to start tracking production."
            action={{
              label: 'Create Product',
              onClick: handleOpenProductDialog,
            }}
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
                  <CardActions sx={{ p: 1.5, pt: 0, gap: 0.5, flexWrap: 'wrap' }}>
                    {canEnterDelivery && (
                      <Tooltip title={canEdit('Products') ? 'Declare Delivery' : 'Enter Delivery Amount'}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDeliveryDialog(product)}
                          sx={{ color: colors.success[500] }}
                        >
                          <ShoppingCart sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canEditProducts && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditProduct(product)}
                            sx={{ color: colors.primary[400] }}
                          >
                            <Edit sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProductClick(product)}
                            sx={{ color: colors.error[500] }}
                          >
                            <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={productDialogOpen} onClose={handleCloseProductDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="product-image-upload"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="product-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2, py: 1.5 }}
              >
                {imagePreview ? 'Change Image' : 'Upload Product Image'}
              </Button>
            </label>
            {imagePreview && (
              <Box
                sx={{
                  width: '100%',
                  height: 200,
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                  border: `1px solid ${colors.neutral[800]}`,
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            label="Product Name"
            value={productFormData.name}
            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            disabled={loading}
            placeholder="e.g., Widget A"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={productFormData.description}
            onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
            placeholder="Describe the product"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductDialog} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmitProduct} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : editingProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteProductDialogOpen} onClose={handleDeleteProductCancel}>
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9375rem', color: colors.neutral[300], mb: 2 }}>
            Are you sure you want to delete the product <strong style={{ color: colors.neutral[100] }}>{productToDelete?.name}</strong>?
          </Typography>
          <Alert severity="warning">
            This action cannot be undone. Make sure the product is not referenced by any deliveries.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteProductCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteProductConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog open={deliveryDialogOpen} onClose={handleCloseDeliveryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {canEdit('Products') ? 'Declare Delivery' : 'Enter Delivery Amount'} - {selectedProductForDelivery?.name}
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
            {canEdit('Products')
              ? 'Declare the amount of products delivered'
              : 'Enter the amount of products delivered for analytics tracking'}
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
            {submittingDelivery ? 'Submitting...' : canEdit('Products') ? 'Declare Delivery' : 'Enter Amount'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProductsPage;
