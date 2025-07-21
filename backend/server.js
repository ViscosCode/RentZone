const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const fsSync = require('fs');
const Razorpay = require('razorpay');

// Initialize Express app
const app = express();

// Load environment variables from .env file
dotenv.config();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Create uploads directory if it doesn't exist
if (!fsSync.existsSync('Uploads')) {
  fsSync.mkdirSync('Uploads', { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Uploads/');
  },
  filename: (req, file, cb) => {
    if (!file || !file.originalname) {
      return cb(new Error('File or file.originalname is undefined'));
    }
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(new Error('No file uploaded'));
    }
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (JPEG, JPG, PNG)!'));
    }
  },
}).single('image');

// Custom middleware to ensure all responses are JSON
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB (RentZone)'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// MongoDB connection status
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection ready');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime(),
  });
});

// Schemas and Models
const partnerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  businessName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String, default: '' },
  password: { type: String, required: true },
  address: { type: String },
  landmark: { type: String },
  pincode: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  imageUrl: { type: String },
});

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  productDescription: { type: String, required: true },
  ownerName: { type: String, required: true },
  shopName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  emailAddress: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  place: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, required: true },
  rentCharge: { type: Number, required: true },
  chargeType: { type: String, enum: ['Day', 'Week', 'Month'], required: true },
  productDeposit: { type: Number, required: true },
  partnerEmail: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const bannerSchema = new mongoose.Schema({
  image: { type: String, required: true },
});

const quoteSchema = new mongoose.Schema({
  quoteId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  address: { type: String, required: true },
  aadhaarNo: { type: String, required: true },
  ownerName: { type: String, required: true },
  ownerContact: { type: String, required: true },
  partnerEmail: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationInMonths: { type: Number, required: true },
  deliveryDate: { type: Date, required: true },
  productDeposit: { type: Number, required: true },
  rentCharge: { type: Number, required: true },
  chargeType: { type: String, required: true },
  totalFixedCost: { type: Number, required: true },
  paymentStatus: { type: String, default: 'pending' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Partner = mongoose.model('Partner', partnerSchema);
const Product = mongoose.model('Product', productSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const Quote = mongoose.model('Quote', quoteSchema);

// Utility to generate unique quoteId
const generateUniqueQuoteId = async () => {
  let quoteId;
  let isUnique = false;
  do {
    quoteId = `QUOTE-${uuidv4().split('-')[0]}`;
    const existing = await Quote.findOne({ quoteId });
    if (!existing) isUnique = true;
  } while (!isUnique);
  return quoteId;
};

// Routes

// Register endpoint
app.post('/api/partners/register', async (req, res) => {
  console.log('Received registration request:', req.body);
  const { fullName, businessName, email, phone, alternatePhone, password } = req.body;

  if (!fullName || !businessName || !email || !phone || !password) {
    console.log('Validation failed: Missing required fields');
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  try {
    const existingPartner = await Partner.findOne({ email });
    if (existingPartner) {
      console.log('Validation failed: Email already exists');
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPartner = new Partner({
      fullName,
      businessName,
      email,
      phone,
      alternatePhone: alternatePhone || '',
      password: hashedPassword,
    });

    await newPartner.save();
    console.log('New partner added:', newPartner);
    res.json({ success: true });
  } catch (error) {
    console.error('Error registering partner:', error.stack);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login endpoint
app.post('/api/partners/login', async (req, res) => {
  console.log('Received login request:', req.body);
  const { email, password } = req.body;

  try {
    const partner = await Partner.findOne({ email });
    if (!partner) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Partner by Email
app.get('/api/partners/:email', async (req, res) => {
  console.log('Received get partner request for email:', req.params.email);
  const { email } = req.params;

  try {
    const partner = await Partner.findOne({ email });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.json(partner);
  } catch (error) {
    console.error('Error fetching partner:', error);
    res.status(500).json({ message: 'Server error fetching partner', error: error.message });
  }
});

// Update Partner
app.put('/api/partners/:email', upload, async (req, res) => {
  console.log('Received update partner request for email:', req.params.email);
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);

  try {
    const { email } = req.params;
    const { fullName, businessName, phone, alternatePhone, address, landmark, pincode, city, state, country } = req.body;

    // Validate required fields
    if (!fullName || !businessName || !phone || !email) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Prepare update object
    const updateData = {
      fullName,
      businessName,
      phone,
      alternatePhone: alternatePhone || '',
      address: address || '',
      landmark: landmark || '',
      pincode: pincode || '',
      city: city || '',
      state: state || '',
      country: country || '',
    };

    // Handle image upload
    if (req.file) {
      const oldPartner = await Partner.findOne({ email });
      if (oldPartner && oldPartner.imageUrl) {
        const oldImagePath = path.join(__dirname, oldPartner.imageUrl);
        try {
          await fs.access(oldImagePath); // Check if file exists
          await fs.unlink(oldImagePath);
          console.log('Old image file deleted:', oldPartner.imageUrl);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log('Old image file not found, skipping deletion:', oldPartner.imageUrl);
          } else {
            console.error('Error deleting old image file:', err.message);
          }
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
      console.log('New imageUrl set:', updateData.imageUrl);
    }

    // Update partner in database
    const updatedPartner = await Partner.findOneAndUpdate(
      { email },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPartner) {
      console.log('Partner not found for update');
      return res.status(404).json({ message: 'Partner not found' });
    }

    console.log('Partner updated successfully:', updatedPartner);
    res.status(200).json(updatedPartner);
  } catch (error) {
    console.error('Error updating partner:', error.stack);
    if (error.message.includes('Images only')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating partner', error: error.message });
  }
});

// Update Partner Password
app.put('/api/partners/:email/password', async (req, res) => {
  console.log('Received update password request for email:', req.params.email);
  try {
    const { currentPassword, newPassword } = req.body;
    const partner = await Partner.findOne({ email: req.params.email });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, partner.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    partner.password = hashedPassword;
    await partner.save();

    console.log('Password updated successfully for email:', req.params.email);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error updating password', error: error.message });
  }
});

// Delete Partner Account
app.delete('/api/partners/:email', async (req, res) => {
  console.log('Received delete account request for email:', req.params.email);
  const { email } = req.params;

  try {
    const partner = await Partner.findOneAndDelete({ email });
    if (partner) {
      if (partner.imageUrl) {
        const imagePath = path.join(__dirname, partner.imageUrl);
        try {
          await fs.unlink(imagePath);
          console.log('Image file deleted:', partner.imageUrl);
        } catch (err) {
          console.error('Error deleting image file:', err.message);
        }
      }
      console.log('Partner deleted:', partner);
      res.json({ success: true, message: 'Account deleted successfully' });
    } else {
      console.log('Partner not found for deletion');
      res.status(404).json({ message: 'Partner not found' });
    }
  } catch (error) {
    console.error('Error deleting partner:', error.stack);
    res.status(500).json({ message: 'Server error during account deletion', error: error.message });
  }
});

// Add Product
app.post('/api/products', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    try {
      console.log('Received product submission:');
      console.log('Body:', req.body);
      console.log('File:', req.file);

      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB connection not ready');
        return res.status(503).json({ message: 'Database connection not ready' });
      }

      const {
        productName,
        productDescription,
        ownerName,
        shopName,
        contactNumber,
        emailAddress,
        state,
        city,
        place,
        category,
        subcategory,
        rentCharge,
        chargeType,
        productDeposit,
        partnerEmail,
      } = req.body;

      if (
        !productName ||
        !productDescription ||
        !ownerName ||
        !shopName ||
        !contactNumber ||
        !emailAddress ||
        !state ||
        !city ||
        !place ||
        !category ||
        !subcategory ||
        !rentCharge ||
        !chargeType ||
        !productDeposit ||
        !partnerEmail ||
        !req.file
      ) {
        console.log('Validation failed: Missing required fields');
        return res.status(400).json({ message: 'All required fields must be filled, including the image' });
      }

      const productId = `PROD-${uuidv4().split('-')[0]}`;
      console.log('Generated productId:', productId);

      const imageUrl = `/uploads/${req.file.filename}`;

      const newProduct = new Product({
        productId,
        productName,
        productDescription,
        ownerName,
        shopName,
        contactNumber,
        emailAddress,
        state,
        city,
        place,
        category,
        subcategory,
        rentCharge: Number(rentCharge),
        chargeType,
        productDeposit: Number(productDeposit),
        partnerEmail,
        imageUrl,
        createdAt: new Date(),
      });

      await newProduct.save();
      console.log('New product added:', newProduct);
      res.status(201).json({ success: true, productId, createdAt: newProduct.createdAt });
    } catch (error) {
      console.error('Error adding product:', error.stack);
      if (error.message === 'File or file.originalname is undefined') {
        return res.status(400).json({ message: 'No file uploaded or file name is missing' });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Schema validation failed', errors: error.errors });
      }
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Product ID already exists (unexpected error)' });
      }
      res.status(500).json({ message: 'Server error during product submission', error: error.message });
    }
  });
});

// Fetch Products by Partner Email
app.get('/api/products/partner/:email', async (req, res) => {
  console.log('Received fetch products request for email:', req.params.email);
  const { email } = req.params;

  try {
    const products = await Product.find({ partnerEmail: email });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error fetching products', error: error.message });
  }
});

// Update Product
app.put('/api/products/:productId', upload, async (req, res) => {
  console.log('Received update product request for productId:', req.params.productId);
  console.log('Request body:', req.body);
  console.log('File:', req.file);

  try {
    const { productId } = req.params;
    const { productName, productDescription, ownerName, shopName, contactNumber, emailAddress, state, city, place, category, subcategory, rentCharge, chargeType, productDeposit, partnerEmail } = req.body;

    if (!productName || !productDescription || !ownerName || !shopName || !contactNumber || !emailAddress || !state || !city || !place || !category || !subcategory || !rentCharge || !chargeType || !productDeposit || !partnerEmail) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    const updateData = {
      productName,
      productDescription,
      ownerName,
      shopName,
      contactNumber,
      emailAddress,
      state,
      city,
      place,
      category,
      subcategory,
      rentCharge: Number(rentCharge),
      chargeType,
      productDeposit: Number(productDeposit),
      partnerEmail,
    };

    if (req.file) {
      const oldProduct = await Product.findOne({ productId });
      if (oldProduct && oldProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, oldProduct.imageUrl);
        try {
          await fs.unlink(oldImagePath);
          console.log('Old image file deleted:', oldProduct.imageUrl);
        } catch (err) {
          console.error('Error deleting old image file:', err.message);
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      console.log('Product not found for update');
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated:', updatedProduct);
    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error.stack);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Schema validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Server error updating product', error: error.message });
  }
});

// Delete Product
app.delete('/api/products/:productId', async (req, res) => {
  try {
    console.log('Received delete product request for productId:', req.params.productId);
    const { productId } = req.params;

    const product = await Product.findOne({ productId });
    if (!product) {
      console.log('Product not found for deletion');
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.imageUrl) {
      const imagePath = path.join(__dirname, product.imageUrl);
      try {
        await fs.unlink(imagePath);
        console.log('Image file deleted:', product.imageUrl);
      } catch (err) {
        console.error('Error deleting image file:', err.message);
      }
    }

    await Product.deleteOne({ productId });
    console.log('Product deleted:', product);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error.stack);
    res.status(500).json({ message: 'Server error deleting product', error: error.message });
  }
});

// Fetch All Products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({});
    console.log(products);
    res.json(products);
  } catch (err) {
    console.error('Error fetching all products:', err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch Product by MongoDB _id
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    console.log(product);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fetch All Banners
app.get("/api/banners", async (req, res) => {
  try {
    const banners = await Banner.find();
    console.log(banners);
    const images = banners.map(b => b.image);
    res.json(images);
  } catch (err) {
    console.error('Error fetching banners:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Error creating Razorpay order', error: error.message });
  }
});

// Save Quote after Payment
app.post('/api/quotes', async (req, res) => {
  try {
    const quoteData = req.body;
    console.log('Received quote data:', quoteData);

    // Validate partnerEmail presence
    if (!quoteData.partnerEmail) {
      console.log('Validation failed: partnerEmail is missing');
      return res.status(400).json({ message: 'Partner email is required' });
    }

    // Generate unique quoteId
    quoteData.quoteId = await generateUniqueQuoteId();

    const newQuote = new Quote(quoteData);
    await newQuote.save();
    res.status(200).json({ success: true, message: 'Quote saved successfully' });
  } catch (error) {
    console.error('Error saving quote:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Schema validation failed', errors: error.errors });
    }
    res.status(500).json({ message: 'Error saving quote', error: error.message });
  }
});

// Fetch Quotes by Partner Email
app.get('/api/quotes/partner/:email', async (req, res) => {
  const { email } = req.params;
  console.log(`Fetching quotes for partner email: ${email}`);

  try {
    const quotes = await Quote.find({ partnerEmail: email });
    if (!quotes.length) {
      return res.status(404).json({ message: 'No quotes found for this partner email' });
    }
    res.status(200).json(quotes);
  } catch (error) {
    console.error('Failed to fetch quotes:', error.message);
    res.status(500).json({ message: 'Server error while fetching quotes', error: error.message });
  }
});

// Handle invalid routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});