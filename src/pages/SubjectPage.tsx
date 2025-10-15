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
  Breadcrumbs,
  Link as MuiLink,
  Typography,
} from "@mui/material";
import NotesIcon from "@mui/icons-material/Notes";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
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
  mimeType: string;
  webViewLink?: string;
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
  const rootFolderId = subjectId ? folderMap[subjectId] : null;
  const [files, setFiles] = useState<FileState[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileState | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
 const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>(
    []
  );
  const [currentFolderId, setCurrentFolderId] = useState(rootFolderId || "");

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

useEffect(() => {
  if (!folderMap || !subjectId) return;

  const rootFolderId = folderMap[subjectId];
  if (rootFolderId) {
    setCurrentFolderId(rootFolderId);
  } else {
    console.warn("⚠️ No folder found for subject:", subjectId);
  }
}, [folderMap, subjectId]);
  // Fetch Drive files + Firestore progress
 useEffect(() => {
  if (!accessToken || !currentFolderId) return;

  const fetchFiles = async () => {
    try {
      // 1️⃣ Get Drive files
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${currentFolderId}'+in+parents&fields=files(id,name,webViewLink,mimeType)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const data = await res.json();

      const driveFiles: DriveFile[] = data.files || [];

      // 2️⃣ Get Firestore saved progress
      const snapshot = await getDocs(userCollection);
      const saved: Record<string, { watched: boolean; notes: string }> = {};
      snapshot.forEach((docSnap) => {
        saved[docSnap.id] = docSnap.data() as {
          watched: boolean;
          notes: string;
        };
      });

      // 3️⃣ Merge both datasets
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
}, [accessToken, currentFolderId]);


  // 🔄 Handle folder click
  const handleOpenFolder = (folder: DriveFile) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  // 🔙 Go back to previous folder
  const handleBreadcrumbClick = (index: number) => {
    const newTrail = breadcrumbs.slice(0, index);
    setBreadcrumbs(newTrail);
    if (index === 0) {
      setCurrentFolderId(rootFolderId!);
    } else {
      setCurrentFolderId(breadcrumbs[index - 1].id);
    }
  };
  
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

const isFolder = (file: DriveFile) => file.mimeType === "application/vnd.google-apps.folder";

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        {subjectId?.replace("-", " ").toUpperCase()}
      </Typography>

      {/* 🧭 Breadcrumb navigation */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <MuiLink
            underline="hover"
            color="inherit"
            onClick={() => {
              setBreadcrumbs([]);
              setCurrentFolderId(rootFolderId!);
            }}
            sx={{ cursor: "pointer" }}
          >
            Root
          </MuiLink>
          {breadcrumbs.map((crumb, i) => (
            <MuiLink
              key={crumb.id}
              underline="hover"
              color={i === breadcrumbs.length - 1 ? "text.primary" : "inherit"}
              sx={{ cursor: "pointer" }}
              onClick={() => handleBreadcrumbClick(i)}
            >
              {crumb.name}
            </MuiLink>
          ))}
        </Breadcrumbs>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File / Folder</TableCell>
            <TableCell>Watched</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell>
                {isFolder(file) ? (
                  <Button
                    startIcon={<FolderIcon />}
                    onClick={() => handleOpenFolder(file)}
                  >
                    {file.name}
                  </Button>
                ) : (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
                  >
                    <InsertDriveFileIcon sx={{ mr: 1 }} />
                    {file.name}
                  </a>
                )}
              </TableCell>
              <TableCell>
                {!isFolder(file) && (
                  <Checkbox
                    checked={file.watched}
                    onChange={() => toggleWatched(file)}
                  />
                )}
              </TableCell>
              <TableCell>
                {!isFolder(file) && (
                  <IconButton onClick={() => handleOpenNotes(file)}>
                    <NotesIcon />
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 📝 Notes dialog */}				   
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
