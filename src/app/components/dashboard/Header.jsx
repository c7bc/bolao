'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt, FaUser, FaClock, FaChevronDown } from 'react-icons/fa';

const Header = ({ userType, userName, onLogout, onSelectMenu }) => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentTime(formattedTime);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    updateTime();
    handleResize();

    const timer = setInterval(updateTime, 1000);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    if (['admin', 'superadmin', 'colaborador'].includes(userType)) {
      router.push('/loginAdmin');
    } else {
      router.push('/login');
    }
  };

  const handlePerfilClick = () => {
    onSelectMenu('perfil');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const headerStyles = {
    header: {
      background: 'linear-gradient(to right, #48BB78, #2F855A)',
      color: 'white',
      padding: '1rem 1.5rem',
      boxShadow: isScrolled ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
      transition: 'all 0.3s ease-in-out',
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
    },
    flexContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    titleSection: {
      display: 'flex',
      alignItems: 'center',
    },
    heading: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      letterSpacing: '-0.025em',
      marginRight: '1.5rem',
      color: 'white',
    },
    clockContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'white',
      fontSize: '0.875rem',
    },
    mobileMenu: {
      position: 'relative',
    },
    mobileButton: {
      background: 'transparent',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: '#1A202C',
      borderRadius: '0.375rem',
      marginTop: '0.5rem',
      minWidth: '160px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      zIndex: 10,
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      color: 'white',
      width: '100%',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      textAlign: 'left',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    desktopMenu: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    avatar: {
      width: '32px',
      height: '32px',
      backgroundColor: '#48BB78',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
    },
    userName: {
      fontWeight: '500',
      color: 'white',
    },
    profileButton: {
      background: 'transparent',
      border: 'none',
      color: 'white',
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      },
    },
    logoutButton: {
      backgroundColor: '#48BB78',
      border: 'none',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      '&:hover': {
        backgroundColor: '#38A169',
      },
    },
  };

  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        <div style={headerStyles.flexContainer}>
          <div style={headerStyles.titleSection}>
            <h1 style={headerStyles.heading}>Dashboard</h1>
            <div style={headerStyles.clockContainer}>
              <FaClock />
              <span>{currentTime}</span>
            </div>
          </div>

          {isMobile ? (
            <div style={headerStyles.mobileMenu}>
              <button style={headerStyles.mobileButton} onClick={toggleMenu}>
                Menu <FaChevronDown />
              </button>
              {isMenuOpen && (
                <div style={headerStyles.dropdownMenu}>
                  <button style={headerStyles.menuItem} onClick={handlePerfilClick}>
                    <FaUser /> Meu Perfil
                  </button>
                  <button style={headerStyles.menuItem} onClick={handleLogoutClick}>
                    <FaSignOutAlt /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={headerStyles.desktopMenu}>
              <div style={headerStyles.avatar}>
                {userName?.charAt(0) || 'U'}
              </div>
              <span style={headerStyles.userName}>{userName || 'Usuário'}</span>
              <button style={headerStyles.profileButton} onClick={handlePerfilClick}>
                <FaUser /> Meu Perfil
              </button>
              <button style={headerStyles.logoutButton} onClick={handleLogoutClick}>
                <FaSignOutAlt /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;