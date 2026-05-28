import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ServiceDetailModal.css';

const API_BASE = "http://localhost:5000/api";

// ✅ FIX 1: filled prop controls fill/stroke directly on the SVG element
// Previously fill="currentColor" meant ALL stars looked filled
const StarIcon = ({ filled }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16" height="16"
        viewBox="0 0 24 24"
        fill={filled ? "#f59e0b" : "none"}
        stroke={filled ? "#f59e0b" : "#9ca3af"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;

const StarRating = ({ rating, count }) => {
    if (count === 0 || !rating) return <div className="detail-rating-text">No reviews yet</div>;
    const fullStars = Math.round(rating);
    return (
        <div className="detail-star-rating">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < fullStars} />
            ))}
            <span className="detail-rating-text">{parseFloat(rating).toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})</span>
        </div>
    );
};

const StarRatingDisplay = ({ rating }) => (
    <div className="review-stars">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < rating} />
        ))}
    </div>
);

const ServiceDetailModal = ({ service, onClose }) => {
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        if (!service) return;
        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                const res = await axios.get(`${API_BASE}/reviews/${service.id}`);
                setReviews(res.data);
            } catch {
                setReviews([]);
            } finally {
                setLoadingReviews(false);
            }
        };
        fetchReviews();
    }, [service]);

    if (!service) return null;

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="close-btn">&times;</button>
                <img
                    src={service.image_url || `https://placehold.co/600x400/191925/a99eff?text=${service.service_name.split(' ').map(w => w[0]).join('')}`}
                    alt={service.service_name}
                    className="detail-modal-img"
                />
                <div className="detail-modal-content">
                    <div className="detail-modal-header">
                        <h2>{service.service_name}</h2>
                        <p className="detail-modal-price">₹{service.price ? Number(service.price).toLocaleString('en-IN') : 'N/A'}</p>
                    </div>

                    <StarRating rating={avgRating} count={reviews.length} />

                    <p className="detail-modal-description">
                        {service.description || "No description provided."}
                    </p>

                    <div className="detail-modal-meta">
                        <p><strong>Category:</strong> {service.category}</p>
                        <p><strong>Location:</strong> {service.location}</p>
                    </div>

                    <div className="provider-contact-box">
                        <h4>Provider Details</h4>
                        <p className="provider-contact-name">{service.provider_name || 'Anonymous'}</p>
                        <div className="provider-contact-row">
                            <PhoneIcon />
                            {service.provider_phone
                                ? <a href={`tel:${service.provider_phone}`}>{service.provider_phone}</a>
                                : <span className="not-provided">Phone not provided</span>}
                        </div>
                        <div className="provider-contact-row">
                            <MapPinIcon />
                            {service.provider_area
                                ? <span>{service.provider_area}</span>
                                : <span className="not-provided">Area not provided</span>}
                        </div>
                    </div>

                    <div className="reviews-section">
                        <h4>Customer Reviews {reviews.length > 0 && `(${reviews.length})`}</h4>
                        {loadingReviews ? (
                            <p className="reviews-loading">Loading reviews...</p>
                        ) : reviews.length === 0 ? (
                            <p className="no-reviews">No reviews yet. Be the first to review!</p>
                        ) : (
                            <div className="reviews-list">
                                {reviews.map(r => (
                                    <div key={r.id} className="review-item">
                                        <div className="review-item-header">
                                            <div className="reviewer-avatar">
                                                {r.customer_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="reviewer-name">{r.customer_name}</p>
                                                <StarRatingDisplay rating={r.rating} />
                                            </div>
                                        </div>
                                        {r.comment && <p className="review-item-comment">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailModal;