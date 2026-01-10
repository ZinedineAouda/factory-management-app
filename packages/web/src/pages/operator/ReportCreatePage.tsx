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
  Chip,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Description,
  Send,
  Image as ImageIcon,
  Close,
  Warning,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

const ReportCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  useEffect(() => {
    fetchDepartments();
    // Set user's department as default if available
    if (user?.departmentId) {
      setSelectedDepartment(user.departmentId);
    }
  }, [user]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(ApiEndpoints.DEPARTMENTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('Image size must be less than 10MB');
          return false;
        }
        return true;
      });

      if (validFiles.length + images.length > 5) {
        setError('Maximum 5 images allowed');
        return;
      }

      setImages([...images, ...validFiles]);
      
      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please describe the issue or trouble you encountered');
      return;
    }

    if (!selectedDepartment) {
      setError('Please select a department');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('message', message.trim());
      formData.append('departmentId', selectedDepartment);
      
      images.forEach((image) => {
        formData.append('images', image);
      });

      await axios.post(ApiEndpoints.REPORTS.CREATE, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Report submitted successfully! Administrators have been notified.');
      setMessage('');
      setImages([]);
      setImagePreviews([]);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin/reports');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Report Issue"
      subtitle="Report any problems, troubles, or issues you encountered in the factory"
    >
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: alpha(colors.warning[500], 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.warning[500],
                }}
              >
                <Warning sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Report an Issue
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
                  Describe the problem or trouble you encountered. Administrators will be notified.
                </Typography>
              </Box>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[300], mb: 1 }}>
                  Department *
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {departments.map((dept) => (
                    <Chip
                      key={dept.id}
                      label={dept.name}
                      onClick={() => setSelectedDepartment(dept.id)}
                      color={selectedDepartment === dept.id ? 'primary' : 'default'}
                      sx={{
                        backgroundColor:
                          selectedDepartment === dept.id
                            ? alpha(colors.primary[500], 0.1)
                            : colors.neutral[800],
                        color:
                          selectedDepartment === dept.id
                            ? colors.primary[400]
                            : colors.neutral[300],
                        border: `1px solid ${
                          selectedDepartment === dept.id
                            ? colors.primary[500]
                            : colors.neutral[700]
                        }`,
                        '&:hover': {
                          backgroundColor:
                            selectedDepartment === dept.id
                              ? alpha(colors.primary[500], 0.15)
                              : colors.neutral[750],
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Describe the Issue"
                  placeholder="Describe the problem, trouble, or issue you encountered in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colors.neutral[950],
                      color: colors.neutral[100],
                      '& fieldset': {
                        borderColor: colors.neutral[700],
                      },
                      '&:hover fieldset': {
                        borderColor: colors.neutral[600],
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary[500],
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: colors.neutral[400],
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: colors.primary[400],
                    },
                  }}
                />
                <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 1 }}>
                  Be as detailed as possible. Include what happened, when it happened, and any relevant information.
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[300], mb: 1 }}>
                  Attach Images (Optional)
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  multiple
                  onChange={handleImageChange}
                />
                <label htmlFor="image-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    sx={{
                      borderColor: colors.neutral[700],
                      color: colors.neutral[300],
                      '&:hover': {
                        borderColor: colors.neutral[600],
                        backgroundColor: alpha(colors.neutral[700], 0.1),
                      },
                    }}
                  >
                    Add Images ({images.length}/5)
                  </Button>
                </label>
                <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 1 }}>
                  Maximum 5 images, 10MB each. Images help administrators understand the issue better.
                </Typography>

                {imagePreviews.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    {imagePreviews.map((preview, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          width: 120,
                          height: 120,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: `1px solid ${colors.neutral[700]}`,
                        }}
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: alpha(colors.error[500], 0.8),
                            color: colors.neutral[100],
                            '&:hover': {
                              backgroundColor: colors.error[500],
                            },
                          }}
                        >
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  sx={{
                    borderColor: colors.neutral[700],
                    color: colors.neutral[300],
                    '&:hover': {
                      borderColor: colors.neutral[600],
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} /> : <Send />}
                  disabled={loading || !message.trim() || !selectedDepartment}
                  sx={{
                    backgroundColor: colors.primary[500],
                    '&:hover': {
                      backgroundColor: colors.primary[600],
                    },
                    '&:disabled': {
                      backgroundColor: colors.neutral[700],
                      color: colors.neutral[500],
                    },
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ReportCreatePage;

