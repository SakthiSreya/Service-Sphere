import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './RatingModal.css';

const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <span
        className={`star ${filled ? 'filled' : ''}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
    >
        ★
    </span>
);

const RatingModal = ({ booking, onClose, axiosWithAuth, onReviewSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warn("Please select a star rating.");
            return;
        }
        try {
            await axiosWithAuth.post('/reviews', {
                booking_id: booking.id,
                service_id: booking.service_id,
                provider_id: booking.provider_id,
                rating: rating,
                comment: comment,
            });
            toast.success("Review submitted successfully!");
            onReviewSubmit(); // This will re-fetch bookings
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to submit review.");
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content rating-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Rate Your Experience</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="rating-body">
                    <p>How was your service for <strong>{booking.service_name}</strong> with <strong>{booking.provider_name}</strong>?</p>
                    
                    <div className="star-rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                filled={star <= (hoverRating || rating)}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                            />
                        ))}
                    </div>

                    <textarea
                        className="form-textarea"
                        rows="4"
                        placeholder="Share your experience (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Submit Review</button>
                </div>
            </div>
        </div>
    );
};

export default RatingModal;