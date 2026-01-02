import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import PageContainer from '../../components/layout/PageContainer';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface RegistrationCode {
  id: string;
  code: string;
  role: string | null;
  isUsed: boolean;
  usedBy?: string;
  usedByUsername?: string | null;
  usedByEmail?: string | null;
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
}

const CodeGenerationPage: React.FC = () => {
  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<RegistrationCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    quantity: 1,
    expiresAt: '',
  });
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.REGISTRATION_CODES.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCodes(response.data);
    } catch (error: any) {
      setError('Failed to fetch registration codes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setFormData({ quantity: 1, expiresAt: '' });
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({ quantity: 1, expiresAt: '' });
    setError(null);
  };

  const handleGenerate = async () => {
    try {
      setError(null);
      
      // Validate quantity
      if (!formData.quantity || formData.quantity < 1) {
        setError('Quantity must be at least 1');
        return;
      }
      
      if (formData.quantity > 10) {
        setError('Maximum 10 codes can be generated at once');
        return;
      }
      
      console.log('Generating codes:', { quantity: formData.quantity, expiresAt: formData.expiresAt });
      
      const response = await axios.post(
        ApiEndpoints.REGISTRATION_CODES.GENERATE,
        {
          quantity: Number(formData.quantity), // Ensure it's a number
          expiresAt: formData.expiresAt || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Codes generated:', response.data);
      handleClose();
      fetchCodes();
    } catch (error: any) {
      console.error('Generate codes error:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.error || error.response?.data?.details || error.message || 'Failed to generate codes');
    }
  };

  const handleDeleteClick = (code: RegistrationCode) => {
    setCodeToDelete(code);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCodeToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!codeToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.REGISTRATION_CODES.DELETE(codeToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
      fetchCodes();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete registration code');
      setDeleteDialogOpen(false);
      setCodeToDelete(null);
    }
  };

  const handleDeleteAllClick = () => {
    setDeleteAllDialogOpen(true);
    setError(null);
  };

  const handleDeleteAllCancel = () => {
    setDeleteAllDialogOpen(false);
  };

  const handleDeleteAllConfirm = async () => {
    try {
      setError(null);
      await axios.delete(`${ApiEndpoints.REGISTRATION_CODES.LIST}/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteAllDialogOpen(false);
      fetchCodes();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete all registration codes');
      setDeleteAllDialogOpen(false);
    }
  };

  return (
    <PageContainer
      title="Registration Codes"
      actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          {codes.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAllClick}
            >
              Delete All
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleOpen}
          >
            Generate Codes
          </Button>
        </Box>
      }
    >

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Code</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Used By</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell><strong>Expires</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No codes found
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight="bold">
                          {code.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={code.isUsed ? 'Used' : 'Available'}
                          size="small"
                          color={code.isUsed ? 'default' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        {code.isUsed && code.usedByUsername ? (
                          <Tooltip
                            title={
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  Username: {code.usedByUsername}
                                </Typography>
                                {code.usedByEmail && (
                                  <Typography variant="body2">
                                    Email: {code.usedByEmail}
                                  </Typography>
                                )}
                                {code.usedAt && (
                                  <Typography variant="body2">
                                    Used on: {new Date(code.usedAt).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                            arrow
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight="medium">
                                {code.usedByUsername}
                              </Typography>
                              <InfoIcon fontSize="small" color="action" />
                            </Box>
                          </Tooltip>
                        ) : code.isUsed ? (
                          <Tooltip title="User information not available" arrow>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Unknown User
                              </Typography>
                              <InfoIcon fontSize="small" color="disabled" />
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{new Date(code.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteClick(code)}
                          aria-label="delete code"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Registration Codes</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setFormData({ ...formData, quantity: Math.max(1, Math.min(10, val)) });
            }}
            margin="normal"
            required
            inputProps={{ min: 1, max: 10 }}
            helperText="Enter number of codes to generate (1-10)"
          />
          <TextField
            fullWidth
            label="Expiration Date (Optional)"
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleGenerate} variant="contained">
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Registration Code</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the registration code{' '}
            <strong>{codeToDelete?.code}</strong>?
          </Typography>
          {codeToDelete?.isUsed && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This code has already been used. Deleting it will not affect existing users.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteAllDialogOpen} onClose={handleDeleteAllCancel}>
        <DialogTitle>Delete All Registration Codes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>all {codes.length} registration codes</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              This will delete all registration codes, including used and unused ones. 
              Existing users will not be affected, but you will need to generate new codes for future registrations.
            </Typography>
          </Alert>
          {codes.filter(c => c.isUsed).length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {codes.filter(c => c.isUsed).length} code(s) have been used. 
                Deleting them will not affect the users who registered with these codes.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAllCancel}>Cancel</Button>
          <Button onClick={handleDeleteAllConfirm} color="error" variant="contained">
            Delete All
          </Button>
        </DialogActions>
        </Dialog>
    </PageContainer>
  );
};

export default CodeGenerationPage;
