import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'react-toastify';
import './BookingModal.css';

const API_BASE = "http://localhost:5000/api";

const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;

// ─── Screen 1: Calendar + Slot Picker ────────────────────────────────────────
const SlotPickerScreen = ({ service, selectedDate, setSelectedDate, currentWeek, setCurrentWeek, availableSlots, selectedSlot, setSelectedSlot, isLoading, onCancel, onNext }) => {
    const renderWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = addDays(currentWeek, i);
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
            const isPast = day < new Date().setHours(0, 0, 0, 0);
            days.push(
                <button key={i} disabled={isPast} className={`day-btn ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`} onClick={() => setSelectedDate(day)}>
                    <span className="day-name">{format(day, 'EEE')}</span>
                    <span className="day-number">{format(day, 'd')}</span>
                </button>
            );
        }
        return days;
    };

    return (
        <>
            <div className="modal-header">
                <h3>Book <span className="highlight">{service.service_name}</span></h3>
                <button onClick={onCancel} className="close-btn">&times;</button>
            </div>
            <div className="booking-body">
                <div className="calendar-section">
                    <h4><CalendarIcon /> Select a Date</h4>
                    <div className="week-navigator">
                        <button onClick={() => setCurrentWeek(addDays(currentWeek, -7))}><ChevronLeftIcon /></button>
                        <span>{format(currentWeek, 'MMM yyyy')}</span>
                        <button onClick={() => setCurrentWeek(addDays(currentWeek, 7))}><ChevronRightIcon /></button>
                    </div>
                    <div className="week-days">{renderWeekDays()}</div>
                </div>
                <div className="slots-section">
                    <h4><ClockIcon /> Select a Time</h4>
                    <div className="time-slots">
                        {isLoading ? <p>Loading slots...</p> : availableSlots.length > 0 ? (
                            availableSlots.map(slot => (
                                <button key={slot} className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`} onClick={() => setSelectedSlot(slot)}>{slot}</button>
                            ))
                        ) : (
                            <p className="no-slots">No available slots for {format(selectedDate, 'MMMM d')}.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={onNext} disabled={!selectedSlot}>
                    Continue to Payment →
                </button>
            </div>
        </>
    );
};

// ─── Screen 2: Payment Method Choice ─────────────────────────────────────────
const PaymentChoiceScreen = ({ service, selectedDate, selectedSlot, paymentMethod, setPaymentMethod, onBack, onConfirm, isSubmitting }) => (
    <>
        <div className="modal-header">
            <button className="back-btn" onClick={onBack}><BackIcon /> Back</button>
            <button onClick={onConfirm} className="close-btn" style={{ display: 'none' }}>&times;</button>
        </div>

        <div className="payment-choice-body">
            <div className="booking-summary-bar">
                <div className="summary-item">
                    <span className="summary-label">Service</span>
                    <span className="summary-value">{service.service_name}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item">
                    <span className="summary-label">Date & Time</span>
                    <span className="summary-value">{format(selectedDate, 'MMM d')} at {selectedSlot}</span>
                </div>
                <div className="summary-divider" />
                <div className="summary-item">
                    <span className="summary-label">Amount</span>
                    <span className="summary-value summary-price">₹{service.price || '0'}</span>
                </div>
            </div>

            <h4 className="payment-choice-title">Choose Payment Method</h4>

            <div className="payment-options">
                <label className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    <div className="payment-option-icon cod-icon">💵</div>
                    <div className="payment-option-info">
                        <span className="payment-option-name">Cash on Delivery</span>
                        <span className="payment-option-desc">Pay in cash when the service is completed</span>
                    </div>
                    {paymentMethod === 'COD' && <div className="payment-option-check">✓</div>}
                </label>

                <label className={`payment-option-card ${paymentMethod === 'Online' ? 'selected' : ''}`}>
                    <input type="radio" name="payment" value="Online" checked={paymentMethod === 'Online'} onChange={() => setPaymentMethod('Online')} />
                    <div className="payment-option-icon online-icon">💳</div>
                    <div className="payment-option-info">
                        <span className="payment-option-name">Pay Online</span>
                        <span className="payment-option-desc">UPI, Card, or Net Banking — instant confirmation</span>
                    </div>
                    {paymentMethod === 'Online' && <div className="payment-option-check">✓</div>}
                </label>
            </div>
        </div>

        <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>Back</button>
            <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={isSubmitting}>
                {paymentMethod === 'Online' ? 'Proceed to Pay →' : (isSubmitting ? 'Booking...' : 'Confirm Booking')}
            </button>
        </div>
    </>
);

// ─── Screen 3: Fake Online Payment UI ────────────────────────────────────────
const OnlinePaymentScreen = ({ service, onBack, onPaymentSuccess, isSubmitting }) => {
    const [activeTab, setActiveTab] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [netbankSelected, setNetbankSelected] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const banks = [
        { id: 'sbi', name: 'State Bank of India', logo: '🏦' },
        { id: 'hdfc', name: 'HDFC Bank', logo: '🏦' },
        { id: 'icici', name: 'ICICI Bank', logo: '🏦' },
        { id: 'axis', name: 'Axis Bank', logo: '🏦' },
        { id: 'kotak', name: 'Kotak Mahindra', logo: '🏦' },
        { id: 'pnb', name: 'Punjab National Bank', logo: '🏦' },
    ];

    const formatCardNumber = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const handlePay = () => {
        if (activeTab === 'upi' && !upiId.includes('@')) {
            toast.warn('Please enter a valid UPI ID (e.g. name@upi)');
            return;
        }
        if (activeTab === 'card') {
            if (cardNumber.replace(/\s/g, '').length < 16) { toast.warn('Enter a valid 16-digit card number'); return; }
            if (cardExpiry.length < 5) { toast.warn('Enter a valid expiry date'); return; }
            if (cardCvv.length < 3) { toast.warn('Enter a valid CVV'); return; }
            if (!cardName.trim()) { toast.warn('Enter cardholder name'); return; }
        }
        if (activeTab === 'netbanking' && !netbankSelected) {
            toast.warn('Please select a bank');
            return;
        }

        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            onPaymentSuccess();
        }, 1500);
    };

    return (
        <>
            <div className="modal-header payment-gateway-header">
                <div className="gateway-title-row">
                    <button className="back-btn" onClick={onBack} disabled={isProcessing}><BackIcon /> Back</button>
                    <div className="gateway-brand">
                        <LockIcon />
                        <span>Secure Payment</span>
                    </div>
                </div>
            </div>

            <div className="payment-gateway-body">
                <div className="gateway-amount-bar">
                    <span>Paying for <strong>{service.service_name}</strong></span>
                    <span className="gateway-amount">₹{service.price || '0'}</span>
                </div>

                <div className="gateway-tabs">
                    <button className={`gateway-tab ${activeTab === 'upi' ? 'active' : ''}`} onClick={() => setActiveTab('upi')}>UPI</button>
                    <button className={`gateway-tab ${activeTab === 'card' ? 'active' : ''}`} onClick={() => setActiveTab('card')}>Card</button>
                    <button className={`gateway-tab ${activeTab === 'netbanking' ? 'active' : ''}`} onClick={() => setActiveTab('netbanking')}>Net Banking</button>
                </div>

                <div className="gateway-panel">
                    {activeTab === 'upi' && (
                        <div className="upi-panel">
                            <div className="upi-apps-row">
                                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                                    <button key={app} className="upi-app-btn" onClick={() => setUpiId(`user@${app.toLowerCase()}`)}>
                                        <span className="upi-app-icon">{app === 'GPay' ? '🟢' : app === 'PhonePe' ? '🟣' : app === 'Paytm' ? '🔵' : '🟠'}</span>
                                        <span>{app}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="upi-divider"><span>or enter UPI ID</span></div>
                            <div className="gateway-field">
                                <label>UPI ID</label>
                                <input
                                    className="gateway-input"
                                    placeholder="yourname@upi"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'card' && (
                        <div className="card-panel">
                            <div className="card-preview">
                                <div className="card-chip">▪▪▪</div>
                                <div className="card-number-preview">{cardNumber || '•••• •••• •••• ••••'}</div>
                                <div className="card-bottom-row">
                                    <div>
                                        <div className="card-label">Card Holder</div>
                                        <div className="card-val">{cardName || 'YOUR NAME'}</div>
                                    </div>
                                    <div>
                                        <div className="card-label">Expires</div>
                                        <div className="card-val">{cardExpiry || 'MM/YY'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="gateway-field">
                                <label>Card Number</label>
                                <input className="gateway-input" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} />
                            </div>
                            <div className="gateway-field">
                                <label>Cardholder Name</label>
                                <input className="gateway-input" placeholder="Name on card" value={cardName} onChange={e => setCardName(e.target.value)} />
                            </div>
                            <div className="gateway-row">
                                <div className="gateway-field">
                                    <label>Expiry</label>
                                    <input className="gateway-input" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                                </div>
                                <div className="gateway-field">
                                    <label>CVV</label>
                                    <input className="gateway-input" placeholder="•••" type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'netbanking' && (
                        <div className="netbanking-panel">
                            <div className="bank-grid">
                                {banks.map(bank => (
                                    <label key={bank.id} className={`bank-option ${netbankSelected === bank.id ? 'selected' : ''}`}>
                                        <input type="radio" name="bank" value={bank.id} checked={netbankSelected === bank.id} onChange={() => setNetbankSelected(bank.id)} />
                                        <span className="bank-logo">{bank.logo}</span>
                                        <span className="bank-name">{bank.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-actions">
                <div className="secure-label"><LockIcon /> 256-bit SSL secured</div>
                <button type="button" className="btn btn-pay" onClick={handlePay} disabled={isProcessing || isSubmitting}>
                    {isProcessing ? <><span className="pay-spinner"></span> Processing...</> : `Pay ₹${service.price || '0'}`}
                </button>
            </div>
        </>
    );
};

// ─── Screen 4: Success ────────────────────────────────────────────────────────
const SuccessScreen = ({ paymentMethod, onClose }) => (
    <div className="success-screen">
        <div className="success-icon-wrap">
            <CheckIcon />
        </div>
        <h3>{paymentMethod === 'Online' ? 'Payment Successful!' : 'Booking Confirmed!'}</h3>
        <p>{paymentMethod === 'Online'
            ? 'Your payment was processed and booking request has been sent to the provider.'
            : 'Your booking is placed. Pay cash when the service is done.'
        }</p>
        <button className="btn btn-primary" onClick={onClose}>Done</button>
    </div>
);

// ─── Main BookingModal ────────────────────────────────────────────────────────
// NOTE: axiosWithAuth prop removed — modal now owns its own authenticated instance
const BookingModal = ({ service, onClose }) => {
    const [screen, setScreen] = useState('slots');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ FIX: Build the authenticated axios instance here, not from props.
    // This guarantees the correct baseURL and token are always used.
    const token = localStorage.getItem('token');
    const axiosWithAuth = useMemo(() => axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` },
    }), [token]);

    const fetchAvailableSlots = useCallback(async (date) => {
        if (!service) return;
        setIsLoading(true);
        setSelectedSlot(null);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await axios.get(`${API_BASE}/availability/${service.provider_id}/${dateStr}`);
            setAvailableSlots(res.data.availableSlots);
        } catch {
            toast.error("Failed to fetch available slots.");
            setAvailableSlots([]);
        } finally {
            setIsLoading(false);
        }
    }, [service]);

    useEffect(() => { fetchAvailableSlots(selectedDate); }, [selectedDate, fetchAvailableSlots]);

    const buildBookingStartTime = () => {
        const [hours, minutes] = selectedSlot.split(':');
        const t = new Date(selectedDate);
        t.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return t.toISOString();
    };

    // Called when COD is confirmed OR after online payment succeeds
    const createBooking = async (method) => {
        setIsSubmitting(true);
        try {
            await axiosWithAuth.post('/bookings', {
                service_id: service.id,
                provider_id: service.provider_id,
                booking_start_time: buildBookingStartTime(),
                payment_method: method,                              // ✅ 'COD' or 'Online'
                payment_status: method === 'Online' ? 'Paid' : 'Pending',
            });
            setScreen('success');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentConfirm = () => {
        if (paymentMethod === 'Online') {
            setScreen('gateway');
        } else {
            createBooking('COD');
        }
    };

    // ✅ FIX: pass the actual method string, not the state variable
    // (state might not have flushed yet in older React versions)
    const handleOnlinePaymentSuccess = () => {
        createBooking('Online');
    };

    return (
        <div className="modal-overlay" onClick={screen === 'success' ? onClose : undefined}>
            <div
                className={`modal-content booking-modal ${screen === 'gateway' ? 'gateway-modal' : ''} ${screen === 'success' ? 'success-modal' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                {screen === 'slots' && (
                    <SlotPickerScreen
                        service={service}
                        selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                        currentWeek={currentWeek} setCurrentWeek={setCurrentWeek}
                        availableSlots={availableSlots}
                        selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot}
                        isLoading={isLoading}
                        onCancel={onClose}
                        onNext={() => setScreen('payment')}
                    />
                )}
                {screen === 'payment' && (
                    <PaymentChoiceScreen
                        service={service}
                        selectedDate={selectedDate}
                        selectedSlot={selectedSlot}
                        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                        onBack={() => setScreen('slots')}
                        onConfirm={handlePaymentConfirm}
                        isSubmitting={isSubmitting}
                    />
                )}
                {screen === 'gateway' && (
                    <OnlinePaymentScreen
                        service={service}
                        onBack={() => setScreen('payment')}
                        onPaymentSuccess={handleOnlinePaymentSuccess}
                        isSubmitting={isSubmitting}
                    />
                )}
                {screen === 'success' && (
                    <SuccessScreen paymentMethod={paymentMethod} onClose={onClose} />
                )}
            </div>
        </div>
    );
};

export default BookingModal;