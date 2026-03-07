'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Settings, ShoppingBag, Globe } from 'lucide-react';
import { useAuthStore, useSettingsStore } from '@/lib/store';
import { useLanguage } from '@/components/providers/LanguageProvider';
import NotificationCenter from './NotificationCenter';


export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuthStore();
    const { settings, hasHydrated } = useSettingsStore();
    const { language, setLanguage, t } = useLanguage();


    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('nav.home'), href: '/' },
        { name: t('nav.events') || 'Eventos', href: '/events' },
        { name: 'Roster', href: '/fighters' },
        { name: t('nav.promoters') || 'Promotoras', href: '/promoters' },
        { name: t('nav.news'), href: '/noticias' },
        { name: t('nav.about'), href: '/about' },
    ];


    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        window.location.href = '/';
    };

    const isAuthPage = pathname?.startsWith('/auth');

    // Hide Navbar on Admin pages and Watch pages (Immersive mode)
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/watch')) {
        return null;
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || isOpen ? 'bg-dark-950/80 backdrop-blur-xl shadow-2xl shadow-black/50' : 'bg-transparent'
                }`}
        >
            <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Brand / Logo - Production Style */}
                    {!isAuthPage && (
                        <Link href="/" className="flex items-center gap-3 group">
                            {!hasHydrated ? (
                                <div className="w-10 h-10 bg-dark-800 rounded-lg animate-pulse" />
                            ) : settings?.site_logo ? (
                                <div
                                    className="relative transition-transform group-hover:scale-105 flex items-center justify-center"
                                    style={{
                                        width: settings.site_logo_width ? `${settings.site_logo_width}px` : '40px',
                                        maxWidth: '180px', // Prevent massive logos on mobile
                                        transform: `translate(${settings.site_logo_offset_x || 0}px, ${settings.site_logo_offset_y || 0}px)`
                                    }}
                                >
                                    <img
                                        src={settings.site_logo}
                                        alt={settings?.site_name || 'Logo'}
                                        className="max-w-full max-h-[70px] md:max-h-none h-auto object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-600/20 group-hover:scale-105 transition-transform">
                                    <span className="text-white font-bold text-xl">
                                        {settings?.site_name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                            )}
                            {hasHydrated && (
                                <span className="text-2xl font-bold text-primary-600 tracking-tight group-hover:text-primary-500 transition-colors">
                                    {settings?.site_name || ''}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Desktop Navigation - Centered like reference */}
                    <div className="hidden md:flex items-center space-x-10">
                        {!isAuthPage && navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`text-lg font-bold transition-colors ${pathname === link.href
                                    ? 'text-primary-500'
                                    : 'text-gray-300 hover:text-white'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side - Auth/Profile */}
                    <div className="hidden md:flex items-center gap-4">
                        <NotificationCenter />
                        {/* Language Switcher */}
                        <div className="flex items-center bg-dark-900/50 rounded-lg p-0.5 mr-2 border border-white/5">
                            <button
                                onClick={() => setLanguage('es')}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${language === 'es' ? 'bg-dark-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                ES
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${language === 'en' ? 'bg-dark-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                EN
                            </button>
                        </div>

                        {isAuthenticated && user ? (

                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-dark-800 hover:bg-dark-700 border border-dark-700 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-900/50">
                                        {user.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                    </div>
                                    <span className="text-gray-200 font-medium text-sm max-w-[100px] truncate">
                                        {user.full_name}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 mt-2 w-64 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5"
                                        >
                                            <div className="px-4 py-4 bg-dark-800/50 border-b border-dark-700">
                                                <p className="text-sm font-bold text-white">{user.full_name}</p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                <div className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-md bg-primary-900/30 text-primary-400 inline-block border border-primary-500/20 uppercase tracking-wider">
                                                    {user.role === 'admin' ? t('roles.admin') : user.role === 'promoter' ? t('roles.promoter') : t('roles.user')}
                                                </div>

                                            </div>

                                            <div className="py-2">
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <User className="w-4 h-4" />
                                                    <span>{t('nav.profile')}</span>
                                                </Link>

                                                <Link
                                                    href="/profile?tab=purchases"
                                                    className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>{t('nav.purchases')}</span>
                                                </Link>

                                                {user.role === 'admin' && (
                                                    <Link
                                                        href="/admin"
                                                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-primary-400 hover:bg-dark-800 hover:text-primary-300 transition-colors"
                                                        onClick={() => setUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>{t('nav.admin')}</span>
                                                    </Link>

                                                )}
                                                {user.role === 'promoter' && (
                                                    <Link
                                                        href="/promoter-dashboard"
                                                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-blue-400 hover:bg-dark-800 hover:text-blue-300 transition-colors"
                                                        onClick={() => setUserMenuOpen(false)}
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        <span>{t('nav.promoter')}</span>
                                                    </Link>

                                                )}
                                            </div>

                                            <div className="border-t border-dark-700 py-2 bg-dark-950/30">
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center space-x-3 px-4 py-2.5 text-sm w-full text-left text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>{t('nav.logout')}</span>
                                                </button>

                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        ) : (
                            !isAuthPage && (
                                <Link
                                    href="/auth/login"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 border border-primary-500/50 transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary-600 text-xs font-bold">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="text-white font-medium text-sm pr-2">{t('nav.login')}</span>
                                </Link>

                            )
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Mobile Language Switcher */}
                        <div className="flex bg-dark-900/50 rounded-lg p-0.5 border border-white/5">
                            <button
                                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                                className="px-2 py-0.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider"
                            >
                                {language}
                            </button>
                        </div>
                        {!isAuthPage && (
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-dark-950 overflow-hidden shadow-2xl"
                    >
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            {!isAuthPage && navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.name === 'Inicio' ? '/events' : link.href} // UX tweak: Redirect 'Inicio' to events for better flow
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 rounded-xl text-base font-bold ${pathname === link.href
                                        ? 'bg-primary-600/10 text-primary-500'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <div className="pt-4 mt-4 space-y-3">
                                {isAuthenticated && user ? (
                                    <>
                                        <div className="px-4 py-2 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                                                {user.full_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{user.full_name}</div>
                                                <div className="text-xs text-gray-400">{user.email}</div>
                                            </div>
                                        </div>

                                        <Link
                                            href="/profile?tab=purchases"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5"
                                        >
                                            {t('nav.purchases')}
                                        </Link>

                                        <Link
                                            href="/profile"
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5"
                                        >
                                            {t('nav.profile')}
                                        </Link>


                                        {user.role === 'admin' && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setIsOpen(false)}
                                                className="block px-4 py-3 rounded-xl text-primary-400 hover:bg-white/5"
                                            >
                                                {t('nav.admin')}
                                            </Link>

                                        )}
                                        {user.role === 'promoter' && (
                                            <Link
                                                href="/promoter-dashboard"
                                                onClick={() => setIsOpen(false)}
                                                className="block px-4 py-3 rounded-xl text-blue-400 hover:bg-white/5"
                                            >
                                                {t('nav.promoter')}
                                            </Link>

                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10"
                                        >
                                            {t('nav.logout')}
                                        </button>

                                    </>
                                ) : (
                                    !isAuthPage && (
                                        <Link
                                            href="/auth/login"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500"
                                        >
                                            <User className="w-5 h-5" />
                                            <span>{t('nav.login')}</span>
                                        </Link>

                                    )
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
