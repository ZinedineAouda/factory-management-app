import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  alpha,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Description,
  Download,
  Visibility,
  FilterList,
  Refresh,
  Add,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { DataTable, EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Report {
  id: string;
  department_id: string;
  operator_id: string;
  message: string;
  created_at: string;
  operator_username: string;
  department_name: string;
}

const ReportsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.REPORTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      id: 'message',
      label: 'Report Message',
      render: (row: Report) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: alpha(colors.primary[500], 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary[400],
            }}
          >
            <Description sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
              {row.message.length > 60 ? `${row.message.substring(0, 60)}...` : row.message}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
              {row.department_name}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'operator',
      label: 'Created By',
      width: 150,
      render: (row: Report) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
          {row.operator_username}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 150,
      render: (row: Report) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
          {new Date(row.created_at).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      width: 120,
      align: 'right' as const,
      render: (_row: Report) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="View Report">
            <IconButton size="small">
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small">
              <Download sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer
      title="Reports"
      subtitle="View and manage production and maintenance reports"
      actions={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<FilterList />}>
            Filters
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReports}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            Create Report
          </Button>
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!loading && reports.length === 0 ? (
        <Box
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 3,
          }}
        >
          <EmptyState
            icon={<Description />}
            title="No reports yet"
            description="Create your first report to track production and maintenance activities."
            action={{
              label: 'Create Report',
              onClick: () => console.log('Create report'),
            }}
          />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          loading={loading}
          rowKey={(row) => row.id}
          emptyMessage="No reports found"
        />
      )}
    </PageContainer>
  );
};

export default ReportsPage;
