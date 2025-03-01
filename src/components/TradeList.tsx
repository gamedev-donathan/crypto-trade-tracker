import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton,
  ButtonGroup,
  Menu,
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import { useTrades } from '../context/TradeContext';
import { Trade } from '../types';

const TradeList: React.FC = () => {
  const { trades, updateStopLoss, closeTrade, deleteTrade, importTrades } = useTrades();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openStopLossDialog, setOpenStopLossDialog] = useState(false);
  const [openCloseTradeDialog, setOpenCloseTradeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [newStopLoss, setNewStopLoss] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [sortField, setSortField] = useState<keyof Trade>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Export/Import state
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [importAnchorEl, setImportAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle stop loss dialog
  const handleOpenStopLossDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setNewStopLoss(trade.stopLoss.toString());
    setOpenStopLossDialog(true);
  };
  
  const handleCloseStopLossDialog = () => {
    setOpenStopLossDialog(false);
    setSelectedTrade(null);
  };
  
  const handleUpdateStopLoss = () => {
    if (selectedTrade && newStopLoss) {
      updateStopLoss(selectedTrade.id, parseFloat(newStopLoss));
      handleCloseStopLossDialog();
    }
  };
  
  // Handle close trade dialog
  const handleOpenCloseTradeDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setExitPrice(trade.entryPrice.toString());
    setOpenCloseTradeDialog(true);
  };
  
  const handleCloseTradeDialog = () => {
    setOpenCloseTradeDialog(false);
    setSelectedTrade(null);
  };
  
  const handleCloseTrade = () => {
    if (selectedTrade && exitPrice) {
      closeTrade(selectedTrade.id, parseFloat(exitPrice));
      handleCloseTradeDialog();
    }
  };
  
  // Handle delete dialog
  const handleOpenDeleteDialog = (trade: Trade) => {
    setSelectedTrade(trade);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTrade(null);
  };
  
  const handleDeleteTrade = () => {
    if (selectedTrade) {
      deleteTrade(selectedTrade.id);
      handleCloseDeleteDialog();
    }
  };
  
  // Handle sorting
  const handleSort = (field: keyof Trade) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Export menu
  const handleExportClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };
  
  // Import menu
  const handleImportClick = (event: React.MouseEvent<HTMLElement>) => {
    setImportAnchorEl(event.currentTarget);
  };

  const handleImportClose = () => {
    setImportAnchorEl(null);
  };
  
  // Export to JSON
  const handleExportJSON = () => {
    try {
      const jsonData = JSON.stringify(trades, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-trades-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbarMessage('Trades exported successfully to JSON');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      setSnackbarMessage('Error exporting trades to JSON');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    handleExportClose();
  };
  
  // Export to CSV
  const handleExportCSV = () => {
    try {
      // Define CSV headers
      const headers = [
        'id',
        'cryptocurrency',
        'coinId',
        'entryPrice',
        'exitPrice',
        'quantity',
        'quantityType',
        'stopLoss',
        'entryDate',
        'exitDate',
        'notes',
        'isActive'
      ].join(',');
      
      // Convert trades to CSV rows
      const rows = trades.map(trade => {
        return [
          trade.id,
          `"${trade.cryptocurrency}"`, // Wrap in quotes to handle commas in names
          trade.coinId,
          trade.entryPrice,
          trade.exitPrice || '',
          trade.quantity,
          trade.quantityType,
          trade.stopLoss,
          trade.entryDate,
          trade.exitDate || '',
          `"${trade.notes || ''}"`, // Wrap in quotes to handle commas in notes
          trade.isActive
        ].join(',');
      });
      
      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crypto-trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbarMessage('Trades exported successfully to CSV');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setSnackbarMessage('Error exporting trades to CSV');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    handleExportClose();
  };
  
  // Import from JSON
  const handleImportJSON = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'application/json';
      fileInputRef.current.click();
    }
    handleImportClose();
  };
  
  // Import from CSV
  const handleImportCSV = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.csv';
      fileInputRef.current.click();
    }
    handleImportClose();
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          // Parse JSON
          const importedTrades = JSON.parse(content);
          importTrades(importedTrades);
          setSnackbarMessage(`Successfully imported ${importedTrades.length} trades from JSON`);
          setSnackbarSeverity('success');
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          
          const importedTrades = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = parseCSVLine(line);
            const trade: any = {};
            
            headers.forEach((header, index) => {
              if (header === 'entryPrice' || header === 'exitPrice' || header === 'quantity' || header === 'stopLoss') {
                trade[header] = values[index] ? parseFloat(values[index]) : null;
              } else if (header === 'isActive') {
                trade[header] = values[index] === 'true';
              } else {
                trade[header] = values[index];
              }
            });
            
            return trade as Trade;
          });
          
          importTrades(importedTrades);
          setSnackbarMessage(`Successfully imported ${importedTrades.length} trades from CSV`);
          setSnackbarSeverity('success');
        }
      } catch (error) {
        console.error('Error importing file:', error);
        setSnackbarMessage('Error importing trades. Please check the file format.');
        setSnackbarSeverity('error');
      }
      
      setSnackbarOpen(true);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      reader.readAsText(file);
    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      setSnackbarMessage('Unsupported file format. Please use JSON or CSV.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Helper function to parse CSV lines correctly (handling quoted values with commas)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    
    // Remove quotes from quoted values
    return result.map(value => {
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.substring(1, value.length - 1);
      }
      return value;
    });
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Sort trades
  const sortedTrades = [...trades].sort((a, b) => {
    if (sortField === 'entryDate' || sortField === 'exitDate') {
      const dateA = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
      const dateB = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (
      sortField === 'entryPrice' || 
      sortField === 'exitPrice' || 
      sortField === 'quantity' || 
      sortField === 'stopLoss'
    ) {
      const numA = a[sortField] || 0;
      const numB = b[sortField] || 0;
      return sortDirection === 'asc' ? (numA as number) - (numB as number) : (numB as number) - (numA as number);
    } else {
      const strA = String(a[sortField] || '').toLowerCase();
      const strB = String(b[sortField] || '').toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    }
  });
  
  // Filter active and closed trades
  const activeTrades = sortedTrades.filter(trade => trade.isActive);
  const closedTrades = sortedTrades.filter(trade => !trade.isActive);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Calculate profit/loss
  const calculateProfitLoss = (trade: Trade) => {
    if (!trade.exitPrice) return null;
    
    const isShort = trade.cryptocurrency.toLowerCase().includes('short');
    
    // Calculate actual quantity in coins if input is in dollars
    const actualQuantity = trade.quantityType === 'dollars' 
      ? trade.quantity / trade.entryPrice 
      : trade.quantity;
    
    const profitLoss = (trade.exitPrice - trade.entryPrice) * actualQuantity * (isShort ? -1 : 1);
    const profitLossPercentage = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100 * (isShort ? -1 : 1);
    
    return {
      value: profitLoss,
      percentage: profitLossPercentage
    };
  };
  
  // Format quantity with type
  const formatQuantity = (trade: Trade) => {
    if (trade.quantityType === 'coins') {
      return trade.quantity.toString();
    } else {
      return `$${trade.quantity.toFixed(2)}`;
    }
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Trade List
        </Typography>
        <Box>
          <ButtonGroup variant="contained" sx={{ mr: 1 }}>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={handleExportClick}
              color="primary"
            >
              Export
            </Button>
            <Button
              startIcon={<FileUploadIcon />}
              onClick={handleImportClick}
              color="secondary"
            >
              Import
            </Button>
          </ButtonGroup>
          
          {/* Hidden file input for import */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          {/* Export Menu */}
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={handleExportJSON}>Export as JSON</MenuItem>
            <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
          </Menu>
          
          {/* Import Menu */}
          <Menu
            anchorEl={importAnchorEl}
            open={Boolean(importAnchorEl)}
            onClose={handleImportClose}
          >
            <MenuItem onClick={handleImportJSON}>Import from JSON</MenuItem>
            <MenuItem onClick={handleImportCSV}>Import from CSV</MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Active Trades */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Active Trades
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('cryptocurrency')}>
                  Cryptocurrency
                  {sortField === 'cryptocurrency' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('entryPrice')}>
                  Entry Price
                  {sortField === 'entryPrice' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                  Quantity
                  {sortField === 'quantity' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('stopLoss')}>
                  Stop Loss
                  {sortField === 'stopLoss' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleSort('entryDate')}>
                  Entry Date
                  {sortField === 'entryDate' && (
                    sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                  )}
                </Box>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeTrades.length > 0 ? (
              activeTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>
                      {trade.cryptocurrency.toLowerCase().includes('short') ? (
                        <Chip label="SHORT" color="error" size="small" sx={{ mr: 1 }} />
                      ) : null}
                      {trade.cryptocurrency}
                    </TableCell>
                    <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      {formatQuantity(trade)}
                      {trade.quantityType === 'dollars' && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          ≈ {(trade.quantity / trade.entryPrice).toFixed(8)} coins
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>${trade.stopLoss.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(trade.entryDate)}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit Stop Loss">
                        <IconButton onClick={() => handleOpenStopLossDialog(trade)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Close Trade">
                        <IconButton onClick={() => handleOpenCloseTradeDialog(trade)} color="success">
                          <DoneIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Trade">
                        <IconButton onClick={() => handleOpenDeleteDialog(trade)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No active trades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {activeTrades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={activeTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>
      
      {/* Closed Trades */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Closed Trades
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cryptocurrency</TableCell>
              <TableCell>Entry Price</TableCell>
              <TableCell>Exit Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Profit/Loss</TableCell>
              <TableCell>Entry Date</TableCell>
              <TableCell>Exit Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closedTrades.length > 0 ? (
              closedTrades
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((trade) => {
                  const profitLoss = calculateProfitLoss(trade);
                  return (
                    <TableRow key={trade.id}>
                      <TableCell>
                        {trade.cryptocurrency.toLowerCase().includes('short') ? (
                          <Chip label="SHORT" color="error" size="small" sx={{ mr: 1 }} />
                        ) : null}
                        {trade.cryptocurrency}
                      </TableCell>
                      <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell>${trade.exitPrice?.toFixed(2)}</TableCell>
                      <TableCell>
                        {formatQuantity(trade)}
                        {trade.quantityType === 'dollars' && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            ≈ {(trade.quantity / trade.entryPrice).toFixed(8)} coins
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {profitLoss && (
                          <Typography 
                            color={profitLoss.value >= 0 ? 'success.main' : 'error.main'}
                          >
                            ${profitLoss.value.toFixed(2)} ({profitLoss.percentage.toFixed(2)}%)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(trade.entryDate)}</TableCell>
                      <TableCell>{trade.exitDate ? formatDate(trade.exitDate) : 'N/A'}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete Trade">
                          <IconButton onClick={() => handleOpenDeleteDialog(trade)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No closed trades
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {closedTrades.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={closedTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>
      
      {/* Stop Loss Dialog */}
      <Dialog open={openStopLossDialog} onClose={handleCloseStopLossDialog}>
        <DialogTitle>Update Stop Loss</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Stop Loss"
            type="number"
            fullWidth
            value={newStopLoss}
            onChange={(e) => setNewStopLoss(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStopLossDialog}>Cancel</Button>
          <Button onClick={handleUpdateStopLoss} color="primary">Update</Button>
        </DialogActions>
      </Dialog>
      
      {/* Close Trade Dialog */}
      <Dialog open={openCloseTradeDialog} onClose={handleCloseTradeDialog}>
        <DialogTitle>Close Trade</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Exit Price"
            type="number"
            fullWidth
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTradeDialog}>Cancel</Button>
          <Button onClick={handleCloseTrade} color="primary">Close Trade</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Trade Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Trade</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trade? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteTrade} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TradeList; 