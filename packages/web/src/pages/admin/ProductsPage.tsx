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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Inventory,
  Refresh,
  CloudUpload,
  Image as ImageIcon,
  LocalShipping,
  Close,
  Analytics,
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

/**
 * ProductsPage - Full management page for users with can_edit_products permission
 * 
 * This page is ONLY for users who can create, edit, and delete products.
 * Features:
 * - View all products
 * - Create new products
 * - Edit existing products
 * - Delete products
 * - Full product management capabilities
 * 
 * Route: /admin/products
 * Protected by: requiredPermission={{ edit: 'Products' }}
 * 
 * Users with view-only permissions are routed to /products (ProductViewPage) instead
 */
const ProductsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const { canEdit, isAdmin } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Permission check: Only users with edit permission can access this page
  // View-only users are automatically routed to /products (ProductViewPage)
  const canEditProducts = isAdmin || canEdit('Products');
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
  
  // Deliveries view for admin
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  
  // Product analytics dialog
  const [productAnalyticsDialogOpen, setProductAnalyticsDialogOpen] = useState(false);
  const [selectedProductForAnalytics, setSelectedProductForAnalytics] = useState<Product | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);
  const [loadingProductAnalytics, setLoadingProductAnalytics] = useState(false);

  useEffect(() => {
    // Safety check: Redirect message if view-only user somehow accesses this page
    // (This shouldn't happen due to route protection, but added as safeguard)
    if (!canEditProducts) {
      setError('You do not have permission to manage products. Users with view-only permissions should use the Products view page at /products.');
      setLoading(false);
      setProducts([]);
      return;
    }
    
    // Fetch all products for management
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEditProducts, token]);

  const fetchProducts = async () => {
    // Double-check permission before fetching
    if (!canEditProducts) {
      setError('You do not have permission to manage products.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[ProductsPage] Fetching products for user with edit permissions');
      
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const fetchedProducts = response.data || [];
      console.log('[ProductsPage] Fetched products count:', fetchedProducts.length);
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error('[ProductsPage] Fetch products error:', err);
      console.error('[ProductsPage] Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || 'Failed to fetch products';
      setError(errorMsg);
      setProducts([]); // Reset products on error
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const response = await axios.get(ApiEndpoints.PRODUCT_DELIVERIES.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries(response.data || []);
    } catch (err: any) {
      console.error('Fetch deliveries error:', err);
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const handleOpenDeliveriesDialog = () => {
    setDeliveriesDialogOpen(true);
    fetchDeliveries();
  };

  const handleCloseDeliveriesDialog = () => {
    setDeliveriesDialogOpen(false);
    setDeliveries([]);
  };

  const fetchProductAnalytics = async (product: Product) => {
    try {
      setLoadingProductAnalytics(true);
      const response = await axios.get(ApiEndpoints.ANALYTICS.PRODUCT(product.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProductAnalytics(response.data);
    } catch (err: any) {
      console.error('Fetch product analytics error:', err);
      setProductAnalytics(null);
    } finally {
      setLoadingProductAnalytics(false);
    }
  };

  const handleOpenProductAnalytics = (product: Product) => {
    setSelectedProductForAnalytics(product);
    setProductAnalyticsDialogOpen(true);
    fetchProductAnalytics(product);
  };

  const handleCloseProductAnalyticsDialog = () => {
    setProductAnalyticsDialogOpen(false);
    setSelectedProductForAnalytics(null);
    setProductAnalytics(null);
  };

  const handleOpenProductDialog = () => {
    // Check permissions before opening dialog
    if (!canEditProducts) {
      setError('You do not have permission to create products. Only users with edit permissions can create products.');
      return;
    }
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
    setProductDialogOpen(true); // Open the dialog
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
    // Check permissions before submitting
    if (editingProduct && !canEditProducts) {
      setError('You do not have permission to edit products.');
      return;
    }
    if (!editingProduct && !canEditProducts) {
      setError('You do not have permission to create products.');
      return;
    }

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
          {isAdmin && (
            <Button variant="outlined" startIcon={<LocalShipping />} onClick={handleOpenDeliveriesDialog}>
              View Deliveries
            </Button>
          )}
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchProducts}>
            Refresh
          </Button>
          {/* Create Product button - Only visible to users with edit permissions */}
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

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : products.length === 0 ? (
        /* Empty State - No Products */
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
            description={canEditProducts 
              ? "Create your first product to start tracking production." 
              : "No products are available at the moment. Products created by users with edit permissions will appear here."}
            action={canEditProducts ? {
              label: 'Create Product',
              onClick: handleOpenProductDialog,
            } : undefined}
          />
        </Box>
      ) : (
        /* Products Grid - Show all products for users with view permission */
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
                    {/* Analytics button - View product analytics */}
                    <Tooltip title="View Analytics">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenProductAnalytics(product)}
                        sx={{ color: colors.info[500] }}
                      >
                        <Analytics sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    {/* Edit and Delete buttons - Only available on this admin page */}
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

      {/* Create/Edit Dialog - Only accessible to users with edit permissions */}
      {canEditProducts && (
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
      )}

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

      {/* Deliveries Dialog for Admin */}
      {isAdmin && (
        <Dialog open={deliveriesDialogOpen} onClose={handleCloseDeliveriesDialog} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">All Product Deliveries</Typography>
              <IconButton onClick={handleCloseDeliveriesDialog} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {loadingDeliveries ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : deliveries.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No deliveries found.</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2, backgroundColor: colors.neutral[900], border: `1px solid ${colors.neutral[800]}` }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Worker</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Group</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }} align="right">Amount</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Delivery Date</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Delivery Hour</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Notes</TableCell>
                      <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deliveries.map((delivery: any) => (
                      <TableRow key={delivery.id} hover>
                        <TableCell sx={{ color: colors.neutral[100] }}>{delivery.product_name || 'Unknown'}</TableCell>
                        <TableCell sx={{ color: colors.neutral[100] }}>{delivery.worker_username || 'Unknown'}</TableCell>
                        <TableCell sx={{ color: colors.neutral[300] }}>
                          {delivery.group_name || 'No Group'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: colors.success[500], fontWeight: 600 }}>
                          {delivery.amount?.toLocaleString() || '0'}
                        </TableCell>
                        <TableCell sx={{ color: colors.neutral[300] }}>
                          {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: colors.primary[400], fontWeight: 500, fontFamily: 'monospace' }}>
                          {delivery.delivery_hour || (delivery.created_at ? new Date(delivery.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A')}
                        </TableCell>
                        <TableCell sx={{ color: colors.neutral[400], maxWidth: 200 }}>
                          {delivery.notes || '-'}
                        </TableCell>
                        <TableCell sx={{ color: colors.neutral[400] }}>
                          {delivery.created_at ? new Date(delivery.created_at).toLocaleString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeliveriesDialog}>Close</Button>
            <Button onClick={fetchDeliveries} variant="outlined" startIcon={<Refresh />}>
              Refresh
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Product Analytics Dialog */}
      <Dialog open={productAnalyticsDialogOpen} onClose={handleCloseProductAnalyticsDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedProductForAnalytics?.name}</Typography>
              <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                Product Analytics & Delivery History
              </Typography>
            </Box>
            <IconButton onClick={handleCloseProductAnalyticsDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingProductAnalytics ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : productAnalytics ? (
            <>
              {/* Analytics Stats */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: colors.neutral[900],
                      border: `1px solid ${colors.neutral[800]}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                      Total Deliveries
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary[400] }}>
                      {productAnalytics.totalDeliveries || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: colors.neutral[900],
                      border: `1px solid ${colors.neutral[800]}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                      Total Amount
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.success[500] }}>
                      {productAnalytics.totalAmount?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: colors.neutral[900],
                      border: `1px solid ${colors.neutral[800]}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                      Average Amount
                    </Typography>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.info[500] }}>
                      {productAnalytics.avgAmount?.toFixed(0) || '0'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: colors.neutral[900],
                      border: `1px solid ${colors.neutral[800]}`,
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                      Best Group
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.warning[500] }}>
                      {productAnalytics.bestGroup?.groupName || 'N/A'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[400], mt: 0.5 }}>
                      {productAnalytics.bestGroup?.totalAmount?.toLocaleString() || '0'} total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Best Groups */}
              {productAnalytics.groupsByPerformance && productAnalytics.groupsByPerformance.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
                    Performance by Group
                  </Typography>
                  <Grid container spacing={2}>
                    {productAnalytics.groupsByPerformance.slice(0, 3).map((group: any, index: number) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: colors.neutral[900],
                            border: `1px solid ${index === 0 ? colors.warning[500] : colors.neutral[800]}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                              {group.groupName}
                            </Typography>
                            {index === 0 && (
                              <Chip label="Best" size="small" sx={{ backgroundColor: colors.warning[500], color: colors.neutral[950], fontSize: '0.7rem', height: 20 }} />
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                            {group.deliveryCount} deliveries
                          </Typography>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.success[500] }}>
                            {group.totalAmount?.toLocaleString() || '0'} total
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Delivery History Table */}
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
                Delivery History
              </Typography>
              {productAnalytics.deliveries && productAnalytics.deliveries.length > 0 ? (
                <TableContainer component={Paper} sx={{ backgroundColor: colors.neutral[900], border: `1px solid ${colors.neutral[800]}` }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Worker</TableCell>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Group</TableCell>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Date</TableCell>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Time</TableCell>
                        <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productAnalytics.deliveries.map((delivery: any) => (
                        <TableRow key={delivery.id} hover>
                          <TableCell sx={{ color: colors.neutral[100] }}>{delivery.worker_username || 'Unknown'}</TableCell>
                          <TableCell sx={{ color: colors.neutral[300] }}>{delivery.group_name || 'No Group'}</TableCell>
                          <TableCell align="right" sx={{ color: colors.success[500], fontWeight: 600 }}>
                            {delivery.amount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell sx={{ color: colors.neutral[300] }}>
                            {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: colors.primary[400], fontWeight: 500, fontFamily: 'monospace' }}>
                            {delivery.delivery_hour || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: colors.neutral[400], maxWidth: 150 }}>
                            {delivery.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No delivery history available for this product.</Alert>
              )}
            </>
          ) : (
            <Alert severity="error">Failed to load product analytics.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductAnalyticsDialog}>Close</Button>
          {selectedProductForAnalytics && (
            <Button onClick={() => fetchProductAnalytics(selectedProductForAnalytics)} variant="outlined" startIcon={<Refresh />}>
              Refresh
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProductsPage;
