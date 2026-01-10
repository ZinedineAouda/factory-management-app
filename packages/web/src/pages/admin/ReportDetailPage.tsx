import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  alpha,
  TextField,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Send,
  Warning,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';
import { usePermissions } from '../../hooks/usePermissions';

interface ReportAttachment {
  id: string;
  file_url: string;
  file_name: string;
}

interface ReportComment {
  id: string;
  user_id: string;
  user_username: string;
  comment: string;
  created_at: string;
}

interface Report {
  id: string;
  department_id: string;
  operator_id: string;
  operator_username: string;
  message: string;
  department_name: string;
  is_solved: number;
  solved_at?: string;
  solved_by?: string;
  solved_by_username?: string;
  created_at: string;
  attachments?: ReportAttachment[];
  comments?: ReportComment[];
}

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { isAdmin, canEdit } = usePermissions();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.REPORTS.DETAIL(id!), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSolved = async () => {
    if (!report || report.is_solved) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await axios.put(
        ApiEndpoints.REPORTS.MARK_SOLVED(id!),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReport(response.data);
      setSuccess('Report marked as solved!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to mark report as solved');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      setError(null);
      const response = await axios.post(
        ApiEndpoints.REPORTS.ADD_COMMENT(id!),
        { comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add new comment to report
      if (report) {
        setReport({
          ...report,
          comments: [...(report.comments || []), response.data],
        });
      }
      setComment('');
      setSuccess('Comment added successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const canMarkAsSolved = () => {
    if (!report) return false;
    if (isAdmin) return true;
    if (canEdit('Reports') && user?.role === 'operator' && report.operator_id === user?.id) {
      return true;
    }
    return false;
  };

  const canComment = () => {
    // All authenticated users who can view the report can comment
    return true;
  };

  const getImageUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) return fileUrl;
    const apiBaseUrl = import.meta.env.VITE_API_URL || '';
    return `${apiBaseUrl}${fileUrl}`;
  };

  if (loading) {
    return (
      <PageContainer title="Report Details">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer title="Report Details">
        <Alert severity="error">Report not found</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Report Details"
      subtitle={`Report from ${report.department_name} department`}
    >
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
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

        {/* Header Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              color: colors.neutral[300],
              '&:hover': {
                backgroundColor: alpha(colors.neutral[700], 0.1),
              },
            }}
          >
            Back to Reports
          </Button>

          {canMarkAsSolved() && !report.is_solved && (
            <Button
              variant="contained"
              startIcon={submitting ? <CircularProgress size={16} /> : <CheckCircle />}
              onClick={handleMarkAsSolved}
              disabled={submitting}
              sx={{
                backgroundColor: colors.success[500],
                '&:hover': {
                  backgroundColor: colors.success[600],
                },
              }}
            >
              {submitting ? 'Marking...' : 'Mark as Solved'}
            </Button>
          )}

          {report.is_solved && (
            <Chip
              icon={<CheckCircle />}
              label={`Solved by ${report.solved_by_username || 'Unknown'}`}
              color="success"
              sx={{
                backgroundColor: alpha(colors.success[500], 0.1),
                color: colors.success[500],
                border: `1px solid ${colors.success[500]}`,
              }}
            />
          )}
        </Box>

        {/* Report Card */}
        <Card
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: report.is_solved
                    ? alpha(colors.success[500], 0.1)
                    : alpha(colors.warning[500], 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: report.is_solved ? colors.success[500] : colors.warning[500],
                }}
              >
                {report.is_solved ? (
                  <CheckCircle sx={{ fontSize: 24 }} />
                ) : (
                  <Warning sx={{ fontSize: 24 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                    Report #{report.id.substring(0, 8)}
                  </Typography>
                  <Chip
                    label={report.department_name}
                    size="small"
                    sx={{
                      backgroundColor: alpha(colors.primary[500], 0.1),
                      color: colors.primary[500],
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
                  Reported by {report.operator_username} • {new Date(report.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '0.9375rem',
                color: colors.neutral[200],
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                mb: 3,
              }}
            >
              {report.message}
            </Typography>

            {/* Attachments */}
            {report.attachments && report.attachments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[300], mb: 1.5 }}>
                  Attachments ({report.attachments.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {report.attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      sx={{
                        position: 'relative',
                        width: 120,
                        height: 120,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${colors.neutral[700]}`,
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: colors.primary[500],
                        },
                      }}
                      onClick={() => window.open(getImageUrl(attachment.file_url), '_blank')}
                    >
                      <img
                        src={getImageUrl(attachment.file_url)}
                        alt={attachment.file_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ borderColor: colors.neutral[800], my: 3 }} />

            {/* Comments Section */}
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
              Comments ({report.comments?.length || 0})
            </Typography>

            {/* Comments List */}
            {report.comments && report.comments.length > 0 ? (
              <Box sx={{ mb: 3 }}>
                {report.comments.map((comment) => (
                  <Box
                    key={comment.id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 2,
                      p: 2,
                      backgroundColor: colors.neutral[950],
                      borderRadius: 2,
                      border: `1px solid ${colors.neutral[800]}`,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: alpha(colors.primary[500], 0.1),
                        color: colors.primary[500],
                        fontSize: '0.875rem',
                      }}
                    >
                      {comment.user_username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
                          {comment.user_username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300], whiteSpace: 'pre-wrap' }}>
                        {comment.comment}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: colors.neutral[950],
                  borderRadius: 2,
                  border: `1px solid ${colors.neutral[800]}`,
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
                  No comments yet. Be the first to comment!
                </Typography>
              </Box>
            )}

            {/* Add Comment Form */}
            {canComment() && (
              <form onSubmit={handleAddComment}>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submittingComment}
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
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={submittingComment ? <CircularProgress size={16} /> : <Send />}
                    disabled={submittingComment || !comment.trim()}
                    sx={{
                      minWidth: 120,
                      backgroundColor: colors.primary[500],
                      '&:hover': {
                        backgroundColor: colors.primary[600],
                      },
                    }}
                  >
                    {submittingComment ? 'Sending...' : 'Send'}
                  </Button>
                </Box>
              </form>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ReportDetailPage;

