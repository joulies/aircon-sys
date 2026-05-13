import React, { useState, useEffect } from 'react';

function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200',
    'https://www.thespruce.com/thmb/nEO5_zaDwRE5EZwUVUYKuqJU_ZI=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/200172034-001-56a4ec505f9b58b7d0d9ee18.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const moveSlide = (step) => {
    setCurrentSlide((prev) => {
      let newIndex = prev + step;
      if (newIndex >= slides.length) newIndex = 0;
      if (newIndex < 0) newIndex = slides.length - 1;
      return newIndex;
    });
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section className="hero-slider">
      <div className="slider-wrapper">
        {slides.map((slide, index) => (
          <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`}>
            <img src={slide} alt={`Slide ${index + 1}`} />
          </div>
        ))}
      </div>

      <button className="slider-arrow left" onClick={() => moveSlide(-1)}>
        &#10094;
      </button>
      <button className="slider-arrow right" onClick={() => moveSlide(1)}>
        &#10095;
      </button>

      <div className="slider-dots">
        {slides.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentSlide ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>
    </section>
  );
}

export default HeroSlider;
