import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Skeleton,
  alpha,
} from '@mui/material';
import { colors } from '../../theme';

interface Column<T> {
  id: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    rowsPerPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
  };
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}

function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data available',
  pagination,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        {columns.map((col) => (
          <TableCell key={col.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  return (
    <Box
      sx={{
        backgroundColor: colors.neutral[900],
        border: `1px solid ${colors.neutral[800]}`,
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <TableContainer
        sx={{
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: colors.neutral[800],
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: colors.neutral[700],
            borderRadius: 4,
            '&:hover': {
              backgroundColor: colors.neutral[600],
            },
          },
        }}
      >
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  sx={{
                    width: col.width,
                    backgroundColor: colors.neutral[900],
                    borderBottom: `1px solid ${colors.neutral[800]}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: colors.neutral[400],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    px: { xs: 1, md: 2 },
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  sx={{
                    textAlign: 'center',
                    py: 6,
                    color: colors.neutral[500],
                  }}
                >
                  <Typography sx={{ fontSize: '0.9375rem' }}>{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: alpha(colors.neutral[500], 0.04),
                    },
                    '&:last-child td': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align || 'left'}
                      sx={{
                        borderBottom: `1px solid ${colors.neutral[800]}`,
                        py: 1.5,
                        px: { xs: 1, md: 2 },
                        fontSize: '0.875rem',
                        color: colors.neutral[200],
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.render ? col.render(row) : (row as any)[col.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          onPageChange={(_, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(e) => pagination.onRowsPerPageChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            borderTop: `1px solid ${colors.neutral[800]}`,
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: '0.8125rem',
              color: colors.neutral[400],
            },
            '.MuiTablePagination-select': {
              fontSize: '0.8125rem',
            },
          }}
        />
      )}
    </Box>
  );
}

export default DataTable;

