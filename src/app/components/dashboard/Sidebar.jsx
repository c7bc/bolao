'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiHome,
  FiUsers,
  FiPlay,
  FiDollarSign,
  FiSettings,
  FiUser,
  FiClock,
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { FaPenRuler } from "react-icons/fa6";

const Sidebar = ({ userType, onSelectMenu, isOpen }) => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuGroups, setMenuGroups] = useState({});

  // Detecta se é mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Configuração dos menus baseada no tipo de usuário
  const menuItems = {
    admin: [
      {
        group: 'Principal',
        items: [
          { label: 'Dashboard', key: 'adminDashboard', icon: FiHome },
          { label: 'Usuários', key: 'userManagement', icon: FiUsers },
          { label: 'Jogos', key: 'gameManagement', icon: FiPlay }
        ]
      },
      {
        group: 'Gestão',
        items: [
          { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign },
          { label: 'Configurações', key: 'configuracoes', icon: FiSettings }
        ]
      }
    ],
    superadmin: [
      {
        group: 'Principal',
        items: [
          { label: 'Dashboard', key: 'adminDashboard', icon: FiHome },
          { label: 'Usuários', key: 'userManagement', icon: FiUsers },
          { label: 'Jogos', key: 'gameManagement', icon: FiPlay }
        ]
      },
      {
        group: 'Gestão',
        items: [
          { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign },
          { label: 'Configurações', key: 'configuracoes', icon: FiSettings },
          { label: 'Personalização', key: 'personalizacao', icon: FaPenRuler }
        ]
      }
    ],
    colaborador: [
      {
        group: 'Principal',
        items: [
          { label: 'Dashboard', key: 'colaboradorDashboard', icon: FiHome },
          { label: 'Clientes', key: 'clienteManagement', icon: FiUsers }
        ]
      },
      {
        group: 'Gestão',
        items: [
          { label: 'Jogos', key: 'jogos', icon: FiPlay },
          { label: 'Financeiro', key: 'financeiro', icon: FiDollarSign }
        ]
      }
    ],
    cliente: [
      {
        group: 'Principal',
        items: [
          { label: 'Dashboard', key: 'clienteDashboard', icon: FiHome },
          { label: 'Jogos Disponíveis', key: 'jogosDisponiveis', icon: FiPlay },
          { label: 'Meus Jogos', key: 'meusJogos', icon: FiPlay }
        ]
      },
      {
        group: 'Conta',
        items: [
          { label: 'Histórico', key: 'historico', icon: FiClock },
          { label: 'Perfil', key: 'perfil', icon: FiUser }
        ]
      }
    ]
  };

  // Gerencia o estado de expansão dos grupos de menu
  useEffect(() => {
    if (menuItems[userType]) {
      const initialGroups = menuItems[userType].reduce((acc, group) => {
        acc[group.group] = !isMobile;
        return acc;
      }, {});
      setMenuGroups(initialGroups);
    }
  }, [userType, isMobile, menuItems]);

  const toggleGroup = useCallback((groupName) => {
    setMenuGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  }, []);

  const handleMenuClick = useCallback((menu) => {
    setActiveMenu(menu.key);
    onSelectMenu(menu.key);
  }, [onSelectMenu]);

  // Classes base do sidebar
  const sidebarBaseClasses = `
    fixed left-0 h-full w-64 bg-white shadow-lg
    transition-all duration-300 ease-in-out z-40
    transform md:translate-x-0
    border-r border-gray-200
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  // Classes para scroll personalizado
  const scrollbarClasses = `
    overflow-y-auto
    scrollbar scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
    hover:scrollbar-thumb-gray-400
  `;

  return (
    <>
      <nav className={sidebarBaseClasses}>
        <div className={`h-full ${scrollbarClasses}`}>
          {/* Espaço para o header fixo */}
          <div className="h-16"></div>

          {/* Container principal do sidebar */}
          <div className="p-4">
            {/* Grupos de Menu */}
            {menuItems[userType]?.map((group, groupIndex) => (
              <div key={group.group} className="mb-6">
                {/* Cabeçalho do Grupo */}
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="flex items-center justify-between w-full px-2 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                  <span>{group.group}</span>
                  {menuGroups[group.group] ? (
                    <FiChevronUp className="w-4 h-4" />
                  ) : (
                    <FiChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Itens do Grupo */}
                <div
                  className={`mt-2 space-y-1 transition-all duration-200 ease-in-out
                    ${menuGroups[group.group] ? 'max-h-96' : 'max-h-0 overflow-hidden'}`}
                >
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleMenuClick(item)}
                      className={`
                        flex items-center w-full px-4 py-2 text-sm rounded-lg
                        transition-colors duration-150 ease-in-out
                        ${activeMenu === item.key
                          ? 'bg-green-100 text-green-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon className={`
                        w-5 h-5 mr-3
                        ${activeMenu === item.key ? 'text-green-600' : 'text-gray-400'}
                      `} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Separador entre grupos */}
                {groupIndex < menuItems[userType].length - 1 && (
                  <div className="my-4 border-t border-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Overlay para fechar o sidebar em mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => onSelectMenu(activeMenu)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;