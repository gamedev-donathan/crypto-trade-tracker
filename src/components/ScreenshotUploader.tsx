import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Grid, 
  IconButton, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import { 
  AddPhotoAlternate as AddPhotoIcon, 
  Delete as DeleteIcon, 
  ContentPaste as PasteIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { Screenshot } from '../types';

interface ScreenshotUploaderProps {
  screenshots: Screenshot[];
  onScreenshotsChange: (screenshots: Screenshot[]) => void;
  screenshotType?: 'entry' | 'exit' | 'partial' | 'other';
}

const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({ 
  screenshots, 
  onScreenshotsChange,
  screenshotType = 'other'
}) => {
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [editingScreenshot, setEditingScreenshot] = useState<Screenshot | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  
  // Set up clipboard paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement === pasteAreaRef.current || pasteAreaRef.current?.contains(document.activeElement)) {
        const items = e.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const blob = items[i].getAsFile();
              if (blob) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    addScreenshot(event.target.result as string);
                  }
                };
                reader.readAsDataURL(blob);
              }
            }
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          addScreenshot(e.target.result as string);
        }
      };
      
      reader.readAsDataURL(file);
      
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const addScreenshot = (data: string) => {
    const newScreenshot: Screenshot = {
      id: uuidv4(),
      data,
      timestamp: new Date().toISOString(),
      type: screenshotType
    };
    
    onScreenshotsChange([...screenshots, newScreenshot]);
  };
  
  const deleteScreenshot = (id: string) => {
    onScreenshotsChange(screenshots.filter(screenshot => screenshot.id !== id));
  };
  
  const openPreview = (data: string) => {
    setPreviewImage(data);
    setPreviewOpen(true);
  };
  
  const closePreview = () => {
    setPreviewOpen(false);
  };
  
  const openEditDialog = (screenshot: Screenshot) => {
    setEditingScreenshot(screenshot);
    setEditLabel(screenshot.label || '');
    setEditDialogOpen(true);
  };
  
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingScreenshot(null);
    setEditLabel('');
  };
  
  const saveLabel = () => {
    if (editingScreenshot) {
      const updatedScreenshots = screenshots.map(screenshot => 
        screenshot.id === editingScreenshot.id 
          ? { ...screenshot, label: editLabel }
          : screenshot
      );
      onScreenshotsChange(updatedScreenshots);
      closeEditDialog();
    }
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Screenshots
      </Typography>
      
      <Box 
        ref={pasteAreaRef}
        sx={{ 
          border: '2px dashed #ccc', 
          borderRadius: 1, 
          p: 2, 
          mb: 2, 
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: '#f0f7ff'
          },
          tabIndex: 0 // Make div focusable for paste events
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <AddPhotoIcon fontSize="large" color="primary" />
          <Typography variant="body1">
            Click to upload or drag & drop
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can also paste (Ctrl+V) screenshots directly
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<PasteIcon />}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.read().then(items => {
                for (const item of items) {
                  if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    item.getType(item.types.find(type => type.startsWith('image/')) || 'image/png')
                      .then(blob => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            addScreenshot(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(blob);
                      });
                  }
                }
              }).catch(err => {
                console.error('Failed to read clipboard contents: ', err);
              });
            }}
            sx={{ mt: 1 }}
          >
            Paste from Clipboard
          </Button>
        </Box>
      </Box>
      
      {screenshots.length > 0 && (
        <Grid container spacing={2}>
          {screenshots.map((screenshot) => (
            <Grid item xs={12} sm={6} md={4} key={screenshot.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={screenshot.data}
                  alt={screenshot.label || "Screenshot"}
                  sx={{ objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => openPreview(screenshot.data)}
                />
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="body2" noWrap>
                    {screenshot.label || new Date(screenshot.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Tooltip title="View Full Size">
                    <IconButton size="small" onClick={() => openPreview(screenshot.data)}>
                      <FullscreenIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Label">
                    <IconButton size="small" onClick={() => openEditDialog(screenshot)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => deleteScreenshot(screenshot.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <img 
            src={previewImage} 
            alt="Screenshot Preview" 
            style={{ width: '100%', height: 'auto' }} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
          <Button 
            onClick={() => {
              // Create a temporary anchor element to download the image
              const a = document.createElement('a');
              a.href = previewImage;
              a.download = `screenshot-${new Date().toISOString().replace(/:/g, '-')}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Label Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={closeEditDialog}
      >
        <DialogTitle>Edit Screenshot Label</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Label"
            fullWidth
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button onClick={saveLabel}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScreenshotUploader; 