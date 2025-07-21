import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetails.css';
import axios from 'axios';
import Navbar from './Navbar';
import { FaUserCheck, FaRupeeSign, FaShieldAlt, FaCheckCircle, FaTags, FaThList, FaUser, FaPhoneAlt, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook for navigation
  const [product, setProduct] = useState(null);
  const [startDate, setStartDate] = useState(null); // Initially null
  const [endDate, setEndDate] = useState(null); // Initially null
  const [deliveryDate, setDeliveryDate] = useState(null); // Initially null
  const [showPopup, setShowPopup] = useState(false);
  const [showReceiptPopup, setShowReceiptPopup] = useState(false);
  const [isRazorpayScriptLoaded, setIsRazorpayScriptLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contact: '',
    address: '',
    aadhaarNo: '',
  });
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const productData = res.data;

        const productDeposit = Number(productData.productDeposit);
        const rentCharge = Number(productData.rentCharge);

        if (
          !productData ||
          isNaN(productDeposit) ||
          productDeposit <= 0 ||
          isNaN(rentCharge) ||
          rentCharge <= 0 ||
          !productData.partnerEmail
        ) {
          throw new Error('Product data is invalid or missing. Please contact support.');
        }

        setProduct(productData);
        setErrorMessage(null);
      } catch (err) {
        console.error('Failed to fetch product:', err.message);
        setErrorMessage('Failed to load product details. Please try again or contact support.');
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsRazorpayScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      setIsRazorpayScriptLoaded(false);
      setErrorMessage('Failed to load payment system. Please try again.');
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const calculateDurationInMonths = (start, end) => {
    if (!start || !end) return 0; // Return 0 if either date is null
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const months =
      (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12 +
      (endDateObj.getMonth() - startDateObj.getMonth());
    return months > 0 ? months : 0;
  };

  const durationInMonths = calculateDurationInMonths(startDate, endDate);
  const productDeposit = product && !isNaN(Number(product.productDeposit)) ? Number(product.productDeposit) : 0;
  const rentCharge = product && !isNaN(Number(product.rentCharge)) ? Number(product.rentCharge) : 0;
  const totalFixedCost = product ? productDeposit + rentCharge * durationInMonths : 0;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Handle null dates
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!product) {
      alert('Product data is not loaded yet. Please wait a moment and try again.');
      return;
    }

    if (!productDeposit || productDeposit <= 0 || !rentCharge || rentCharge <= 0) {
      alert('Invalid product pricing. Please contact support.');
      return;
    }

    // Validate that startDate and endDate are provided
    if (!startDate || !endDate) {
      alert('Please select both start date and end date.');
      return;
    }

    if (durationInMonths < 1) {
      alert('The rental duration must be at least 1 month. Please adjust the end date.');
      return;
    }

    if (!totalFixedCost || totalFixedCost <= 0) {
      alert('Invalid total cost. Please check the rental duration and try again.');
      return;
    }

    if (!deliveryDate) {
      alert('Please select a delivery date.');
      return;
    }

    if (!isRazorpayScriptLoaded) {
      alert('Payment system is not loaded yet. Please try again in a moment.');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      contact: formData.contact,
      address: formData.address,
      aadhaarNo: formData.aadhaarNo,
      ownerName: product.ownerName,
      ownerContact: product.contactNumber,
      partnerEmail: product.partnerEmail,
      productId: product._id,
      productName: product.productName,
      startDate,
      endDate,
      durationInMonths,
      deliveryDate,
      productDeposit,
      rentCharge,
      chargeType: product.chargeType,
      totalFixedCost,
    };

    try {
      const orderResponse = await axios.post('http://localhost:5000/api/create-order', {
        amount: totalFixedCost * 1,
        currency: 'INR',
      });

      const { orderId, amount, currency } = orderResponse.data;

      const options = {
        key: 'rzp_test_2Ek77WST31XIAh',
        amount,
        currency,
        name: 'RentZone',
        description: `Payment for renting ${product.productName}`,
        image: 'https://via.placeholder.com/150x50.png?text=RentZone',
        order_id: orderId,
        handler: async (response) => {
          try {
            payload.razorpayOrderId = response.razorpay_order_id;
            payload.razorpayPaymentId = response.razorpay_payment_id;
            payload.paymentStatus = 'completed';
            payload.paymentDate = new Date().toLocaleString();

            await axios.post('http://localhost:5000/api/quotes', payload);
            setPaymentDetails(payload);
            setShowPopup(false);
            setShowReceiptPopup(true);
            alert('Payment successful! Quote request submitted successfully.');
          } catch (error) {
            console.error('Failed to save quote:', error);
            alert('Payment successful, but failed to save quote. Please contact support.');
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.contact,
        },
        notes: { address: formData.address },
        theme: { color: '#ff6200' },
        modal: {
          ondismiss: () => alert('Payment modal closed. To proceed, please complete the payment.'),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', (response) => {
        alert('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });
    } catch (error) {
      console.error('Error initiating payment:', error.response?.data || error.message);
      alert('Error initiating payment. Please try again.');
    }
  };

  const handlePrint = () => {
    const qrCodeCanvas = document.getElementById('qrCodeCanvas');
    const qrCodeDataUrl = qrCodeCanvas.toDataURL('image/png');

    const printContent = `
      <html>
        <head>
          <title>Payment Receipt - RentZone</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #ff6200; padding-bottom: 10px; margin-bottom: 20px; }
            .header img { max-width: 150px; height: auto; }
            .header h1 { margin: 5px 0; color: #ff6200; }
            .header p { margin: 5px 0; color: #666; }
            .section { margin-bottom: 20px; }
            .section h3 { margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .section p { margin: 5px 0; font-size: 14px; }
            .section p strong { display: inline-block; width: 150px; }
            .qr-code { text-align: center; margin: 10px 0; }
            .qr-code img { width: 100px; height: 100px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <img src="https://via.placeholder.com/150x50.png?text=RentZone" alt="RentZone Logo" />
              <h1>RentZone</h1>
              <p>Payment Receipt</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            <div class="section">
              <h3>Customer Details</h3>
              <p><strong>Name:</strong> ${paymentDetails.fullName}</p>
              <p><strong>Email:</strong> ${paymentDetails.email}</p>
              <p><strong>Contact:</strong> ${paymentDetails.contact}</p>
              <p><strong>Address:</strong> ${paymentDetails.address}</p>
            </div>
            <div class="section">
              <h3>Product Details</h3>
              <p><strong>Product Name:</strong> ${paymentDetails.productName}</p>
              <p><strong>Product ID:</strong> ${paymentDetails.productId}</p>
              <p><strong>Owner Name:</strong> ${paymentDetails.ownerName}</p>
              <p><strong>Partner Email:</strong> ${paymentDetails.partnerEmail}</p>
              <p><strong>Rent Charge:</strong> ₹${paymentDetails.rentCharge}/${paymentDetails.chargeType}</p>
              <p><strong>Deposit:</strong> ₹${paymentDetails.productDeposit}</p>
              <p><strong>Total Cost:</strong> ₹${paymentDetails.totalFixedCost}</p>
              <p><strong>Duration:</strong> ${paymentDetails.durationInMonths} months</p>
              <p><strong>Start Date:</strong> ${formatDate(paymentDetails.startDate)}</p>
              <p><strong>End Date:</strong> ${formatDate(paymentDetails.endDate)}</p>
              <p><strong>Delivery Date:</strong> ${formatDate(paymentDetails.deliveryDate)}</p>
            </div>
            <div class="section">
              <h3>Payment Details</h3>
              <p><strong>Payment Date:</strong> ${paymentDetails.paymentDate}</p>
              <p><strong>Razorpay Order ID:</strong> ${paymentDetails.razorpayOrderId}</p>
              <p><strong>Razorpay Payment ID:</strong> ${paymentDetails.razorpayPaymentId}</p>
              <p><strong>Payment Status:</strong> ${paymentDetails.paymentStatus}</p>
              <div class="qr-code">
                <img src="${qrCodeDataUrl}" alt="QR Code" />
              </div>
            </div>
            <div class="footer">
              <p>Thank you for renting with RentZone!</p>
              <p>Contact support at support@rentzone.com for assistance.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  const handleDownload = () => {
    const qrCodeCanvas = document.getElementById('qrCodeCanvas');
    const qrCodeDataUrl = qrCodeCanvas.toDataURL('image/png');

    const doc = new jsPDF();
    let yOffset = 10;

    // Header
    doc.addImage('https://via.placeholder.com/150x50.png?text=RentZone', 'PNG', 80, yOffset, 50, 16);
    yOffset += 20;
    doc.setFontSize(20);
    doc.setTextColor(255, 98, 0);
    doc.text('RentZone', 105, yOffset, { align: 'center' });
    yOffset += 10;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Payment Receipt', 105, yOffset, { align: 'center' });
    yOffset += 10;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yOffset, { align: 'center' });
    yOffset += 10;
    doc.setLineWidth(0.5);
    doc.setDrawColor(255, 98, 0);
    doc.line(20, yOffset, 190, yOffset);
    yOffset += 10;

    // Customer Details
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Customer Details', 20, yOffset);
    yOffset += 5;
    doc.setLineWidth(0.2);
    doc.setDrawColor(200);
    doc.line(20, yOffset, 80, yOffset);
    yOffset += 5;
    doc.setFontSize(10);
    doc.text(`Name: ${paymentDetails.fullName}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Email: ${paymentDetails.email}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Contact: ${paymentDetails.contact}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Address: ${paymentDetails.address}`, 20, yOffset);
    yOffset += 10;

    // Product Details
    doc.setFontSize(14);
    doc.text('Product Details', 20, yOffset);
    yOffset += 5;
    doc.setLineWidth(0.2);
    doc.line(20, yOffset, 80, yOffset);
    yOffset += 5;
    doc.setFontSize(10);
    doc.text(`Product Name: ${paymentDetails.productName}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Product ID: ${paymentDetails.productId}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Owner Name: ${paymentDetails.ownerName}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Partner Email: ${paymentDetails.partnerEmail}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Rent Charge: ₹${paymentDetails.rentCharge}/${paymentDetails.chargeType}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Deposit: ₹${paymentDetails.productDeposit}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Total Cost: ₹${paymentDetails.totalFixedCost}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Duration: ${paymentDetails.durationInMonths} months`, 20, yOffset);
    yOffset += 5;
    doc.text(`Start Date: ${formatDate(paymentDetails.startDate)}`, 20, yOffset);
    yOffset += 5;
    doc.text(`End Date: ${formatDate(paymentDetails.endDate)}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Delivery Date: ${formatDate(paymentDetails.deliveryDate)}`, 20, yOffset);
    yOffset += 10;

    // Payment Details
    doc.setFontSize(14);
    doc.text('Payment Details', 20, yOffset);
    yOffset += 5;
    doc.setLineWidth(0.2);
    doc.line(20, yOffset, 80, yOffset);
    yOffset += 5;
    doc.setFontSize(10);
    doc.text(`Payment Date: ${paymentDetails.paymentDate}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Razorpay Order ID: ${paymentDetails.razorpayOrderId}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Razorpay Payment ID: ${paymentDetails.razorpayPaymentId}`, 20, yOffset);
    yOffset += 5;
    doc.text(`Payment Status: ${paymentDetails.paymentStatus}`, 20, yOffset);
    yOffset += 5;
    doc.addImage(qrCodeDataUrl, 'PNG', 85, yOffset, 40, 40);
    yOffset += 45;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Thank you for renting with RentZone!', 105, yOffset, { align: 'center' });
    yOffset += 5;
    doc.text('Contact support at support@rentzone.com for assistance.', 105, yOffset, { align: 'center' });

    // Download the PDF
    doc.save(`RentZone_Receipt_${paymentDetails.razorpayPaymentId}.pdf`);
  };

  // Function to handle navigation back to the homepage
  const handleBackToHome = () => {
    navigate('/'); // Navigate to the homepage
  };

  if (errorMessage) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="error-message" style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      {/* Back button to navigate to the homepage */}
      <div style={{ padding: '10px 20px', textAlign: 'left' }}>
        <button
          onClick={handleBackToHome}
          style={{
                padding: '8px 10px',
                backgroundColor: '#ff6200',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '12px',
                position: 'relative',
                top: '80px',
              }}

          
        >
          Back to Home
        </button>
      </div>
      <div className="product-container">
        <div className="product-main">
          <div className="product-image-section">
            <img src={`http://localhost:5000${product.imageUrl}`} className="main-img" alt={product.productName} />
          </div>
          <div className="product-info-section">
            <h2>{product.productName}</h2>
            <p className="price">Rent Charge: ₹{rentCharge}/{product.chargeType}</p>
            <h3>Deposit: ₹{productDeposit}</h3>
            <h3>Product ID: {product.productId}</h3>
            <h3>Owner: {product.ownerName}</h3>
            <p className="location">
              <strong>Location:</strong> {product.place}, {product.city}, {product.state}
            </p>
            <button className="quote-btn" onClick={() => setShowPopup(true)} disabled={!product}>
              Rent Now
            </button>
            <p className="info-text">This product is available for rent within the selected city only.</p>
          </div>
        </div>

        <div className="description-section extra-details-section">
          <h3>Description</h3>
          <div className="underline"></div>
          <p>{product.productDescription}</p>
        </div>

        <div className="extra-details-section description-section">
          <h3>Product Details</h3>
          <div className="underline"></div>
          <div className="product-details-grid">
            <div className="detail-box">
              <FaTags className="detail-icon" />
              <span>Category:</span> {product.category}
            </div>
            <div className="detail-box">
              <FaThList className="detail-icon" />
              <span>Subcategory:</span> {product.subcategory}
            </div>
            <div className="detail-box">
              <FaUser className="detail-icon" />
              <span>Owner:</span> {product.ownerName}
            </div>
            <div className="detail-box">
              <FaPhoneAlt className="detail-icon" />
              <span>Contact:</span> {product.contactNumber}
            </div>
            <div className="detail-box">
              <FaEnvelope className="detail-icon" />
              <span>Email:</span> {product.emailAddress}
            </div>
            <div className="detail-box">
              <FaCheckCircle className="detail-icon" />
              <span>Brand:</span> {product.brand || 'N/A'}
            </div>
            <div className="detail-box">
              <FaCheckCircle className="detail-icon" />
              <span>Model:</span> {product.model || 'N/A'}
            </div>
            <div className="detail-box">
              <FaCheckCircle className="detail-icon" />
              <span>Condition:</span> {product.condition || 'Excellent'}
            </div>
            <div className="detail-box">
              <FaCalendarAlt className="detail-icon" />
              <span>Posted On:</span> {formatDate(product.createdAt)}
            </div>
          </div>
        </div>

        <div className="trust-section">
          <div>
            <FaUserCheck size={30} /> <span>KYC Verified User</span>
          </div>
          <div>
            <FaRupeeSign size={30} /> <span>100% Refundable Security</span>
          </div>
          <div>
            <FaShieldAlt size={30} /> <span>Secure Payment</span>
          </div>
          <div>
            <FaCheckCircle size={30} /> <span>Verified Product</span>
          </div>
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-form modern-form">
              <h3>Rental Request Form</h3>
              <button className="close-btn" onClick={() => setShowPopup(false)}>
                ×
              </button>
              <div className="form-scrollable">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name:</label>
                    <input
                      type="text"
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="contact">Contact Number:</label>
                    <input
                      type="text"
                      id="contact"
                      placeholder="Enter your contact number"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Address:</label>
                    <input
                      type="text"
                      id="address"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="aadhaarNo">Aadhaar Number:</label>
                    <input
                      type="text"
                      id="aadhaarNo"
                      placeholder="Enter your Aadhaar number"
                      value={formData.aadhaarNo}
                      onChange={(e) => setFormData({ ...formData, aadhaarNo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="productName">Product Name:</label>
                    <input type="text" id="productName" value={product.productName} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="productId">Product ID:</label>
                    <input type="text" id="productId" value={product._id} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="productDeposit">Product Deposit:</label>
                    <input type="text" id="productDeposit" value={`₹${productDeposit}`} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="rentCharge">Rent Charge:</label>
                    <input type="text" id="rentCharge" value={`₹${rentCharge}/${product.chargeType}`} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalFixedCost">Total Fixed Cost:</label>
                    <input type="text" id="totalFixedCost" value={`₹${totalFixedCost}`} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ownerName">Owner Name:</label>
                    <input type="text" id="ownerName" value={product.ownerName} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ownerContact">Owner Contact:</label>
                    <input type="text" id="ownerContact" value={product.contactNumber} disabled />
                  </div>
                  <div className="form-group">
                    <label htmlFor="partnerEmail">Partner Email:</label>
                    <input type="text" id="partnerEmail" value={product.partnerEmail} disabled />
                  </div>
                  <div className="form-group date-input-group">
                    <label htmlFor="startDate">Start Date:</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        id="startDate"
                        value={startDate || ''} // Use empty string if null
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group date-input-group">
                    <label htmlFor="endDate">End Date:</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        id="endDate"
                        value={endDate || ''} // Use empty string if null
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined} // Only set min if startDate exists
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group date-input-group">
                    <label htmlFor="deliveryDate">Delivery Date:</label>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        id="deliveryDate"
                        value={deliveryDate || ''} // Use empty string if null
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        min={startDate || undefined} // Only set min if startDate exists
                        max={endDate || undefined} // Only set max if endDate exists
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="submit-btn modern-submit">
                    Submit Request
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {showReceiptPopup && paymentDetails && (
          <div className="popup-overlay">
            <div className="popup-form modern-form" style={{ maxWidth: '650px', padding: '0' }}>
              <div style={{ backgroundColor: '#ff6200', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Payment Receipt</h3>
                <button className="close-btn" onClick={() => setShowReceiptPopup(false)} style={{ color: '#fff', fontSize: '20px' }}>
                  ×
                </button>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fff', maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid #ccc', padding: '20px' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #ff6200', paddingBottom: '10px', marginBottom: '20px' }}>
                    <img src="https://via.placeholder.com/150x50.png?text=RentZone" alt="RentZone Logo" style={{ maxWidth: '150px', height: 'auto' }} />
                    <h1 style={{ margin: '5px 0', color: '#ff6200', fontSize: '24px' }}>RentZone</h1>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Payment Receipt</p>
                    <p style={{ margin: '5px 0', color: '#666', fontSize: '12px' }}>
                      Generated on: ${new Date().toLocaleString()}
                    </p>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px', fontSize: '16px' }}>
                      Customer Details
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Name:</strong> ${paymentDetails.fullName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Email:</strong> ${paymentDetails.email}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Contact:</strong> ${paymentDetails.contact}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Address:</strong> ${paymentDetails.address}
                    </p>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px', fontSize: '16px' }}>
                      Product Details
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Product Name:</strong> ${paymentDetails.productName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Product ID:</strong> ${paymentDetails.productId}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Owner Name:</strong> ${paymentDetails.ownerName}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Partner Email:</strong> ${paymentDetails.partnerEmail}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Rent Charge:</strong> ₹${paymentDetails.rentCharge}/${paymentDetails.chargeType}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Deposit:</strong> ₹${paymentDetails.productDeposit}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Total Cost:</strong> ₹${paymentDetails.totalFixedCost}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Duration:</strong> ${paymentDetails.durationInMonths} months
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Start Date:</strong> ${formatDate(paymentDetails.startDate)}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>End Date:</strong> ${formatDate(paymentDetails.endDate)}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Delivery Date:</strong> ${formatDate(paymentDetails.deliveryDate)}
                    </p>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333', borderBottom: '1px solid #ddd', paddingBottom: '5px', fontSize: '16px' }}>
                      Payment Details
                    </h3>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Payment Date:</strong> ${paymentDetails.paymentDate}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Razorpay Order ID:</strong> ${paymentDetails.razorpayOrderId}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Razorpay Payment ID:</strong> ${paymentDetails.razorpayPaymentId}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong style={{ display: 'inline-block', width: '150px' }}>Payment Status:</strong> ${paymentDetails.paymentStatus}
                    </p>
                    <div style={{ textAlign: 'center', margin: '10px 0' }}>
                      <QRCodeCanvas
                        id="qrCodeCanvas"
                        value={`https://rentzone.com/verify-payment/${paymentDetails.razorpayPaymentId}`}
                        size={100}
                        level="H"
                      />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '12px', color: '#666' }}>
                    <p style={{ margin: '5px 0' }}>Thank you for renting with RentZone!</p>
                    <p style={{ margin: '5px 0' }}>Contact support at support@rentzone.com for assistance.</p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '10px 20px', borderTop: '1px solid #ddd', textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                <button
                  onClick={handlePrint}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ff6200',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px',
                    fontSize: '14px',
                  }}
                >
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px',
                    fontSize: '14px',
                  }}
                >
                  Download PDF
                </button>
                <button
                  onClick={() => setShowReceiptPopup(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    fontSize: '14px',
                  }}
                >
                  Back to Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;