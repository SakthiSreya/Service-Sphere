import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import RatingModal from './RatingModal';
import './MyBookings.css'; 


const API_BASE = "http://localhost:5000/api";

const StarIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;

const StarRatingDisplay = ({ rating }) => {
    return (
        <div className="star-rating-display">
            {[...Array(5)].map((_, index) => (
                <StarIcon key={index} className={index < rating ? 'star-filled' : 'star-empty'}/>
            ))}
        </div>
    );
};

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const axiosWithAuth = useMemo(() => axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosWithAuth.get('/bookings');
            setBookings(res.data);
        } catch (error) {
            toast.error("Failed to fetch your bookings.");
        } finally {
            setLoading(false);
        }
    }, [axiosWithAuth]);

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        const currentUser = JSON.parse(localStorage.getItem("user"));
        setUser(currentUser);
        fetchBookings();
    }, [token, navigate, fetchBookings]);

    const handleOpenRatingModal = (booking) => {
        setSelectedBooking(booking);
        setIsRatingModalOpen(true);
    };

    const handleCloseRatingModal = () => {
        setIsRatingModalOpen(false);
        setSelectedBooking(null);
    };

    const getStatusClass = (status) => {
        return status ? status.toLowerCase() : '';
    }

    const handleBackClick = () => {
        if (user?.role === 'Service Provider') {
            navigate('/provider');
        } else {
            navigate('/customer');
        }
    }
    
    return (
        <>
            <div className="my-bookings-page">
                <ToastContainer theme="dark" position="bottom-right" />
                <header className="bookings-header">
                    <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>ServiceSphere</div>
                    <button className="back-btn"  onClick={handleBackClick}> 
                        <ArrowLeftIcon /> 
                        <span>Back to Dashboard</span>
                    </button> 
                </header>
                <main className="bookings-container">
                    <h1>My Bookings</h1>
                    <p>Here is a list of all your scheduled appointments and past services.</p>

                    <div className="bookings-list">
                        {loading ? (
                            <div className="loader-container"><div className="loader"></div></div>
                        ) : bookings.length > 0 ? (
                            bookings.map(booking => (
                                <div key={booking.id} className="booking-card">
                                    <div className="booking-card-header">
                                        <h3>{booking.service_name}</h3>
                                        <span className={`booking-status ${getStatusClass(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="booking-card-body">
                                        <p><strong>{user?.role === 'Customer' ? 'Provider' : 'Customer'}:</strong> {user?.role === 'Customer' ? booking.provider_name : booking.customer_name}</p>
                                        <p><strong>Date & Time:</strong> {format(new Date(booking.booking_start_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</p>
                                        <p><strong>Price:</strong> ₹{booking.price || 'N/A'}</p>
                                    </div>
                                    {booking.status === 'Completed' && (
                                        <div className="booking-card-footer">
                                            {booking.review_id ? (
                                                <div className="review-display">
                                                    <h4>{user?.role === 'Customer' ? 'Your Review' : 'Customer Review'}:</h4>
                                                    <StarRatingDisplay rating={booking.rating} />
                                                    {booking.comment && <p className="review-comment">"{booking.comment}"</p>}
                                                </div>
                                            ) : (
                                                user?.role === 'Customer' && (
                                                    <button className="btn btn-primary" onClick={() => handleOpenRatingModal(booking)}>
                                                        Rate & Review
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-bookings">
                               <p>You have no bookings yet.</p>
                               <button className="btn" onClick={() => navigate('/customer')}>Explore Services</button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
            {isRatingModalOpen && (
                <RatingModal 
                    booking={selectedBooking}
                    onClose={handleCloseRatingModal}
                    axiosWithAuth={axiosWithAuth}
                    onReviewSubmit={fetchBookings}
                />
            )}
        </>
    );
};

export default MyBookings;