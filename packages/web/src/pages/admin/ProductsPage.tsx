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
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

const ProductsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
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
          <Button variant="contained" startIcon={<Add />} onClick={handleOpenProductDialog}>
            Create Product
          </Button>
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
                  <CardActions sx={{ p: 1.5, pt: 0, gap: 0.5 }}>
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
    </PageContainer>
  );
};

export default ProductsPage;
