import React, { useRef } from 'react';
import ProductCard from './ProductCard';

function ProductSection({ products, onCartUpdate }) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 220;
      if (direction === 'left') {
        scrollContainerRef.current.scrollLeft -= scrollAmount;
      } else {
        scrollContainerRef.current.scrollLeft += scrollAmount;
      }
    }
  };

  if (!products || products.length === 0) {
    return (
      <section className="product-section">
        <h3>DAIKIN</h3>
        <p style={{ textAlign: 'center', color: '#999' }}>No products available</p>
      </section>
    );
  }

  return (
    <section className="product-section">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/0/05/DAIKIN_logo.svg" 
          alt="DAIKIN" 
          style={{ height: '40px' }}
        />
      </h3>
      <div className="row-container">
        <button className="arrow left" onClick={() => scroll('left')}>
          &#10094;
        </button>
        <div className="product-row" ref={scrollContainerRef}>
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onCartUpdate={onCartUpdate}
            />
          ))}
        </div>
        <button className="arrow right" onClick={() => scroll('right')}>
          &#10095;
        </button>
      </div>
    </section>
  );
}

export default ProductSection;
