import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  FileText,
  Video,
  BookOpen,
  MessageSquare,
  Paperclip,
  Download,
  ExternalLink,
  Send,
  Calendar,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';

export const SmartClassroomPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Post Creator Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState('PPT');
  const [subjectId, setSubjectId] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Post Detail & Comments Modal
  const [activePost, setActivePost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchSubjects = async () => {
    try {
      if (user?.role === 'FACULTY' || user?.role === 'ADMIN') {
        const res = await api.get('/faculty/my-subjects');
        const list = res.data.subjects || [];
        setSubjects(list);
        if (list.length > 0 && !subjectId) setSubjectId(list[0].id);
      } else {
        const res = await api.get('/auth/departments/' + user?.college_id);
        // Student subjects
        const sRes = await api.get('/admin/subjects');
        setSubjects(sRes.data.subjects || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      let url = `/classroom/posts?`;
      if (selectedSubject) url += `&subjectId=${selectedSubject}`;
      if (selectedType) url += `&type=${selectedType}`;

      const res = await api.get(url);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Error fetching classroom posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedSubject, selectedType]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !title) return;
    setIsPublishing(true);

    try {
      const formData = new FormData();
      formData.append('subjectId', subjectId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('postType', postType);
      if (externalUrl) formData.append('externalUrl', externalUrl);
      if (dueDate) formData.append('dueDate', dueDate);
      if (selectedFile) formData.append('file', selectedFile);

      await api.post('/classroom/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setExternalUrl('');
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenPost = async (postId: string) => {
    try {
      const res = await api.get(`/classroom/posts/${postId}`);
      setActivePost(res.data.post);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activePost) return;
    setIsSubmittingComment(true);

    try {
      const res = await api.post(`/classroom/posts/${activePost.id}/comments`, {
        commentText: newComment.trim(),
      });
      setComments((prev) => [...prev, res.data.comment]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getPostTypeBadge = (type: string) => {
    switch (type) {
      case 'PPT':
        return 'primary';
      case 'PDF':
      case 'NOTES':
        return 'info';
      case 'ASSIGNMENT':
        return 'danger';
      case 'VIDEO_LINK':
        return 'purple';
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <span>Smart Classroom & Digital Handouts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access lecture slide decks, syllabus PDF handouts, assignment briefs, and engage in class discussions.
          </p>
        </div>

        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md transition-all self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Create Classroom Post</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['', 'PPT', 'PDF', 'NOTES', 'ASSIGNMENT', 'VIDEO_LINK', 'ANNOUNCEMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedType === type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === '' ? 'All Types' : type}
            </button>
          ))}
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="w-full sm:w-56 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
          ))}
        </select>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">Loading classroom stream...</div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs glass-card rounded-3xl p-8">
            No classroom study materials published under this filter.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleOpenPost(post.id)}
              className="glass-card p-6 rounded-3xl flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all cursor-pointer shadow-xs group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Badge variant={getPostTypeBadge(post.post_type)} size="sm">
                    {post.post_type}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {post.description || 'Study material uploaded for course curriculum.'}
                </p>

                {post.file_name && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-2 text-xs text-slate-700">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate font-semibold text-[11px]">{post.file_name}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <img
                    src={post.faculty_avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop'}
                    alt={post.faculty_name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">{post.faculty_name}</span>
                </div>

                <div className="flex items-center space-x-1 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comment_count || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Smart Classroom Post" maxWidth="xl">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject</label>
            <select
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.department_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Post Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PPT">PPT Slide Deck</option>
                <option value="PDF">PDF Document</option>
                <option value="NOTES">Lecture Handout Notes</option>
                <option value="ASSIGNMENT">Assignment Brief</option>
                <option value="VIDEO_LINK">Video Lecture Link</option>
                <option value="ANNOUNCEMENT">Department Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Post Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3: React Hooks & State Management Slide Deck"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Guidelines</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide instructions, key learning objectives, or summary..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {postType === 'VIDEO_LINK' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Video / External URL</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Upload File (PDF / PPT / Notes)</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isPublishing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {isPublishing ? 'Publishing Material...' : 'Publish to Students'}
          </button>
        </form>
      </Modal>

      {/* Post Details & Discussion Comments Modal */}
      {activePost && (
        <Modal
          isOpen={!!activePost}
          onClose={() => setActivePost(null)}
          title={activePost.title}
          subtitle={`${activePost.subject_name} • Posted by ${activePost.faculty_name}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Description */}
            <div className="prose text-xs text-slate-700 leading-relaxed">
              <p>{activePost.description}</p>
            </div>

            {/* Attached File or External Link Action */}
            {activePost.file_url && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold text-xs">
                    {activePost.post_type}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950">{activePost.file_name || 'Download Attachment'}</p>
                    <p className="text-[10px] text-indigo-700">Verified academic material</p>
                  </div>
                </div>

                <a
                  href={activePost.file_url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            )}

            {activePost.external_url && (
              <a
                href={activePost.external_url}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors"
              >
                <span>Watch External Video / Resource</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Comments Stream */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                <span>Class Discussion ({comments.length})</span>
              </h4>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No comments yet. Be the first to start the discussion!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.user_name}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.comment_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a question or post a discussion note..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
