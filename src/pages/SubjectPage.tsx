import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";

interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
}

interface FileState extends DriveFile {
  watched: boolean;
  notes: string;
}

interface SubjectPageProps {
  userEmail: string;
  accessToken: string; // 👈 must be the access_token from useGoogleLogin
  folderMap: Record<string, string> // 👈 Google Drive folder ID for this subject
}

export default function SubjectPage({
  userEmail,
  accessToken,
  folderMap,
}: SubjectPageProps) {
  const { subjectId } = useParams<{ subjectId: string }>();
  const folderId = subjectId ? folderMap[subjectId] : null;
  const [files, setFiles] = useState<FileState[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileState | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const storageKey = `tuhfah-tracker:${userEmail}:${subjectId}`;
 //console.warn("folderId - " + folderId);
 //console.warn("access token - " + accessToken);
  // Fetch files from Google Drive API
  useEffect(() => {
  const fetchFiles = async () => {
    if (!accessToken || !folderId) return;

    // Load saved state from localStorage first
    const saved = localStorage.getItem(storageKey);
    let savedState: Record<string, { watched: boolean; notes: string }> = {};
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.forEach((f: any) => {
          savedState[f.id] = { watched: f.watched, notes: f.notes };
        });
      } catch {
        console.warn("Invalid saved state, ignoring");
      }
    }

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,webViewLink,mimeType)`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();
    const driveFiles: DriveFile[] = data.files || [];

    setFiles((prev) =>
      driveFiles.map((f) => ({
        ...f,
        // Prefer savedState first, then prev in-memory state
        watched:
          savedState[f.id]?.watched ??
          prev.find((p) => p.id === f.id)?.watched ??
          false,
        notes:
          savedState[f.id]?.notes ??
          prev.find((p) => p.id === f.id)?.notes ??
          "",
      }))
    );
  };

  fetchFiles();
}, [subjectId, accessToken, folderId, storageKey]);


  // Persist watched + notes state
  useEffect(() => {
    if (files.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(files));
    }
  }, [files, storageKey]);

  const toggleWatched = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, watched: !f.watched } : f
      )
    );
  };

  const handleOpenNotes = (file: FileState) => {
    setSelectedFile(file);
    setNoteDraft(file.notes);
  };

  const handleSaveNotes = () => {
    if (selectedFile) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === selectedFile.id ? { ...f, notes: noteDraft } : f
        )
      );
    }
    setSelectedFile(null);
  };

  return (
    <div>
      <h2>{subjectId?.replace("-", " ").toUpperCase()}</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File</TableCell>
            <TableCell>Watched</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {file.name}
                </a>
              </TableCell>
              <TableCell>
                <Checkbox
                  checked={file.watched}
                  onChange={() => toggleWatched(file.id)}
                />
              </TableCell>
              <TableCell>
                <IconButton onClick={() => handleOpenNotes(file)}>
                  <NotesIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedFile} onClose={() => setSelectedFile(null)}>
        <DialogTitle>Notes for {selectedFile?.name}</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            rows={4}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedFile(null)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
