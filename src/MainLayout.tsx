import React, { useState } from 'react';
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

interface MainLayoutProps {
  user: GoogleUser;
  onLogout: () => void;
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

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
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

  const subjects = [
    { id: 'subject-a', label: 'Qisas' },
    { id: 'subject-b', label: 'Nahw' },
    { id: 'subject-c', label: 'Sarf' },
    { id: 'subject-d', label: 'Quduri' },
    { id: 'subject-e', label: 'Quran' },
    { id: 'subject-f', label: 'Tarbiyyah' },
  ];

	const folderMap: Record<string, string> = {
	  'subject-a': '1uKLo5IvIzvWj8-7YMThisCITBpJRceiD',
	  'subject-b': '1wff8EW8MdhibXBTS9ly8kvD8F24O79jn',
	  'subject-c': '1DYUFj7R1XYfgOD8GvXh9gNqtdNGbxgh7',
	  'subject-d': '1Ka86L_xKjWtRQ_TWgzsYp98y59FM4Xkv',
	  'subject-e': '1vdesCROBmriPVl_wY3Vzz0DR0OwSeUyc',
	  'subject-f': '1KFcOSzeGjLOwAgwtzceob_24sRTKx5Jd',
	};
	
  return (
    <div style={{ display: 'flex' }}>
      <CssBaseline />
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
                <MenuItem disabled>{user.name}</MenuItem>
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
          <Route path="/" element={<Navigate to="/subject-a" replace />} />
          <Route
			path="/:subjectId"
			element={
			  <SubjectPage
				userEmail={user.email}
				accessToken={user.token}
				folderMap={folderMap} // later derive from subjectId
			  />
			}
		  />
        </Routes>
      </Main>
    </div>
  );
}
