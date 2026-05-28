import React, { useState, useRef, useEffect } from 'react';
import './AIAssistant.css';

// ✅ FIX: Call your own backend, not Anthropic directly
// Browser can't call Anthropic API directly (CORS + API key exposure)
const API_BASE = "http://localhost:5000/api";

const CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "House Cleaning", "IT Services", "Appliance Repair", "Gardening", "Tutoring", "Other"];

const SparkleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const UploadIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const URGENCY_COLORS = { High: '#e02424', Medium: '#f59e0b', Low: '#1aa34a' };

function getRateLimitKey(userId) { return `ai_queries_${userId}_${new Date().toDateString()}`; }
function getRateLimit(userId) { return parseInt(localStorage.getItem(getRateLimitKey(userId)) || '0'); }
function incrementRateLimit(userId) { localStorage.setItem(getRateLimitKey(userId), getRateLimit(userId) + 1); }
const DAILY_LIMIT = 10;

const AIAssistant = ({ services, onFilterByCategory, user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('text');
    const [problem, setProblem] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const queriesUsed = getRateLimit(user?.id);
    const queriesLeft = DAILY_LIMIT - queriesUsed;

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(file);
        setResult(null);
    };

    // ✅ FIX: Call backend /api/ai/analyze instead of Anthropic directly
    const callAI = async (payload) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/ai/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'API call failed');
        }
        const data = await response.json();
        return data.result;
    };

    const parseAIResponse = (text) => {
        try {
            const clean = text.replace(/```json|```/g, '').trim();
            return JSON.parse(clean);
        } catch {
            return null;
        }
    };

    const getMatchingServices = (category) => {
        if (!category || !services) return [];
        return services
            .filter(s => s.category?.toLowerCase() === category?.toLowerCase() && s.availability === 'Available')
            .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
            .slice(0, 3);
    };

    const handleTextAnalyze = async () => {
        if (!problem.trim()) return;
        if (queriesLeft <= 0) { setError('You have used all 10 free AI queries for today. Come back tomorrow!'); return; }
        setLoading(true); setResult(null); setError('');
        try {
            const text = await callAI({ type: 'text', problem });
            const parsed = parseAIResponse(text);
            if (parsed) {
                incrementRateLimit(user?.id);
                setResult({ ...parsed, matchingServices: getMatchingServices(parsed.category) });
            } else {
                setError('Could not parse AI response. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'AI service unavailable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageAnalyze = async () => {
        if (!imageFile) return;
        if (queriesLeft <= 0) { setError('You have used all 10 free AI queries for today. Come back tomorrow!'); return; }
        setLoading(true); setResult(null); setError('');
        try {
            const base64 = await new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result.split(',')[1]);
                reader.onerror = rej;
                reader.readAsDataURL(imageFile);
            });
            const text = await callAI({ type: 'image', base64, mediaType: imageFile.type });
            const parsed = parseAIResponse(text);
            if (parsed) {
                incrementRateLimit(user?.id);
                setResult({ ...parsed, matchingServices: getMatchingServices(parsed.category) });
            } else {
                setError('Could not analyze image. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'AI service unavailable. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilter = () => {
        if (result?.category) {
            onFilterByCategory(result.category);
            setIsOpen(false);
        }
    };

    const handleReset = () => {
        setProblem(''); setImageFile(null); setImagePreview(null); setResult(null); setError('');
    };

    return (
        <>
            <button className={`ai-fab ${isOpen ? 'ai-fab--open' : ''}`} onClick={() => setIsOpen(o => !o)} aria-label="AI Assistant">
                {isOpen ? <CloseIcon /> : <SparkleIcon />}
                {!isOpen && <span className="ai-fab-label">AI Assistant</span>}
            </button>

            {isOpen && (
                <div className="ai-panel-overlay" onClick={() => setIsOpen(false)}>
                    <div className="ai-panel" onClick={e => e.stopPropagation()}>
                        <div className="ai-panel-header">
                            <div className="ai-panel-title">
                                <div className="ai-panel-icon"><SparkleIcon /></div>
                                <div>
                                    <h2>AI Service Assistant</h2>
                                    <p>Describe your problem or upload a photo</p>
                                </div>
                            </div>
                            <div className="ai-panel-meta">
                                <span className={`ai-queries-badge ${queriesLeft <= 3 ? 'ai-queries-badge--low' : ''}`}>
                                    {queriesLeft}/{DAILY_LIMIT} queries left today
                                </span>
                                <button className="ai-close-btn" onClick={() => setIsOpen(false)}><CloseIcon /></button>
                            </div>
                        </div>

                        <div className="ai-tabs">
                            <button className={`ai-tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => { setActiveTab('text'); handleReset(); }}>
                                💬 Describe Problem
                            </button>
                            <button className={`ai-tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => { setActiveTab('image'); handleReset(); }}>
                                📷 Upload Photo
                            </button>
                        </div>

                        <div className="ai-panel-body">
                            {activeTab === 'text' && !result && (
                                <div className="ai-input-section">
                                    <p className="ai-input-hint">Describe what's wrong in your home — be as detailed as you like.</p>
                                    <textarea
                                        className="ai-textarea"
                                        placeholder="e.g. My AC is making a loud noise and not cooling the room properly..."
                                        value={problem}
                                        onChange={e => setProblem(e.target.value)}
                                        rows={5}
                                    />
                                    <div className="ai-examples">
                                        <span>Try:</span>
                                        {["Leaking kitchen tap", "Power socket not working", "Water heater broken"].map(ex => (
                                            <button key={ex} className="ai-example-chip" onClick={() => setProblem(ex)}>{ex}</button>
                                        ))}
                                    </div>
                                    <button className="ai-analyze-btn" onClick={handleTextAnalyze} disabled={!problem.trim() || loading || queriesLeft <= 0}>
                                        {loading ? <><span className="ai-spinner" /> Analyzing...</> : <><SparkleIcon /> Analyze with AI</>}
                                    </button>
                                </div>
                            )}

                            {activeTab === 'image' && !result && (
                                <div className="ai-input-section">
                                    <p className="ai-input-hint">Upload a photo of the issue — broken appliance, leaking pipe, damaged wall, etc.</p>
                                    {!imagePreview ? (
                                        <div className="ai-dropzone" onClick={() => fileInputRef.current.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                                            <UploadIcon />
                                            <p>Click or drag & drop an image here</p>
                                            <span>PNG, JPG, WEBP supported</span>
                                        </div>
                                    ) : (
                                        <div className="ai-image-preview-container">
                                            <img src={imagePreview} alt="Preview" className="ai-image-preview" />
                                            <button className="ai-remove-image" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕ Remove</button>
                                        </div>
                                    )}
                                    <button className="ai-analyze-btn" onClick={handleImageAnalyze} disabled={!imageFile || loading || queriesLeft <= 0} style={{ marginTop: '1rem' }}>
                                        {loading ? <><span className="ai-spinner" /> Analyzing image...</> : <><SparkleIcon /> Analyze Photo</>}
                                    </button>
                                </div>
                            )}

                            {error && <div className="ai-error">{error}</div>}

                            {loading && (
                                <div className="ai-loading">
                                    <div className="ai-loading-animation">
                                        <div className="ai-loading-dot" />
                                        <div className="ai-loading-dot" />
                                        <div className="ai-loading-dot" />
                                    </div>
                                    <p>AI is analyzing your {activeTab === 'image' ? 'photo' : 'problem'}...</p>
                                </div>
                            )}

                            {result && !loading && (
                                <div className="ai-result">
                                    <div className="ai-result-header">
                                        <div className="ai-result-issue">
                                            <h3>{result.detected_issue}</h3>
                                            <div className="ai-result-badges">
                                                <span className="ai-badge ai-badge--category">{result.category}</span>
                                                <span className="ai-badge ai-badge--urgency" style={{ background: `${URGENCY_COLORS[result.urgency]}20`, color: URGENCY_COLORS[result.urgency] }}>
                                                    {result.urgency} Urgency
                                                </span>
                                                {result.confidence && (
                                                    <span className="ai-badge ai-badge--confidence">{result.confidence} Confidence</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="ai-result-summary">{result.summary}</p>

                                    <div className="ai-result-detail">
                                        <div className="ai-detail-row">
                                            <span className="ai-detail-label">Service Needed</span>
                                            <span className="ai-detail-value">{result.service_needed}</span>
                                        </div>
                                        <div className="ai-detail-row">
                                            <span className="ai-detail-label">Urgency Reason</span>
                                            <span className="ai-detail-value">{result.urgency_reason}</span>
                                        </div>
                                    </div>

                                    {result.tips && result.tips.length > 0 && (
                                        <div className="ai-tips">
                                            <h4>💡 Quick Tips</h4>
                                            <ul>{result.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                                        </div>
                                    )}

                                    {result.matchingServices && result.matchingServices.length > 0 && (
                                        <div className="ai-recommended">
                                            <h4>⭐ Recommended Providers</h4>
                                            <div className="ai-provider-list">
                                                {result.matchingServices.map(s => (
                                                    <div key={s.id} className="ai-provider-card">
                                                        <img src={s.image_url || `https://placehold.co/60x60/0095f6/fff?text=${s.service_name.charAt(0)}`} alt={s.service_name} />
                                                        <div className="ai-provider-info">
                                                            <strong>{s.service_name}</strong>
                                                            <span>{s.provider_name}</span>
                                                            <span className="ai-provider-rating">
                                                                ⭐ {s.average_rating ? parseFloat(s.average_rating).toFixed(1) : 'New'} · ₹{s.price ? Number(s.price).toLocaleString('en-IN') : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button className="ai-filter-btn" onClick={handleApplyFilter}>
                                                View all {result.category} providers →
                                            </button>
                                        </div>
                                    )}

                                    {result.matchingServices && result.matchingServices.length === 0 && (
                                        <div className="ai-no-providers">
                                            No providers currently available for <strong>{result.category}</strong>.
                                            <button className="ai-filter-btn" onClick={handleApplyFilter}>Browse anyway →</button>
                                        </div>
                                    )}

                                    <button className="ai-reset-btn" onClick={handleReset}>← Try another problem</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIAssistant;