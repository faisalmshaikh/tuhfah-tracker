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
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

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

  //const storageKey = `tuhfah-tracker:${userEmail}:${subjectId}`;
  //// Fetch files from Google Drive API
  // 🔑 Firestore reference path
  const userCollection = collection(
    db,
    "users",
    userEmail,
    "subjects",
    subjectId || "unknown",
    "files"
  );
  // Fetch Drive files + Firestore progress
  useEffect(() => {
  const fetchFiles = async () => {
    if (!accessToken || !folderId) return;

    try {
        // 1. Get Drive files
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,webViewLink,mimeType)`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data = await res.json();
        const driveFiles: DriveFile[] = data.files || [];

        // 2. Get Firestore saved progress
        const snapshot = await getDocs(userCollection);
        const saved: Record<string, { watched: boolean; notes: string }> = {};
        snapshot.forEach((docSnap) => {
          saved[docSnap.id] = docSnap.data() as {
            watched: boolean;
            notes: string;

          };
        });

        // 3. Merge
        const merged = driveFiles.map((f) => ({
          ...f,
          watched: saved[f.id]?.watched ?? false,
          notes: saved[f.id]?.notes ?? "",
        }));

        setFiles(merged);
      } catch (err) {
        console.error("Error fetching files", err);
      }
    };

  fetchFiles();
}, [subjectId, accessToken, folderId]);

    // Toggle watched
    const toggleWatched = async (file: FileState) => {
    const updated = { ...file, watched: !file.watched };

    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? updated : f))
    );

    // Save to Firestore
    await setDoc(
      doc(userCollection, file.id),
      { watched: updated.watched, notes: updated.notes },
      { merge: true }
    );
  };

  // Open notes dialog
  const handleOpenNotes = (file: FileState) => {
    setSelectedFile(file);
    setNoteDraft(file.notes);
  };

  // Save notes to Firestore
  const handleSaveNotes = async () => {
    if (selectedFile) {
      const updated = { ...selectedFile, notes: noteDraft };

      setFiles((prev) =>
        prev.map((f) => (f.id === selectedFile.id ? updated : f))
      );

      await setDoc(
        doc(userCollection, selectedFile.id),
        { watched: updated.watched, notes: updated.notes },
        { merge: true }
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
                  onChange={() => toggleWatched(file)}
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
