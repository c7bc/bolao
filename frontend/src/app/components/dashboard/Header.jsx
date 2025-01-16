'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaSignOutAlt, FaUser, FaClock, FaBars, FaChevronDown } from 'react-icons/fa';

const Header = ({ userType, userName, onLogout, onSelectMenu, toggleSidebar }) => {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const updateTime = useCallback(() => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setCurrentTime(formattedTime);
  }, []);

  const handleResize = useCallback(() => {
    setIsMobileView(window.innerWidth < 768);
  }, []);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
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
  }, [updateTime, handleScroll, handleResize]);

  const handleLogoutClick = useCallback(() => {
    onLogout();
    if (['admin', 'superadmin', 'colaborador'].includes(userType)) {
      router.push('/loginAdmin');
    } else {
      router.push('/login');
    }
    setIsMenuOpen(false);
  }, [onLogout, userType, router]);

  const handlePerfilClick = useCallback(() => {
    onSelectMenu('perfil');
    setIsMenuOpen(false);
  }, [onSelectMenu]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50
      bg-gradient-to-r from-green-500 to-green-700
      transition-all duration-300 ease-in-out
      ${isScrolled ? 'shadow-lg' : 'shadow-none'}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Seção Esquerda - Logo e Menu Mobile */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-white 
                hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white
                md:hidden"
              aria-label="Menu principal"
            >
              <FaBars className="h-6 w-6" />
            </button>

            <h1 className="ml-4 text-xl font-bold text-white md:text-2xl">
              Dashboard
            </h1>

            <div className="hidden md:flex items-center ml-6 space-x-2 text-white">
              <FaClock className="h-5 w-5" />
              <span className="text-sm font-medium">{currentTime}</span>
            </div>
          </div>

          {/* Seção Direita - Perfil e Ações */}
          <div className="flex items-center">
            {/* Versão Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {userName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-white font-medium">
                  {userName || 'Usuário'}
                </span>
              </div>

              <button
                onClick={handlePerfilClick}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white 
                  rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-offset-green-600 focus:ring-white
                  transition duration-150 ease-in-out"
              >
                <FaUser className="mr-2 h-4 w-4" />
                Meu Perfil
              </button>

              <button
                onClick={handleLogoutClick}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white 
                  bg-green-600 rounded-md hover:bg-green-700 focus:outline-none 
                  focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-600 
                  focus:ring-white transition duration-150 ease-in-out"
              >
                <FaSignOutAlt className="mr-2 h-4 w-4" />
                Sair
              </button>
            </div>

            {/* Versão Mobile */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-white
                  hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-inset 
                  focus:ring-white"
                aria-expanded="false"
              >
                <span className="sr-only">Abrir menu de usuário</span>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {userName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <FaChevronDown className="ml-2 h-4 w-4" />
                </div>
              </button>

              {/* Menu Mobile Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <p className="font-medium">{userName || 'Usuário'}</p>
                    <p className="text-sm text-gray-500">{currentTime}</p>
                  </div>

                  <button
                    onClick={handlePerfilClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                      flex items-center space-x-2"
                  >
                    <FaUser className="h-4 w-4" />
                    <span>Meu Perfil</span>
                  </button>

                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100
                      flex items-center space-x-2"
                  >
                    <FaSignOutAlt className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;