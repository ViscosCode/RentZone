import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { FcBusinessman } from "react-icons/fc";

// Categories extracted from HomePage.jsx
const categories = [
  { name: "Automobiles", items: ["Self Drive Car", "Bikes & Scooters", "Outstation Cabs", "Luxury Cars", "Segways", "Golf Cart", "Car Rental in Goa"] },
  { name: "Drones", items: ["Thermal Drone", "Consumer Drone"] },
  { name: "Furniture", items: ["Office Workstation & Chairs", "Beds & Mattress", "Sofa & Recliners", "Dining Sets", "Wardrobes & Cabinets", "Tables", "Student Combo Deal"] },
  { name: "Generators", items: ["Diesel Generators", "Gas Generators"] },
  { name: "Home Appliance", items: ["Microwave", "AC & Coolers", "Combo Deals", "Refrigerator", "Washing Machine", "Deep Freezer", "Mist Fans", "Heaters", "TV", "Dishwasher", "RO & Dispensers", "Home Theatre", "Air Purifier", "Geyser"] },
  { name: "Laptops/Computers", items: ["Macbook Laptops", "Windows Laptops", "Desktops"] },
  { name: "Musical Instruments", items: ["Guitar", "Flute", "Harmonium", "Violin", "Keyboard", "Drum", "Trumpet", "Ukulele", "Sitar", "Tabla", "Congo"] },
];

// Predefined state, city, and place mapping
const locationData = {
  "Maharashtra": {
    "Mumbai": ["Andheri", "Bandra", "Dadar", "Colaba", "Powai"],
    "Pune": ["Kothrud", "Shivaji Nagar", "Hadapsar", "Hinjawadi", "Baner"],
    "Nagpur": ["Dharampeth", "Ramdaspeth", "Sadar", "Civil Lines"],
    "Chhatrapati Sambhajinagar": ["Cidco", "Aurangpura", "Osmanpura", "Garkheda", "Jalna Road"],
    "Nanded": ["Vazirabad", "Taroda", "Wajegaon", "Shivajinagar"],
  },
  "Delhi": {
    "New Delhi": ["Connaught Place", "Karol Bagh", "South Extension", "Chanakyapuri", "Hauz Khas"],
    "North Delhi": ["Rohini", "Pitampura", "Model Town", "Shalimar Bagh"],
    "East Delhi": ["Laxmi Nagar", "Mayur Vihar", "Preet Vihar"],
  },
  "Karnataka": {
    "Bangalore": ["Koramangala", "Indiranagar", "Whitefield", "Jayanagar", "Malleshwaram"],
    "Mysore": ["Gokulam", "Vijayanagar", "Kuvempunagar", "Siddarthanagar"],
    "Hubli": ["Vidyanagar", "Deshpande Nagar", "Navanagar"],
  },
  "Tamil Nadu": {
    "Chennai": ["T. Nagar", "Anna Nagar", "Velachery", "Adyar", "Mylapore"],
    "Coimbatore": ["RS Puram", "Saibaba Colony", "Peelamedu", "Gandhipuram"],
    "Madurai": ["Anna Nagar", "K.K. Nagar", "Tallakulam", "Thiruparankundram"],
  },
  "Uttar Pradesh": {
    "Lucknow": ["Gomti Nagar", "Hazratganj", "Aliganj", "Indira Nagar"],
    "Noida": ["Sector 18", "Sector 62", "Sector 50", "Greater Noida West"],
    "Varanasi": ["Sigra", "Lanka", "Bhelupur", "Cantt"],
  },
  "West Bengal": {
    "Kolkata": ["Salt Lake", "Park Street", "New Town", "Dum Dum", "Garia"],
    "Howrah": ["Shibpur", "Salkia", "Bally", "Liluah"],
    "Siliguri": ["Sevoke Road", "Hakimpara", "Pradhan Nagar"],
  },
  "Gujarat": {
    "Ahmedabad": ["Navrangpura", "Vastrapur", "Satellite", "Maninagar"],
    "Surat": ["Adajan", "Vesu", "Athwalines", "Piplod"],
    "Vadodara": ["Alkapuri", "Gotri", "Fatehgunj", "Vasna Road"],
  },
  "Rajasthan": {
    "Jaipur": ["C-Scheme", "Vaishali Nagar", "Malviya Nagar", "Tonk Road"],
    "Udaipur": ["Hiran Magri", "Fatehpura", "City Palace", "Shobhagpura"],
    "Jodhpur": ["Sardarpura", "Paota", "Ratanada", "Shastri Nagar"],
  },
};

const chargeTypes = ['Day', 'Week', 'Month'];

const Dashboard = ({ email, onClose }) => {
  const [partner, setPartner] = useState(null);
  const [products, setProducts] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('Dashboard');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const [dashboardFormData, setDashboardFormData] = useState({
    address: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    country: '',
  });
  const [profileFormData, setProfileFormData] = useState({
    fullName: '',
    businessName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    image: null,
    imagePreview: '', // Temporary preview URL during editing
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    ownerName: '',
    shopName: '',
    contactNumber: '',
    emailAddress: email,
    state: '',
    city: '',
    place: '',
    category: '',
    subcategory: '',
    rentCharge: '',
    chargeType: '',
    productDeposit: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [cacheBuster, setCacheBuster] = useState(Date.now()); // For cache busting

  // Fetch partner and products on mount
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        console.log('Fetching partner details for email:', email);
        const response = await fetch(`http://localhost:5000/api/partners/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch partner details. Please try again later.');
        }
        const data = await response.json();
        console.log('Partner details response:', data);
        setPartner(data);
        setProfileFormData({
          fullName: data.fullName || '',
          businessName: data.businessName || '',
          email: data.email,
          phone: data.phone || '',
          alternatePhone: data.alternatePhone || '',
          image: null,
          imagePreview: data.imageUrl ? `http://localhost:5000${data.imageUrl}?t=${cacheBuster}` : '',
        });
        setDashboardFormData({
          address: data.address || '',
          landmark: data.landmark || '',
          pincode: data.pincode || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
        });
        setFormData((prev) => ({
          ...prev,
          ownerName: data.fullName || '',
        }));
      } catch (error) {
        console.error('Error fetching partner details:', error);
        setError(error.message || 'An unexpected error occurred while fetching partner details.');
      }
    };

    const fetchProducts = async () => {
      try {
        console.log('Fetching products for email:', email);
        const response = await fetch(`http://localhost:5000/api/products/partner/${email}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products. Please try again later.');
        }
        const data = await response.json();
        console.log('Products response:', data);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error.message || 'An unexpected error occurred while fetching products.');
      }
    };

    if (email) {
      fetchPartner();
      fetchProducts();
    }
  }, [email, cacheBuster]);

  // Cleanup image previews on unmount
  useEffect(() => {
    return () => {
      if (profileFormData.imagePreview && profileFormData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileFormData.imagePreview);
      }
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [profileFormData.imagePreview, imagePreview]);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setShowServiceForm(false);
    setIsEditing(false);
    setIsEditingProfile(false);
    setIsEditingDashboard(false);
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setFormError('');

    if (section === 'My Orders') {
      fetchQuotes();
    }
  };

  const fetchQuotes = async () => {
    setIsLoadingQuotes(true);
    setError('');
    try {
      console.log('Fetching quotes for email:', email);
      const response = await fetch(`http://localhost:5000/api/quotes/partner/${email}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders. Please try again later.');
      }
      const data = await response.json();
      console.log('Quotes response:', data);
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setError(error.message || 'An unexpected error occurred while fetching orders.');
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleAddNewProductClick = () => {
    setIsEditing(false);
    setFormData({
      productName: '',
      productDescription: '',
      ownerName: partner ? partner.fullName : '',
      shopName: '',
      contactNumber: '',
      emailAddress: email,
      state: '',
      city: '',
      place: '',
      category: '',
      subcategory: '',
      rentCharge: '',
      chargeType: '',
      productDeposit: '',
      image: null,
    });
    // Revoke previous image preview if it exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setCities([]);
    setPlaces([]);
    setSubcategories([]);
    setShowServiceForm(true);
  };

  const handleEditProductClick = (product) => {
    setIsEditing(true);
    setEditProduct(product);
    setFormData({
      productName: product.productName,
      productDescription: product.productDescription,
      ownerName: product.ownerName,
      shopName: product.shopName,
      contactNumber: product.contactNumber,
      emailAddress: product.emailAddress,
      state: product.state,
      city: product.city,
      place: product.place,
      category: product.category,
      subcategory: product.subcategory,
      rentCharge: product.rentCharge.toString(),
      chargeType: product.chargeType,
      productDeposit: product.productDeposit ? product.productDeposit.toString() : '',
      image: null,
    });
    setImagePreview(product.imageUrl ? `http://localhost:5000${product.imageUrl}` : null);
    setCities(product.state ? Object.keys(locationData[product.state]) : []);
    setPlaces(product.state && product.city ? locationData[product.state][product.city] : []);
    const selectedCategory = categories.find(cat => cat.name === product.category);
    setSubcategories(selectedCategory ? selectedCategory.items : []);
    setShowServiceForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      console.log('Sending DELETE request for productId:', productId);
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product. Please try again later.');
      }

      const result = await response.json();
      console.log('Delete product response:', result);

      const productsResponse = await fetch(`http://localhost:5000/api/products/partner/${email}`);
      if (!productsResponse.ok) {
        throw new Error('Failed to refresh products after deletion. Please try again later.');
      }
      const productsData = await productsResponse.json();
      console.log('Refreshed products:', productsData);
      setProducts(productsData || []);
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error.message);
      setFormError(error.message || 'An unexpected error occurred while deleting the product.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    try {
      console.log('Sending DELETE request for account with email:', email);
      const response = await fetch(`http://localhost:5000/api/partners/${email}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account. Please try again later.');
      }

      const result = await response.json();
      console.log('Delete account response:', result);
      alert('Account deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting account:', error.message);
      setFormError(error.message || 'An unexpected error occurred while deleting the account.');
    }
  };

  const handleCloseServiceForm = () => {
    // Revoke temporary image preview if it exists
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setShowServiceForm(false);
    setIsEditing(false);
    setEditProduct(null);
    setFormData({
      productName: '',
      productDescription: '',
      ownerName: partner ? partner.fullName : '',
      shopName: '',
      contactNumber: '',
      emailAddress: email,
      state: '',
      city: '',
      place: '',
      category: '',
      subcategory: '',
      rentCharge: '',
      chargeType: '',
      productDeposit: '',
      image: null,
    });
    setImagePreview(null);
    setCities([]);
    setPlaces([]);
    setSubcategories([]);
    setFormError('');
  };

  const validateForm = () => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      setFormError('Contact number must be a 10-digit number');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (formData.rentCharge <= 0) {
      setFormError('Rent charge must be a positive number');
      return false;
    }

    if (formData.productDeposit <= 0) {
      setFormError('Product deposit must be a positive number');
      return false;
    }

    setFormError('');
    return true;
  };

  const validateProfileForm = () => {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(profileFormData.phone)) {
      setFormError('Phone number must be a 10-digit number');
      return false;
    }

    if (profileFormData.alternatePhone && !phoneRegex.test(profileFormData.alternatePhone)) {
      setFormError('Alternate phone number must be a 10-digit number');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileFormData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!profileFormData.fullName || !profileFormData.businessName) {
      setFormError('Full Name and Business Name are required');
      return false;
    }

    setFormError('');
    return true;
  };

  const validateDashboardForm = () => {
    const pincodeRegex = /^\d{6}$/;
    if (dashboardFormData.pincode && !pincodeRegex.test(dashboardFormData.pincode)) {
      setFormError('Pincode must be a 6-digit number');
      return false;
    }

    if (!dashboardFormData.address) {
      setFormError('Address is required');
      return false;
    }

    if (!dashboardFormData.city) {
      setFormError('City is required');
      return false;
    }

    if (!dashboardFormData.state) {
      setFormError('State is required');
      return false;
    }

    if (!dashboardFormData.country) {
      setFormError('Country is required');
      return false;
    }

    setFormError('');
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordFormData.currentPassword) {
      setFormError('Current password is required');
      return false;
    }

    if (passwordFormData.newPassword.length < 8) {
      setFormError('New password must be at least 8 characters long');
      return false;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setFormError('New password and confirmation do not match');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData({ ...profileFormData, [name]: value });
  };

  const handleDashboardInputChange = (e) => {
    const { name, value } = e.target;
    setDashboardFormData({ ...dashboardFormData, [name]: value });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({ ...passwordFormData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous image preview if it exists
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke the old temporary URL to prevent memory leaks
      if (profileFormData.imagePreview && profileFormData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileFormData.imagePreview);
      }
      setProfileFormData({
        ...profileFormData,
        image: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setFormData({ ...formData, state, city: '', place: '' });
    setCities(state ? Object.keys(locationData[state]) : []);
    setPlaces([]);
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setFormData({ ...formData, city, place: '' });
    setPlaces(formData.state && city ? locationData[formData.state][city] : []);
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const selectedCategory = categories.find(cat => cat.name === category);
    setFormData({ ...formData, category, subcategory: '' });
    setSubcategories(selectedCategory ? selectedCategory.items : []);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.trim());
  };

  const handleProductSearchChange = (e) => {
    setProductSearchQuery(e.target.value.trim());
  };

  const handleEditProfileClick = () => {
    setIsEditingProfile(true);
    setFormError('');
  };

  const handleEditDashboardClick = () => {
    setIsEditingDashboard(true);
    setFormError('');
  };

  const handleCancelEditProfile = () => {
    // Revoke temporary URL if it exists
    if (profileFormData.imagePreview && profileFormData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(profileFormData.imagePreview);
    }
    setIsEditingProfile(false);
    setProfileFormData({
      fullName: partner.fullName || '',
      businessName: partner.businessName || '',
      email: partner.email || '',
      phone: partner.phone || '',
      alternatePhone: partner.alternatePhone || '',
      image: null,
      imagePreview: partner.imageUrl ? `http://localhost:5000${partner.imageUrl}?t=${cacheBuster}` : '',
    });
    setFormError('');
  };

  const handleCancelEditDashboard = () => {
    setIsEditingDashboard(false);
    setDashboardFormData({
      address: partner.address || '',
      landmark: partner.landmark || '',
      pincode: partner.pincode || '',
      city: partner.city || '',
      state: partner.state || '',
      country: partner.country || '',
    });
    setFormError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const data = new FormData();
    data.append('fullName', profileFormData.fullName);
    data.append('businessName', profileFormData.businessName);
    data.append('email', profileFormData.email);
    data.append('phone', profileFormData.phone);
    data.append('alternatePhone', profileFormData.alternatePhone || '');
    if (profileFormData.image) {
      data.append('image', profileFormData.image);
    }

    try {
      console.log('Submitting profile update with FormData:');
      for (let [key, value] of data.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch(`http://localhost:5000/api/partners/${email}`, {
        method: 'PUT',
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile. Please try again later.');
      }

      const updatedPartner = await response.json();
      console.log('Updated partner response:', updatedPartner);
      console.log('New imageUrl from backend:', updatedPartner.imageUrl);

      // Update partner state
      setPartner(updatedPartner);

      // Revoke temporary preview URL
      if (profileFormData.imagePreview && profileFormData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileFormData.imagePreview);
      }

      // Update profileFormData with the new imageUrl from backend
      const newCacheBuster = Date.now();
      setCacheBuster(newCacheBuster);
      setProfileFormData({
        fullName: updatedPartner.fullName || '',
        businessName: updatedPartner.businessName || '',
        email: updatedPartner.email || '',
        phone: updatedPartner.phone || '',
        alternatePhone: updatedPartner.alternatePhone || '',
        image: null,
        imagePreview: updatedPartner.imageUrl ? `http://localhost:5000${updatedPartner.imageUrl}?t=${newCacheBuster}` : '',
      });

      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      setFormError(error.message || 'An unexpected error occurred while updating the profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDashboardSubmit = async (e) => {
    e.preventDefault();

    if (!validateDashboardForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch(`http://localhost:5000/api/partners/${email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboardFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update details. Please try again later.');
      }

      const updatedPartner = await response.json();
      console.log('Updated partner response:', updatedPartner);
      setPartner(updatedPartner);
      setIsEditingDashboard(false);
      alert('Details updated successfully!');
    } catch (error) {
      console.error('Error updating dashboard details:', error.message);
      setFormError(error.message || 'An unexpected error occurred while updating details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const response = await fetch(`http://localhost:5000/api/partners/${email}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password. Please try again later.');
      }

      const result = await response.json();
      console.log('Password update response:', result);
      alert('Password updated successfully!');
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error.message);
      setFormError(error.message || 'An unexpected error occurred while updating the password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    const data = new FormData();
    data.append('productName', formData.productName);
    data.append('productDescription', formData.productDescription);
    data.append('ownerName', formData.ownerName);
    data.append('shopName', formData.shopName);
    data.append('contactNumber', formData.contactNumber);
    data.append('emailAddress', formData.emailAddress);
    data.append('state', formData.state);
    data.append('city', formData.city);
    data.append('place', formData.place);
    data.append('category', formData.category);
    data.append('subcategory', formData.subcategory);
    data.append('rentCharge', formData.rentCharge);
    data.append('chargeType', formData.chargeType);
    data.append('productDeposit', formData.productDeposit);
    data.append('partnerEmail', email);
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      console.log('Submitting form in', isEditing ? 'edit' : 'add', 'mode');
      console.log('FormData entries:');
      for (let [key, value] of data.entries()) {
        console.log(`${key}: ${value}`);
      }

      const url = isEditing ? `http://localhost:5000/api/products/${editProduct.productId}` : 'http://localhost:5000/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} product. Please try again later.`);
      }

      const result = await response.json();
      console.log(`${isEditing ? 'Update' : 'Add'} product response:`, result);

      const productsResponse = await fetch(`http://localhost:5000/api/products/partner/${email}`);
      if (!productsResponse.ok) {
        throw new Error('Failed to refresh products after submission. Please try again later.');
      }
      const productsData = await productsResponse.json();
      console.log('Refreshed products:', productsData);
      setProducts(productsData || []);

      alert(isEditing ? 'Product updated successfully!' : `Product added successfully! Created at: ${new Date(result.createdAt).toLocaleString()}`);
      handleCloseServiceForm();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} product:`, error.message);
      setFormError(error.message || `An unexpected error occurred while ${isEditing ? 'updating' : 'adding'} the product.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const query = searchQuery.toLowerCase();
    return (
      (quote.productName?.toLowerCase().includes(query) || '') ||
      (quote.fullName?.toLowerCase().includes(query) || '') ||
      (quote.contact?.toLowerCase().includes(query) || '')
    );
  });

  const filteredProducts = products.filter(product => {
    const query = productSearchQuery.toLowerCase();
    return (
      (product.productName?.toLowerCase().includes(query) || '') ||
      (product.shopName?.toLowerCase().includes(query) || '') ||
      (product.category?.toLowerCase().includes(query) || '') ||
      (product.city?.toLowerCase().includes(query) || '')
    );
  });

  // Handle image load errors for avatar and profile images
  const handleImageError = (e) => {
    console.error('Failed to load image:', e.target.src);
    e.target.style.display = 'none'; // Hide broken image
    // The FcBusinessman icon will automatically show as a fallback in the UI
  };

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  if (!partner) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-logo">RentZone</div>
        <ul className="sidebar-menu">
          <li
            className={`sidebar-item ${activeSection === 'Dashboard' ? 'active' : ''}`}
            onClick={() => handleSectionClick('Dashboard')}
          >
            Dashboard
          </li>
          <li className="sidebar-section">Account</li>
          <li
            className={`sidebar-item ${activeSection === 'Profile' ? 'active' : ''}`}
            onClick={() => handleSectionClick('Profile')}
          >
            Profile
          </li>
          <li
            className={`sidebar-item ${activeSection === 'Change Password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('Change Password')}
          >
            Change Password
          </li>
          <li
            className={`sidebar-item ${activeSection === 'Delete Account' ? 'active' : ''}`}
            onClick={() => handleSectionClick('Delete Account')}
          >
            Delete Account
          </li>
          <li className="sidebar-section">SERVICE</li>
          <li
            className={`sidebar-item ${activeSection === 'Service List' ? 'active' : ''}`}
            onClick={() => handleSectionClick('Service List')}
          >
            Service List
          </li>
          <li className="sidebar-item" onClick={handleAddNewProductClick}>
            Add Service
          </li>
          <li className="sidebar-section">Inbox ({quotes.length})</li>
          <li
            className={`sidebar-item ${activeSection === 'My Orders' ? 'active' : ''}`}
            onClick={() => handleSectionClick('My Orders')}
          >
            My Orders
          </li>

        </ul>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-greeting">
            <div className="avatar">
              {partner.imageUrl ? (
                <img
                  src={`http://localhost:5000${partner.imageUrl}?t=${cacheBuster}`}
                  alt="Profile"
                  className="profile-avatar-img"
                  onError={handleImageError}
                />
              ) : (
                <FcBusinessman className="profile-avatar-icon" />
              )}
            </div>
            <div>
              <h1>Hi! {partner.fullName}</h1>
              <p>Business Name: {partner.businessName}</p>
            </div>
          </div>
          {activeSection === 'Dashboard' && (
            <div className="dashboard-stats">
              <div className="stat-box">
                <p>Listed Product</p>
                <h2>{products.length}</h2>
              </div>
              <div className="stat-box">
                <p>Total Order</p>
                <h2>{quotes.length}</h2>
              </div>
            </div>
          )}
        </div>

        {activeSection === 'Dashboard' ? (
          <div className="dashboard-details">
            <div className="profile-header">
              <h3>Basic Details</h3>
              {!isEditingDashboard && (
                <button className="dashboard-action-btn edit-btn" onClick={handleEditDashboardClick}>
                  Edit Details
                </button>
              )}
            </div>
            {formError && <div className="form-error">{formError}</div>}
            {isEditingDashboard ? (
              <form onSubmit={handleDashboardSubmit}>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Name</label>
                    <p>{partner.fullName}</p>
                  </div>
                  <div className="detail-row">
                    <label>Email</label>
                    <p>{partner.email}</p>
                  </div>
                  <div className="detail-row">
                    <label>Phone Number</label>
                    <p>{partner.phone}</p>
                  </div>
                  <div className="detail-row">
                    <label>Flat/House No, Street *</label>
                    <input
                      type="text"
                      name="address"
                      value={dashboardFormData.address}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter address"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>Local Landmark</label>
                    <input
                      type="text"
                      name="landmark"
                      value={dashboardFormData.landmark}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter local landmark"
                    />
                  </div>
                  <div className="detail-row">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={dashboardFormData.pincode}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter pincode"
                      pattern="[0-9]{6}"
                      title="Pincode must be 6 digits"
                    />
                  </div>
                  <div className="detail-row">
                    <label>City *</label>
                    <input
                      type="text"
                      name="city"
                      value={dashboardFormData.city}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>State *</label>
                    <input
                      type="text"
                      name="state"
                      value={dashboardFormData.state}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter state"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>Country *</label>
                    <input
                      type="text"
                      name="country"
                      value={dashboardFormData.country}
                      onChange={handleDashboardInputChange}
                      placeholder="Enter country"
                      required
                    />
                  </div>
                </div>
                <div className="profile-actions">
                  <button type="submit" className="dashboard-action-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="dashboard-action-btn cancel-btn"
                    onClick={handleCancelEditDashboard}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="details-grid">
                <div className="detail-row">
                  <label>Name</label>
                  <p>{partner.fullName}</p>
                </div>
                <div className="detail-row">
                  <label>Email</label>
                  <p>{partner.email}</p>
                </div>
                <div className="detail-row">
                  <label>Phone Number</label>
                  <p>{partner.phone}</p>
                </div>
                <div className="detail-row">
                  <label>Flat/House No, Street</label>
                  <p>{partner.address || '-'}</p>
                </div>
                <div className="detail-row">
                  <label>Local Landmark</label>
                  <p>{partner.landmark || '-'}</p>
                </div>
                <div className="detail-row">
                  <label>Pincode</label>
                  <p>{partner.pincode || '-'}</p>
                </div>
                <div className="detail-row">
                  <label>City</label>
                  <p>{partner.city || '-'}</p>
                </div>
                <div className="detail-row">
                  <label>State</label>
                  <p>{partner.state || '-'}</p>
                </div>
                <div className="detail-row">
                  <label>Country</label>
                  <p>{partner.country || '-'}</p>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'Profile' ? (
          <div className="dashboard-details">
            <div className="profile-header">
              <h3>Profile Details</h3>
              {!isEditingProfile && (
                <button className="dashboard-action-btn edit-btn" onClick={handleEditProfileClick}>
                  Edit Profile
                </button>
              )}
            </div>
            {formError && <div className="form-error">{formError}</div>}
            {isEditingProfile ? (
              <form onSubmit={handleProfileSubmit}>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Profile Image</label>
                    <div className="image-upload-wrapper">
                      <i className="fas fa-upload image-upload-icon"></i>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                      />
                    </div>
                  </div>
                  {profileFormData.imagePreview && (
                    <div className="detail-row image-preview">
                      <img
                        src={profileFormData.imagePreview}
                        alt="Profile Preview"
                        onError={handleImageError}
                      />
                    </div>
                  )}
                  <div className="detail-row">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={profileFormData.fullName}
                      onChange={handleProfileInputChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>Business Name *</label>
                    <input
                      type="text"
                      name="businessName"
                      value={profileFormData.businessName}
                      onChange={handleProfileInputChange}
                      placeholder="Enter business name"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileFormData.email}
                      onChange={handleProfileInputChange}
                      placeholder="Enter email"
                      required
                      disabled
                    />
                  </div>
                  <div className="detail-row">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileFormData.phone}
                      onChange={handleProfileInputChange}
                      placeholder="Enter phone number"
                      pattern="[0-9]{10}"
                      title="Phone number must be 10 digits"
                      required
                    />
                  </div>
                  <div className="detail-row">
                    <label>Alternate Phone</label>
                    <input
                      type="tel"
                      name="alternatePhone"
                      value={profileFormData.alternatePhone}
                      onChange={handleProfileInputChange}
                      placeholder="Enter alternate phone number"
                      pattern="[0-9]{10}"
                      title="Alternate phone number must be 10 digits"
                    />
                  </div>
                </div>
                <div className="profile-actions">
                  <button type="submit" className="dashboard-action-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="dashboard-action-btn cancel-btn"
                    onClick={handleCancelEditProfile}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="details-grid">
                <div className="detail-row">
                  <label>Profile Image</label>
                  {partner.imageUrl ? (
                    <img
                      src={`http://localhost:5000${partner.imageUrl}?t=${cacheBuster}`}
                      alt="Profile"
                      className="profile-image-small"
                      onError={handleImageError}
                    />
                  ) : (
                    <p>No image uploaded</p>
                  )}
                </div>
                <div className="detail-row">
                  <label>Full Name</label>
                  <p>{partner.fullName}</p>
                </div>
                <div className="detail-row">
                  <label>Business Name</label>
                  <p>{partner.businessName}</p>
                </div>
                <div className="detail-row">
                  <label>Email</label>
                  <p>{partner.email}</p>
                </div>
                <div className="detail-row">
                  <label>Phone Number</label>
                  <p>{partner.phone}</p>
                </div>
                <div className="detail-row">
                  <label>Alternate Phone</label>
                  <p>{partner.alternatePhone || '-'}</p>
                </div>
              </div>
            )}
          </div>
        ) : activeSection === 'Change Password' ? (
          <div className="dashboard-details">
            <h3>Change Password</h3>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handlePasswordSubmit}>
              <div className="details-grid">
                <div className="detail-row">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordFormData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="detail-row">
                  <label>New Password *</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordFormData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="detail-row">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    value={passwordFormData.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <div className="profile-actions">
                <button type="submit" className="dashboard-action-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        ) : activeSection === 'Delete Account' ? (
          <div className="dashboard-details">
            <h3>Delete Account</h3>
            {formError && <div className="form-error">{formError}</div>}
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <button className="dashboard-action-btn delete-btn" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </div>
        ) : activeSection === 'Service List' ? (
          <div className="dashboard-details">
            <div className="product-list-header">
              <h3>Product List</h3>
              <div className="product-list-actions">
                <input
                  type="text"
                  placeholder="Search by Product, Shop, Category, or City"
                  className="product-search"
                  value={productSearchQuery}
                  onChange={handleProductSearchChange}
                />
                <button className="add-product-btn" onClick={handleAddNewProductClick}>
                  Add New Product
                </button>
              </div>
            </div>
            <table className="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Shop Name</th>
                  <th>Category</th>
                  <th>City</th>
                  <th>Rent Charge / Charge Type</th>
                  <th>Images</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <tr key={product.productId}>
                      <td>{index + 1}</td>
                      <td>{product.productName}</td>
                      <td>{product.shopName}</td>
                      <td>{product.category}</td>
                      <td>{product.city}</td>
                      <td>{product.rentCharge} / {product.chargeType}</td>
                      <td>
                        {product.imageUrl && (
                          <img src={`http://localhost:5000${product.imageUrl}`} alt="Product 1" className="product-table-image" onError={handleImageError} />
                        )}
                      </td>
                      <td>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditProductClick(product)}
                          title="Edit Product"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteProduct(product.productId)}
                          title="Delete Product"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">{productSearchQuery ? 'No matching products found' : 'No products found'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeSection === 'My Orders' ? (
          <div className="dashboard-details">
            <div className="product-list-header">
              <h3>My Orders</h3>
              <div className="product-list-actions">
                <input
                  type="text"
                  placeholder="Search by Product, Customer, or Contact"
                  className="product-search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            {isLoadingQuotes ? (
              <div>Loading orders...</div>
            ) : (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Name</th>
                    <th>Customer Name</th>
                    <th>Contact</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Total Cost</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.length > 0 ? (
                    filteredQuotes.map((quote, index) => (
                      <tr key={quote.quoteId}>
                        <td>{index + 1}</td>
                        <td>{quote.productName || 'N/A'}</td>
                        <td>{quote.fullName || 'N/A'}</td>
                        <td>{quote.contact || 'N/A'}</td>
                        <td>{quote.startDate ? new Date(quote.startDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{quote.endDate ? new Date(quote.endDate).toLocaleDateString() : 'N/A'}</td>
                        <td>{quote.totalFixedCost || 'N/A'}</td>
                        <td>{quote.paymentStatus || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">{searchQuery ? 'No matching orders found' : 'No orders found'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        <button className="dashboard-close-btn" onClick={onClose}>
          Close Dashboard
        </button>
      </div>

      {showServiceForm && (
        <div className="service-form-overlay" onClick={handleCloseServiceForm}>
          <div className="service-form-content" onClick={(e) => e.stopPropagation()}>
            <button className="service-form-close-btn" onClick={handleCloseServiceForm}>
              ×
            </button>
            <div className="service-form">
              <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
              {formError && <div className="form-error">{formError}</div>}
              <form onSubmit={handleServiceSubmit}>
                <div className="form-row">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Product Description *</label>
                  <textarea
                    name="productDescription"
                    value={formData.productDescription}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Owner Name *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    placeholder="Enter owner name"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Shop Name *</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="Enter shop name"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    pattern="[0-9]{10}"
                    title="Contact number must be 10 digits"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    disabled={!isEditing}
                  />
                </div>
                <div className="form-row">
                  <label>Product Image *</label>
                  <div className="image-upload-wrapper">
                    <i className="fas fa-upload image-upload-icon"></i>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleImageChange}
                      required={!isEditing}
                    />
                  </div>
                </div>
                {imagePreview && (
                  <div className="form-row image-preview">
                    <img src={imagePreview} alt="Product Image Preview" onError={handleImageError} />
                  </div>
                )}
                <div className="form-row">
                  <label>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    required
                  >
                    <option value="">Select State</option>
                    {Object.keys(locationData).map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleCityChange}
                    required
                    disabled={!formData.state}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Place *</label>
                  <select
                    name="place"
                    value={formData.place}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.city}
                  >
                    <option value="">Select Place</option>
                    {places.map((place) => (
                      <option key={place} value={place}>{place}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Subcategory *</label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.category}
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Rent Charge *</label>
                  <input
                    type="number"
                    name="rentCharge"
                    value={formData.rentCharge}
                    onChange={handleInputChange}
                    placeholder="Enter charge amount"
                    min="1"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Charge Type *</label>
                  <select
                    name="chargeType"
                    value={formData.chargeType}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.rentCharge}
                  >
                    <option value="">Select Charge Type</option>
                    {chargeTypes.map((type) => (
                      <option key={type} value={type}>Per {type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Product Deposit *</label>
                  <input
                    type="number"
                    name="productDeposit"
                    value={formData.productDeposit}
                    onChange={handleInputChange}
                    placeholder="Enter deposit amount"
                    min="1"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="service-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (isEditing ? 'Updating Product...' : 'Adding Product...') : (isEditing ? 'Update Product' : 'Add Product')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;