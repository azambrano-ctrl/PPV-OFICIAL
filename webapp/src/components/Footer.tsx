import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';
import { useSettingsStore } from '@/lib/store';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const { settings } = useSettingsStore();

    const footerLinks = {
        company: [
            { label: 'Nosotros', href: '/about' },
            { label: 'Eventos', href: '/events' },
            { label: 'Contacto', href: '/contact' },
        ],
        legal: [
            { label: 'Términos de Servicio', href: '/terms' },
            { label: 'Política de Privacidad', href: '/privacy' },
            { label: 'Política de Reembolsos', href: '/refunds' },
        ],
        support: [
            { label: 'Centro de Ayuda', href: '/help' },
            { label: 'FAQ', href: '/faq' },
            { label: 'Soporte Técnico', href: '/support' },
        ],
    };

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Youtube, href: '#', label: 'YouTube' },
    ];

    return (
        <footer className="bg-dark-900 border-t border-dark-800">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4 group">
                            {settings?.site_logo ? (
                                <div className="w-10 h-10 transition-transform group-hover:scale-105">
                                    <img
                                        src={settings.site_logo}
                                        alt={settings?.site_name || 'Logo'}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                                    <span className="text-white font-bold text-xl">
                                        {settings?.site_name?.charAt(0) || 'P'}
                                    </span>
                                </div>
                            )}
                            <span className="font-display font-bold text-xl gradient-text">
                                {settings?.site_name || 'PPV Streaming'}
                            </span>
                        </Link>
                        <p className="text-dark-400 mb-6 max-w-sm">
                            {settings?.site_description || 'La mejor plataforma para ver peleas en vivo. Acceso exclusivo a los eventos más emocionantes del deporte.'}
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-lg bg-dark-800 hover:bg-primary-600 flex items-center justify-center transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Compañía</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2">
                            {footerLinks.legal.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Soporte</h3>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-dark-400 hover:text-primary-500 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="mt-12 pt-8 border-t border-dark-800">
                    <div className="max-w-md">
                        <h3 className="font-semibold text-white mb-2">
                            Suscríbete a nuestro newsletter
                        </h3>
                        <p className="text-dark-400 text-sm mb-4">
                            Recibe notificaciones sobre próximos eventos y ofertas especiales.
                        </p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="input flex-1"
                            />
                            <button type="submit" className="btn-primary">
                                <Mail className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-8 pt-8 border-t border-dark-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-dark-400 text-sm">
                        © {currentYear} {settings?.site_name || 'PPV Streaming'}. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-dark-400">
                        <span>Pagos seguros con</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-dark-800 rounded text-xs font-semibold">
                                STRIPE
                            </span>
                            <span className="px-2 py-1 bg-dark-800 rounded text-xs font-semibold">
                                PAYPAL
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
