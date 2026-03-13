import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Save, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { createBlog, fetchBlogById, fetchBlogs, updateBlog } from '../../api/blogs.api';
import TablePageToolbar from '../../components/ui/TablePageToolbar';
import Button from '../../components/ui/Button';

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
};

const CreateBlog = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [availableBlogs, setAvailableBlogs] = useState([]);
    const [form, setForm] = useState({
        title: '',
        slug: '',
        status: 'draft',
        publishedAt: '',
        content: '',
        categories: '',
        relatedPosts: [],
        authors: '',
        metaTitle: '',
        metaDescription: '',
        heroImage: null,
        metaImage: null,
        heroImageUrl: '',
        metaImageUrl: '',
    });

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';
    const mediaBase = apiBase.replace(/\/v1\/?$/, '');

    const resolveMedia = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        return `${mediaBase}/${path.replace(/^\/+/, '')}`;
    };

    useEffect(() => {
        const loadBlogs = async () => {
            try {
                const response = await fetchBlogs({ page: 1, limit: 200 });
                setAvailableBlogs(response.data?.results || []);
            } catch (error) {
                console.error('Failed to load blogs for related posts:', error);
            }
        };
        loadBlogs();
    }, []);

    useEffect(() => {
        if (!isEditing) return;
        const loadBlog = async () => {
            try {
                const response = await fetchBlogById(id);
                const blog = response.data;
                setForm((prev) => ({
                    ...prev,
                    title: blog.title || '',
                    slug: blog.slug || '',
                    status: blog.status || 'draft',
                    publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().slice(0, 16) : '',
                    content: blog.content || '',
                    categories: (blog.categories || []).join(', '),
                    relatedPosts: (blog.relatedPosts || []).map((item) => item.toString()),
                    authors: (blog.authors || []).map((item) => item.toString()).join(', '),
                    metaTitle: blog.meta?.title || '',
                    metaDescription: blog.meta?.description || '',
                    heroImageUrl: resolveMedia(blog.heroImage),
                    metaImageUrl: resolveMedia(blog.meta?.image),
                }));
            } catch (error) {
                console.error('Failed to load blog:', error);
                toast.error('Failed to load blog');
                navigate('/blogs/all');
            }
        };
        loadBlog();
    }, [id, isEditing, navigate]);

    const relatedOptions = useMemo(() => availableBlogs.filter((b) => b._id !== id), [availableBlogs, id]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleToggleRelated = (blogId) => {
        setForm((prev) => {
            const exists = prev.relatedPosts.includes(blogId);
            return {
                ...prev,
                relatedPosts: exists
                    ? prev.relatedPosts.filter((item) => item !== blogId)
                    : [...prev.relatedPosts, blogId],
            };
        });
    };

    const buildPayload = () => {
        const payload = new FormData();
        payload.append('title', form.title);
        if (form.slug) payload.append('slug', form.slug);
        payload.append('status', form.status);
        if (form.publishedAt) payload.append('publishedAt', new Date(form.publishedAt).toISOString());
        payload.append('content', form.content);
        payload.append('categories', JSON.stringify(toArray(form.categories)));
        payload.append('relatedPosts', JSON.stringify(form.relatedPosts));
        payload.append('authors', JSON.stringify(toArray(form.authors)));
        payload.append('metaTitle', form.metaTitle);
        payload.append('metaDescription', form.metaDescription);
        if (form.heroImage) payload.append('heroImage', form.heroImage);
        if (form.metaImage) payload.append('metaImage', form.metaImage);
        return payload;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = buildPayload();
            if (isEditing) {
                await updateBlog(id, payload);
                toast.success('Blog updated');
            } else {
                await createBlog(payload);
                toast.success('Blog created');
            }
            navigate('/blogs/all');
        } catch (error) {
            console.error('Failed to save blog:', error);
            toast.error('Failed to save blog');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <TablePageToolbar
                title={isEditing ? 'Edit Blog' : 'Create Blog'}
                subtitle="Content"
                icon={FileText}
                right={(
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={() => navigate('/blogs/all')} className="h-9 px-4 rounded-xl text-xs gap-2">
                            <ArrowLeft size={14} />
                            Back
                        </Button>
                        <Button onClick={handleSubmit} className="h-9 px-4 rounded-xl text-xs gap-2" disabled={isSaving}>
                            <Save size={14} />
                            {isSaving ? 'Saving...' : 'Save Blog'}
                        </Button>
                    </div>
                )}
            />

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-4">
                    <div className="terminal-panel rounded-2xl p-4 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Title</label>
                            <input
                                value={form.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                required
                                placeholder="Blog title"
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Slug</label>
                                <input
                                    value={form.slug}
                                    onChange={(e) => handleChange('slug', e.target.value)}
                                    placeholder="Auto-generated if empty"
                                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Published At</label>
                            <input
                                type="datetime-local"
                                value={form.publishedAt}
                                onChange={(e) => handleChange('publishedAt', e.target.value)}
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Content</label>
                            <textarea
                                value={form.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                required
                                rows={12}
                                placeholder="Write the blog content..."
                                className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    </div>

                    <div className="terminal-panel rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <ImageIcon size={14} />
                            Hero Image
                        </div>
                        {form.heroImageUrl && (
                            <img src={form.heroImageUrl} alt="Hero" className="w-full rounded-xl border border-border object-cover max-h-56" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleChange('heroImage', e.target.files?.[0] || null)}
                            className="text-xs text-muted-foreground"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="terminal-panel rounded-2xl p-4 space-y-3">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Categories</label>
                            <input
                                value={form.categories}
                                onChange={(e) => handleChange('categories', e.target.value)}
                                placeholder="Comma separated"
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Authors</label>
                            <input
                                value={form.authors}
                                onChange={(e) => handleChange('authors', e.target.value)}
                                placeholder="User IDs, comma separated"
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Related Posts</label>
                            <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-border bg-background/40 p-2">
                                {relatedOptions.length === 0 ? (
                                    <div className="text-[11px] text-muted-foreground">No other blogs yet.</div>
                                ) : (
                                    relatedOptions.map((blog) => (
                                        <label key={blog._id} className="flex items-center gap-2 text-xs text-foreground py-1">
                                            <input
                                                type="checkbox"
                                                checked={form.relatedPosts.includes(blog._id)}
                                                onChange={() => handleToggleRelated(blog._id)}
                                            />
                                            <span className="truncate">{blog.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="terminal-panel rounded-2xl p-4 space-y-3">
                        <div className="text-xs font-semibold text-muted-foreground">SEO</div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Meta Title</label>
                            <input
                                value={form.metaTitle}
                                onChange={(e) => handleChange('metaTitle', e.target.value)}
                                placeholder="Meta title"
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Meta Description</label>
                            <textarea
                                value={form.metaDescription}
                                onChange={(e) => handleChange('metaDescription', e.target.value)}
                                rows={4}
                                placeholder="Meta description"
                                className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground">Meta Image</label>
                            {form.metaImageUrl && (
                                <img src={form.metaImageUrl} alt="Meta" className="mt-2 w-full rounded-xl border border-border object-cover max-h-44" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleChange('metaImage', e.target.files?.[0] || null)}
                                className="mt-2 text-xs text-muted-foreground"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateBlog;
