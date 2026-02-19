'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, MessageSquare, Tag, Eye, Newspaper } from 'lucide-react';
import { newsAPI } from '@/lib/api';
import { formatDate, getImageUrl } from '@/lib/utils';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

interface NewsPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    category: string;
    thumbnail_url: string;
    banner_url: string;
    created_at: string;
    view_count: number;
    meta_title: string;
    meta_description: string;
    source_name?: string;
    source_url?: string;
}

export default function SingleNewsPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [post, setPost] = useState<NewsPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (slug) {
            loadPost();
        }
    }, [slug]);

    const loadPost = async () => {
        try {
            setLoading(true);
            const res = await newsAPI.getBySlug(slug as string);
            setPost(res.data.data);

            // Load related posts from the same category
            const relatedRes = await newsAPI.getAll({
                category: res.data.data.category,
                limit: 3,
                status: 'published'
            });
            setRelatedPosts(relatedRes.data.data.filter((p: any) => p.slug !== slug));
        } catch (error) {
            console.error('Error loading news post:', error);
            toast.error('No se pudo encontrar la noticia');
            router.push('/noticias');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="spinner w-12 h-12" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />

            {/* Article Head */}
            <header className="relative pt-32 pb-16 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                <div className="container-custom relative z-10">
                    <Link
                        href="/noticias"
                        className="inline-flex items-center gap-2 text-red-500 font-bold uppercase text-xs tracking-widest mb-8 hover:translate-x-[-4px] transition-transform"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver a Noticias
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span className="bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                            {post.category}
                        </span>
                        <div className="flex items-center gap-4 text-gray-500 text-xs font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.created_at)}</span>
                            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {post.view_count} Vistas</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter uppercase">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wide">Redacción Arena Fight Pass</span>
                        </div>
                        <div className="h-4 w-px bg-zinc-800" />
                        <div className="flex gap-4">
                            <button className="text-gray-500 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></button>
                            <button className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></button>
                            <button className="text-gray-500 hover:text-white transition-colors"><Share2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Image */}
            <div className="container-custom mb-16">
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-900 shadow-2xl">
                    <Image
                        src={getImageUrl(post.banner_url || post.thumbnail_url || '') || ''}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>

            {/* Content & Sidebar */}
            <main className="container-custom pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Article Content */}
                    <article className="lg:col-span-8">

                        <div className="prose prose-invert prose-red max-w-none">
                            <p className="text-xl text-gray-300 font-medium leading-relaxed mb-10 first-letter:text-5xl first-letter:font-black first-letter:text-red-600 first-letter:mr-3 first-letter:float-left">
                                {post.excerpt}
                            </p>

                            <div className="text-gray-400 text-lg leading-loose space-y-6 whitespace-pre-line">
                                {post.content}
                            </div>

                            {post.source_name && (
                                <div className="mt-12 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-red-500">
                                            <Newspaper className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Fuente de la noticia</p>
                                            <h4 className="text-lg font-black uppercase text-white">{post.source_name}</h4>
                                        </div>
                                    </div>
                                    {post.source_url && (
                                        <a
                                            href={post.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-6 py-2 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Leer Original
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Article Footer */}
                        <footer className="mt-20 pt-10 border-t border-zinc-900">
                            <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500">
                                    <Tag className="w-3.5 h-3.5" /> MMA Ecuador
                                </span>
                                <span className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500">
                                    <Tag className="w-3.5 h-3.5" /> {post.category}
                                </span>
                                {post.slug.includes('vera') && (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500">
                                        <Tag className="w-3.5 h-3.5" /> Chito Vera
                                    </span>
                                )}
                            </div>
                        </footer>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-12">
                        {/* Featured Sidebar Box */}
                        <div className="bg-red-600 p-8 rounded-2xl shadow-xl shadow-red-900/10">
                            <Newspaper className="w-10 h-10 mb-4" />
                            <h3 className="text-2xl font-black uppercase mb-4 leading-tight">Suscríbete al Newsletter</h3>
                            <p className="text-white/80 text-sm mb-6">Recibe las mejores noticias de MMA y ofertas exclusivas de Arena Fight Pass en tu correo.</p>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                className="w-full bg-black/20 border border-white/20 rounded-lg px-4 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:border-white transition-colors mb-4"
                            />
                            <button className="w-full bg-white text-black font-black uppercase text-xs tracking-widest py-3 rounded-lg hover:bg-gray-100 transition-colors">
                                SUSCRIBIRME
                            </button>
                        </div>

                        {/* Recent News in Sidebar */}
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-red-600 mb-6 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                Noticias Relacionadas
                            </h3>
                            <div className="space-y-6">
                                {relatedPosts.map((r) => (
                                    <Link key={r.id} href={`/noticias/${r.slug}`} className="group flex gap-4">
                                        <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                                            <Image
                                                src={getImageUrl(r.thumbnail_url || '') || ''}
                                                alt={r.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold uppercase leading-tight group-hover:text-red-500 transition-colors line-clamp-2 mb-2">
                                                {r.title}
                                            </h4>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                {formatDate(r.created_at)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Square Ad Box */}
                        <div className="sticky top-32">
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
