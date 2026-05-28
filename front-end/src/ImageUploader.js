// src/ImageUploader.js

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ImageUploader.css';
import ThemeToggle from './ThemeToggle';


const API_BASE = "http://localhost:5000/api";

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;

const ImageUploader = ({ onUploadComplete, initialImageUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState(initialImageUrl || null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
            });
            setUploadedImageUrl(res.data.url);
            onUploadComplete(res.data.url);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            toast.error("Image upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-uploader" onClick={() => fileInputRef.current.click()}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/webp"
            />
            {uploading ? (
                <div className="loader"></div>
            ) : uploadedImageUrl ? (
                <img src={uploadedImageUrl} alt="Service preview" className="image-preview" />
            ) : (
                <div className="upload-placeholder">
                    <UploadIcon />
                    <span>Click to upload an image</span>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;