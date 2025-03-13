import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { FolderOpen as FolderIcon } from '@mui/icons-material';

interface PermissionRequestProps {
  open: boolean;
  onClose: () => void;
  onRequestPermission: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({
  open,
  onClose,
  onRequestPermission
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="permission-dialog-title"
      aria-describedby="permission-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="permission-dialog-title">
        <Box display="flex" alignItems="center">
          <FolderIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">File System Access Permission</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="permission-dialog-description">
          <Typography paragraph>
            This application needs permission to access your file system to enable auto-save and auto-import features.
          </Typography>
          <Typography paragraph>
            When prompted, please select a folder where you'd like to store your trade data backups. 
            The application will create a <code>save_data</code> folder within the selected location.
          </Typography>
          <Typography paragraph>
            If you have existing backup files (with names like <code>crypto-trades-backup-*.zip</code>) in the folder you select, 
            the application will automatically import the most recent one.
          </Typography>
          <Typography paragraph>
            Your data will be automatically saved to this location at the interval you specify in settings, 
            and the most recent backup will be automatically imported when you start the application.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Note: You can change these settings later in the Settings page.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Skip for Now
        </Button>
        <Button onClick={onRequestPermission} color="primary" variant="contained">
          Grant Permission
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PermissionRequest; 