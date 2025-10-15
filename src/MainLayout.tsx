import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  CssBaseline,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Button,
  Box,
  Menu,
  MenuItem,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import BookIcon from '@mui/icons-material/Book';
import { styled, useTheme } from '@mui/material/styles';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import SubjectPage from './pages/SubjectPage';
import { GoogleUser } from './LoginScreen'; 
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import AdminScreen from "./pages/AdminScreen";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";


interface MainLayoutProps {
  user: GoogleUser;
  onLogout: () => void;
  setUser: React.Dispatch<React.SetStateAction<GoogleUser | null>>;
}

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth - 60}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const DrawerStyled = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : 60,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  },
}));

export default function MainLayout({ user, onLogout, setUser }: MainLayoutProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    onLogout();
  };

  
  const [subjects, setSubjects] = useState<{ id: string; label: string }[]>([]);
  const [folderMap, setFolderMap] = useState<Record<string, string>>({});	
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [yearDraft, setYearDraft] = useState(user.year || 1);

  const handleYearSave = () => {
    if (yearDraft >= 1 && yearDraft <= 8) {
      const updatedUser = { ...user, year: yearDraft };
      setUser(updatedUser);
      localStorage.setItem("tuhfah-user", JSON.stringify(updatedUser));
      localStorage.setItem("tuhfah-year", yearDraft.toString());
      setYearDialogOpen(false);
    } else {
      alert("Year must be between 1 and 8.");
    }
  };
 
 useEffect(() => {
  const fetchFolders = async () => {
    try {
      const snapshot = await getDocs(collection(db, "config", "folders", "items"));
      const data = snapshot.docs.map((doc) => doc.data() as { year: number; subject: string; folderId: string });

      // Filter by the logged-in user’s year (from localStorage)
      const userYear = Number(localStorage.getItem("tuhfah-year"));
      const filtered = data.filter((d) => d.year === userYear);

      // Create subject list and folder map
      const subjectList = filtered.map((d) => ({
        id: d.subject.toLowerCase().replace(/\s+/g, "-"), // e.g. 'Subject A' → 'subject-a'
        label: d.subject,
      }));

      const map: Record<string, string> = {};
      filtered.forEach((d) => {
        map[d.subject.toLowerCase().replace(/\s+/g, "-")] = d.folderId;
      });

      setSubjects(subjectList);
      setFolderMap(map);
    } catch (err) {
      console.error("Error loading folder configs:", err);
    }
  };

  fetchFolders();
}, []);

	
  return (
    <div style={{ display: 'flex' }}>
      <CssBaseline />
	  <Dialog open={yearDialogOpen} onClose={() => setYearDialogOpen(false)}>
        <DialogTitle>Edit Year</DialogTitle>
        <DialogContent>
          <TextField
            type="number"
            label="Year (1-8)"
            value={yearDraft}
            onChange={(e) => setYearDraft(parseInt(e.target.value))}
            fullWidth
            inputProps={{ min: 1, max: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleYearSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <AppBar position="fixed" style={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              Tuhfah Tracker
            </Typography>
          </Box>

          {/* ✅ Right side user controls */}
          {isMobile ? (
            <>
              <IconButton onClick={handleMenuOpen}>
                <Avatar src={user.picture} alt={user.name} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>{user.name} {user.year ? `(Year ${user.year})` : ""}</MenuItem>
                <MenuItem onClick={() => setYearDialogOpen(true)}>Edit Year</MenuItem>
                <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">{user.name}</Typography>
              <Avatar src={user.picture} alt={user.name} />
              <Button color="inherit" onClick={onLogout}>
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <DrawerStyled variant="permanent" open={open}>
        <Toolbar />
        <Divider />
        <List>
  {subjects.map((s) => (
    <ListItem key={s.id} disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        component={Link}
        to={`/${s.id}`}
        sx={{
          minHeight: 48,
          justifyContent: open ? 'initial' : 'center',
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 3 : 'auto',
            justifyContent: 'center',
          }}
        >
          <BookIcon />
        </ListItemIcon>
        <ListItemText primary={s.label} sx={{ opacity: open ? 1 : 0 }} />
      </ListItemButton>
    </ListItem>
  ))}
</List>
      </DrawerStyled>
	  
      <Main open={open}>
        <Toolbar />
        <Routes>
          <Route path="/admin" element={<AdminScreen />} />
		  <Route path="/" element={<Navigate to={`/${subjects[0]?.id || ""}`} replace />} />
			<Route
			  path="/:subjectId"
			  element={
				<SubjectPage
				  userEmail={user.email}
				  accessToken={user.token}
				  folderMap={folderMap}
				/>
			  }
			/>

        </Routes>
      </Main>
    </div>
  );
}
