import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ProductCard.css";

const ProductCard = ({ sortOption, searchQuery, filterType }) => {
  const [products, setProducts] = useState([]);
  const [bannerImages, setBannerImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await axios.get("http://localhost:5000/api/products");
        const bannerRes = await axios.get("http://localhost:5000/api/banners");
        setProducts(productRes.data);
        setBannerImages(bannerRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchData();
  }, []);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery && filterType) {
      const q = searchQuery.toLowerCase();
      if (filterType === "category") {
        filtered = filtered.filter(
          p => p.category && p.category.toLowerCase() === q
        );
      } else if (filterType === "subcategory") {
        filtered = filtered.filter(
          p => p.subcategory && p.subcategory.toLowerCase() === q
        );
      }
    }
    let sorted = [...filtered];
    if (sortOption === "Sort Alphabetically by Subcategory") {
      sorted.sort((a, b) => (a.subcategory || "").localeCompare(b.subcategory || ""));
    } else if (sortOption === "Sort by Price (Low to High)") {
      sorted.sort((a, b) => Number(a.rentCharge) - Number(b.rentCharge));
    } else if (sortOption === "Sort by Newest") {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  }, [products, sortOption, searchQuery, filterType]);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerImages.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  return (
    <div className="product-page-container">
      {/* Sliding Banner */}
      <div className="banner-carousel">
        <button className="arrow left" onClick={goPrev}>&lt;</button>
        {bannerImages.length > 0 && (
          <img src={bannerImages[currentIndex]} alt="Banner" className="banner-image" />
        )}
        <button className="arrow right" onClick={goNext}>&gt;</button>
      </div>

      {/* Product Grid */}
      <div className="product-grid-container">
        {filteredAndSortedProducts.map((product, index) => (
          <div className="product-card" key={index}>
            <img src={`http://localhost:5000${product.imageUrl}`} alt={product.subcategory} className="product-image" />
            <h4 className="product-name">{product.subcategory}</h4>
            <p className="product-price">{product.rentCharge}/ Month</p>
            <button className="rent-button" onClick={() => navigate(`/product/${product._id}`)}>
              Take On Rent
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCard;