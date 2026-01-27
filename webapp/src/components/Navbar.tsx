'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Menu, X, User, LogOut, Settings, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: 'Inicio' },
        { href: '/events', label: 'Eventos' },
        { href: '/promoters', label: 'Promotoras' },
        { href: '/about', label: 'Nosotros' },
    ];

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        window.location.href = '/';
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark-950/95 backdrop-blur-lg shadow-xl' : 'bg-transparent'
                }`}
        >
            <div className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <span className="font-display font-bold text-xl gradient-text hidden sm:block">
                            PPV Streaming
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-medium transition-colors ${pathname === link.href
                                    ? 'text-primary-500'
                                    : 'text-dark-300 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons / User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated && user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium">{user.full_name}</span>
                                </button>

                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-dark-800 rounded-lg shadow-xl z-50 overflow-hidden">
                                            <div className="px-4 py-3 border-b border-dark-800">
                                                <p className="text-sm font-medium">{user.full_name}</p>
                                                <p className="text-xs text-dark-400">{user.email}</p>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-dark-800 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span>Mi Perfil</span>
                                                </Link>
                                                <Link
                                                    href="/profile/purchases"
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-dark-800 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>Mis Compras</span>
                                                </Link>
                                                {user.role === 'admin' && (
                                                    <Link
                                                        href="/admin"
                                                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-dark-800 transition-colors text-primary-500"
                                                        onClick={() => setUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>Panel Admin</span>
                                                    </Link>
                                                )}
                                                {user.role === 'promoter' && (
                                                    <Link
                                                        href="/promoter-dashboard"
                                                        className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-dark-800 transition-colors text-blue-400"
                                                        onClick={() => setUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>Panel Promotora</span>
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="border-t border-dark-800 py-2">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-dark-800 transition-colors w-full text-left text-red-400"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Cerrar Sesión</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/auth/login" className="btn btn-secondary">
                                    Iniciar Sesión
                                </Link>
                                <Link href="/auth/register" className="btn-primary">
                                    Registrarse
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 rounded-lg hover:bg-dark-800 transition-colors"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-dark-900 border-t border-dark-800">
                    <div className="container-custom py-4 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileMenu}
                                className={`block px-4 py-2 rounded-lg transition-colors ${pathname === link.href
                                    ? 'bg-primary-600 text-white'
                                    : 'text-dark-300 hover:bg-dark-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}

                        <div className="pt-4 border-t border-dark-800 space-y-2">
                            {isAuthenticated && user ? (
                                <>
                                    <Link
                                        href="/profile"
                                        onClick={closeMobileMenu}
                                        className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-800"
                                    >
                                        Mi Perfil
                                    </Link>
                                    <Link
                                        href="/profile/purchases"
                                        onClick={closeMobileMenu}
                                        className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-800"
                                    >
                                        Mis Compras
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            onClick={closeMobileMenu}
                                            className="block px-4 py-2 rounded-lg text-primary-500 hover:bg-dark-800"
                                        >
                                            Panel Admin
                                        </Link>
                                    )}
                                    {user.role === 'promoter' && (
                                        <Link
                                            href="/promoter-dashboard"
                                            onClick={closeMobileMenu}
                                            className="block px-4 py-2 rounded-lg text-blue-400 hover:bg-dark-800"
                                        >
                                            Panel Promotora
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 rounded-lg text-red-400 hover:bg-dark-800"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={closeMobileMenu}
                                        className="block px-4 py-2 rounded-lg text-dark-300 hover:bg-dark-800"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={closeMobileMenu}
                                        className="block px-4 py-2 rounded-lg bg-primary-600 text-white text-center"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
