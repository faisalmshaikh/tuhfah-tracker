import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  CollectionReference, 
  DocumentData
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Box,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

interface FolderConfig {
  id?: string;
  year: number;
  subject: string;
  folderId: string;
}

export default function AdminScreen() {
  const [configs, setConfigs] = useState<FolderConfig[]>([]);
  const [open, setOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FolderConfig | null>(null);
  const [form, setForm] = useState<FolderConfig>({ year: 1, subject: "", folderId: "" });

  const folderCollection = collection(db, "config", "folders", "items") as CollectionReference<DocumentData>;

  const fetchConfigs = async () => {
    const snapshot = await getDocs(folderCollection);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FolderConfig));
    setConfigs(data);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    if (editingConfig) {
      // Update
      const ref = doc(folderCollection, editingConfig.id);
      await updateDoc(ref, form as any);
    } else {
      // Add new
      await addDoc(folderCollection, form as any);
    }
    setOpen(false);
    setForm({ year: 1, subject: "", folderId: "" });
    setEditingConfig(null);
    fetchConfigs();
  };

  const handleEdit = (cfg: FolderConfig) => {
    setEditingConfig(cfg);
    setForm(cfg);
    setOpen(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await deleteDoc(doc(folderCollection, id));
    fetchConfigs();
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        📁 Admin Configuration
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Add Configuration
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Year</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Folder ID</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {configs.map((cfg) => (
            <TableRow key={cfg.id}>
              <TableCell>{cfg.year}</TableCell>
              <TableCell>{cfg.subject}</TableCell>
              <TableCell>{cfg.folderId}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleEdit(cfg)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(cfg.id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editingConfig ? "Edit Configuration" : "Add Configuration"}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Year"
            type="number"
            fullWidth
            margin="dense"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
          />
          <TextField
            label="Subject"
            fullWidth
            margin="dense"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <TextField
            label="Folder ID"
            fullWidth
            margin="dense"
            value={form.folderId}
            onChange={(e) => setForm({ ...form, folderId: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
